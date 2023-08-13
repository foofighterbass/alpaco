import { Sequelize, DataTypes } from 'sequelize'

const DB_NAME = 'alpaca'
const DB_USER = 'admin'
const DB_PASSWORD = 'admin'
const DB_HOST = 'localhost'
const DB_DIALECT = 'postgres'
const DB_PORT = '1234'

class NiceFellowDb {
    constructor() {
        this.sequelize = new Sequelize(
            DB_NAME,
            DB_USER,
            DB_PASSWORD,
            {
                host: DB_HOST,
                port: DB_PORT,
                dialect: DB_DIALECT
            }  
        );

        this.User = this.sequelize.define('User', {
            id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
            tgUserName: {type: DataTypes.STRING},
            tgUserId: {type: DataTypes.STRING, unique: true},
            niceFellowCount: {type: DataTypes.INTEGER, defaultValue: 0}
        })
      
        this.Group = this.sequelize.define('Group', {
            id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
            tgGroupName: {type: DataTypes.STRING},
            tgGroupId: {type: DataTypes.STRING, unique: true},
            lastNiceRun: {type: DataTypes.STRING}
        })

        this.UserGroup = this.sequelize.define('UserGroup', {})

        this.User.belongsToMany(this.Group, { through: this.UserGroup });
        this.Group.belongsToMany(this.User, { through: this.UserGroup });
    }

    async connect() {
        try {
            await this.sequelize.authenticate();
            await this.sequelize.sync();
            console.log('Connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    } 
}

export default NiceFellowDb;
