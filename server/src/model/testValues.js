const { DataTypes } = require('sequelize');

const TestValue = (sequelize) => sequelize.define('testValue', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = TestValue;
