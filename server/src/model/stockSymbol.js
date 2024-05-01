const { DataTypes } = require('sequelize');

const StockSymbols = (sequelize) => sequelize.define('stockSymbol', {
  stocks: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = StockSymbols;
