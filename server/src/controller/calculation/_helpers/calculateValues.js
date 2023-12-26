
const constantTS = 0.08 / 100; // change this with W1 from sheet as user input
const constantSloss = 10 / 100; // Change with the actual M2 from the sheet as user input
const constantTGT = 25 / 100; //change it with the N2 of the sheet as user input

const calculateHRefPoints = (stock, prevStock, index, testValue) => {
    const fallInStock = testValue.fallInStock
    const high = stock.high;
    if (index === 0) {
        return high;
    } else if (index === 1) {
        return roundToDecimalPlaces(prevStock.HrefPoint * (1 + (fallInStock / 100))); //change with B1 from the sheet
    } else if (index === 2) {
        return high;
    }
    const open = prevStock.open;
    const tradeClose = prevStock ? prevStock.TradeClose : null;
    const prevHrefPoint = prevStock ? prevStock.HrefPoint: null
    const prevHigh = prevStock.high;

    if (open === "") {
        return "";
    }

    if (tradeClose === 1) {
        return roundToDecimalPlaces(prevStock.SP);
    } else if(prevHrefPoint > prevHigh){
        return roundToDecimalPlaces(prevHrefPoint)
    }else {
        return roundToDecimalPlaces(prevHigh)
    }
};

  
  const calculateDeclineFromRP = (stock, prevStock, index, testValue) => {
    if(index === 0) {
        return null
    }
    if(index === 1 || index === 2) {
        return stock.low/prevStock.HrefPoint - 1
    }
    const low = stock.low;
    const prevHrefPoint = prevStock ? prevStock.HrefPoint : null;

    if (low === "") {
        return "";
    } else {
        const declineInRp = isNaN(low / prevHrefPoint - 1) ? '' : low / prevHrefPoint - 1;
        return declineInRp;
    }

  };
  
  const calculateBP = (stock, prevStock, index, testValue) => {
    const fallInStock = testValue.fallInStock
    const limitLevel = testValue.limitLevel
    if (index === 0 || index === 1 || index === 2) {
      return null;
    }
  
    const open = stock.open;
    const prevCarry = prevStock ? prevStock.Carry : null;
    const prevBp = prevStock ? prevStock.BP : null;
    const low = stock.low;
    const hrefPoint = stock.HrefPoint ? stock.HrefPoint : calculateHRefPoints(stock, prevStock, index, testValue);
    const constantB1 = fallInStock / 100; // change it with B1 of the sheet
    const constantD1 = limitLevel / 100; // change it with D1 of the sheet
  
    if (open === "") {
      return "";
    } 
    if (prevCarry === 1) {
        return prevBp;
    } 
    if (low < hrefPoint * (1 + constantB1 - constantD1)){
        return roundToDecimalPlaces(hrefPoint * (1 + constantB1 - constantD1))
    }else {
        return ""
    }
  };
  
  
  const calculatePosInitial = (stock, prevStock, index, testValue) => { 
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const bp = calculateBP(stock, prevStock, index, testValue);
    const prevBp = prevStock ? prevStock.BP : null;

    if (bp === "") {
        return "";
    } else {
        return bp !== prevBp ? 1 : "";
    }
  };
  
  const calculateTGT = (stock, prevStock, index, testValue) => {
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const open = stock.open;
    const posInitial = stock.posInitial? stock.posInitial : calculatePosInitial(stock, prevStock, index, testValue);
    const prevCarry = prevStock ? prevStock.Carry : null;
    const bp = stock.BP ? stock.BP : calculateBP(stock, prevStock, index, testValue);
    const constantN2 = constantTGT; //change it with the N2 of the sheet
  
    if (open === "") {
      return "";
    } else {
      if (posInitial === 1 || prevCarry === 1) {
        return roundToDecimalPlaces(bp * (1 + constantN2));
      } else {
        return "";
      }
    }
  };
  
  const calculateSLHit = (stock, prevStock, index, testValue) => {
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const open = stock.open;
    const posInitial = stock.DPosInitial ? stock.DPosInitial : calculatePosInitial(stock, prevStock, index, testValue);
    const prevCarry = prevStock ? prevStock.Carry : null;
    const low = stock.low;
    const sloss = stock.Sloss ? stock.Sloss : calculateSloss(stock, prevStock, index, testValue);
  
    if (open === "") {
      return "";
    } else {
      if ((posInitial === 1 || prevCarry === 1) && low <= sloss) {
        return 1;
      } else {
        return 0;
      }
    }
  };
  
  const calculateTGTHit = (stock, prevStock, index, testValue) => {
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const open = stock.open;
    const slHit = stock.SLHit ? stock.SLHit : calculateSLHit(stock, prevStock, index, testValue);
    const high = stock.high;
    const tgt = stock.TGT ? stock.TGT : calculateTGT(stock, prevStock, index, testValue);
    const posInitial = stock.posInitial ? stock.posInitial : calculatePosInitial(stock, prevStock, index, testValue);
    const prevCarry = prevStock ? prevStock.Carry : null;
  
    if (open === "") {
      return "";
    } else {
      if (slHit === 0 && high >= tgt && (posInitial === 1 || prevCarry === 1)) {
        return 1;
      } else {
        return 0;
      }
    }
  };
  
  const calculateHLDDay = (stock, prevStock, index, testValue) => {
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const open = stock.open;
    const posInitial = stock.posInitial ? stock.posInitial : calculatePosInitial(stock, prevStock, index, testValue);
    const prevCarry = prevStock ? prevStock.Carry : null;
    const prevHldDays = prevStock ? prevStock.HLDDay : null;;

    if (open === "") {
        return "";
    } else {
        if (posInitial === 1) {
        return 0;
        } else if (prevCarry === 1) {
        return prevHldDays + 1;
        } else {
        return "";
        }
    }
  };
  
  const calculateTradeClose = (stock, prevStock, index, testValue) => {
    const holdingDay = testValue.hldDay
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const open = stock.open;
    const posInitial = stock.posInitial ? stock.posInitial : calculatePosInitial(stock, prevStock, index, testValue);
    const prevCarry = prevStock ? prevStock.Carry : null
    const slHit = stock.SLHit? stock.SLHit : calculateSLHit(stock, prevStock, index, testValue);
    const tgtHit = stock.TGTHit ? stock.TGTHit : calculateTGTHit(stock, prevStock, index, testValue);
    const hldDay = stock.HLDDay ? stock.HLDDay : calculateHLDDay(stock, prevStock, index, testValue);
    const constantF1 = holdingDay; // Change it with cell F1 of the sheet
  
    if (open === "") {
      return "";
    } else {
      if ((posInitial === 1 || prevCarry === 1) && (slHit === 1 || tgtHit === 1 || hldDay === constantF1) ) {
        return 1;
      } else {
        return 0;
      }
    }
  };
  
  const calculateSloss = (stock, prevStock, index, testValue) => {
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const open = stock.open;
    const posInitial = stock.posInitial ? stock.posInitial : calculatePosInitial(stock, prevStock, index,testValue);
    const prevCarry = prevStock ? prevStock.Carry : null;
    const bp = stock.BP ? stock.BP : calculateBP(stock, prevStock, index, testValue);
    const constantM2 = constantSloss; //Change with the actual M2 from the sheet
  
    if (open === "") {
      return "";
    } else {
      if (posInitial === 1 || prevCarry === 1) {
        return roundToDecimalPlaces(bp * (1 - constantM2));
      } else {
        return "";
      }
    }
  };
  
  const calculateSP = (stock, prevStock, index, testValue) => {
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const open = stock.open;
    const tradeClose = stock.TradeClose ? stock.TradeClose : calculateTradeClose(stock, prevStock, index, testValue);
    const slHit = stock.SLHit? stock.SLHit : calculateSLHit(stock, prevStock, index, testValue);
    const tgtHit = stock.TGTHit ? stock.TGTHit : calculateTGTHit(stock, prevStock, index, testValue);
    const sloss = stock.Sloss ? stock.Sloss : calculateSloss(stock, prevStock, index, testValue);
    const tgt = stock.TGT ? stock.TGT : calculateTGT(stock, prevStock, index, testValue);
    const price = stock.price;
    const constantW1 = constantTS; // Replace this with W1 from sheet
  
    if (open === "") {
      return "";
    } else {
      if (tradeClose === 1) {
        if (slHit === 1) {
          return roundToDecimalPlaces(sloss * (1 - constantW1));
        } else if (tgtHit === 1) {
          return roundToDecimalPlaces(tgt * (1 - constantW1));
        } else if (tradeClose === 1) {
          return roundToDecimalPlaces(price * (1 - constantW1));
        } else {
          return "";
        }
      } else {
        return "";
      }
    }
  };
  
  const calculateCarry = (stock, prevStock, index, spValue, testValue) => {
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const open = stock.open;
    const prevCarry = prevStock ? prevStock.Carry : null;
    const posInitial = stock.DPosInitial ? stock.DPosInitial : calculatePosInitial(stock, prevStock, index, testValue);
    const sp = spValue;
  
    if (open === "") {
      return "";
    } else {
      if ((prevCarry === 1 || posInitial === 1) && sp === "") {
        return 1;
      } else {
        return 0;
      }
    }
  };
  
  const calculateRet = (stock, prevStock, index, testValue) => {
    if(index === 0 || index === 1 || index === 2 ) {
        return null
    }
    const sp = stock.SP? stock.SP : calculateSP(stock, prevStock, index, testValue);
    const bp = stock.BP ? stock.BP : calculateBP(stock, prevStock, index, testValue);
    if(sp === "" || sp === null) {
        return null
    }
    const ret = isNaN(sp / bp - 1) ? '' : sp / bp - 1;
    return ret;
  };

  const  roundToDecimalPlaces = (number)  => {
    let factor = Math.pow(10, 2);
    return Math.round(number * factor) / factor;
  }
  
  const calculateValues = (stocks, testCases) => {
    const fallInStock = testCases.fallInStock * 100
    const limitLevel = testCases.limitLevel * 100
    const hldDay = Number(testCases.hldDay)
    const testValue = {
        fallInStock,
        limitLevel,
        hldDay
    }
    let prevStock = null;
    const calculatedStocks = stocks.map( (stockData, index) => {
      const stock = stockData.dataValues
      const hrefPoint = calculateHRefPoints(stock, prevStock, index, testValue);
      const declineInRP = calculateDeclineFromRP(stock, prevStock, index, testValue);
      const bp = calculateBP(stock, prevStock, index, testValue);
      const dPosInitial = calculatePosInitial(stock, prevStock, index, testValue);
      const tgt = calculateTGT(stock, prevStock, index, testValue);
      const slHit = calculateSLHit(stock, prevStock, index, testValue);
      const tgtHit = calculateTGTHit(stock, prevStock, index, testValue);
      const hldDay = calculateHLDDay(stock, prevStock, index, testValue);
      const tradeClose = calculateTradeClose(stock, prevStock, index, testValue);
      const sp = calculateSP(stock, prevStock, index, testValue);
      const carry = calculateCarry(stock, prevStock, index, sp, testValue);
      const sloss = calculateSloss(stock, prevStock, index, testValue);
      const ret = calculateRet(stock, prevStock, index, testValue);
  
      prevStock = {
        ...stock,
        HrefPoint: hrefPoint,
        declineInRP: declineInRP,
        BP: bp,
        DPosInitial: dPosInitial,
        TGT: tgt,
        SLHit: slHit,
        TGTHit: tgtHit,
        HLDDay: hldDay,
        TradeClose: tradeClose,
        SP: sp,
        Carry: carry,
        Sloss: sloss,
        Ret: ret,
      };

      return {
        ...stock,
        HrefPoint: hrefPoint,
        declineInRP: declineInRP,
        BP: bp,
        DPosInitial: dPosInitial,
        TGT: tgt,
        SLHit: slHit,
        TGTHit: tgtHit,
        HLDDay: hldDay,
        TradeClose: tradeClose,
        SP: sp,
        Carry: carry,
        Sloss: sloss,
        Ret: ret,
      };
    });
  
    return calculatedStocks;
  };
  
  
  module.exports = calculateValues;
  