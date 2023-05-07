const TelegramApi = require('node-telegram-bot-api')
const token = '5918467905:AAHXL68CbUcGKG-wg75j-r1NExgBCDBLKTI'
const sequelize = require('./db')
const UserModel = require('./models')

const bot = new TelegramApi(token, {polling: true})

const start = async () => {
    //db connection
    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (error) {
        console.log('Connection refused', error)
    }

    bot.on('message', async msg => {
        const text = msg.text
        const userId = msg.from.id
        newUserId = userId.toString()

        try {
            if (text === '/start'){
                const user = await UserModel.findOne({where: {userId: newUserId}})
                console.log(user)
    
                if (!user){
                    await UserModel.create({userId: newUserId})
                    bot.sendMessage(msg.chat.id, 'Welcome!')
                } else {
                    bot.sendMessage(msg.chat.id, 'U r alredy in the game!')
                }
            }
        } catch (error) {
            return bot.sendMessage(msg.chat.id, 'Ooops...')
        }
    })
}

start()