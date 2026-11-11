"""
Interactive CKD stage predictor.
Loads the .joblib bundle produced by train.py and prompts the user
for each feature value, then prints the predicted CKD stage (1-5)
plus the per-class probabilities.

"""

import argparse
import json
import sys

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

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


def load_bundle(path: str) -> dict:
    """Load the joblib bundle and rebuild the live Booster."""
    bundle = joblib.load(path)
    booster = xgb.Booster()
    booster.load_model(bytearray(bundle["booster_raw"]))
    bundle["booster"] = booster
    return bundle


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

    probs = booster.predict(drow)[0]                # shape (num_class,)
    pred_idx = int(np.argmax(probs))                # 0..4
    stage = pred_idx + label_offset                 # 1..5
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


def load_from_json(path: str) -> dict:
    """Load a dict of feature values from a JSON file (optional path)."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError("JSON input must be an object of feature -> value.")
    return {k: float(v) for k, v in data.items()}


def main() -> None:
    ap = argparse.ArgumentParser(description="Interactive CKD stage predictor")
    ap.add_argument(
        "--model",
        default="ckd_xgb_model.joblib",
        help="path to the .joblib model bundle",
    )
    ap.add_argument(
        "--input",
        default=None,
        help="optional JSON file with feature values (skips prompts)",
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
    print(f"XGBoost version used at training: "
          f"{bundle.get('xgboost_version', 'unknown')}")
    print(f"Features ({len(features)}): {', '.join(features)}")

    if a.input:
        try:
            values = load_from_json(a.input)
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
    else:
        values = collect_inputs(features)

    stage, probs = predict(bundle, values)
    print_result(stage, probs, label_offset)


if __name__ == "__main__":
    main()