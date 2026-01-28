import pandas as pd

# -------------------------------
# Load original CSV files
# -------------------------------
med_df = pd.read_csv("test1.csv", low_memory=False)
pharma_df = pd.read_csv("test2.csv", low_memory=False)

# -------------------------------
# Required column structures
# -------------------------------
required_med_cols = [
    "name",
    "substitutes",
    "side_effect",
    "use0",
    "Therapeutic_Class"
]

required_pharma_cols = [
    "brand_name",
    "manufacturer",
    "price_inr",
    "primary_ingredient",
    "primary_strength",
    "therapeutic_class"
]

# -------------------------------
# Create cleaned medicine dataset
# -------------------------------
clean_med_df = pd.DataFrame()

for col in required_med_cols:
    clean_med_df[col] = med_df[col] if col in med_df.columns else None

clean_med_df.to_csv("med4.csv", index=False)

# -------------------------------
# Create cleaned pharmaceutical dataset
# -------------------------------
clean_pharma_df = pd.DataFrame()

for col in required_pharma_cols:
    clean_pharma_df[col] = pharma_df[col] if col in pharma_df.columns else None

clean_pharma_df.to_csv("med3.csv", index=False)

print("Preprocessing completed successfully.")
