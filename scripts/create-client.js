/**
 * Script para criar um client (API Key) inicial no banco de dados
 * Uso: node scripts/create-client.js
 */

const mongoose = require('mongoose')
const ClientDB = require('../models/client')
const { connect } = require('../lib/db')
require('dotenv').config()

const createClient = async () => {
  try {
    await connect()

    const token = 'F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk'
    const name = process.env.CLIENT_NAME || 'Development Client'

    // Verificar se já existe
    const existing = await ClientDB.findOne({ token })
    if (existing) {
      console.log('Client já existe:', existing)
      process.exit(0)
    }

    // Criar novo client
    const client = new ClientDB({
      token,
      name,
      active: true
    })

    await client.save()

    console.log('Client criado com sucesso!')
    console.log('Token:', client.token)
    console.log('Name:', client.name)
    console.log('\nUse este token no header X-API-Key nas requisições')

    process.exit(0)
  } catch (error) {
    console.error('Erro ao criar client:', error)
    process.exit(1)
  }
}

createClient()
