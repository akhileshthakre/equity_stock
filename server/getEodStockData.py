##################################### EOD WORKING SCRIPT #####################################

import sys
import requests
import json
from datetime import datetime

# Inputs from command line
# ──────────────────────────────────────────────────────────────────────────────
# NOTE: symbol must include exchange (e.g., "AAPL.US", "MSFT.US", etc.)
symbol = sys.argv[1]
start_date = sys.argv[2]  # e.g. "2025-01-01"
end_date   = sys.argv[3]  # e.g. "2025-05-31"

# Replace with your actual API token
API_KEY = '683ab17a9dbfd6.62007504'

# Use the base technical endpoint and supply all query params in `params`
API_BASE = f"https://eodhd.com/api/technical/{symbol}"

params = {
    'function': 'splitadjusted',  # required for split-only adjustments
    'from':      start_date,      # API expects "from" in YYYY-MM-DD format
    'to':        end_date,        # API expects "to" in YYYY-MM-DD format
    'api_token': API_KEY,
    'fmt':       'json',
    # 'agg_period': 'd',          # optional (e.g., 'd', 'w', 'm'); defaults to 'd'
}

try:
    response = requests.get(API_BASE, params=params)
    response.raise_for_status()
    data = response.json()

    if not isinstance(data, list) or len(data) == 0:
        print(json.dumps({
            "error": "No data returned. Possibly invalid symbol, wrong date range, or missing exchange suffix."
        }))
    else:
        # Sort data by date ascending (earliest → latest)
        data_sorted = sorted(data, key=lambda x: x['date'])

        result = {
            f"('Open', '{symbol}')":  {},
            f"('High', '{symbol}')":  {},
            f"('Low', '{symbol}')":   {},
            f"('Close', '{symbol}')": {}  # under splitadjusted, 'close' is already split-adjusted
        }

        for entry in data_sorted:
            # Convert YYYY-MM-DD → Unix timestamp (ms)
            dt_obj = datetime.strptime(entry['date'], "%Y-%m-%d")
            timestamp = int(dt_obj.timestamp() * 1000)

            # Assign split-adjusted OHLC without rounding
            result[f"('Open', '{symbol}')"][str(timestamp)]  = entry['open']
            result[f"('High', '{symbol}')"][str(timestamp)]  = entry['high']
            result[f"('Low', '{symbol}')"][str(timestamp)]   = entry['low']
            result[f"('Close', '{symbol}')"][str(timestamp)] = entry['close']

        print(json.dumps(result, indent=2))

except requests.exceptions.HTTPError as http_err:
    print(json.dumps({"error": f"HTTP error: {http_err}"}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
