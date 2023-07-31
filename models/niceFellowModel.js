const sequelize = require('./db')
const {DataTypes} = require('sequelize')


const User = sequelize.define('User', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    tgUserName: {type: DataTypes.STRING},
    tgUserId: {type: DataTypes.STRING, unique: true},
    niceFellowCount: {type: DataTypes.INTEGER, defaultValue: 0}
})

const Group = sequelize.define('Group', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    tgGroupName: {type: DataTypes.STRING},
    tgGroupId: {type: DataTypes.STRING, unique: true},
    lastNiceRun: {type: DataTypes.STRING}
}) 

const UserGroup = sequelize.define('UserGroup', {})

User.belongsToMany(Group, { through: UserGroup });
Group.belongsToMany(User, { through: UserGroup });

module.exports.User = User
module.exports.Group = Group
