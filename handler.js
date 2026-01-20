const serverless = require('serverless-http')
const express = require('express')
const cors = require('cors')
const routes = require('./routes.json')
const { info, error } = require('./lib/debug')
const helmet = require('helmet')
const { connect } = require('./lib/db')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const path = require('path')

const app = express()

// Middleware para parsing JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS
app.options('*', cors())
app.use(cors())

// Configuração de segurança com Helmet
// Ajustado para permitir Swagger UI funcionar
const configHelmet = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginOpenerPolicy: true,
  strictTransportSecurity: true,
  frameguard: { action: 'sameorigin' }
}
app.use(helmet(configHelmet))

// Swagger UI - Documentação da API (antes do roteador dinâmico)
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'))
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MSL API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }))
  info('Swagger UI disponível em /docs')
} catch (err) {
  error('Erro ao carregar Swagger:', err.message)
}

// Middleware de validação de API Key
const validateApiKey = isPrivate => {
  return (req, res, next) => {
    if (isPrivate === false) return next()

    const apiKey = req.headers['x-api-key'] || req.headers['X-API-KEY']
    if (!apiKey) {
      error('Acesso negado: X-API-KEY não fornecida', { path: req.path })
      return res.status(401).json({ 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Forbidden'
        }
      })
    }
    next()
  }
}

// Roteador dinâmico - carrega rotas do routes.json
const dynamicRouter = new express.Router()
for (const config of routes) {
  const filePath = config.handler.split('.')
  const file = require(`./${filePath[0]}`)

  const handler = async (req, res) => {
    await connect()

    const event = {
      ...req.event,
      pathParameters: req.params,
      queryStringParameters: req.query,
      headers: req.headers,
      body: req.body || null,
      httpMethod: req.method
    }
    info(req.method, filePath, { path: req.path, params: req.params })

    try {
      const result = await file[filePath[1]](event, req.context)
      res.header(result.headers)
      res.status(result.statusCode).send(result.body)
    } catch (err) {
      error('ROUTER', err)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Erro interno do servidor'
        }
      })
    }
  }

  const path = `/${config.path}`
  const isPrivate = config.private !== false

  dynamicRouter[config.method](path, validateApiKey(isPrivate), handler)
}

app.use('/', dynamicRouter)

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint não encontrado'
    }
  })
})

// Error handler
app.use((err, req, res, next) => {
  error('ROUTER', err)
  res.status(400).json({
    error: {
      code: 'BAD_REQUEST',
      message: err.message || 'Requisição inválida'
    }
  })
})

// Para desenvolvimento local (npm run dev ou node handler.js)
if (require.main === module) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
    console.log(`📚 Swagger UI disponível em http://localhost:${PORT}/docs`)
  })
}

module.exports = {
  index: serverless(app, {
    binary: ['multipart/form-data'],
    request: function (req, event, context) {
      req.event = event
      req.context = context
    }
  })
}
