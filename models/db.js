const vault = require('../vault')
const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
    vault.DB_NAME,
    vault.DB_USER,
    vault.DB_PASSWORD,
    {
        host: vault.DB_HOST,
        port: vault.DB_PORT,
        dialect: vault.DB_DIALECT
    }
)
