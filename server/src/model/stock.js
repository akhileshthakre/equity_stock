const { DataTypes } = require('sequelize');

const Stock = (sequelize) => sequelize.define('stock', {
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  period: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  //this store the close column value or price column value
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  high: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  low: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  open: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
});

module.exports = Stock;
