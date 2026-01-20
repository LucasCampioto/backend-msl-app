const ClientDB = require('../models/client')
const { error } = require('../lib/debug')

module.exports.findByToken = async token => {
  try {
    const client = await ClientDB.findOne({ token, active: true })
    if (!client) {
      throw new Error('Token inválido')
    }
    return client
  } catch (ex) {
    error('Auth.findByToken', ex)
    throw ex
  }
}
