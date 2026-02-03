import sys
import json
import requests
import pandas as pd
from datetime import datetime

# Inputs from command line
symbol = sys.argv[1]  # e.g., 86970 (Japan ticker code)
start_date = sys.argv[2]  # YYYY-MM-DD
end_date = sys.argv[3]    # YYYY-MM-DD

# J-Quants API key
# Get your API key from: https://jpx-jquants.com/en/dashboard
api_key = '67goZ6kO-z1zI0B3rfsYZnYO-h0QVMHHryC9WZHI4l4'

# Build request URL
url = 'https://api.jquants.com/v2/equities/bars/daily'

# Request headers and parameters
headers = {
    'x-api-key': api_key
}
params = {
    'code': symbol,
    'from': start_date,  # Can use YYYY-MM-DD or YYYYMMDD format
    'to': end_date
}

try:
    response = requests.get(url, params=params, headers=headers)
    result = response.json()

    # Error handling
    if "error" in result or "message" in result:
        error_msg = result.get("message") or result.get("error", "Unknown error occurred")
        print(json.dumps({"error": error_msg}))
        sys.exit(1)

    if "data" not in result or not result["data"]:
        print(json.dumps({"error": "No data returned", "api_response": result}))
        sys.exit(1)
    
    quotes = result["data"]
    
    # Parse into DataFrame
    df = pd.DataFrame(quotes)
    df['Date'] = pd.to_datetime(df['Date'])
    df.set_index('Date', inplace=True)
    df.sort_index(inplace=True)
    
    # Convert to requested JSON format (matching Twelve Data format)
    # J-Quants uses 'O', 'H', 'L', 'C' for unadjusted OHLC data
    # and 'AdjO', 'AdjH', 'AdjL', 'AdjC' for split-adjusted data
    
    # Use unadjusted prices only if explicitly requested
    use_unadjusted = len(sys.argv) > 4 and sys.argv[4].lower() == 'unadjusted'
    
    output = {}
    if use_unadjusted:
        # Use unadjusted prices
        column_mapping = {
            'O': 'Open',
            'H': 'High',
            'L': 'Low',
            'C': 'Close'
        }
    else:
        # Use split-adjusted prices (DEFAULT)
        column_mapping = {
            'AdjO': 'Open',
            'AdjH': 'High',
            'AdjL': 'Low',
            'AdjC': 'Close'
        }
    
    for jq_col, display_name in column_mapping.items():
        if jq_col in df.columns:
            key = f"('{display_name}', '{symbol}')"
            output[key] = {
                str(int(index.timestamp() * 1000)): float(value)
                for index, value in df[jq_col].items()
            }
    
    print(json.dumps(output, indent=2))

except IndexError:
    print(json.dumps({
        "error": "Usage: python getJQuantsStockData.py <ticker_code> <start_date> <end_date> [unadjusted]",
        "example_adjusted": "python getJQuantsStockData.py 86970 2023-01-01 2023-12-31 (default: split-adjusted)",
        "example_unadjusted": "python getJQuantsStockData.py 86970 2023-01-01 2023-12-31 unadjusted"
    }))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
