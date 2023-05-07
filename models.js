const sequelize = require('./db')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    userId: {type: DataTypes.STRING, unique: true},
    niceFellowCount: {type: DataTypes.INTEGER, defaultValue: 0}
})

module.exports = User