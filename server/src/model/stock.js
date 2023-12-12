const { DataTypes } = require('sequelize');

const Stock = (sequelize) => sequelize.define('stock', {
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  period: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // Adjust precision and scale based on your requirements
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
  close: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  open: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
});

module.exports = Stock;
