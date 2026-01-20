const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  // Campos de auditoria
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date
  },

  // Campos do domínio
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  }
})

// Middleware para atualizar campo updated
schema.pre('save', function (next) {
  this.updated = new Date()
  next()
})

// Exportar modelo
module.exports =
  mongoose.models.msl_clients || mongoose.model('msl_clients', schema)
