import sys
import yfinance as yf

symbol = sys.argv[1]  # Get stock symbol from Node.js
start_date = sys.argv[2]  # Get start date
end_date = sys.argv[3]  # Get end date
stock_data = yf.download(symbol, start=start_date, end=end_date, auto_adjust=True)
print(stock_data.to_json())  # Return data in JSON format
