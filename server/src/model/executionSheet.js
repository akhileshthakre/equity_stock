const { DataTypes } = require('sequelize');

const ExecutionSheet = (sequelize) => sequelize.define('executionSheet', {
  sheetNames: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stockSymbol: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  weightage: {
    type: DataTypes.DECIMAL(25, 15),
    allowNull: true,
  },
  fallInStock: {
    type: DataTypes.DECIMAL(25, 15),
    allowNull: true,
  },
  limitLevel: {
    type: DataTypes.DECIMAL(25, 15),
    allowNull: true,
  },
  hldDay: {
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true,
  },
  bp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  posInitial: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sloss: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tgt: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  slHit: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tgtHit: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hld: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tradeClose: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  carry: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nd: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  posVal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  constantValue: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

});

module.exports = ExecutionSheet;
