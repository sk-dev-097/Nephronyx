"""
CKD stage predictor.

Loads the .joblib bundle produced by train.py and feature values from
`src/data/patient_data.json` (or an explicit --input path), then prints
the predicted CKD stage (1-5) plus per-class probabilities.

Usage:
    python predict.py
    python predict.py --model ckd_xgb_model.joblib
    python predict.py --model ckd_xgb_model.joblib --input ../data/patient_data.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

LIB_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = LIB_DIR.parents[1]  # Nephronyx/
DEFAULT_DATA_PATH = LIB_DIR.parent / "data" / "patient_data.json"
DEFAULT_MODEL_PATH = LIB_DIR / "ckd_xgb_model.joblib"
# Fallback: native XGBoost JSON + feature list from the sibling test/ folder
FALLBACK_MODEL_JSON = PROJECT_ROOT.parent / "test" / "ckd_xgb_model.json"
FALLBACK_FEATURES_JSON = PROJECT_ROOT.parent / "test" / "ckd_features.json"

# Human-friendly prompt text for each known feature.
# Anything not listed here falls back to the raw column name.
FEATURE_PROMPTS = {
    "age": "Age (years)",
    "sex": "Sex (0 = Male, 1 = Female)",
    "bp_systolic_mmHg": "Systolic BP (mmHg)",
    "bp_diastolic_mmHg": "Diastolic BP (mmHg)",
    "body_weight_kg": "Body weight (kg)",
    "heart_rate_bpm": "Heart rate (bpm)",
    "blood_glucose_mg_dL": "Blood glucose (mg/dL)",
    "bun_mg_dL": "BUN (mg/dL)",
    "uacr_mg_g": "UACR (mg/g)",
    "serum_potassium_mmol_L": "Serum potassium (mmol/L)",
    "serum_creatinine_mg_dL": "Serum creatinine (mg/dL)",
    "egfr_mL_min_1.73m2": "eGFR (mL/min/1.73m²)",
}


def load_bundle_from_json(
    model_json: str | Path,
    features_json: str | Path,
) -> dict:
    """Load a native XGBoost JSON model + features list."""
    features = json.loads(Path(features_json).read_text(encoding="utf-8"))
    if not isinstance(features, list) or not features:
        raise ValueError("features JSON must be a non-empty list of names")
    booster = xgb.Booster()
    booster.load_model(str(model_json))
    return {
        "booster": booster,
        "features": list(features),
        "num_class": 5,
        "label_offset": 1,
        "xgboost_version": xgb.__version__,
        "source": str(model_json),
    }


def load_bundle(path: str | Path | None = None) -> dict:
    """
    Load the joblib bundle (preferred) or fall back to the test/ JSON model.
    """
    path = Path(path or DEFAULT_MODEL_PATH)
    if path.exists():
        bundle = joblib.load(path)
        booster = xgb.Booster()
        booster.load_model(bytearray(bundle["booster_raw"]))
        bundle["booster"] = booster
        return bundle

    if FALLBACK_MODEL_JSON.exists() and FALLBACK_FEATURES_JSON.exists():
        return load_bundle_from_json(FALLBACK_MODEL_JSON, FALLBACK_FEATURES_JSON)

    raise FileNotFoundError(
        f"Model not found at {path}, and fallback JSON model missing "
        f"({FALLBACK_MODEL_JSON})"
    )


def prompt_float(label: str) -> float:
    """Prompt until the user enters a valid float."""
    while True:
        raw = input(f"  {label}: ").strip()
        if raw == "":
            print("    ! Please enter a value.")
            continue
        try:
            return float(raw)
        except ValueError:
            print(f"    ! '{raw}' is not a number. Try again.")


def collect_inputs(features: list[str]) -> dict:
    """Prompt the user for every feature. Returns a dict of name -> float."""
    print("\nEnter the following values:")
    values = {}
    for feat in features:
        label = FEATURE_PROMPTS.get(feat, feat)
        values[feat] = prompt_float(label)
    return values


def predict(bundle: dict, values: dict) -> tuple[int, np.ndarray]:
    """
    Run the model on a single row.

    Returns:
        (predicted_stage, probabilities) where predicted_stage is 1..5
        and probabilities is a length-5 array for stages 1..5.
    """
    features: list[str] = bundle["features"]
    label_offset: int = bundle["label_offset"]
    booster: xgb.Booster = bundle["booster"]

    # Order must match training exactly
    row = pd.DataFrame([[values[f] for f in features]], columns=features)
    drow = xgb.DMatrix(row.astype(float), feature_names=features)

    probs = booster.predict(drow)[0]  # shape (num_class,)
    pred_idx = int(np.argmax(probs))  # 0..4
    stage = pred_idx + label_offset  # 1..5
    return stage, probs


def print_result(stage: int, probs: np.ndarray, label_offset: int) -> None:
    print("\n" + "=" * 42)
    print(f"  Predicted CKD stage: {stage}")
    print("=" * 42)
    print("\nClass probabilities:")
    for i, p in enumerate(probs):
        s = i + label_offset
        bar = "█" * int(round(p * 30))
        marker = "  <-- predicted" if s == stage else ""
        print(f"  Stage {s}: {p * 100:6.2f}%  {bar}{marker}")
    print()


def load_from_json(path: str | Path) -> dict:
    """Load a dict of feature values from a JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError("JSON input must be an object of feature -> value.")
    return {k: float(v) for k, v in data.items()}


