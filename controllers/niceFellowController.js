const TelegramApi = require('node-telegram-bot-api')
const schedule = require('node-schedule');
const Hogan = require('hogan.js')
const token = '5918467905:AAHXL68CbUcGKG-wg75j-r1NExgBCDBLKTI'
const sequelize = require('../db')
const TgModel = require('../models/niceFellowModel')
const fs = require('fs')

const bot = new TelegramApi(token, {polling: true})

var h = new Date();
var prevNiceStart


const niceFellowStart = async () => {

    //_____DB CONNECTION_____//
    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (error) {
        console.log('Connection refused', error)
    }

    //_____FUNCTION FOR DELAY SEND MESSAGE_____//
    function sendTime(time, msg, text) {
        new schedule.scheduleJob({ start: new Date(Date.now() + Number(time) * 1000 * 60), end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)), rule: '*/1 * * * * *' }, function () {
            bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
        });
    }

    //_____SET COMMAND FOR BOT USAGE_____//
    bot.setMyCommands([
        {command: '/start', description: 'Запустить бота'},
        {command: '/nicerules', description: 'Правила игры (обязательно к прочтению!)'},
        {command: '/nicereg', description: 'Зарегистрироваться в игре'},
        {command: '/nice', description: 'Запуск розыгрыша "Хорошего человека дня"'},
        {command: '/niceauto', description: 'Автоматический запуск розыгрыша "Хорошего человека дня"'},
        {command: '/nicestopauto', description: 'Остановка автоматического розыгрыша "Хорошего человека дня"'},
    ])
    
    //_____LISTNER_____//
    bot.on('message', async msg => {
        const text = msg.text
        const userId = (msg.from.id).toString()
        const userName = (msg.from.first_name).toString()
        const chatType = (msg.chat.type).toString()

        //console.log(msg)

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

                niceFellowGameTimeMNG()

            } else {
                bot.sendMessage(msg.chat.id, `Только для групповых чатов`)
            }
        }

        //_____ACTION ON "/niceauto" MESSAGE_____//
        if (text === '/niceauto'){

            if (chatType === 'supergroup'){

                job = schedule.scheduleJob( 'nice', '0 8 * * *', async () => {
                    niceFellowGameTimeMNG()
                })

                if (job){
                    bot.sendMessage(msg.chat.id, `Автоматический розыгрыш активирован`)
                    niceFellowGameTimeMNG()
                    return
                }
                bot.sendMessage(msg.chat.id, `Что-то пошло не так...`)
  
            } else {
                bot.sendMessage(msg.chat.id, `Только для групповых чатов`)
            }
        }

        //_____ACTION ON "/nicestopauto" MESSAGE_____//
        if (text === '/nicestopauto'){
            
            var my_job = schedule.scheduledJobs['nice'];
            if (my_job){
                my_job.cancel()
                bot.sendMessage(msg.chat.id, `Автоматический розыгрыш отключен`)
                return
            }
            bot.sendMessage(msg.chat.id, `Автоматический розыгрыш не был активирован`)

        }

        //_____TIME RESTRICTIONS FOR THE NICE FELLOW OF DAY GAME_____//
        async function niceFellowGameTimeMNG(){

            let canStart = false
            let alreadyStarted = false
            let nowDate = h.getUTCFullYear() + '-' + h.getMonth() + '-' + h.getUTCDate()

            if ((prevNiceStart != nowDate) && (alreadyStarted === false)){
                canStart = true
            }

            if ((prevNiceStart != nowDate) && (canStart === true)){

                niceFellowGame()
                prevNiceStart = h.getUTCFullYear() + '-' + h.getMonth() + '-' + h.getUTCDate()
                alreadyStarted = true
                canStart = false

            } else {
                bot.sendMessage(msg.chat.id, `Игру можно запускать только раз в день`)
            }
        }

        //_____LOGIC FOR THE NICE FELLOW OF DAY GAME_____//
        async function niceFellowGame() {

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

            if (usersInGroup){

                if (numberOfUsers >= 2){

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
        
                    sendTime(0.01, msg, 'Woop-woop! That\'s the sound of da nice-police!')
                    sendTime(0.04, msg, 'Машины выехали')
                    sendTime(0.07, msg, 'Так, что тут у нас?')
                    sendTime(0.11, msg, `Кто бы мог подумать, но *хороший человек дня* - ${user.tgUserName}`)
                    return
                } 

                bot.sendMessage(msg.chat.id, `В игре должно быть минимум 2 человека. Зарегистрироваться - /nicereg`)
                return
            }
            
            bot.sendMessage(msg.chat.id, `В этом чате пока еще никто не зарегистрировался в игру. Зарегистрироваться - /nicereg`)
            return
        }

        
    })
}

niceFellowStart()

module.exports.niceFellowStart = niceFellowStart
