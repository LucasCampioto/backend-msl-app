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

  // Relacionamento com KOL
  kolId: {
    type: mongoose.Types.ObjectId,
    ref: 'msl_kols',
    required: true,
    index: true
  },

  // Campos denormalizados para performance
  kolName: {
    type: String,
    required: true
  },
  kolSpecialty: {
    type: String,
    required: true
  },

  // Campos do domínio
  date: {
    type: Date,
    required: true,
    index: true
  },
  time: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: ['presential', 'remote'],
    required: true
  },
  remoteLink: {
    type: String,
    default: null
  },
  agenda: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  notes: {
    type: String,
    default: null
  },
  audioTranscript: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    enum: ['efficacy', 'safety', 'access', 'cost-effectiveness', 'protocol', 'clinical-data', 'competition']
  }],
  levelChange: {
    from: {
      type: Number,
      min: 0,
      max: 6
    },
    to: {
      type: Number,
      min: 0,
      max: 6
    },
    justification: {
      type: String
    }
  }
})

// Middleware para atualizar campo updated
schema.pre('save', function (next) {
  this.updated = new Date()
  next()
})

// Índices compostos
schema.index({ kolId: 1, date: -1 })
schema.index({ status: 1, date: -1 })
schema.index({ kolId: 1, status: 1 })

// Exportar modelo
module.exports =
  mongoose.models.msl_visits || mongoose.model('msl_visits', schema)
