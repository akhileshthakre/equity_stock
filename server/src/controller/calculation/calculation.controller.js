const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const db = require('../../model');
const Stock = db.stocks;
const TestValue = db.testValues;
const calculateValues = require('./_helpers/calculateValues');

const NUM_THREADS = 4;

const fetchDataBatch = async (stocks, testValues, slossPercent, tgPercent, tsPercent) => {
  const resp = await Promise.all(
    testValues.map(async (testValue) => {
      const result = calculateValues(stocks, testValue.dataValues, slossPercent, tgPercent, tsPercent);
      const numberOfUpMoves = result.filter((stock) => stock.Ret > 0.0).length;
      const numberOfDownMoves = result.filter((stock) => stock.Ret < 0.0).length;
      const totalDays = numberOfUpMoves + numberOfDownMoves;
      const totalRetSum = result.reduce((acc, stock) => acc + (stock.Ret || 0), 0) * 100;
      const avgGain =
        numberOfUpMoves + numberOfDownMoves > 0
          ? ((totalRetSum) / 100 / (numberOfUpMoves + numberOfDownMoves)) * 100
          : -1;
      const winPercent = numberOfUpMoves > 0 ? (numberOfUpMoves / totalDays) * 100 : 0;

      return {
        nameOfStock: stocks[1].dataValues.name,
        fallInStock: testValue.dataValues.fallInStock,
        limitLevel: testValue.dataValues.limitLevel,
        hldDay: testValue.dataValues.hldDay,
        numberOfUpMoves,
        numberOfDownMoves,
        totalDays,
        totalRetSum,
        avgGain,
        winPercent,
      };
    })
  );

  return resp;
};

const CalculationService = {
  fetchData: async (req, res) => {
    const { page = 1, pageSize = 100, downloadAll = false, slossPercent, tgPercent, tsPercent  } = req.body;
    let stocks, testValues;

    try {
      if (downloadAll) {
        [stocks, testValues] = await Promise.all([Stock.findAll(), TestValue.findAll()]);
      } else {
        const offset = (page - 1) * pageSize;
        testValues = await TestValue.findAll({ offset, limit: pageSize });
        stocks = await Stock.findAll();
      }

      const testValuesBatches = Array.from({ length: NUM_THREADS }, (_, index) =>
        testValues.slice((index * testValues.length) / NUM_THREADS, ((index + 1) * testValues.length) / NUM_THREADS)
      );

      const workerPromises = testValuesBatches.map((batch) =>
        new Promise((resolve) => {
          const worker = new Worker(__filename, {
            workerData: { stocks, testValues: batch, slossPercent, tgPercent, tsPercent},
          });

          worker.on('message', resolve);
        })
      );

      const results = await Promise.all(workerPromises);

      const resp = results.flat();

      res.send({
        data: resp,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

if (!isMainThread) {
  const { stocks, testValues, slossPercent, tgPercent, tsPercent } = workerData;
  fetchDataBatch(stocks, testValues, slossPercent, tgPercent, tsPercent).then((result) => {
    parentPort.postMessage(result);
  });
} else {
  module.exports = CalculationService;
}
