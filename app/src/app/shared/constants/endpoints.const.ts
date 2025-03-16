export const END_POINT_CONST = {
    STOCKS: {
        GET_TOKEN: '/user/login',
        REGISTER: '/user/register',
        UPLOAD_FILE: '/upload/stockFile',
        UPLOAD_BULK_SEARCH_STOCK: '/searchStock/bulk',
        UPLOAD_TEST_FILE: '/upload/testFile',
        GET_ALL_STOCKS: '/stock',
        DELETE_STOCK_LIST: '/stock/deleteStocks',
        DELETE_TEST_LIST: '/testValue/deleteAllTestValues',
        GET_ALL_TEST_VALUES: '/testValue',
        CALCULATE: '/calculation',
        SEARCH_STOCK: '/searchStock',
        GET_USER: '/user'
    },
    EXECUTION: {
        DELETE_EXECUTION_SHEET: '/executionSheet/deleteExecutionData',
        UPLOAD_EXECUTION_SHEET: '/upload/executionFile',
        GET_EXECUTION_SHEET: '/executionSheet',
        CALCULATE_EXECUTION: '/execution/calculate'
    },
    STOCKS_SYMBOLS: {
        UPLOAD_STOCK_SYMBOLS: '/upload/allStockSymbols', 
        GET_STOCK_SYMBOLS: '/searchStock/downloadStocks',         
    }

}
