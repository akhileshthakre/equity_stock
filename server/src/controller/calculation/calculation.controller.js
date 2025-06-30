const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const db = require('../../model');
const Stock = db.stocks;
const TestValue = db.testValues;
const Output = db.outputSheet;
const calculateValues = require('./_helpers/calculateValues');
const { Op } = require('sequelize');


const NUM_THREADS = os.cpus().length;

const  roundToDecimalPlaces = (number)  => {
  let factor = Math.pow(10, 4);
  return Math.round(number * factor) / factor;
}

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
      }, {})
      
      const tradesPerYear = () => {
        if(numberOfYears === 1)  {
          return 0
        }else {
          return roundToDecimalPlaces(totalDays / (numberOfYears - 1))
        }
      }

      const absolutePercentPerYear = () => {
        if (isNaN(tradesPerYear()) || isNaN(avgGain)) {
            return 0
        } else {
            return roundToDecimalPlaces(tradesPerYear() * avgGain)
        }
      }


      const annualReturn = () => {
        if (testValue.dataValues.hldDay === 0 || tradesPerYear() === 0) { 
            return 0
        } else {
            const result = (250 / (testValue.dataValues.hldDay * tradesPerYear())) * absolutePercentPerYear();
            return isFinite(result) ? roundToDecimalPlaces(result) : 0
        }
      }

      const numberOfNegativeYears = () => {
        try {
            let count = 0;
            for (let key in yearlySums) {
                if (yearlySums[key] < 0) {
                    count++
                }
            }
            return count;
        } catch (error) {
            return 0
        }
      }

      const negativePercentage = () => {
        if (tradesPerYear() === 1) {
            return 0
        } else {
            try {
                return roundToDecimalPlaces(numberOfNegativeYears() / (numberOfYears - 1))
            } catch (error) {
                return 0
            }
        }
    }

    const maxNegativePercentage = () => {
      try {
          const values = Object.values(yearlySums)
          if (values.length === 0 || values.some(value => typeof value !== 'number' || isNaN(value))) {
              return 0
          }
          const maxNegavtivePercent =  Math.min(...values) / 100
          return roundToDecimalPlaces(maxNegavtivePercent)
      } catch (error) {
          return 0
      }
  }
    


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
        tradesPerYear: tradesPerYear(),
        absolutePercentPerYear: absolutePercentPerYear(),
        annualReturn: annualReturn(),
        numberOfNegativeYears: numberOfNegativeYears(),
        negativePercentage: negativePercentage(),
        maxNegativePercentage: maxNegativePercentage(),
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
    const { page = 1, pageSize = 100, downloadAll = false, slossPercent, tgPercent, tsPercent, avgGain, maxNegativePercentage, numNegativeYears,totalSum,winPercent,  stockId, isNewFormula = false, isYearlySumEnabled = false  } = req.body;
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

      const filterConditions = [];

      if (totalSum) {
        filterConditions.push({ totalRetSum: { [Op.gte]: Number(totalSum)/100 } });
      }
      if (avgGain) {
        filterConditions.push({ avgGain: { [Op.gte]: Number(avgGain)/100 } });
      }
      if (winPercent) {
        filterConditions.push({ winPercent: { [Op.gte]: Number(winPercent)/100 } });
      }
      if (numNegativeYears) {
        filterConditions.push({ numberOfNegativeYears: { [Op.lte]: Number(numNegativeYears) } });
      }
      if (maxNegativePercentage) {
        filterConditions.push({ maxNegativePercentage: { [Op.gte]: Number(maxNegativePercentage)/100 } });
      }


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
        console.log('filterConditions', filterConditions)

        const finalOutput = flattenedResults
        .filter((data) =>
          filterConditions.every((condition) =>
            Object.entries(condition).every(([key, val]) => {
              // Check for Op.gte and Op.lte explicitly and ensure both conditions are properly checked
              if (val[Op.gte] !== undefined && val[Op.lte] !== undefined) {
                // Handle both gte and lte
                return data[key] >= val[Op.gte] && data[key] <= val[Op.lte];
              } else if (val[Op.gte] !== undefined) {
                // Handle only gte
                return data[key] >= val[Op.gte];
              } else if (val[Op.lte] !== undefined) {
                // Handle only lte
                return data[key] <= val[Op.lte];
              } else {
                return true; // Default condition if none exist
              }
            })
          )
        )
        .map((data) => ({
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
          tradesPerYear: data.tradesPerYear,
          absolutePercentPerYear: data.absolutePercentPerYear,
          annualReturn: data.annualReturn,
          numberOfNegativeYears: data.numberOfNegativeYears,
          negativePercentage: data.negativePercentage,
          maxNegativePercentage: data.maxNegativePercentage,
          years: isYearlySumEnabled ? data.years : [],
          yearlyRetSum: isYearlySumEnabled ? data.yearlyRetSum : {},
          userId: userId,
        }));
      
        results.push(finalOutput);
      }

      res.send({
        data: results,
      });
    } catch (error) {
      res.status(200).json({ error: error.message });
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
