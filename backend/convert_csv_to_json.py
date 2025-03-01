import pandas as pd
import json

csv_file = r"C:\Users\morea\OneDrive\Desktop\Patient-Engagement-\backend\drugsComTrain_final.csv"
json_file = r"C:\Users\morea\OneDrive\Desktop\Patient-Engagement-\backend\training_data.json"

df = pd.read_csv(csv_file)

# Select relevant columns and rename for consistency
df = df[['uniqueID', 'drugName', 'condition', 'rating']]
df.rename(columns={'uniqueID': 'id', 'drugName': 'drug_name'}, inplace=True)

# Convert to training format
json_data = [
    {
        "prompt": f"Condition: {row['condition']}",
        "response": f"ID: {row['id']}\nDrug Name: {row['drug_name']}\nRating: {row['rating']}"
    }
    for _, row in df.iterrows()
]

# Save to JSON
with open(json_file, "w") as f:
    json.dump(json_data, f, indent=2)

print(f"Training data saved at: {json_file}")
