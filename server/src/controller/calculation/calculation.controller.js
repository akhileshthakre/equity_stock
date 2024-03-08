const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const db = require('../../model');
const Stock = db.stocks;
const TestValue = db.testValues;
const Output = db.outputSheet;
const calculateValues = require('./_helpers/calculateValues');

const NUM_THREADS = os.cpus().length;

const fetchDataBatch = async (stocks, testValues, slossPercent, tgPercent, tsPercent, stockId, isNewFormula) => {
  const yearsArray = stocks.map((stock) => {
      const date = new Date(stock.dataValues.period)
      const year = date.getFullYear();
      return year
  })
  const years = new Set(yearsArray)
  const uniqueYears = Array.from(years);
  const numberOfYears = years.size


  const resp = await Promise.all(
    testValues.map(async (testValue) => {
      const result = calculateValues(stocks, testValue.dataValues, slossPercent, tgPercent, tsPercent, isNewFormula);
      const numberOfUpMoves = result.filter((stock) => stock.Ret > 0.0).length;
      const numberOfDownMoves = result.filter((stock) => stock.Ret === 0.0 || stock.Ret < 0.0).length;
      const totalDays = numberOfUpMoves + numberOfDownMoves
      const totalRetSum = result.reduce((acc, stock) => acc + (stock.Ret || 0.0), 0);
      const avgGain =
        numberOfUpMoves + numberOfDownMoves > 0
          ? (((totalRetSum) / 100) / (totalDays))
          : -1;
      const winPercent = numberOfUpMoves > 0 ? (numberOfUpMoves / totalDays) : 0;

      const yearlySums = result.reduce((acc, stock) => {
        const date = new Date(stock.period);
        const year = date.getFullYear();
        if (!acc[year]) {
            acc[year] = 0;
        }
        acc[year] += stock.Ret || 0.0;
        return acc;
      }, {});    

      return {
        nameOfStock: stockId || stocks[0].dataValues.name,
        fallInStock: testValue.dataValues.fallInStock,
        limitLevel: testValue.dataValues.limitLevel,
        hldDay: testValue.dataValues.hldDay,
        totalDays,
        totalRetSum: totalRetSum / 100,
        avgGain,
        winPercent,
        numberOfYears,
        years: uniqueYears,
        yearlyRetSum: yearlySums,
      };
    })
  );

  return resp;
};

const CalculationService = {
  fetchData: async (req, res) => {
    const userId = req.user.userId
    await Output.destroy({
      where: { userId },
    });
    const { page = 1, pageSize = 100, downloadAll = false, slossPercent, tgPercent, tsPercent, stockId, isNewFormula = false, isYearlySumEnabled = false  } = req.body;
    let stocks, testValues, filteredTestValues, results;

    try {
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
      results = [];

      for (const stock of uniqueStocks) {
        const stockName = stock.name;
        filteredTestValues = stocks.filter(s => s.name === stockName);

        const workerPromises = testValuesBatches.map((batch) =>
          new Promise((resolve) => {
            const worker = new Worker(__filename, {
              workerData: { filteredTestValues, testValues: batch, slossPercent, tgPercent, tsPercent, stockId, isNewFormula},
            });

            worker.on('message', resolve);
          })
        );

        const stockResults = await Promise.all(workerPromises);
        const flattenedResults = stockResults.flat();

        const finalOutput = flattenedResults.map(data => ({
          nameOfStock: data.nameOfStock,
          fallInStock: data.fallInStock,
          limitLevel: data.limitLevel,
          hldDay: data.hldDay,
          numberOfUpMoves: data.numberOfUpMoves,
          numberOfDownMoves: data.numberOfDownMoves,
          totalDays: data.totalDays,
          totalRetSum: data.totalRetSum,
          avgGain: data.avgGain,
          winPercent: data.winPercent,
          numberOfYears: data.numberOfYears,
          years: isYearlySumEnabled ? data.years : [],
          yearlyRetSum: isYearlySumEnabled ? data.yearlyRetSum : {},
          userId: userId,
        }));
      
        // if(downloadAll) {
        //   const formattedData = flattenedResults.map(data => ({
        //     nameOfStock: data.nameOfStock,
        //     fallInStock: data.fallInStock,
        //     limitLevel: data.limitLevel,
        //     hldDay: data.hldDay,
        //     numberOfUpMoves: data.numberOfUpMoves,
        //     numberOfDownMoves: data.numberOfDownMoves,
        //     totalDays: data.totalDays,
        //     totalRetSum: data.totalRetSum,
        //     avgGain: data.avgGain,
        //     winPercent: data.winPercent,
        //     numberOfYears: data.numberOfYears,
        //     yearlyRetSum: data.yearlyRetSum,
        //     userId: userId,
        //   }));
        //   await Output.bulkCreate(formattedData, { updateOnDuplicate: Object.keys(formattedData[0]) });
        // }
      
        results.push(finalOutput);
      }

      res.send({
        data: results,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

if (!isMainThread) {
  const { filteredTestValues, testValues, slossPercent, tgPercent, tsPercent, stockId, isNewFormula } = workerData;
  fetchDataBatch(filteredTestValues, testValues, slossPercent, tgPercent, tsPercent, stockId, isNewFormula).then((result) => {
    parentPort.postMessage(result);
  });
} else {
  module.exports = CalculationService;
}
