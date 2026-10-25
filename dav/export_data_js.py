import json
import pandas as pd

df = pd.read_csv(r"c:\Users\Ajit Adtani\OneDrive\Desktop\dav\cleaned_student_data.csv")

def categorize(score):
    if score >= 85: return "Excellent (85-100)"
    if score >= 70: return "Good (70-84.99)"
    if score >= 50: return "Average (50-69.99)"
    return "Needs Improvement (<50)"

df["Performance_Category"] = df["Final_Marks"].apply(categorize)
records = df.to_dict(orient="records")

js_content = f"const STUDENTS_DATA = {json.dumps(records, indent=2)};\n"

with open(r"c:\Users\Ajit Adtani\OneDrive\Desktop\dav\students_data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Exported {len(records)} students to students_data.js")
