const mongoose = require('mongoose')
const { error } = require('./debug')

mongoose.Promise = global.Promise
let isConnected

const connect = connectionString => {
  try {
    if (isConnected) return Promise.resolve()

    const options = {
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 15 * 60 * 1000,
      connectTimeoutMS: 15 * 60 * 1000,
      serverSelectionTimeoutMS: 5000
    }

    mongoose.set('strictQuery', false)
    return mongoose
      .connect(connectionString || process.env.DB_URL, options)
      .then(db => {
        isConnected = db.connections[0].readyState
      })
      .catch(ex => {
        error('DB.CONNECT', ex.message)
        throw new Error(ex)
      })
  } catch (ex) {
    error('DB.CONNECT', ex)
  }
}

const close = async () => {
  // Em Lambda, não fechamos conexões (warm start optimization)
  return true
}

module.exports = { connect, close }
