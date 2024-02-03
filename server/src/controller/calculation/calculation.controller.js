const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const db = require('../../model');
const Stock = db.stocks;
const TestValue = db.testValues;
const calculateValues = require('./_helpers/calculateValues');

const NUM_THREADS = os.cpus().length;

const fetchDataBatch = async (stocks, testValues, slossPercent, tgPercent, tsPercent, stockId) => {
  const resp = await Promise.all(
    testValues.map(async (testValue) => {
      const result = calculateValues(stocks, testValue.dataValues, slossPercent, tgPercent, tsPercent);
      const numberOfUpMoves = result.filter((stock) => stock.Ret > 0.0).length;
      const numberOfDownMoves = result.filter((stock) => stock.Ret === 0.0 || stock.Ret < 0.0).length;
      const totalDays = result.filter((stock) => stock.Ret).length
      const totalRetSum = result.reduce((acc, stock) => acc + (stock.Ret || 0.0), 0);
      const avgGain =
        numberOfUpMoves + numberOfDownMoves > 0
          ? (((totalRetSum) / 100) / (totalDays))
          : -1;
      const winPercent = numberOfUpMoves > 0 ? (numberOfUpMoves / totalDays) : 0;

      return {
        nameOfStock: stockId || stocks[0].dataValues.name,
        fallInStock: testValue.dataValues.fallInStock,
        limitLevel: testValue.dataValues.limitLevel,
        hldDay: testValue.dataValues.hldDay,
        numberOfUpMoves,
        numberOfDownMoves,
        totalDays,
        totalRetSum: totalRetSum / 100,
        avgGain,
        winPercent,
      };
    })
  );

  return resp;
};

const CalculationService = {
  fetchData: async (req, res) => {
    const userId = req.user.userId
    const { page = 1, pageSize = 100, downloadAll = false, slossPercent, tgPercent, tsPercent, stockId  } = req.body;
    let stocks, testValues, filteredTestValues, results;

    try {
      let isFirstChunk = true;

      if (downloadAll) {
        [stocks, testValues] = await Promise.all([Stock.findAll({where: {userId}}), TestValue.findAll({where: {userId}})]);
      } else if(stockId){
        const offset = (page - 1) * pageSize;
        testValues = await TestValue.findAll({ where: {userId}, offset, limit: pageSize });
        stocks = await Stock.findAll({
          where: {
            name: stockId,
            userId: userId
          },
        });
      }else {
        const offset = (page - 1) * pageSize;
        testValues = await TestValue.findAll({ where: {userId}, offset, limit: pageSize });
        stocks = await Stock.findAll({where: {userId}});
      }
      const whereClause = stockId ? { name: stockId , userId: userId}: {userId: userId}
      const uniqueStocks = await Stock.findAll({
        where: {...whereClause},
        attributes: ['name'],
        group: ['name'],
        raw: true,
      });      
      const testValuesBatches = await Promise.all(
        Array.from({ length: NUM_THREADS }, async (_, index) => {
          const start = (index * testValues.length) / NUM_THREADS;
          const end = ((index + 1) * testValues.length) / NUM_THREADS;
          return testValues.slice(start, end);
        })
      );
      

      res.write('{ "data": [');

      for (const stock of uniqueStocks) {
        const stockName = stock.name;
        filteredTestValues = stocks.filter(s => s.name === stockName);

        const workerPromises = testValuesBatches.map((batch) =>
          new Promise((resolve) => {
            const worker = new Worker(__filename, {
              workerData: { filteredTestValues, testValues: batch, slossPercent, tgPercent, tsPercent, stockId},
            });

            worker.on('message', (result) => {
              if (!isFirstChunk) {
                res.write(',');
              }
              res.write(JSON.stringify(result));
              isFirstChunk = false;
              resolve();
            });
          })
        );

        await Promise.all(workerPromises);

      }

      // Close the JSON array and send the final response
      res.write(']}');
      res.end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

if (!isMainThread) {
  const { filteredTestValues, testValues, slossPercent, tgPercent, tsPercent, stockId } = workerData;
  fetchDataBatch(filteredTestValues, testValues, slossPercent, tgPercent, tsPercent, stockId).then((result) => {
    parentPort.postMessage(result);
  });
} else {
  module.exports = CalculationService;
}
