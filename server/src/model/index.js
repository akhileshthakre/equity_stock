require('dotenv').config()
const { CLIENT, DATABASE, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env


const Sequelize = require("sequelize");
const sequelize = new Sequelize(DATABASE, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
        rejectUnauthorized: false
    }
  },
  operatorsAliases: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require('./User')(sequelize, Sequelize);
db.stocks = require('./stock')(sequelize, Sequelize);

module.exports = db;