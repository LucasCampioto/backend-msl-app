const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const briefingController = require('../controllers/briefing')

const get = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { kolId } = event.pathParameters
    const { visitId } = event.queryStringParameters || {}

    info(`Usuário buscou briefing para KOL ${kolId}`, { visitId })

    const briefing = await briefingController.generate(kolId, visitId)

    return success({
      data: briefing
    })
  } catch (err) {
    error('Briefing.get', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

module.exports = {
  get
}
