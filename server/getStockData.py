# import sys
# import time
# import yfinance as yf
# import pandas as pd

# # 1) Try to import the new location of YFRateLimitError
# try:
#     from yfinance.exceptions import YFRateLimitError
# except ImportError:
#     # If that fails, fall back to catching a generic exception
#     YFRateLimitError = Exception

# def download_with_retry(symbol, start, end, max_retries=5):
#     """
#     Download a single ticker’s historical data with exponential backoff
#     if we hit a YFRateLimitError.
#     """
#     for attempt in range(1, max_retries + 1):
#         try:
#             df = yf.download(
#                 tickers      = symbol,
#                 start       = start,
#                 end         = end,
#                 auto_adjust = True,
#                 threads     = False   # single-threaded → fewer simultaneous hits
#             )
#             return df

#         except YFRateLimitError:
#             wait_time = 2 ** attempt
#             print(f"[Attempt {attempt}] Rate limited for {symbol}. Sleeping {wait_time}s …", file=sys.stderr)
#             time.sleep(wait_time)

#     raise RuntimeError(f"Failed to fetch {symbol} after {max_retries} attempts due to rate limits.")

# if len(sys.argv) != 4:
#     print("Usage: python3 getStockData.py <SYMBOL> <START_DATE> <END_DATE>")
#     print("Example: python3 getStockData.py AAPL 2021-01-01 2021-12-31")
#     sys.exit(1)

# symbol     = sys.argv[1].upper()
# start_date = sys.argv[2]
# end_date   = sys.argv[3]

# # Attempt the fetch, retrying on rate limits
# stock_data = download_with_retry(symbol, start_date, end_date)
# # Output as JSON in “table” orientation:
# print(stock_data.to_json())



import sys
import requests
import json
from datetime import datetime

# Inputs from command line
symbol = sys.argv[1]
start_date = sys.argv[2]
end_date = sys.argv[3]

# Replace with your actual API token
API_KEY = '683ab17a9dbfd6.62007504'
API_URL = f"https://eodhd.com/api/eod/{symbol}"

params = {
    'from': start_date,
    'to': end_date,
    'api_token': API_KEY,
    'fmt': 'json'
}

try:
    response = requests.get(API_URL, params=params)
    response.raise_for_status()
    data = response.json()

    if not data:
        print(json.dumps({"error": "No data returned. Possibly invalid symbol or date range."}))
    else:
        # Sort data by date ascending
        data_sorted = sorted(data, key=lambda x: x['date'])

        result = {
            f"('Open', '{symbol}')": {},
            f"('High', '{symbol}')": {},
            f"('Low', '{symbol}')": {},
            f"('Close', '{symbol}')": {}  # 'Close' will now always hold adjusted_close when available
        }

        for entry in data_sorted:
            timestamp = int(datetime.strptime(entry['date'], "%Y-%m-%d").timestamp() * 1000)

            # Round raw open/high/low
            result[f"('Open', '{symbol}')"][str(timestamp)]  = round(entry['open'],  2)
            result[f"('High', '{symbol}')"][str(timestamp)]  = round(entry['high'],  2)
            result[f"('Low', '{symbol}')"][str(timestamp)]   = round(entry['low'],   2)

            # Use adjusted_close if present; otherwise fallback to raw close
            adj_close = entry.get('adjusted_close', entry['close'])
            result[f"('Close', '{symbol}')"][str(timestamp)] = round(adj_close, 2)

        print(json.dumps(result, indent=2))

except Exception as e:
    print(json.dumps({"error": str(e)}))

