const TelegramApi = require('node-telegram-bot-api')
const Hogan = require('hogan.js')
const token = '5918467905:AAHXL68CbUcGKG-wg75j-r1NExgBCDBLKTI'
const sequelize = require('../db')
const TgModel = require('../models/niceFellowModel')
const fs = require('fs')

const bot = new TelegramApi(token, {polling: true})

const niceFellowStart = async () => {

    //_____DB CONNECTION_____//
    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (error) {
        console.log('Connection refused', error)
    }

    //_____SET COMMAND FOR BOT USAGE_____//
    bot.setMyCommands([
        {command: '/start', description: 'Запустить бота'},
        {command: '/nicerules', description: 'Правила игры (обязательно к прочтению!)'},
        {command: '/nicereg', description: 'Зарегистрироваться в игре'},
        {command: '/nice', description: 'Запуск розыгрыша "Хорошего человека дня"'},
    ])
    
    //_____LISTNER_____//
    bot.on('message', async msg => {
        const text = msg.text
        const userId = (msg.from.id).toString()
        const userName = (msg.from.first_name).toString()
        const chatType = (msg.chat.type).toString()

        //console.log(chatType)

        //_____ACTION ON "/start" MESSAGE_____//
        if (text === '/start'){
            var data = {
                userName: userName,
            };
            const readFile = fs.readFileSync('./templates/startTemplate.txt', 'utf-8')
            const templateFile = Hogan.compile(readFile)
            const startTemplateFile = templateFile.render(data);

            bot.sendMessage(msg.chat.id, startTemplateFile, { parse_mode: 'Markdown' })
        }

        //_____ACTION ON "/nicerules" MESSAGE_____//
        if (text === '/nicerules'){
            var data = {
                //userName: userName,
            };
            const readFile = fs.readFileSync('./templates/rulesTemplate.txt', 'utf-8')
            const templateFile = Hogan.compile(readFile)
            const rulesTemplateFile = templateFile.render();

            bot.sendMessage(msg.chat.id, rulesTemplateFile, { parse_mode: 'Markdown' })
        }

        //_____ACTION ON "/nicereg" MESSAGE_____//
        if (text === '/nicereg'){

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
                bot.sendMessage(msg.chat.id, 'Добро пожаловать!')
            } else {
                bot.sendMessage(msg.chat.id, 'Ты уже в игре!')
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
                    await user.addGroup(checkGroup)
                }
            }
        }

        //_____ACTION ON "/nice" MESSAGE_____//
        if (text === '/nice'){

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

niceFellowStart()

module.exports.niceFellowStart = niceFellowStart