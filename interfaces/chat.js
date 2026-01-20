const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const chatController = require('../controllers/chat')

const sendMessage = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {})

    // Validações
    if (!body.message) {
      return failure({ message: 'Mensagem é obrigatória' }, 400)
    }

    const { message, context = {} } = body

    info(`Usuário enviou mensagem ao chat`, { message: message.substring(0, 50) })

    const response = await chatController.sendMessage(message, context)

    return success({
      data: response
    })
  } catch (err) {
    error('Chat.sendMessage', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

module.exports = {
  sendMessage
}
