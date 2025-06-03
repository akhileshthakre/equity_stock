import sys
import time
import yfinance as yf
import json
import pandas as pd

# 1) Try to import the new location of YFRateLimitError
try:
    from yfinance.exceptions import YFRateLimitError
except ImportError:
    # If that fails, fall back to catching a generic exception
    YFRateLimitError = Exception

def download_with_retry(symbol, start, end, max_retries=5):
    """
    Download a single ticker’s historical data with exponential backoff
    if we hit a YFRateLimitError.
    """
    for attempt in range(1, max_retries + 1):  
        try:
            df = yf.download(tickers=symbol,start=start,end=end, auto_adjust = True, threads=True)
            return df

        except YFRateLimitError:
            wait_time = 2 ** attempt        
            print(f"[Attempt {attempt}] Rate limited for {symbol}. Sleeping {wait_time}s …", file=sys.stderr)
            time.sleep(wait_time)

    raise RuntimeError(f"Failed to fetch {symbol} after {max_retries} attempts due to rate limits.")

if len(sys.argv) != 4:
    print("Usage: python3 getStockData.py <SYMBOL> <START_DATE> <END_DATE>")
    print("Example: python3 getStockData.py AAPL 2021-01-01 2021-12-31")
    sys.exit(1)

symbol     = sys.argv[1].upper()
start_date = sys.argv[2]
end_date   = sys.argv[3]

# Attempt the fetch, retrying on rate limits
stock_data = download_with_retry(symbol, start_date, end_date)
# Output as JSON in “table” orientation:
print(stock_data.to_json())