const jwt = require('jsonwebtoken')
const authAPI = require('../controllers/auth')
const { error } = require('./debug')

const toLowerHeaders = headers => {
  return Object.keys(headers).reduce((c, k) => {
    c[k.toLowerCase()] = headers[k]
    return c
  }, {})
}

const getKey = async event => {
  const headers = toLowerHeaders(event.headers)
  if (headers['x-api-key']) {
    const client = await authAPI.findByToken(headers['x-api-key'])
    return client
  }
  throw new Error('Token inválido')
}

const getToken = async event => {
  const headers = toLowerHeaders(event.headers)
  try {
    const { authorization } = headers
    if (authorization) {
      const bearer = authorization.split(' ')
      const bearerToken = bearer[1]
      return {
        user: jwt.verify(bearerToken, process.env.SECRET_TOKEN),
        bearerToken
      }
    }
    throw new Error('Token inválido')
  } catch (ex) {
    error('GETTOKEN', ex.message)
    return null
  }
}

const validateUser = async event => {
  await getKey(event)
  const tokenData = await getToken(event)
  if (!tokenData) {
    const err = new Error('Token inválido ou expirado')
    err.code = 401
    throw err
  }
  return tokenData.user
}

module.exports = { getKey, getToken, validateUser }
