"""
Build ckd_xgb_model.joblib from the XGBoost JSON model in ../../test.

Usage:
    python build_model_bundle.py
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import xgboost as xgb

HERE = Path(__file__).resolve().parent
TEST_DIR = HERE.parents[2] / "test"
OUT_PATH = HERE / "ckd_xgb_model.joblib"


def main() -> None:
    model_json = TEST_DIR / "ckd_xgb_model.json"
    features_json = TEST_DIR / "ckd_features.json"

    if not model_json.exists():
        raise SystemExit(f"Missing model JSON: {model_json}")
    if not features_json.exists():
        raise SystemExit(f"Missing features JSON: {features_json}")

    features = json.loads(features_json.read_text(encoding="utf-8"))
    booster = xgb.Booster()
    booster.load_model(str(model_json))

    bundle = {
        "booster_raw": booster.save_raw(raw_format="ubj"),
        "features": list(features),
        "num_class": 5,
        "label_offset": 1,
        "format_version": 1,
        "library": "xgboost",
        "xgboost_version": xgb.__version__,
    }
    joblib.dump(bundle, OUT_PATH, compress=3)
    print(f"Wrote {OUT_PATH}")
    print(f"Features ({len(features)}): {', '.join(features)}")


if __name__ == "__main__":
    main()
