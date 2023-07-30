const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
    'alpaca',
    'admin',
    'admin',
    {
        host: 'localhost',
        port: '1234',
        dialect: 'postgres'
    }
)
