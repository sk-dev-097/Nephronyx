"""
Train an XGBoost model to predict CKD stage (1-5).

* patient_id / visit_date / visit_number are NOT used as features.
* Train/test split is done BY PATIENT when a group column is present.
* By default eGFR and serum creatinine are excluded, because the stage label
  is computed from eGFR (label leakage). Add --use-egfr to include them.

Output:
    Saves the trained model to a .joblib file (default: ckd_xgb_model.joblib).
    The joblib bundle contains:
        - booster (the trained xgb.Booster)
        - features (list[str])
        - num_class (int)
        - label_offset (int, always 1: model outputs 0..4, real labels 1..5)

Usage:
    python train_ckd_model.py
    python train_ckd_model.py --csv ckd_synthetic_data.csv --use-egfr
    python train_ckd_model.py --model-out my_model.joblib
"""

import argparse
import sys

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import GroupShuffleSplit, train_test_split

BASE_FEATURES = [
    "age", "sex",
    "bp_systolic_mmHg", "bp_diastolic_mmHg", "body_weight_kg",
    "heart_rate_bpm", "blood_glucose_mg_dL",
    "bun_mg_dL", "uacr_mg_g", "serum_potassium_mmol_L",
]
LEAKY_FEATURES = ["serum_creatinine_mg_dL", "egfr_mL_min_1.73m2"]
LABEL_COL = "ckd_stage"
GROUP_CANDIDATES = ["patient_id", "patientId", "PatientID", "patient"]
NUM_CLASS = 5
LABEL_OFFSET = 1  # XGBoost classes 0..4 <-> real CKD stages 1..5


def pick_group_column(df: pd.DataFrame) -> str | None:
    """Return the first identifier column that exists in df, else None."""
    for col in GROUP_CANDIDATES:
        if col in df.columns:
            return col
    return None


def validate_columns(df: pd.DataFrame, features: list[str], label: str) -> None:
    """Exit with a clear message if required columns are missing."""
    missing = [c for c in features + [label] if c not in df.columns]
    if missing:
        print(f"ERROR: missing required column(s): {missing}", file=sys.stderr)
        print(f"Columns found in CSV: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)


def save_joblib_bundle(
    path: str,
    booster: xgb.Booster,
    features: list[str],
    num_class: int,
    label_offset: int,
) -> None:
    """
    Save the trained model + metadata to a single .joblib file.

    We store the booster's raw UBJSON bytes so the whole bundle is picklable
    and self-contained (no sibling .json file required).
    """
    bundle = {
        "booster_raw": booster.save_raw(raw_format="ubj"),  # bytes
        "features": list(features),
        "num_class": int(num_class),
        "label_offset": int(label_offset),
        "format_version": 1,
        "library": "xgboost",
        "xgboost_version": xgb.__version__,
    }
    joblib.dump(bundle, path, compress=3)


def load_joblib_bundle(path: str) -> dict:
    """Inverse of save_joblib_bundle. Returns a dict with a live Booster."""
    bundle = joblib.load(path)
    booster = xgb.Booster()
    booster.load_model(bytearray(bundle["booster_raw"]))
    bundle["booster"] = booster
    return bundle


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="ckd_synthetic_data.csv")
    ap.add_argument(
        "--use-egfr",
        action="store_true",
        help="include eGFR + creatinine (causes label leakage)",
    )
    ap.add_argument(
        "--model-out",
        default="ckd_xgb_model.joblib",
        help="output .joblib path",
    )
    a = ap.parse_args()

    df = pd.read_csv(a.csv)

    features = BASE_FEATURES + (LEAKY_FEATURES if a.use_egfr else [])
    validate_columns(df, features, LABEL_COL)

    X = df[features].astype(float)
    # XGBoost native API wants 0..NUM_CLASS-1 integer labels
    y = (df[LABEL_COL] - LABEL_OFFSET).astype(int)

    group_col = pick_group_column(df)

    if group_col is not None:
        print(f"Grouping by '{group_col}' for patient-level split.")
        groups = df[group_col]
        splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
        train_idx, test_idx = next(splitter.split(X, y, groups))
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
    else:
        # No patient/group column -> fall back to a stratified row-level split.
        print(
            "WARNING: no patient/group column found "
            f"(looked for {GROUP_CANDIDATES}). Falling back to a "
            "stratified row-level split; results may be optimistic.",
            file=sys.stderr,
        )
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

    # ---- Native XGBoost API (avoids the sklearn wrapper save_model bug) ----
    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=features)
    dtest = xgb.DMatrix(X_test, label=y_test, feature_names=features)

    params = {
        "objective": "multi:softprob",
        "num_class": NUM_CLASS,
        "max_depth": 5,
        "eta": 0.08,              # native API uses "eta" instead of learning_rate
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "eval_metric": "mlogloss",
        "seed": 42,
        "tree_method": "hist",
    }

    booster = xgb.train(
        params=params,
        dtrain=dtrain,
        num_boost_round=300,
        evals=[(dtrain, "train"), (dtest, "test")],
        verbose_eval=False,
    )

    # Predict probabilities then take argmax for class labels
    probs = booster.predict(dtest)
    pred = np.argmax(probs, axis=1)

    print(f"\nFeatures used: {features}\n")
    print(f"Overall accuracy: {accuracy_score(y_test, pred):.3f}\n")
    print(
        classification_report(
            y_test + LABEL_OFFSET,
            pred + LABEL_OFFSET,
            digits=3,
        )
    )

    if "sex" in X_test.columns:
        sex_vals = X_test["sex"].to_numpy()
        y_test_np = y_test.to_numpy()
        for s, name in [(0, "Male"), (1, "Female")]:
            m = sex_vals == s
            if m.sum() == 0:
                print(f"{name} accuracy: n/a (n=0)")
                continue
            print(
                f"{name} accuracy: "
                f"{accuracy_score(y_test_np[m], pred[m]):.3f}  "
                f"(n={int(m.sum())})"
            )

    # ---- Save as .joblib ----
    save_joblib_bundle(
        a.model_out,
        booster=booster,
        features=features,
        num_class=NUM_CLASS,
        label_offset=LABEL_OFFSET,
    )
    print(f"\nModel bundle saved to {a.model_out}")

    # ---- Sanity check: reload and confirm predictions match ----
    reloaded = load_joblib_bundle(a.model_out)
    re_probs = reloaded["booster"].predict(dtest)
    re_pred = np.argmax(re_probs, axis=1)
    assert np.array_equal(pred, re_pred), "Reloaded model disagrees!"
    print("Reload sanity check passed.")


if __name__ == "__main__":
    main()