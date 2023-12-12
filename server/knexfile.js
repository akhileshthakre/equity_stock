require('dotenv').config()

const { CLIENT, DATABASE, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env

module.exports = {

  development: {
    client: CLIENT || 'pg',
    connection: {
        database: DATABASE,
        user: DB_USER,
        password: DB_PASSWORD,
        host: DB_HOST,
        port: DB_PORT,
        ssl: {
          rejectUnauthorized: false
        },
    },
    migrations: {
        directory: __dirname + '/db/migrations',
    },
    seeds: {
        directory: __dirname + '/db/seeds',
    },
},
  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
