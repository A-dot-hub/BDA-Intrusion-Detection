import csv
import glob
import os

INPUT_DIR = os.path.expanduser("~/cicids2017/MachineLearningCVE")
OUTPUT_DIR = os.path.expanduser("~/BDA-Intrusion-Detection/data/processed")

os.makedirs(OUTPUT_DIR, exist_ok=True)

input_files = sorted(glob.glob(os.path.join(INPUT_DIR, "*.csv")))

output_file = os.path.join(OUTPUT_DIR, "cicids2017_processed.csv")

total_rows = 0
written_rows = 0

with open(output_file, "w", newline="", encoding="utf-8") as out:
    writer = None

    for input_file in input_files:
        print(f"Processing: {os.path.basename(input_file)}")

        with open(input_file, "r", newline="", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)

            header = next(reader)

            # Remove leading/trailing whitespace from column names
            header = [column.strip() for column in header]

            if writer is None:
                writer = csv.writer(out)
                writer.writerow(header)

            for row in reader:
                total_rows += 1

                if len(row) != len(header):
                    continue

                # Clean whitespace from every field
                row = [value.strip() for value in row]

                # Skip completely empty rows
                if not any(row):
                    continue

                writer.writerow(row)
                written_rows += 1

print()
print(f"Total rows read: {total_rows}")
print(f"Rows written:    {written_rows}")
print(f"Output:          {output_file}")
