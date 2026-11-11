"""
Synthetic CKD (Chronic Kidney Disease) longitudinal data generator.
Each patient has several visits over time (eGFR declines at a patient-specific
rate), so the data can be used for monitoring. Saves everything to a CSV.
"""

import argparse

import numpy as np
import pandas as pd

STAGE_PROBS = [0.20, 0.25, 0.25, 0.17, 0.13]  # baseline stage prevalence

EGFR_RANGES = {1: (90, 125), 2: (60, 89), 3: (30, 59), 4: (15, 29), 5: (5, 14)}
UACR_MEDIAN = {1: 12, 2: 25, 3: 80, 4: 250, 5: 600}
# Typical eGFR change per year by baseline stage (mL/min/1.73m2 per year)
SLOPE_MEAN = {1: -1.0, 2: -1.5, 3: -2.5, 4: -3.5, 5: -4.0}


# ---------------------------------------------------------------- CKD-EPI 2021
def ckd_epi_2021(scr, age, female):
    kappa = np.where(female, 0.7, 0.9)
    alpha = np.where(female, -0.241, -0.302)
    ratio = scr / kappa
    return (
        142
        * np.minimum(ratio, 1) ** alpha
        * np.maximum(ratio, 1) ** -1.200
        * 0.9938 ** age
        * np.where(female, 1.012, 1.0)
    )


def creatinine_from_egfr(egfr, age, female):
    kappa = np.where(female, 0.7, 0.9)
    alpha = np.where(female, -0.241, -0.302)
    base = egfr / (142 * 0.9938 ** age * np.where(female, 1.012, 1.0))
    scr_low = kappa * base ** (1 / alpha)
    scr_high = kappa * base ** (-1 / 1.200)
    return np.where(base >= 1, scr_low, scr_high)


def egfr_to_stage(egfr):
    return np.select(
        [egfr >= 90, egfr >= 60, egfr >= 30, egfr >= 15],
        [1, 2, 3, 4],
        default=5,
    )


# ------------------------------------------------------------------- Generator
def generate(n_patients, seed, min_visits=3, max_visits=8):
    rng = np.random.default_rng(seed)

    # ---- Patient-level (fixed) attributes ----------------------------------
    base_stage = rng.choice([1, 2, 3, 4, 5], size=n_patients, p=STAGE_PROBS)
    female = rng.random(n_patients) < 0.48
    age0 = np.clip(rng.normal(42 + 5 * base_stage, 12), 18, 85)

    lo = np.array([EGFR_RANGES[s][0] for s in base_stage])
    hi = np.array([EGFR_RANGES[s][1] for s in base_stage])
    egfr0 = rng.uniform(lo, hi)

    slope = rng.normal([SLOPE_MEAN[s] for s in base_stage], 1.0)
    rapid = rng.random(n_patients) < 0.12  # rapid progressors
    slope = slope - rapid * rng.uniform(2, 6, n_patients)

    diabetic = rng.random(n_patients) < (0.15 + 0.10 * base_stage)
    weight_base = rng.normal(np.where(female, 66, 78), 12)
    hr_base = rng.normal(72, 8, n_patients)
    bp_offset = rng.normal(0, 6, n_patients)
    start_offset = rng.integers(0, 365, n_patients)

    # ---- Expand to visit-level rows -----------------------------------------
    n_visits = rng.integers(min_visits, max_visits + 1, n_patients)
    pid = np.repeat(np.arange(n_patients), n_visits)
    visit_no = np.concatenate([np.arange(k) for k in n_visits])
    n = len(pid)

    days = visit_no * 90 + np.where(visit_no == 0, 0, rng.integers(-10, 11, n))
    years = days / 365.0

    fem = female[pid]
    age = age0[pid] + years

    # ---- eGFR / creatinine (consistent) --------------------------------------
    egfr_true = np.clip(
        egfr0[pid] + slope[pid] * years + rng.normal(0, 2, n), 4, 125
    )
    scr = creatinine_from_egfr(egfr_true, age, fem)
    scr = np.clip(scr * rng.normal(1.0, 0.04, n), 0.4, 15.0)
    egfr = ckd_epi_2021(scr, age, fem)
    stage = egfr_to_stage(egfr)

    # ---- Other labs ---------------------------------------------------------
    bun = np.clip(9 + 9 * scr ** 1.1 + rng.normal(0, 3, n), 5, 150)
    uacr = np.clip(
        np.array([UACR_MEDIAN[s] for s in stage]) * rng.lognormal(0, 1.0, n),
        1,
        5000,
    )
    potassium = np.clip(
        rng.normal(4.1 + 0.25 * (stage - 1), 0.4 + 0.04 * stage), 3.0, 7.5
    )

    # ---- Vitals -------------------------------------------------------------
    sbp = np.clip(
        rng.normal(
            114 + 6 * (stage - 1) + 0.25 * (age - 40) + bp_offset[pid], 7
        ),
        90,
        210,
    )
    dbp = np.clip(rng.normal(0.55 * sbp + 10, 5), 55, 125)
    weight = np.clip(
        weight_base[pid] + 1.0 * (stage - 1) + rng.normal(0, 1.5, n), 38, 150
    )
    heart_rate = np.clip(hr_base[pid] + 1.5 * (stage - 1) + rng.normal(0, 4, n), 45, 130)
    glucose = np.where(diabetic[pid], rng.normal(160, 35, n), rng.normal(93, 9, n))
    glucose = np.clip(glucose, 60, 400)

    return pd.DataFrame(
        {
            "age": np.round(age).astype(int),
            "sex": fem.astype(int),  # 0 = Male, 1 = Female
            # Vitals
            "bp_systolic_mmHg": np.round(sbp).astype(int),
            "bp_diastolic_mmHg": np.round(dbp).astype(int),
            "body_weight_kg": np.round(weight, 1),
            "heart_rate_bpm": np.round(heart_rate).astype(int),
            "blood_glucose_mg_dL": np.round(glucose, 1),
            # Clinical
            "serum_creatinine_mg_dL": np.round(scr, 2),
            "bun_mg_dL": np.round(bun, 1),
            "egfr_mL_min_1.73m2": np.round(egfr, 1),
            "uacr_mg_g": np.round(uacr, 1),
            "serum_potassium_mmol_L": np.round(potassium, 2),
            # Target
            "ckd_stage": stage.astype(int),
        }
    )


def main():
    p = argparse.ArgumentParser(description="Generate synthetic longitudinal CKD data")
    p.add_argument("--patients", type=int, default=1500, help="number of patients")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--output", type=str, default="ckd_synthetic_data.csv")
    a = p.parse_args()

    df = generate(a.patients, a.seed)
    df.to_csv(a.output, index=False)

    print(f"Saved {len(df)} rows ({a.patients} patients) to {a.output}")
    print("\nStage distribution (rows):")
    print(df["ckd_stage"].value_counts().sort_index().to_string())
    print("\nSample:")
    print(df.head().to_string(index=False))


if __name__ == "__main__":
    main()