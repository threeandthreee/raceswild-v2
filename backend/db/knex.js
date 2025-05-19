const knex = require('knex')

module.exports = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, done) => {
      conn.query('SELECT 1', (err) => {
        done(err, conn)
      })
    }
  }
})
