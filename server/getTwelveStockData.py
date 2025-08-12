import sys
import json
import requests
import pandas as pd
from datetime import datetime

# Inputs from command line
symbol = sys.argv[1]  # e.g., 9984.T
start_date = sys.argv[2]  # YYYY-MM-DD
end_date = sys.argv[3]    # YYYY-MM-DD

# Twelve Data API key
api_key = 'f67ae554ca6940edb7085bc1d9c0f93f'

# Build request URL
url = 'https://api.twelvedata.com/time_series'
params = {
    'symbol': symbol,
    'interval': '1day',
    'start_date': start_date,
    'end_date': end_date,
    'apikey': api_key,
    'outputsize': 5000,
    'format': 'JSON'
}

try:
    response = requests.get(url, params=params)
    result = response.json()

    # Error handling
    if "status" in result and result["status"] == "error":
        print(json.dumps({"error": result.get("message", "Unknown error occurred")}))
        sys.exit(1)

    if "values" not in result:
        print(json.dumps({"error": "No data returned"}))
        sys.exit(1)

    # Parse into DataFrame
    df = pd.DataFrame(result["values"])
    df['datetime'] = pd.to_datetime(df['datetime'])
    df.set_index('datetime', inplace=True)
    df.sort_index(inplace=True)

    # Convert to requested JSON format
    output = {}
    for col in ['open', 'high', 'low', 'close']:
        key = f"('{col.capitalize()}', '{symbol}')"
        output[key] = {
            str(int(index.timestamp() * 1000)): float(value)
            for index, value in df[col].items()
        }

    print(json.dumps(output, indent=2))

except Exception as e:
    print(json.dumps({"error": str(e)}))
