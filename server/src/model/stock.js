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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Stock;
