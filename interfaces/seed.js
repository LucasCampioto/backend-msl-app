const db = require('../lib/db')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const seedController = require('../controllers/seed')

const seed = async event => {
  await db.connect()

  try {
    // Seed não requer autenticação (apenas em dev)
    const { queryStringParameters } = event
    const kolCount = queryStringParameters?.kolCount 
      ? parseInt(queryStringParameters.kolCount) 
      : 42
    const visitCount = queryStringParameters?.visitCount
      ? parseInt(queryStringParameters.visitCount)
      : null

    info(`Gerando dados seed`, { kolCount, visitCount })

    const result = await seedController.seed(kolCount, visitCount)

    return success({
      message: 'Dados seed gerados com sucesso',
      generated: result
    })
  } catch (err) {
    error('Seed.seed', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

module.exports = {
  seed
}
