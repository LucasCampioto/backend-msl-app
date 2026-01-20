const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')
const dashboardController = require('../controllers/dashboard')

const getMetrics = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)

    const { queryStringParameters } = event
    const start = queryStringParameters?.start
    const end = queryStringParameters?.end
    const comparisonStart = queryStringParameters?.comparisonStart
    const comparisonEnd = queryStringParameters?.comparisonEnd

    info(`Usuário buscou métricas do dashboard`, { start, end })

    const metrics = await dashboardController.getMetrics(
      start,
      end,
      comparisonStart,
      comparisonEnd
    )

    return success({
      data: metrics
    })
  } catch (err) {
    error('Dashboard.getMetrics', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

module.exports = {
  getMetrics
}
