const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
    'alpaca',
    'admin',
    'admin',
    {
        host: 'alpaca-db-conteinireized',
        port: '5432',
        dialect: 'postgres'
    }
)