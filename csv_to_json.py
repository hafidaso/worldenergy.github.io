import csv
import json

# Specify the CSV file path
csv_file_path = 'data/world_clean_dataset.csv'

# Specify the JSON file path where you want to save the result
json_file_path = 'data/world_clean_dataset.json'

# Open the CSV file and read data
with open(csv_file_path, 'r') as csv_file:
    # Assuming the CSV file has a header
    csv_reader = csv.DictReader(csv_file)

    # Convert CSV data to a list of dictionaries
    data = [row for row in csv_reader]

# Write the data to a JSON file
with open(json_file_path, 'w') as json_file:
    json.dump(data, json_file, indent=4)

print(f'Conversion from CSV to JSON is complete. JSON file saved at {json_file_path}')
