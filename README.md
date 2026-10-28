# Nephronyx

**Machine-learning based monitoring of Chronic Kidney Disease (CKD) stages.**

Nephronyx takes a patient's routine vital signs and kidney-related lab values and uses an **XGBoost** classifier to estimate the patient's CKD stage (1–5). It is designed as the core of a monitoring workflow, where the same set of inputs is fed to the model at every check-up to track how kidney function is progressing.

> ⚠️ **Disclaimer:** Nephronyx is an academic / mini-project prototype. It is trained on **synthetic data** and must not be used for real diagnosis or treatment decisions. Always consult a qualified healthcare professional.

---

## Table of Contents
- [Overview](#overview)
- [Input Features](#input-features)
- [CKD Stages](#ckd-stages)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [How the Synthetic Data Works](#how-the-synthetic-data-works)
- [Model Details](#model-details)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

CKD is a progressive condition in which the kidneys gradually lose their ability to filter blood. Early detection and regular monitoring of the stage can slow progression and reduce complications. Nephronyx demonstrates an end-to-end pipeline for this:

1. **Generate** realistic synthetic patient records (vitals + clinical labs) and save them as a CSV.
2. **Train** an XGBoost multi-class classifier to predict the CKD stage.
3. **Predict** the stage for a new patient from the same input fields.

---

## Input Features

### Demographics
| Feature | Description |
|---|---|
| `age` | Age in years |
| `sex` | 0 = Male, 1 = Female |

### Vital Signs
| Feature | Unit |
|---|---|
| `bp_systolic_mmHg` | Systolic blood pressure (mmHg) |
| `bp_diastolic_mmHg` | Diastolic blood pressure (mmHg) |
| `body_weight_kg` | Body weight (kg) |
| `heart_rate_bpm` | Heart rate (beats per minute) |
| `blood_glucose_mg_dL` | Blood glucose (mg/dL) |

### Clinical / Lab Values
| Feature | Unit |
|---|---|
| `serum_creatinine_mg_dL` | Serum Creatinine, SCr (mg/dL) |
| `bun_mg_dL` | Blood Urea Nitrogen, BUN (mg/dL) |
| `egfr_mL_min_1.73m2` | Estimated Glomerular Filtration Rate, eGFR (mL/min/1.73 m²) |
| `uacr_mg_g` | Urine Albumin-to-Creatinine Ratio, uACR (mg/g) |
| `serum_potassium_mmol_L` | Serum Potassium, K⁺ (mmol/L) |

### Target
| Column | Description |
|---|---|
| `ckd_stage` | CKD stage from 1 to 5 |

---

## CKD Stages

Stages follow the KDIGO classification based on eGFR:

| Stage | eGFR (mL/min/1.73 m²) | Description |
|:---:|:---:|---|
| 1 | ≥ 90 | Normal or high kidney function |
| 2 | 60 – 89 | Mildly decreased |
| 3 | 30 – 59 | Moderately decreased |
| 4 | 15 – 29 | Severely decreased |
| 5 | < 15 | Kidney failure |

---

## Project Structure

```
Nephronyx/
├── generate_ckd_data.py   # Creates the synthetic dataset (CSV)
├── train.py               # Trains and evaluates the XGBoost model
├── predict_ckd.py         # Predicts the CKD stage for a new patient
├── ckd_synthetic_data.csv # Generated dataset (created after running the generator)
├── ckd_xgb_model.json     # Saved model (created after training)
├── ckd_features.json      # Feature order used for training/prediction
└── README.md
```

---

## Installation

**Requirements:** Python 3.9+

```bash
git clone https://github.com/sk-dev-097/Nephronyx.git
cd Nephronyx
pip install numpy pandas scikit-learn xgboost
```

---

## Usage

### 1. Generate the synthetic dataset
```bash
python generate_ckd_data.py
```
Optional arguments:
```bash
python generate_ckd_data.py --patients 2000 --seed 7 --output ckd_data.csv
```

### 2. Train the model
```bash
python train.py
```
This prints the overall accuracy, a per-stage classification report, and accuracy for male and female patients separately. The trained model is saved to `ckd_xgb_model.json`.

### 3. Predict for a new patient
Edit the example values inside `predict_ckd.py`, then run:
```bash
python predict_ckd.py
```
Example output:
```
Predicted CKD stage: 3
  Stage 1: 0.0%
  Stage 2: 0.0%
  Stage 3: 100.0%
  Stage 4: 0.0%
  Stage 5: 0.0%
```

---

## How the Synthetic Data Works

- Each patient is assigned a baseline stage, sex and age.
- eGFR is generated within the range of that stage, and serum creatinine is calculated from it using the **CKD-EPI 2021** equation, so the two values stay consistent.
- BUN, uACR, potassium, blood pressure, weight, heart rate and glucose are generated with realistic trends that shift as kidney function worsens.
- The generator supports multiple visits per patient, with eGFR declining at a patient-specific rate, to simulate monitoring over time.

---

## Model Details

- **Algorithm:** XGBoost (`XGBClassifier`, multi-class `multi:softprob`)
- **Inputs:** 12 features (age, sex, 5 vitals/clinical-vital values, 5 lab values)
- **Output:** CKD stage 1–5 with a probability for each stage
- **Evaluation:** Stratified train/test split, overall and per-class metrics, and a male/female accuracy comparison

---

## Known Limitations

- **Label leakage:** The stage is computed directly from eGFR. When `egfr_mL_min_1.73m2` and `serum_creatinine_mg_dL` are used as inputs, the model reaches near-perfect accuracy mostly by reading eGFR. To test how well the model learns from other signals, remove those two features and retrain (expect roughly 79–81% accuracy on the synthetic data).
- **Synthetic data only:** The model learns the patterns built into the generator, not real clinical patterns. Results on real patients will differ.
- **Single-visit prediction:** The current model predicts from one set of readings and does not yet use a patient's history.

---

## Roadmap

- [ ] Add trend features (change in eGFR between visits, rolling averages)
- [ ] Predict progression risk, not just the current stage
- [ ] Validate on real, de-identified clinical data
- [ ] Add albuminuria categories (A1–A3) from uACR
- [ ] Build a simple dashboard or web interface for monitoring

---

## Contributing

Contributions, issues and feature suggestions are welcome. Feel free to open an issue or submit a pull request.

---

## License

Add your preferred license here (for example, MIT) and include a `LICENSE` file in the repository.