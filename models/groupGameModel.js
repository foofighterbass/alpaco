import NiceFellowDb from './mainGameModel.js';

class NiceFellowGroup {

    constructor() {
        this.niceFellowDb = new NiceFellowDb();
    }

    async create(groupId, groupName) {
        await this.niceFellowDb.Group.create({
            tgGroupId: groupId,
            tgGroupName: groupName
        })
    }

    async get(groupId) {
        return await this.niceFellowDb.Group.findOne({
            where:{
                tgGroupId: groupId
            }
        })
    }

    async findAllUsersInGroup(groupId) {
        return await this.niceFellowDb.Group.findAndCountAll({
            include: this.niceFellowDb.User,
            where: {
                tgGroupId: groupId
            }
        })
    }

    async setLastGameStartDate(groupId, date) {
        await this.niceFellowDb.Group.update(
            {
                lastNiceRun: date,
            },
            {
                where: {
                    tgGroupId: groupId
                }
            }
        )
    }


}

export default NiceFellowGroup;