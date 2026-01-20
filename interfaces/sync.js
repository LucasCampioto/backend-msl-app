const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const syncController = require('../controllers/sync')

const sync = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)

    info('Usuário executou sincronização')

    const result = await syncController.sync()

    return success({
      message: 'Sincronização concluída',
      updated: result.updated
    })
  } catch (err) {
    error('Sync.sync', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

module.exports = {
  sync
}
