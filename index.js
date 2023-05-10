const TelegramApi = require('node-telegram-bot-api')
const Hogan = require('hogan.js')
const token = '5918467905:AAHXL68CbUcGKG-wg75j-r1NExgBCDBLKTI'
const sequelize = require('./db')
const TgModel = require('./models')
const fs = require('fs')

const bot = new TelegramApi(token, {polling: true})

const start = async () => {

    //_____DB CONNECTION_____//
    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (error) {
        console.log('Connection refused', error)
    }
    
    //_____LISTNER_____//
    bot.on('message', async msg => {
        const text = msg.text
        const userId = (msg.from.id).toString()
        const userName = (msg.from.first_name).toString()
        const chatType = (msg.chat.type).toString()

        //console.log(msg)

        if (text === '/rules'){

            //_____EXAMPLE OF PARSING TEMPLATE FILE_____//
            var data = {
                screenName: "dhg",
            };
            const readFile = fs.readFileSync('./templates/rulesTemplate.txt', 'utf-8')
            const templateFile = Hogan.compile(readFile)
            const rulesTemplateFile = templateFile.render();

            bot.sendMessage(msg.chat.id, rulesTemplateFile, { parse_mode: 'Markdown' })
        }

        if (text === '/registration'){

            //_____CHECK USER EXIST_____//
            const user = await TgModel.User.findOne({
                where: {
                    tgUserId: userId
                }
            })

            //_____CREATE USER IF NOT EXIST_____//
            if (!user){
                await TgModel.User.create({
                    tgUserId: userId,
                    tgUserName: userName
                })
                bot.sendMessage(msg.chat.id, 'Welcome!')
            } else {
                bot.sendMessage(msg.chat.id, 'U r alredy in the game!')
            }

            //_____STEPS FOR GROUP CHAT ONLY_____//
            if (chatType === 'supergroup'){

                const groupId = (msg.chat.id).toString()
                const groupName = (msg.chat.title).toString()

                //_____CHECK GROUP EXIST_____//
                const group = await TgModel.Group.findOne({
                    tgGroupId: groupId
                })

                //_____CREATE GROUP IF NOT EXIST_____//
                if (!group){
                    await TgModel.Group.create({
                        tgGroupId: groupId,
                        tgGroupName: groupName
                    })
                    bot.sendMessage(msg.chat.id, 'Group registred!')
                } else {
                    bot.sendMessage(msg.chat.id, 'Group already in game!')
                }

                //_____KOSTYL FOR ADDING USER TO GROUP (NEED TO CREATE BETTER SOLUTION)_____//
                const user = await TgModel.User.findOne({
                    where: {
                        tgUserId: userId
                    }
                })
                const checkGroup = await TgModel.Group.findOne({
                    tgGroupId: groupId
                })

                //_____ADD USER TO GROUP_____//
                if (user){
                    //console.log(JSON.stringify(user, null, 2))
                    await user.addGroup(checkGroup)
                    bot.sendMessage(msg.chat.id, 'User added to group')
                }
            }
        }

        
        if (text === '/niceFellowOfDay'){

            if (chatType === 'supergroup'){

                const groupId = (msg.chat.id).toString()

                //_____SEARCHING ALL USERS IN GROUP_____//
                const usersInGroup = await TgModel.Group.findAndCountAll({
                    include: TgModel.User,
                    where: {
                        tgGroupId: groupId
                    }
                })
    
                usersInGroupJSON = JSON.stringify(usersInGroup, null, 2)
                usersInGroupPARSE = JSON.parse(usersInGroupJSON)
                numberOfUsers = usersInGroupPARSE.count
    
                //_____GETTING RANDOM USER_ID_____//
                const randomNumber = Math.floor(Math.random() * numberOfUsers)
                randomUserId = usersInGroupPARSE.rows[0].Users[randomNumber].tgUserId
    
                //_____INCREMENT NICEFELLOWCOUNT FOR RANDOM USER_____//
                const user = await TgModel.User.findOne({
                    where: {
                        tgUserId: randomUserId
                    }
                })
                incrementNiceFellowCount = await user.increment('niceFellowCount')
    
                bot.sendMessage(msg.chat.id, `Nice fellow of day - ${user.tgUserName}`)
                
                return
            }

            bot.sendMessage(msg.chat.id, `For group chats only`)
        }


    })
}

start()