def save_to_json(path: str | Path, values: dict) -> None:
    """Persist feature values to a JSON file."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    serializable = {k: float(v) for k, v in values.items()}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(serializable, f, indent=2)
        f.write("\n")


def result_to_dict(stage: int, probs: np.ndarray, label_offset: int) -> dict:
    """Structured prediction payload for the UI / API."""
    probabilities = []
    for i, p in enumerate(probs):
        probabilities.append(
            {
                "stage": i + label_offset,
                "probability": float(p),
                "percent": round(float(p) * 100, 2),
            }
        )
    return {
        "stage": int(stage),
        "probabilities": probabilities,
        "label_offset": int(label_offset),
    }


def run_prediction(
    model_path: str | Path | None = None,
    input_path: str | Path | None = None,
    values: dict | None = None,
) -> dict:
    """
    Load model + patient JSON (unless `values` is provided) and return
    a serializable prediction dict.
    """
    input_path = Path(input_path or DEFAULT_DATA_PATH)
    bundle = load_bundle(model_path)
    features: list[str] = bundle["features"]
    label_offset: int = bundle["label_offset"]

    if values is None:
        values = load_from_json(input_path)

    missing = [f for f in features if f not in values]
    if missing:
        raise ValueError(f"Input is missing features: {missing}")

    stage, probs = predict(bundle, values)
    result = result_to_dict(stage, probs, label_offset)
    result["features_used"] = features
    result["input_path"] = str(input_path)
    result["values"] = {f: float(values[f]) for f in features}
    return result


def main() -> None:
    ap = argparse.ArgumentParser(description="CKD stage predictor")
    ap.add_argument(
        "--model",
        default=str(DEFAULT_MODEL_PATH),
        help="path to the .joblib model bundle",
    )
    ap.add_argument(
        "--input",
        default=str(DEFAULT_DATA_PATH),
        help="JSON file with feature values (default: src/data/patient_data.json)",
    )
    ap.add_argument(
        "--interactive",
        action="store_true",
        help="prompt for values instead of reading the JSON file",
    )
    a = ap.parse_args()

    try:
        bundle = load_bundle(a.model)
    except FileNotFoundError:
        print(f"ERROR: model file not found: {a.model}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: could not load model: {exc}", file=sys.stderr)
        sys.exit(1)

    features: list[str] = bundle["features"]
    label_offset: int = bundle["label_offset"]

    print(f"Loaded model: {a.model}")
    print(
        f"XGBoost version used at training: "
        f"{bundle.get('xgboost_version', 'unknown')}"
    )
    print(f"Features ({len(features)}): {', '.join(features)}")

    if a.interactive:
        values = collect_inputs(features)
    else:
        try:
            values = load_from_json(a.input)
            print(f"Loaded patient data: {a.input}")
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR: could not read JSON input: {exc}", file=sys.stderr)
            sys.exit(1)

        missing = [f for f in features if f not in values]
        if missing:
            print(
                f"ERROR: JSON input is missing features: {missing}",
                file=sys.stderr,
            )
            sys.exit(1)

    stage, probs = predict(bundle, values)
    print_result(stage, probs, label_offset)


if __name__ == "__main__":
    main()
