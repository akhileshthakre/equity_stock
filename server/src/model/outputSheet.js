const { DataTypes } = require('sequelize');

const OutputSheet = (sequelize) => sequelize.define('outputSheet', {
  nameOfStock: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fallInStock: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  limitLevel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hldDay: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  totalDays: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  totalRetSum: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  avgGain: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  winPercent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  numberOfYears: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  yearlyRetSum: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

});

module.exports = OutputSheet;
