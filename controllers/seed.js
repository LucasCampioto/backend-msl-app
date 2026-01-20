const KOLDB = require('../models/kol')
const VisitDB = require('../models/visit')
const DocumentDB = require('../models/document')
const { error } = require('../lib/debug')

const specialties = ['Oncologia', 'Cardiologia', 'Neurologia', 'Endocrinologia', 'Pneumologia']
const institutions = [
  'Hospital Sírio-Libanês',
  'Hospital Albert Einstein',
  'Hospital das Clínicas',
  'Hospital A.C.Camargo',
  'Instituto do Câncer do Estado de São Paulo'
]
const profiles = ['prescriber', 'hospital_manager', 'payer', 'pharmacist', 'researcher']
const tags = ['efficacy', 'safety', 'access', 'cost-effectiveness', 'protocol', 'clinical-data', 'competition']
const documentCategories = ['articles', 'studies', 'behavioral', 'knowledge-base']

const randomItem = arr => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

module.exports.seed = async (kolCount = 42, visitCount = null) => {
  try {
    // Calcular número de visitas se não fornecido
    const targetVisitCount = visitCount || Math.floor(kolCount * 0.8)

    // Gerar KOLs
    const kols = []
    for (let i = 0; i < kolCount; i++) {
      const kol = new KOLDB({
        name: `Dr${randomItem(['', 'a'])}. ${['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana'][randomInt(0, 5)]} ${['Silva', 'Santos', 'Costa', 'Oliveira', 'Souza', 'Pereira'][randomInt(0, 5)]}`,
        specialty: randomItem(specialties),
        institution: randomItem(institutions),
        email: `kol${i}@example.com`,
        crm: randomItem([null, `${randomInt(100000, 999999)}-SP`]),
        profile: randomItem(profiles),
        level: randomInt(0, 6),
        tags: [randomItem(tags), randomItem(tags)].filter((v, i, a) => a.indexOf(v) === i),
        created: new Date()
      })
      await kol.save()
      kols.push(kol)
    }

    // Gerar Visitas
    let visitsGenerated = 0
    for (let i = 0; i < targetVisitCount && visitsGenerated < targetVisitCount; i++) {
      const kol = randomItem(kols)
      const daysAgo = randomInt(-30, 30)
      const visitDate = new Date()
      visitDate.setDate(visitDate.getDate() + daysAgo)

      const status = visitDate < new Date() ? 'completed' : 'scheduled'

      const visit = new VisitDB({
        kolId: kol._id,
        kolName: kol.name,
        kolSpecialty: kol.specialty,
        date: visitDate,
        time: `${randomInt(8, 18)}:${randomInt(0, 59).toString().padStart(2, '0')}`,
        format: randomItem(['presential', 'remote']),
        remoteLink: randomItem([null, `https://teams.microsoft.com/meet/${randomInt(100000, 999999)}`]),
        agenda: `Visita sobre ${randomItem(tags)}`,
        status,
        notes: status === 'completed' ? `Visita realizada com sucesso. KOL demonstrou interesse em ${randomItem(tags)}.` : null,
        tags: [randomItem(tags), randomItem(tags)].filter((v, i, a) => a.indexOf(v) === i),
        created: new Date()
      })
      await visit.save()
      visitsGenerated++
    }

    // Gerar Documentos
    const documents = []
    for (let i = 0; i < 20; i++) {
      const doc = new DocumentDB({
        title: `Documento ${i + 1}: ${randomItem(['Estudo', 'Artigo', 'Guia', 'Protocolo'])} sobre ${randomItem(tags)}`,
        category: randomItem(documentCategories),
        description: `Descrição do documento ${i + 1}`,
        url: `/documents/${randomItem(documentCategories)}/doc-${i + 1}.pdf`,
        type: randomItem(['pdf', 'doc', 'link']),
        date: new Date(),
        tags: [randomItem(tags), randomItem(tags)],
        created: new Date()
      })
      await doc.save()
      documents.push(doc)
    }

    // Atualizar lastVisit/nextVisit dos KOLs
    for (const kol of kols) {
      await require('./kol').updateLastNextVisit(kol._id)
    }

    return {
      kols: kols.length,
      visits: visitsGenerated,
      briefings: 0 // Briefings são gerados sob demanda
    }
  } catch (ex) {
    error('Seed.seed', ex)
    throw ex
  }
}
