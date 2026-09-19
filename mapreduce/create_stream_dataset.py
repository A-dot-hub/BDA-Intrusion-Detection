import csv
import os
import subprocess
import zipfile

ZIP_FILE = os.path.expanduser(
    "~/Downloads/GeneratedLabelledFlows (1).zip"
)

OUTPUT_FILE = os.path.expanduser(
    "~/BDA-Intrusion-Detection/data/processed/cicids2017_stream_processed.csv"
)

REQUIRED_COLUMNS = [
    "Flow ID",
    "Source IP",
    "Source Port",
    "Destination IP",
    "Destination Port",
    "Protocol",
    "Timestamp",
    "Label",
]

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

total_rows = 0
written_rows = 0

with zipfile.ZipFile(ZIP_FILE, "r") as archive:

    csv_files = [
        name for name in archive.namelist()
        if name.lower().endswith(".csv")
    ]

    with open(
        OUTPUT_FILE,
        "w",
        newline="",
        encoding="utf-8"
    ) as out:

        writer = csv.writer(out)
        writer.writerow(REQUIRED_COLUMNS)

        for csv_file in sorted(csv_files):

            print(f"Processing: {csv_file}")

            with archive.open(csv_file) as raw:
                # Decode the CSV stream without extracting the file
                text = (
                    line.decode("utf-8", errors="replace")
                    for line in raw
                )

                reader = csv.reader(text)

                header = next(reader)
                header = [column.strip() for column in header]

                column_index = {
                    column: index
                    for index, column in enumerate(header)
                }

                missing = [
                    column
                    for column in REQUIRED_COLUMNS
                    if column not in column_index
                ]

                if missing:
                    raise ValueError(
                        f"Missing columns in {csv_file}: {missing}"
                    )

                indexes = [
                    column_index[column]
                    for column in REQUIRED_COLUMNS
                ]

                for row in reader:

                    total_rows += 1

                    if len(row) != len(header):
                        continue

                    selected = [
                        row[index].strip()
                        for index in indexes
                    ]

                    if not any(selected):
                        continue

                    writer.writerow(selected)
                    written_rows += 1

print()
print(f"Total rows read: {total_rows}")
print(f"Rows written:    {written_rows}")
print(f"Output:          {OUTPUT_FILE}")
