import NiceFellowUser from '../models/userGameModel.js';
import NiceFellowGroup from '../models/groupGameModel.js';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs'
import Hogan from 'hogan.js'

const user = new NiceFellowUser();
const group = new NiceFellowGroup();
const bot = new TelegramBot('5918467905:AAHXL68CbUcGKG-wg75j-r1NExgBCDBLKTI', {polling: true});

let date = new Date();

const niceFellowGameStart = async () => {
    //_____SET COMMAND FOR BOT USAGE_____//
    bot.setMyCommands([
        {command: '/start', description: 'Запустить бота'},
        {command: '/nicerules', description: 'Правила игры (обязательно к прочтению!)'},
        {command: '/niceregchat', description: 'Зарегистрировать группу в игре(только для групповых чатов)'},
        {command: '/nicejoin', description: 'Присоедениться к ежедневной лотерее "Бубочка дня"'},
        {command: '/nicerun', description: 'Запуск розыгрыша "Бубочки дня"'},
        {command: '/niceauto', description: 'Автоматический запуск розыгрыша "Бубочки дня"'},
        {command: '/nicestopauto', description: 'Остановка автоматического розыгрыша "Бубочки дня"'},
        {command: '/nicestat', description: 'Статистика всех участников "Бубочки дня"'},
        {command: '/niceme', description: 'Личная статистика участника "Бубочки дня"'},
    ])

    //_____LISTNER_____//
    bot.on('message', async msg => {
        //____TG CHAT VARIABLES_____//
        const userId = (msg.from.id).toString()
        const userName = (msg.from.first_name).toString()
        const groupId = (msg.chat.id).toString()
        const groupName = (msg.chat.title).toString()
        const chatType = (msg.chat.type).toString()

        //_____ACTION ON "/start" MESSAGE_____//
        if (/\/start(@.+){0,1}/.test(msg.text)){
            let data = { userName: userName, };
            let readFile = fs.readFileSync('./templates/startTemplate.txt', 'utf-8')
            let templateFile = Hogan.compile(readFile)
            let startTemplateFile = templateFile.render(data);

            bot.sendMessage(msg.chat.id, startTemplateFile, { parse_mode: 'Markdown' })
        }

        //_____ACTION ON "/nicerules" MESSAGE_____//
        if (/\/nicerules(@.+){0,1}/.test(msg.text)){
            let readFile = fs.readFileSync('./templates/rulesTemplate.txt', 'utf-8')
            let templateFile = Hogan.compile(readFile)
            let rulesTemplateFile = templateFile.render();

            bot.sendMessage(msg.chat.id, rulesTemplateFile, { parse_mode: 'Markdown' })
        }

        //_____NICE_FELLOW_GAME_LOGIC_____//
        if (chatType === 'supergroup' || chatType === 'group'){
            //_____ACTION ON "/niceregchat" MESSAGE_____//
            if (/\/niceregchat(@.+){0,1}/.test(msg.text)){
                //let isGroupRegistered = await group.get(groupId)
                if (await group.get(groupId)) {
                    bot.sendMessage(msg.chat.id, `Группа уже в игре!`)
                } else {
                    await group.create(groupId, groupName)
                    bot.sendMessage(msg.chat.id, `Вы успешно зарегестрировали групповой чат в игре! /nicejoin - присоедениться к лотерее `, { parse_mode: 'Markdown' })
                }
            }

             //_____ACTION ON "/nicereg" MESSAGE_____//
            if (/\/nicejoin(@.+){0,1}/.test(msg.text)){
                if (!(await user.checkUserInGroup(userId, groupId))){
                    if (await group.get(groupId)) {
                        if (await user.get(userId)) {
                            bot.sendMessage(msg.chat.id, `Мы помним тебя, братишка! Уже успел где-то еще стать *Бубочкой*?`, { parse_mode: 'Markdown' })
                        } else {
                            user.create(userId, userName)
                            await bot.sendMessage(msg.chat.id, `В первый раз здесь?`, { parse_mode: 'Markdown' })
                        }
                        user.addUserToGroup(userId, groupId)
                        await bot.sendMessage(msg.chat.id, `Добавили тебя к розыгрышу в этом чате. Запусти лотерею по команде /nicerun и пусть самый достойный станет *Бубочкой дня*`, { parse_mode: 'Markdown' })
                    } else {
                        bot.sendMessage(msg.chat.id, `Сначала зарегистрируйте чат по команде /niceregchat!`, { parse_mode: 'Markdown' })
                    }
                } else {
                    bot.sendMessage(msg.chat.id, `И зачем сюда нажал? Ты уже в игре!`, { parse_mode: 'Markdown' })
                }
            }

            //_____ACTION ON "/nice" MESSAGE_____//
            if (/\/nicerun(@.+){0,1}/.test(msg.text)){
                let lastStartDate = date.getUTCFullYear() + '-' + date.getMonth() + '-' + date.getUTCDate()
                let thisGroup = await group.get(groupId)
                if (thisGroup) {
                    if (thisGroup.lastNiceRun != lastStartDate) {
                        if (await user.checkUserInGroup(userId, groupId)){
                            let allUsersInGroup = await group.findAllUsersInGroup(groupId)
                            let allUsersInGroupJson = JSON.stringify(allUsersInGroup, null, 2)
                            let allUsersInGroupParse = JSON.parse(allUsersInGroupJson)
                            let allUsersInGroupCount = allUsersInGroupParse.count

                            if (allUsersInGroupCount >= 2) {
                                let randomNumber = Math.floor(Math.random() * allUsersInGroupCount)
                                let randomUserId = allUsersInGroupParse.rows[0].Users[randomNumber].tgUserId
                                let randomUserName = allUsersInGroupParse.rows[0].Users[randomNumber].tgUserName
                                let winner = await user.incrementNiceFellowCount(randomUserId)
                                if (winner === 'SUCCESS') {
                                    await group.setLastGameStartDate(groupId, lastStartDate)
                                    bot.sendMessage(msg.chat.id, `Не все с этим согласны, но *"Бубочка дня"* определен, и это - *${randomUserName}*`, { parse_mode: 'Markdown' })
                                } else {
                                    bot.sendMessage(msg.chat.id, `Не смогли определить победителя, попробуйте еще раз`, { parse_mode: 'Markdown' })
                                }
                            } else {
                                bot.sendMessage(msg.chat.id, `В игре должнно быть минимум два человека! /nicejoin - присоедениться к лотерее `, { parse_mode: 'Markdown' })
                            }
                        } else {
                            bot.sendMessage(msg.chat.id, `Сначала присоеденись к игре по команде /nicejoin`, { parse_mode: 'Markdown' })
                        }
                    } else {
                        bot.sendMessage(msg.chat.id, `Игру можно запускать только 1 раз в день!`, { parse_mode: 'Markdown' })
                    }
                } else {
                    bot.sendMessage(msg.chat.id, `Сначала зарегистрируйте чат по команде /niceregchat!`, { parse_mode: 'Markdown' })
                }     
            }

            //_____ACTION ON "/niceauto" MESSAGE_____//
            if (/\/niceauto(@.+){0,1}/.test(msg.text)){
                bot.sendMessage(msg.chat.id, `Ну не, сейчас я на это не отвечу!`)
            }

            //_____ACTION ON "/nicestopauto" MESSAGE_____//
            if (/\/nicestopauto(@.+){0,1}/.test(msg.text)){
                bot.sendMessage(msg.chat.id, `Ну не, сейчас я на это не отвечу!`)
            }

            //_____ACTION ON "/niceme" MESSAGE_____//
            if (/\/niceme(@.+){0,1}/.test(msg.text)){
                bot.sendMessage(msg.chat.id, `Ну не, сейчас я на это не отвечу!`)
            }

            //_____ACTION ON "/nicestat" MESSAGE_____//
            if (/\/nicestat(@.+){0,1}/.test(msg.text)){
                let thisGroup = await group.get(groupId)
                if (thisGroup) {
                    if (await user.checkUserInGroup(userId, groupId)){
                        //console.log(await user.usersInGroup(groupId))
                        let usersInGroup = await user.usersInGroup(groupId)
                        let usersInGroupJSON = JSON.stringify(usersInGroup, null, 2)
                        let usersInGroupPARSE = JSON.parse(usersInGroupJSON)
                        let groupStat = []

                        for (let i in usersInGroupPARSE){
                            groupStat.push({ name: usersInGroupPARSE[i].tgUserName, amountOfPoints: usersInGroupPARSE[i].niceFellowCount })
                        }
                        groupStat.sort((a, b) => b.amountOfPoints - a.amountOfPoints);
        
                        var statOutput = ""
                        for (let i in groupStat){
                            statOutput += `${Number(i) + Number(1)}. ${groupStat[i].name} - *${groupStat[i].amountOfPoints}*\n`;
                        }

                        bot.sendMessage(msg.chat.id, `*Топ "Бубочек" чата:* \n \n${statOutput}`, { parse_mode: 'Markdown' })
                    } else {
                        bot.sendMessage(msg.chat.id, `Сначала присоеденись к игре по команде /nicejoin`, { parse_mode: 'Markdown' })
                    }
                } else {
                    bot.sendMessage(msg.chat.id, `Сначала зарегистрируйте чат по команде /niceregchat!`, { parse_mode: 'Markdown' })
                } 
            }


        } else {
            bot.sendMessage(msg.chat.id, `Только для групповых чатов!`)
        }
    })

}

niceFellowGameStart()

class NiceFellowMain{

}

export default NiceFellowMain;
