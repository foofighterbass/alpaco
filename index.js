const TelegramApi = require('node-telegram-bot-api')

const token = '5918467905:AAHXL68CbUcGKG-wg75j-r1NExgBCDBLKTI'

const bot = new TelegramApi(token, {polling: true})

bot.on('message', msg => {
    const text = msg.text
    const chatId = msg.chat.id

    if (text === '/start'){
        bot.sendMessage(chatId, 'How do u do fellow kids?')
    }
    //bot.sendMessage(chatId, 'Я покажу кто самый хороший человек')
})

