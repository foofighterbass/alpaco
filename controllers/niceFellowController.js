const TelegramApi = require('node-telegram-bot-api')
const schedule = require('node-schedule');
const Hogan = require('hogan.js')
const vault = require('../vault')
const sequelize = require('../models/db')
const TgModel = require('../models/niceFellowModel')
const fs = require('fs')

 //_____GLOBAL VARIABLES_____//
var bot = new TelegramApi(vault.TG_API_TOKEN, {polling: true})
var h = new Date();

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
        {command: '/nicerun', description: 'Запуск розыгрыша "Хорошего человека дня"'},
        {command: '/niceauto', description: 'Автоматический запуск розыгрыша "Хорошего человека дня"'},
        {command: '/nicestopauto', description: 'Остановка автоматического розыгрыша "Хорошего человека дня"'},
        {command: '/nicestat', description: 'Статистика всех участников "Хорошего человека дня"'},
        {command: '/niceme', description: 'Личная статистика участника "Хорошего человека дня"'},
    ])
    
    //_____LISTNER_____//
    bot.on('message', async msg => {

        //____TG CHAT VARIABLES_____//
        const userId = (msg.from.id).toString()
        const userName = (msg.from.first_name).toString()
        const chatType = (msg.chat.type).toString()
        const groupId = (msg.chat.id).toString()
        const groupName = (msg.chat.title).toString()

        //console.log(msg.chat)

        //_____CHECK USER IN DB_____//
        const userInDB = await TgModel.User.findOne({
            where: {
                tgUserId: userId
            }
        })

        //_____CHECK GROUP IN DB_____//
        const groupInDB = await TgModel.Group.findOne({
            where:{
                tgGroupId: groupId
            }
        })

         //_____CHECK GROUP CONTAINS USER____//
        const userInGroupDB = await TgModel.User.findOne({
            include: [{
                model: TgModel.Group,
                where: {
                    tgGroupId: groupId
                }
            }],
            where: {
                tgUserId: userId
            }
        })


        //_____ACTION ON "/start" MESSAGE_____//
        if (/\/start(@.+){0,1}/.test(msg.text)){

            var data = {
                userName: userName,
            };
            const readFile = fs.readFileSync('./templates/startTemplate.txt', 'utf-8')
            const templateFile = Hogan.compile(readFile)
            const startTemplateFile = templateFile.render(data);

            bot.sendMessage(msg.chat.id, startTemplateFile, { parse_mode: 'Markdown' })
        }


        //_____ACTION ON "/nicerules" MESSAGE_____//
        if (/\/nicerules(@.+){0,1}/.test(msg.text)){

            const readFile = fs.readFileSync('./templates/rulesTemplate.txt', 'utf-8')
            const templateFile = Hogan.compile(readFile)
            const rulesTemplateFile = templateFile.render();

            bot.sendMessage(msg.chat.id, rulesTemplateFile, { parse_mode: 'Markdown' })
        }


        //_____ACTION ON "/nicereg" MESSAGE_____//
        if (/\/nicereg(@.+){0,1}/.test(msg.text)){

            //_____CREATE USER IF NOT EXIST_____//
            if (!userInDB){
                await TgModel.User.create({
                    tgUserId: userId,
                    tgUserName: userName
                })
                bot.sendMessage(msg.chat.id, 'Добро пожаловать!')
            } else {
                bot.sendMessage(msg.chat.id, 'Ты уже в игре!')
            }

            //_____STEPS FOR GROUP CHAT ONLY_____//
            if (chatType === 'supergroup' || chatType === 'group'){

                //_____CREATE GROUP IF NOT EXIST_____//
                //console.log(groupInDB)
                if (!groupInDB){
                    
                    await TgModel.Group.create({
                        tgGroupId: groupId,
                        tgGroupName: groupName
                    })
                }

                //_____ADD USER TO GROUP_____//
                if (userInDB){
                    await userInDB.addGroup(groupInDB)
                }
            }
        }


        //_____ACTION ON "/nice" MESSAGE_____//
        if (/\/nicerun(@.+){0,1}/.test(msg.text)){
            if (chatType === 'supergroup' || chatType === 'group'){
                niceFellowGameTimeMNG()
            } else {
                bot.sendMessage(msg.chat.id, `Только для групповых чатов`)
            }
        }

        //_____ACTION ON "/nicestat" MESSAGE_____//
        if (/\/nicestat(@.+){0,1}/.test(msg.text)){
            if (userInGroupDB){
                
                //_____SEARCHING ALL USERS IN GROUP_____//
                const usersInGroup = await TgModel.User.findAll({
                    include: [{
                        model: TgModel.Group,
                        where: {
                            tgGroupId: groupId
                        }
                    }],
                })
                usersInGroupJSON = JSON.stringify(usersInGroup, null, 2)
                usersInGroupPARSE = JSON.parse(usersInGroupJSON)

                var groupStat = []
                for (let i in usersInGroupPARSE){
                    groupStat.push({ name: usersInGroupPARSE[i].tgUserName, amountOfPoints: usersInGroupPARSE[i].niceFellowCount })
                }
                groupStat.sort((a, b) => b.amountOfPoints - a.amountOfPoints);

                var statOutput = ""
                for (let i in groupStat){
                    statOutput += `${Number(i) + Number(1)}. ${groupStat[i].name} - ${groupStat[i].amountOfPoints}\n`;
                }

                bot.sendMessage(msg.chat.id, `*Топ лучших людей чата:* \n \n ${statOutput}`, { parse_mode: 'Markdown' })
            } else {
                bot.sendMessage(msg.chat.id, `Зарегистрируйтесь в игре!`)
            }
        }

        //_____ACTION ON "/niceme" MESSAGE_____//
        if (/\/niceme(@.+){0,1}/.test(msg.text)){

            if (userInGroupDB){
                userInGroupJSON = JSON.stringify(userInGroupDB, null, 2)
                userInGroupPARSE = JSON.parse(userInGroupJSON)

                const statLine = `Твоя статистика: \n${userInGroupPARSE.tgUserName} - ${userInGroupPARSE.niceFellowCount}`
                bot.sendMessage(msg.chat.id, `${statLine}`)
            } else {
                bot.sendMessage(msg.chat.id, `Зарегистрируйтесь в игре!`)
            }
        }

        //_____ACTION ON "/niceauto" MESSAGE_____//
        if (/\/niceauto(@.+){0,1}/.test(msg.text)){

            if (chatType === 'supergroup' || chatType === 'group'){

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
        if (/\/nicestopauto(@.+){0,1}/.test(msg.text)){
            
            if (chatType === 'supergroup' || chatType === 'group'){

                var my_job = schedule.scheduledJobs['nice'];
                if (my_job){
                    my_job.cancel()
                    bot.sendMessage(msg.chat.id, `Автоматический розыгрыш отключен`)
                    return
                }
                bot.sendMessage(msg.chat.id, `Автоматический розыгрыш не был активирован`)
            } else {
                bot.sendMessage(msg.chat.id, `Только для групповых чатов`)
            }
        }

        //_____TIME RESTRICTIONS FOR THE NICE FELLOW OF DAY GAME_____//
        async function niceFellowGameTimeMNG(){

            var nowDate = h.getUTCFullYear() + '-' + h.getMonth() + '-' + h.getUTCDate()

            if (groupInDB){
                if (groupInDB.lastNiceRun != nowDate){
                    var isSuccess = await niceFellowGame()
                    console.log(isSuccess)
                    if (isSuccess === 'SUCCESS') {
                        
                        groupInDB.update({
                            lastNiceRun: nowDate,
                        })
                        
                        //await groupInDB.save() 
                    }
                } else {
                    bot.sendMessage(msg.chat.id, `Игру можно запускать только раз в день`)
                }
            } else {
                bot.sendMessage(msg.chat.id, `Никто еще не зарегистрировался в игре!`)
            }
        }

        //_____LOGIC FOR THE NICE FELLOW OF DAY GAME_____//
        async function niceFellowGame() {

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
                    incrementNiceFellowCount = await userInDB.increment('niceFellowCount')
        
                    sendTime(0.01, msg, 'Woop-woop! That\'s the sound of da nice-police!')
                    sendTime(0.04, msg, 'Машины выехали')
                    sendTime(0.07, msg, 'Так, что тут у нас?')
                    sendTime(0.11, msg, `Кто бы мог подумать, но *хороший человек дня* - ${userInDB.tgUserName}`)
                    return 'SUCCESS'
                } 

                bot.sendMessage(msg.chat.id, `В игре должно быть минимум 2 человека. Зарегистрироваться - /nicereg`)
                return 'FAILURE'
            }
            
            bot.sendMessage(msg.chat.id, `В этом чате пока еще никто не зарегистрировался в игру. Зарегистрироваться - /nicereg`)
            return 'FAILURE'
        }

        //_____FUNCTION FOR DELAY SEND MESSAGE_____//
        function sendTime(time, msg, text) {
            new schedule.scheduleJob({ start: new Date(Date.now() + Number(time) * 1000 * 60), end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)), rule: '*/1 * * * * *' }, function () {
                bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
            });
        }
    })
}

niceFellowStart()
