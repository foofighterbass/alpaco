const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
    'alpaca',
    'admin',
    'admin',
    {
        host: '127.0.0.1',
        port: '1234',
        dialect: 'postgres'
    }
)