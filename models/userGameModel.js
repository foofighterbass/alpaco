import { where } from 'sequelize';
import NiceFellowDb from './mainGameModel.js';

class NiceFellowUser {

    constructor() {
        this.niceFellowDb = new NiceFellowDb();
        this.niceFellowDb.connect();
    }

    async create(userId, userName) {    
        await this.niceFellowDb.User.create({
            tgUserId: userId,
            tgUserName: userName
        }) 
    }

    async get(userId) {
        return await this.niceFellowDb.User.findOne({
            where: {
                tgUserId: userId
            },
            raw: true,
        })
    }

    async checkUserInGroup(userId, groupId) {
        return await this.niceFellowDb.User.findOne({
            include: [{
                model: this.niceFellowDb.Group,
                where: {
                    tgGroupId: groupId
                }
            }],
            where: {
                tgUserId: userId
            },
            raw: true,
        })
    }

    async addUserToGroup(userId, groupId) {
        await this.niceFellowDb.User.findOne({ 
            where: { tgUserId: userId }
        })
        .then(user => {
            this.niceFellowDb.Group.findOne({
                where:{ tgGroupId: groupId }
            })
        .then(group => {
            user.addGroup(group);
        })}); 
    }

    async incrementNiceFellowCount(userId) {
        await this.niceFellowDb.User.increment(
            'niceFellowCount',
            {
                where: {tgUserId: userId}
            }
        )
        return 'SUCCESS'
    }

    async usersInGroup(groupId) {
        return await this.niceFellowDb.User.findAll({
            include: [{
                model: this.niceFellowDb.Group,
                where: {
                    tgGroupId: groupId
                }
            }],
        })
    }

}

export default NiceFellowUser;
