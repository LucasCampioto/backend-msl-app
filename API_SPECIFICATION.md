# Especificação da API Backend - Sistema MSL (Medical Science Liaison)

## Índice
1. [Visão Geral](#visão-geral)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Estruturas de Dados](#estruturas-de-dados)
4. [Endpoints da API](#endpoints-da-api)
5. [Regras de Negócio](#regras-de-negócio)
6. [Exemplos de Integração](#exemplos-de-integração)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Notas de Implementação](#notas-de-implementação)
9. [Checklist de Implementação](#checklist-de-implementação)

---

## Visão Geral

### Descrição do Sistema
Sistema de gestão de relacionamento com Key Opinion Leaders (KOLs) para equipes MSL. O sistema gerencia:
- Carteira de stakeholders (KOLs)
- Agendamento e registro de visitas
- Gravação e transcrição de áudio das visitas
- Briefings inteligentes para preparação de visitas
- Métricas e dashboard de performance
- Central de conhecimento com documentos
- Chat inteligente para suporte

### Arquitetura Proposta
- **Tipo**: REST API
- **Formato de Dados**: JSON
- **Versionamento**: `/api/v1/` (opcional, pode ser `/api/` diretamente)
- **Base URL**: `https://api.exemplo.com/api` (ou `http://localhost:3000/api` para desenvolvimento)

### Convenções
- Todas as datas seguem formato ISO 8601: `YYYY-MM-DD` (ex: `2024-12-15`)
- Horários seguem formato `HH:mm` (ex: `14:30`)
- IDs são strings (podem ser UUIDs ou números sequenciais)
- Respostas de erro seguem formato padronizado (ver seção Tratamento de Erros)

---

## Autenticação e Autorização

### Nota sobre Autenticação
O front-end atual não implementa autenticação. Para produção, recomenda-se:

**Opção 1: JWT (JSON Web Tokens)**
```
Headers:
Authorization: Bearer <token>
```

**Opção 2: API Key**
```
Headers:
X-API-Key: <api-key>
```

**Opção 3: Session-based**
```
Headers:
Cookie: session=<session-id>
```

Para demonstração inicial, pode-se implementar autenticação simples ou deixar endpoints públicos (não recomendado para produção).

---

## Estruturas de Dados

### KOL (Key Opinion Leader)

```typescript
interface KOL {
  id: string;                    // ID único do KOL
  name: string;                  // Nome completo (ex: "Dr. João Silva")
  photo?: string;                // URL da foto (opcional)
  specialty: string;             // Especialidade médica (ex: "Oncologia")
  institution: string;           // Instituição (ex: "Hospital Sírio-Libanês")
  email: string;                 // Email de contato
  crm?: string;                  // CRM (opcional, apenas para prescritores)
  profile: KOLProfile;           // Perfil do stakeholder
  level: KOLLevel;               // Nível de engajamento (0-6)
  lastVisit?: string;            // Data da última visita (YYYY-MM-DD)
  nextVisit?: string;            // Data da próxima visita agendada (YYYY-MM-DD)
  tags: TopicTag[];              // Tags de interesse/temas
}

type KOLProfile = 
  | 'prescriber'           // Prescritor
  | 'hospital_manager'      // Gestor Hospitalar
  | 'payer'                 // Pagador
  | 'pharmacist'            // Farmacêutico
  | 'researcher';           // Pesquisador

type KOLLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Labels dos níveis:
// 0: Sem Engajamento
// 1: Conhecimento
// 2: Interesse
// 3: Adotante
// 4: Defensor
// 5: Embaixador
// 6: Parceiro Estratégico

type TopicTag = 
  | 'efficacy'
  | 'safety'
  | 'access'
  | 'cost-effectiveness'
  | 'protocol'
  | 'clinical-data'
  | 'competition';
```

### Visit (Visita)

```typescript
interface Visit {
  id: string;                    // ID único da visita
  kolId: string;                 // ID do KOL relacionado
  kolName: string;               // Nome do KOL (denormalizado para performance)
  kolSpecialty: string;          // Especialidade do KOL (denormalizado)
  date: string;                  // Data da visita (YYYY-MM-DD)
  time: string;                  // Horário (HH:mm)
  format: VisitFormat;           // Formato da visita
  remoteLink?: string;           // Link da reunião remota (se aplicável)
  agenda: string;                // Pauta/objetivo da visita
  status: VisitStatus;           // Status da visita
  notes?: string;                // Relatório/notas da visita (opcional)
  audioTranscript?: string;      // Transcrição de áudio (opcional)
  tags: TopicTag[];              // Temas abordados
  levelChange?: {                 // Mudança de nível do KOL (opcional)
    from: KOLLevel;
    to: KOLLevel;
    justification: string;
  };
}

type VisitFormat = 'presential' | 'remote';
type VisitStatus = 'scheduled' | 'completed' | 'cancelled';
```

### SmartBriefing

```typescript
interface SmartBriefing {
  kolId: string;                 // ID do KOL
  continuityReminder: string;    // Lembrete de continuidade baseado em histórico
  contentSuggestion: string;      // Sugestão de conteúdo para a visita
  levelAlert?: string;            // Alerta sobre nível de engajamento (opcional)
  generatedAt: string;           // Data/hora de geração (ISO 8601)
}
```

### DashboardMetrics

```typescript
interface DashboardMetrics {
  totalKols: number;             // Total de KOLs na carteira
  scheduledVisits: number;        // Total de visitas agendadas
  completedVisitsMonth: number;   // Visitas completadas no período
  avgEngagementLevel: number;     // Nível médio de engajamento (0-6)
  levelDistribution: Record<KOLLevel, number>;  // Distribuição por nível
  trends?: {                      // Tendências comparativas (opcional)
    totalKols?: MetricTrend;
    scheduledVisits?: MetricTrend;
    completedVisitsMonth?: MetricTrend;
    avgEngagementLevel?: MetricTrend;
  };
  targets?: {                     // Metas (opcional)
    completedVisitsMonth?: number;
  };
}

interface MetricTrend {
  value: number;                  // Percentual de variação (ex: +15, -8)
  label: string;                  // Label descritivo (ex: "vs. mês anterior")
}
```

### Document

```typescript
interface Document {
  id: string;                     // ID único do documento
  title: string;                  // Título do documento
  category: DocumentCategory;     // Categoria
  description: string;            // Descrição
  url: string;                    // URL ou caminho do arquivo
  type: 'pdf' | 'doc' | 'link';  // Tipo do documento
  date: string;                   // Data de publicação/atualização (YYYY-MM-DD)
  tags: string[];                 // Tags para busca
}

type DocumentCategory = 
  | 'articles'           // Artigos
  | 'studies'            // Estudos
  | 'behavioral'         // Documentação Comportamental
  | 'knowledge-base';     // Base de Conhecimento MSL
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;                     // ID único da mensagem
  role: 'user' | 'assistant';     // Papel do autor
  content: string;                // Conteúdo da mensagem
  sources?: Array<{                // Fontes citadas (opcional)
    title: string;
    url: string;
  }>;
}
```

---

## Endpoints da API

### 1. KOLs (Carteira de Stakeholders)

#### 1.1 Listar KOLs
**GET** `/api/kols`

Lista todos os KOLs com suporte a filtros e busca.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `search` | string | Não | Busca por nome, especialidade ou instituição |
| `level` | number | Não | Filtro por nível de engajamento (0-6) |
| `profile` | string | Não | Filtro por perfil (prescriber, hospital_manager, etc) |
| `specialty` | string | Não | Filtro por especialidade |
| `institution` | string | Não | Filtro por instituição |
| `limit` | number | Não | Limite de resultados (padrão: sem limite) |
| `offset` | number | Não | Offset para paginação (padrão: 0) |

**Exemplo de Request:**
```http
GET /api/kols?search=oncologia&level=4&limit=20
```

**Exemplo de Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Dr. João Silva",
      "photo": null,
      "specialty": "Oncologia",
      "institution": "Hospital Sírio-Libanês",
      "email": "joao.silva@hospital.com.br",
      "crm": "123456-SP",
      "profile": "prescriber",
      "level": 4,
      "lastVisit": "2024-11-15",
      "nextVisit": "2024-12-20",
      "tags": ["efficacy", "safety"]
    }
  ],
  "meta": {
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

#### 1.2 Obter KOL Específico
**GET** `/api/kols/:id`

Retorna detalhes completos de um KOL específico.

**Path Parameters:**
- `id` (string, obrigatório): ID do KOL

**Exemplo de Request:**
```http
GET /api/kols/1
```

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "id": "1",
    "name": "Dr. João Silva",
    "photo": null,
    "specialty": "Oncologia",
    "institution": "Hospital Sírio-Libanês",
    "email": "joao.silva@hospital.com.br",
    "crm": "123456-SP",
    "profile": "prescriber",
    "level": 4,
    "lastVisit": "2024-11-15",
    "nextVisit": "2024-12-20",
    "tags": ["efficacy", "safety"]
  }
}
```

**Status Codes:**
- `200 OK`: KOL encontrado
- `404 Not Found`: KOL não encontrado

#### 1.3 Criar Novo KOL
**POST** `/api/kols`

Cria um novo KOL na carteira.

**Request Body:**
```json
{
  "name": "Dra. Maria Santos",
  "specialty": "Cardiologia",
  "institution": "Hospital Albert Einstein",
  "email": "maria.santos@einstein.com.br",
  "crm": "789012-SP",
  "profile": "prescriber",
  "level": 0,
  "tags": ["efficacy", "clinical-data"]
}
```

**Campos Obrigatórios:**
- `name`
- `specialty`
- `institution`
- `email`
- `profile`
- `level`

**Exemplo de Response (201 Created):**
```json
{
  "data": {
    "id": "43",
    "name": "Dra. Maria Santos",
    "specialty": "Cardiologia",
    "institution": "Hospital Albert Einstein",
    "email": "maria.santos@einstein.com.br",
    "crm": "789012-SP",
    "profile": "prescriber",
    "level": 0,
    "lastVisit": null,
    "nextVisit": null,
    "tags": ["efficacy", "clinical-data"]
  }
}
```

**Status Codes:**
- `201 Created`: KOL criado com sucesso
- `400 Bad Request`: Dados inválidos ou campos obrigatórios faltando
- `409 Conflict`: Email ou CRM já existe (se aplicável)

#### 1.4 Atualizar KOL
**PUT** `/api/kols/:id`

Atualiza um KOL existente.

**Path Parameters:**
- `id` (string, obrigatório): ID do KOL

**Request Body:**
```json
{
  "name": "Dr. João Silva",
  "level": 5,
  "tags": ["efficacy", "safety", "protocol"]
}
```

**Nota:** Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "id": "1",
    "name": "Dr. João Silva",
    "specialty": "Oncologia",
    "institution": "Hospital Sírio-Libanês",
    "email": "joao.silva@hospital.com.br",
    "crm": "123456-SP",
    "profile": "prescriber",
    "level": 5,
    "lastVisit": "2024-11-15",
    "nextVisit": "2024-12-20",
    "tags": ["efficacy", "safety", "protocol"]
  }
}
```

**Status Codes:**
- `200 OK`: KOL atualizado com sucesso
- `404 Not Found`: KOL não encontrado
- `400 Bad Request`: Dados inválidos

#### 1.5 Deletar KOL
**DELETE** `/api/kols/:id`

Remove um KOL da carteira. **ATENÇÃO:** Isso também deve remover todas as visitas relacionadas.

**Path Parameters:**
- `id` (string, obrigatório): ID do KOL

**Exemplo de Request:**
```http
DELETE /api/kols/1
```

**Exemplo de Response (200 OK):**
```json
{
  "message": "KOL deletado com sucesso",
  "deletedVisits": 5
}
```

**Status Codes:**
- `200 OK`: KOL deletado com sucesso
- `404 Not Found`: KOL não encontrado

---

### 2. Visits (Visitas)

#### 2.1 Listar Visitas
**GET** `/api/visits`

Lista todas as visitas com suporte a múltiplos filtros.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `status` | string | Não | Filtro por status: `scheduled`, `completed`, `cancelled` |
| `kolId` | string | Não | Filtro por KOL específico |
| `dateStart` | string | Não | Data inicial (YYYY-MM-DD) |
| `dateEnd` | string | Não | Data final (YYYY-MM-DD) |
| `format` | string | Não | Filtro por formato: `presential`, `remote` |
| `hasReport` | boolean | Não | Se `true`, retorna apenas visitas com relatório. Se `false`, apenas sem relatório |
| `limit` | number | Não | Limite de resultados |
| `offset` | number | Não | Offset para paginação |

**Filtros Especiais:**
- `status=completed&hasReport=false`: Retorna visitas pendentes de relatório
- `status=completed&hasReport=true`: Retorna visitas realizadas com relatório

**Exemplo de Request:**
```http
GET /api/visits?status=scheduled&dateStart=2024-12-01&dateEnd=2024-12-31
```

**Exemplo de Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1",
      "kolId": "5",
      "kolName": "Dr. João Silva",
      "kolSpecialty": "Oncologia",
      "date": "2024-12-15",
      "time": "14:30",
      "format": "presential",
      "remoteLink": null,
      "agenda": "Apresentar novos dados de eficácia do estudo BEACON",
      "status": "scheduled",
      "notes": null,
      "audioTranscript": null,
      "tags": ["efficacy"],
      "levelChange": null
    }
  ],
  "meta": {
    "total": 15,
    "limit": null,
    "offset": 0
  }
}
```

#### 2.2 Obter Visita Específica
**GET** `/api/visits/:id`

Retorna detalhes completos de uma visita.

**Path Parameters:**
- `id` (string, obrigatório): ID da visita

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "id": "1",
    "kolId": "5",
    "kolName": "Dr. João Silva",
    "kolSpecialty": "Oncologia",
    "date": "2024-12-15",
    "time": "14:30",
    "format": "presential",
    "agenda": "Apresentar novos dados de eficácia do estudo BEACON",
    "status": "completed",
    "notes": "KOL demonstrou interesse nos novos dados. Solicitou material sobre o estudo fase III.",
    "audioTranscript": "Transcrição do áudio da reunião disponível...",
    "tags": ["efficacy", "safety"],
    "levelChange": {
      "from": 3,
      "to": 4,
      "justification": "KOL demonstrou maior engajamento e interesse."
    }
  }
}
```

#### 2.3 Criar Nova Visita
**POST** `/api/visits`

Cria uma nova visita (agendamento).

**Request Body:**
```json
{
  "kolId": "5",
  "date": "2024-12-20",
  "time": "15:00",
  "format": "remote",
  "remoteLink": "https://teams.microsoft.com/meet/123456",
  "agenda": "Discutir protocolo de uso e guidelines de segurança",
  "tags": ["safety", "protocol"]
}
```

**Campos Obrigatórios:**
- `kolId`
- `date`
- `time`
- `format`
- `agenda`

**Validações:**
- `date` não pode ser no passado
- `kolId` deve existir
- Se `format` for `remote`, `remoteLink` é recomendado mas não obrigatório

**Exemplo de Response (201 Created):**
```json
{
  "data": {
    "id": "45",
    "kolId": "5",
    "kolName": "Dr. João Silva",
    "kolSpecialty": "Oncologia",
    "date": "2024-12-20",
    "time": "15:00",
    "format": "remote",
    "remoteLink": "https://teams.microsoft.com/meet/123456",
    "agenda": "Discutir protocolo de uso e guidelines de segurança",
    "status": "scheduled",
    "notes": null,
    "audioTranscript": null,
    "tags": ["safety", "protocol"],
    "levelChange": null
  }
}
```

**Status Codes:**
- `201 Created`: Visita criada com sucesso
- `400 Bad Request`: Dados inválidos
- `404 Not Found`: KOL não encontrado
- `409 Conflict`: Conflito de agendamento (mesma data/hora)

#### 2.4 Atualizar Visita
**PUT** `/api/visits/:id`

Atualiza uma visita existente. Usado para:
- Completar visita (mudar status de `scheduled` para `completed`)
- Adicionar relatório (notes)
- Atualizar informações da visita

**Path Parameters:**
- `id` (string, obrigatório): ID da visita

**Request Body (Exemplo: Completar visita):**
```json
{
  "status": "completed",
  "notes": "KOL demonstrou interesse nos novos dados. Solicitou material sobre o estudo fase III.",
  "audioTranscript": "Transcrição do áudio da reunião disponível...",
  "tags": ["efficacy", "safety"],
  "levelChange": {
    "from": 3,
    "to": 4,
    "justification": "KOL demonstrou maior engajamento e interesse."
  }
}
```

**Regras de Negócio:**
- Ao mudar status para `completed`, o backend deve verificar se a data já passou
- Se `levelChange` for fornecido, o backend deve atualizar o `level` do KOL relacionado
- Ao completar visita, o backend deve atualizar `lastVisit` do KOL

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "id": "1",
    "kolId": "5",
    "kolName": "Dr. João Silva",
    "kolSpecialty": "Oncologia",
    "date": "2024-12-15",
    "time": "14:30",
    "format": "presential",
    "agenda": "Apresentar novos dados de eficácia do estudo BEACON",
    "status": "completed",
    "notes": "KOL demonstrou interesse nos novos dados...",
    "audioTranscript": "Transcrição do áudio...",
    "tags": ["efficacy", "safety"],
    "levelChange": {
      "from": 3,
      "to": 4,
      "justification": "KOL demonstrou maior engajamento e interesse."
    }
  },
  "kolUpdated": {
    "id": "5",
    "level": 4,
    "lastVisit": "2024-12-15"
  }
}
```

**Status Codes:**
- `200 OK`: Visita atualizada com sucesso
- `404 Not Found`: Visita não encontrada
- `400 Bad Request`: Dados inválidos

#### 2.5 Deletar Visita
**DELETE** `/api/visits/:id`

Remove uma visita. Ao deletar, o backend deve atualizar `nextVisit` do KOL se necessário.

**Path Parameters:**
- `id` (string, obrigatório): ID da visita

**Exemplo de Response (200 OK):**
```json
{
  "message": "Visita deletada com sucesso"
}
```

---

### 3. Smart Briefings

#### 3.1 Obter Briefing para KOL
**GET** `/api/briefings/:kolId`

Retorna o briefing inteligente para um KOL específico. O briefing é gerado dinamicamente baseado em:
- Histórico de visitas do KOL
- Última visita realizada
- Próxima visita agendada
- Nível de engajamento atual

**Path Parameters:**
- `kolId` (string, obrigatório): ID do KOL

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `visitId` | string | Não | ID da visita específica para gerar briefing |

**Exemplo de Request:**
```http
GET /api/briefings/5?visitId=12
```

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "kolId": "5",
    "continuityReminder": "Na última visita (2024-11-15), Silva demonstrou interesse nos novos dados. Solicitou material sobre o estudo fase III... Retome este ponto.",
    "contentSuggestion": "Para o tema \"Eficácia\" definido, utilize o estudo BEACON (PDF disponível no portal).",
    "levelAlert": "Este KOL está estagnado no Nível 4. A meta sugerida é conseguir um compromisso de uso prático.",
    "generatedAt": "2024-12-15T10:30:00Z"
  }
}
```

**Regras de Negócio:**
- Briefing só é gerado para visitas agendadas nos próximos 7 dias
- Se não houver visita agendada, retorna `404` ou `null`
- O briefing é gerado dinamicamente a cada requisição

**Status Codes:**
- `200 OK`: Briefing gerado com sucesso
- `404 Not Found`: KOL não encontrado ou não há visita agendada

---

### 4. Dashboard Metrics

#### 4.1 Obter Métricas do Dashboard
**GET** `/api/dashboard/metrics`

Retorna métricas agregadas do dashboard. Suporta filtros de data para análise de períodos específicos.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `start` | string | Não | Data inicial do período (YYYY-MM-DD). Padrão: início do mês atual |
| `end` | string | Não | Data final do período (YYYY-MM-DD). Padrão: fim do mês atual |
| `comparisonStart` | string | Não | Data inicial do período de comparação |
| `comparisonEnd` | string | Não | Data final do período de comparação |

**Exemplo de Request (Mês atual - padrão):**
```http
GET /api/dashboard/metrics
```

**Exemplo de Request (Range customizado):**
```http
GET /api/dashboard/metrics?start=2024-12-01&end=2024-12-15
```

**Exemplo de Request (Com comparação):**
```http
GET /api/dashboard/metrics?start=2024-12-01&end=2024-12-15&comparisonStart=2024-11-01&comparisonEnd=2024-11-15
```

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "totalKols": 42,
    "scheduledVisits": 12,
    "completedVisitsMonth": 28,
    "avgEngagementLevel": 3.2,
    "levelDistribution": {
      "0": 2,
      "1": 4,
      "2": 8,
      "3": 12,
      "4": 9,
      "5": 5,
      "6": 2
    },
    "trends": {
      "totalKols": {
        "value": 5,
        "label": "vs. mês anterior"
      },
      "scheduledVisits": {
        "value": -8,
        "label": "vs. mês anterior"
      },
      "completedVisitsMonth": {
        "value": 15,
        "label": "vs. mês anterior"
      },
      "avgEngagementLevel": {
        "value": 3,
        "label": "vs. mês anterior"
      }
    },
    "targets": {
      "completedVisitsMonth": 30
    }
  }
}
```

**Regras de Cálculo:**
- `completedVisitsMonth`: Conta apenas visitas com `status='completed'` E `notes` preenchido no período
- `scheduledVisits`: Conta todas as visitas com `status='scheduled'` (sem filtro de data)
- `avgEngagementLevel`: Média aritmética dos níveis de todos os KOLs
- `levelDistribution`: Contagem de KOLs por nível
- `trends`: Calcula percentual de variação comparando com período anterior equivalente (se não fornecido, calcula automaticamente)

---

### 5. Documents (Central de Conhecimento)

#### 5.1 Listar Documentos
**GET** `/api/documents`

Lista todos os documentos disponíveis na central de conhecimento.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `category` | string | Não | Filtro por categoria: `articles`, `studies`, `behavioral`, `knowledge-base` |
| `search` | string | Não | Busca por título ou descrição |
| `tags` | string | Não | Filtro por tags (separadas por vírgula) |
| `limit` | number | Não | Limite de resultados |
| `offset` | number | Não | Offset para paginação |

**Exemplo de Request:**
```http
GET /api/documents?category=studies&search=BEACON
```

**Exemplo de Response (200 OK):**
```json
{
  "data": [
    {
      "id": "est-001",
      "title": "Estudo Fase III - Resultados Primários e Secundários",
      "category": "studies",
      "description": "Publicação completa dos resultados do estudo clínico fase III, incluindo análises de subgrupos.",
      "url": "/documents/studies/estudo-fase-3-resultados.pdf",
      "type": "pdf",
      "date": "2024-01-30",
      "tags": ["fase III", "resultados", "estudo clínico"]
    }
  ],
  "meta": {
    "total": 21,
    "limit": null,
    "offset": 0
  }
}
```

#### 5.2 Obter Documento Específico
**GET** `/api/documents/:id`

Retorna detalhes de um documento específico.

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "id": "est-001",
    "title": "Estudo Fase III - Resultados Primários e Secundários",
    "category": "studies",
    "description": "Publicação completa dos resultados do estudo clínico fase III...",
    "url": "/documents/studies/estudo-fase-3-resultados.pdf",
    "type": "pdf",
    "date": "2024-01-30",
    "tags": ["fase III", "resultados", "estudo clínico"]
  }
}
```

#### 5.3 Criar Documento (Admin)
**POST** `/api/documents`

Cria um novo documento na central de conhecimento.

**Request Body:**
```json
{
  "title": "Novo Estudo Clínico",
  "category": "studies",
  "description": "Descrição do estudo...",
  "url": "/documents/studies/novo-estudo.pdf",
  "type": "pdf",
  "date": "2024-12-15",
  "tags": ["eficácia", "segurança"]
}
```

#### 5.4 Atualizar Documento (Admin)
**PUT** `/api/documents/:id`

Atualiza um documento existente.

#### 5.5 Deletar Documento (Admin)
**DELETE** `/api/documents/:id`

Remove um documento da central de conhecimento.

---

### 6. Chat / Smart Briefing

#### 6.1 Enviar Mensagem ao Chat
**POST** `/api/chat/message`

Envia uma mensagem ao chat inteligente e recebe resposta contextualizada.

**Request Body:**
```json
{
  "message": "Resumir estudo BEACON",
  "context": {
    "kolId": "5",
    "visitId": "12",
    "agenda": "Apresentar novos dados de eficácia do estudo BEACON",
    "freeMode": false
  }
}
```

**Campos do Context:**
- `kolId` (string, opcional): ID do KOL para contexto específico
- `visitId` (string, opcional): ID da visita para contexto
- `agenda` (string, opcional): Pauta da visita
- `freeMode` (boolean, opcional): Se `true`, chat sem contexto específico de KOL

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "id": "msg-123",
    "role": "assistant",
    "content": "O estudo BEACON é um ensaio clínico fase III que demonstrou eficácia significativa no tratamento. Os principais resultados mostram uma melhoria na sobrevida livre de progressão em comparação com o tratamento padrão.",
    "sources": [
      {
        "title": "Estudo BEACON - PDF Completo",
        "url": "/documents/studies/beacon-study.pdf"
      }
    ]
  }
}
```

**Regras de Negócio:**
- Se `kolId` fornecido, o chat deve ter acesso ao histórico do KOL
- Se `visitId` fornecido, o chat deve ter acesso à pauta e histórico relacionado
- Se `freeMode=true`, o chat funciona como assistente geral sem contexto específico
- O backend deve buscar documentos relevantes baseado na mensagem

---

### 7. Sync / Data Management

#### 7.1 Sincronizar Dados
**POST** `/api/sync`

Sincroniza dados do sistema. Executa as seguintes operações:
1. Atualiza status de visitas agendadas que passaram da data (muda para `completed`)
2. Atualiza `lastVisit` e `nextVisit` dos KOLs baseado nas visitas
3. Regenera briefings para visitas futuras

**Exemplo de Request:**
```http
POST /api/sync
```

**Exemplo de Response (200 OK):**
```json
{
  "message": "Sincronização concluída",
  "updated": {
    "visits": 3,
    "kols": 5,
    "briefings": 8
  }
}
```

**Nota:** Este endpoint pode ser chamado automaticamente pelo backend em intervalos regulares ou manualmente pelo front-end.

#### 7.2 Popular Dados Iniciais (Dev/Admin)
**POST** `/api/data/seed`

Popula o banco de dados com dados iniciais para desenvolvimento/demonstração.

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `kolCount` | number | Não | Número de KOLs a gerar (padrão: 42) |
| `visitCount` | number | Não | Número de visitas a gerar (padrão: calculado automaticamente) |

**Exemplo de Request:**
```http
POST /api/data/seed?kolCount=50
```

**Exemplo de Response (200 OK):**
```json
{
  "message": "Dados seed gerados com sucesso",
  "generated": {
    "kols": 50,
    "visits": 35,
    "briefings": 8
  }
}
```

**Nota:** Este endpoint deve estar protegido e disponível apenas em ambiente de desenvolvimento ou para administradores.

---

### 8. Audio / Transcrição

#### 8.1 Upload e Transcrição de Áudio
**POST** `/api/visits/:visitId/audio`

Faz upload de um arquivo de áudio e inicia o processo de transcrição. O áudio é gravado durante ou após uma visita e transcrito para texto, que é salvo no campo `audioTranscript` da visita.

**Path Parameters:**
- `visitId` (string, obrigatório): ID da visita relacionada

**Request Body:**
- Formato: `multipart/form-data`
- Campo: `audio` (file, obrigatório): Arquivo de áudio
  - Formatos aceitos: `audio/webm`, `audio/mp3`, `audio/wav`, `audio/m4a`, `audio/ogg`
  - Tamanho máximo: 50MB (recomendado)
  - Duração máxima: 60 minutos (recomendado)

**Exemplo de Request:**
```http
POST /api/visits/12/audio
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="audio"; filename="visit-recording.webm"
Content-Type: audio/webm

[binary audio data]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Opção 1: Resposta Síncrona (Transcrição Imediata)**
Se a transcrição for rápida (< 30 segundos), o backend pode retornar o resultado diretamente:

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "id": "audio-123",
    "visitId": "12",
    "status": "completed",
    "transcript": "Discussão sobre eficácia do tratamento em pacientes com perfil X. O médico demonstrou interesse nos dados do estudo recente. Solicitou material adicional sobre segurança cardiovascular.",
    "audioUrl": "/uploads/audio/visit-12-20241215-143000.webm",
    "duration": 180,
    "createdAt": "2024-12-15T14:30:00Z",
    "processedAt": "2024-12-15T14:30:15Z"
  },
  "visitUpdated": {
    "id": "12",
    "audioTranscript": "Discussão sobre eficácia do tratamento em pacientes com perfil X..."
  }
}
```

**Opção 2: Resposta Assíncrona (Transcrição em Background)**
Se a transcrição demorar mais, o backend pode retornar um status de processamento:

**Exemplo de Response (202 Accepted):**
```json
{
  "data": {
    "id": "audio-123",
    "visitId": "12",
    "status": "processing",
    "audioUrl": "/uploads/audio/visit-12-20241215-143000.webm",
    "duration": null,
    "createdAt": "2024-12-15T14:30:00Z",
    "estimatedProcessingTime": 60
  }
}
```

**Status Codes:**
- `200 OK`: Transcrição concluída com sucesso (resposta síncrona)
- `202 Accepted`: Upload aceito, transcrição em processamento (resposta assíncrona)
- `400 Bad Request`: Arquivo inválido ou formato não suportado
- `404 Not Found`: Visita não encontrada
- `413 Payload Too Large`: Arquivo muito grande
- `415 Unsupported Media Type`: Formato de áudio não suportado
- `500 Internal Server Error`: Erro no processamento

**Regras de Negócio:**
- O arquivo de áudio deve ser salvo no servidor (ou storage externo como S3)
- A transcrição deve ser feita usando serviço de Speech-to-Text (ex: Google Cloud Speech-to-Text, AWS Transcribe, Azure Speech Services, OpenAI Whisper)
- O texto transcrito deve ser salvo automaticamente no campo `audioTranscript` da visita
- Se a visita já tiver um `audioTranscript`, ele pode ser substituído ou mantido (definir política)
- O áudio pode ser deletado após transcrição ou mantido para referência (definir política de retenção)

#### 8.2 Obter Status de Transcrição
**GET** `/api/visits/:visitId/audio/:audioId`

Obtém o status de uma transcrição em processamento (útil quando a resposta foi assíncrona).

**Path Parameters:**
- `visitId` (string, obrigatório): ID da visita
- `audioId` (string, obrigatório): ID do registro de áudio

**Exemplo de Request:**
```http
GET /api/visits/12/audio/audio-123
```

**Exemplo de Response (200 OK) - Processando:**
```json
{
  "data": {
    "id": "audio-123",
    "visitId": "12",
    "status": "processing",
    "progress": 65,
    "estimatedTimeRemaining": 20,
    "createdAt": "2024-12-15T14:30:00Z"
  }
}
```

**Exemplo de Response (200 OK) - Concluído:**
```json
{
  "data": {
    "id": "audio-123",
    "visitId": "12",
    "status": "completed",
    "transcript": "Discussão sobre eficácia do tratamento...",
    "audioUrl": "/uploads/audio/visit-12-20241215-143000.webm",
    "duration": 180,
    "createdAt": "2024-12-15T14:30:00Z",
    "processedAt": "2024-12-15T14:30:45Z"
  }
}
```

**Exemplo de Response (200 OK) - Erro:**
```json
{
  "data": {
    "id": "audio-123",
    "visitId": "12",
    "status": "failed",
    "error": "Não foi possível processar o áudio. Verifique a qualidade do arquivo.",
    "createdAt": "2024-12-15T14:30:00Z",
    "failedAt": "2024-12-15T14:30:30Z"
  }
}
```

**Status Codes:**
- `200 OK`: Status obtido com sucesso
- `404 Not Found`: Áudio não encontrado

#### 8.3 Atualizar Transcrição Manualmente
**PUT** `/api/visits/:visitId/audio/:audioId/transcript`

Permite atualizar manualmente o texto da transcrição (útil para correções).

**Path Parameters:**
- `visitId` (string, obrigatório): ID da visita
- `audioId` (string, obrigatório): ID do registro de áudio

**Request Body:**
```json
{
  "transcript": "Texto corrigido da transcrição..."
}
```

**Exemplo de Response (200 OK):**
```json
{
  "data": {
    "id": "audio-123",
    "visitId": "12",
    "status": "completed",
    "transcript": "Texto corrigido da transcrição...",
    "audioUrl": "/uploads/audio/visit-12-20241215-143000.webm",
    "duration": 180,
    "createdAt": "2024-12-15T14:30:00Z",
    "processedAt": "2024-12-15T14:30:45Z",
    "updatedAt": "2024-12-15T15:00:00Z",
    "manuallyEdited": true
  },
  "visitUpdated": {
    "id": "12",
    "audioTranscript": "Texto corrigido da transcrição..."
  }
}
```

**Status Codes:**
- `200 OK`: Transcrição atualizada com sucesso
- `404 Not Found`: Áudio não encontrado
- `400 Bad Request`: Dados inválidos

#### 8.4 Deletar Áudio e Transcrição
**DELETE** `/api/visits/:visitId/audio/:audioId`

Remove o arquivo de áudio e a transcrição associada. Também remove o campo `audioTranscript` da visita.

**Path Parameters:**
- `visitId` (string, obrigatório): ID da visita
- `audioId` (string, obrigatório): ID do registro de áudio

**Exemplo de Response (200 OK):**
```json
{
  "message": "Áudio e transcrição removidos com sucesso",
  "visitUpdated": {
    "id": "12",
    "audioTranscript": null
  }
}
```

**Status Codes:**
- `200 OK`: Áudio deletado com sucesso
- `404 Not Found`: Áudio não encontrado

**Notas de Implementação:**
- O backend deve integrar com um serviço de Speech-to-Text confiável
- Para produção, considere usar serviços como:
  - **Google Cloud Speech-to-Text**: Boa precisão, suporta português brasileiro
  - **AWS Transcribe**: Integração fácil com S3
  - **Azure Speech Services**: Boa qualidade, suporta múltiplos idiomas
  - **OpenAI Whisper API**: Excelente precisão, suporta português
- O áudio pode ser armazenado em storage temporário durante processamento
- Implementar retry logic para falhas de transcrição
- Considerar webhooks ou polling para notificar o front-end quando a transcrição estiver pronta (se assíncrono)
- Validar qualidade do áudio antes de processar (duração mínima, formato válido, etc.)

---

## Regras de Negócio

### Visitas

1. **Status Automático:**
   - Visitas com `status='scheduled'` e `date` no passado devem ser automaticamente atualizadas para `status='completed'`
   - Isso deve acontecer durante sincronização ou ao consultar visitas

2. **Filtros de Status:**
   - **Agendadas**: `status='scheduled'`
   - **Realizadas**: `status='completed'` AND `notes IS NOT NULL AND notes != ''`
   - **Pendentes**: `status='completed'` AND (`notes IS NULL OR notes = ''`)

3. **Validações:**
   - Não é possível agendar visita com data no passado
   - Não é possível completar visita sem preencher `notes` (mas pode ser feito depois)
   - Ao completar visita, se `levelChange` fornecido, atualizar nível do KOL

4. **Relacionamentos:**
   - Ao deletar KOL, todas as visitas relacionadas devem ser deletadas
   - Ao criar/atualizar visita, atualizar `nextVisit` do KOL se for a próxima agendada
   - Ao completar visita, atualizar `lastVisit` do KOL

5. **Áudio e Transcrição:**
   - O campo `audioTranscript` pode ser preenchido automaticamente via transcrição de áudio ou manualmente
   - Ao fazer upload de áudio, o backend deve processar e salvar a transcrição no campo `audioTranscript` da visita
   - A transcrição pode ser editada manualmente pelo usuário
   - O áudio pode ser gravado durante ou após a visita
   - Se a visita já tiver `audioTranscript`, uma nova transcrição pode substituir a anterior ou ser mantida (definir política)

### KOLs

1. **Campos Calculados:**
   - `lastVisit`: Data da última visita completada (com relatório)
   - `nextVisit`: Data da próxima visita agendada
   - Estes campos devem ser atualizados automaticamente quando visitas são criadas/atualizadas/deletadas

2. **Níveis de Engajamento:**
   - Níveis vão de 0 (Sem Engajamento) a 6 (Parceiro Estratégico)
   - Mudanças de nível devem ser registradas nas visitas com `levelChange`

### Dashboard Metrics

1. **Cálculo de Tendências:**
   - Compara período atual com período anterior equivalente
   - Se período não especificado, compara mês atual com mês anterior
   - Fórmula: `((atual - anterior) / anterior) * 100`

2. **Filtros de Data:**
   - Se `start` e `end` fornecidos, calcular métricas apenas para esse período
   - Se `comparisonStart` e `comparisonEnd` fornecidos, usar para comparação
   - Se não fornecidos, calcular período anterior equivalente automaticamente

### Smart Briefings

1. **Geração:**
   - Briefings são gerados dinamicamente para visitas agendadas nos próximos 7 dias
   - Baseado em histórico de visitas, última visita, e nível do KOL
   - Não são armazenados permanentemente, gerados sob demanda

---

## Exemplos de Integração

### Fluxo Completo: Criar KOL → Agendar Visita → Completar Visita

#### Passo 1: Criar KOL
```http
POST /api/kols
Content-Type: application/json

{
  "name": "Dra. Ana Costa",
  "specialty": "Neurologia",
  "institution": "Hospital das Clínicas",
  "email": "ana.costa@hc.com.br",
  "profile": "prescriber",
  "level": 0,
  "tags": ["efficacy"]
}
```

**Response:**
```json
{
  "data": {
    "id": "43",
    "name": "Dra. Ana Costa",
    ...
  }
}
```

#### Passo 2: Agendar Visita
```http
POST /api/visits
Content-Type: application/json

{
  "kolId": "43",
  "date": "2024-12-20",
  "time": "14:00",
  "format": "presential",
  "agenda": "Apresentar novos dados de eficácia",
  "tags": ["efficacy"]
}
```

**Response:**
```json
{
  "data": {
    "id": "45",
    "kolId": "43",
    "status": "scheduled",
    ...
  }
}
```

#### Passo 3: Obter Briefing
```http
GET /api/briefings/43?visitId=45
```

**Response:**
```json
{
  "data": {
    "kolId": "43",
    "continuityReminder": "Primeira visita com este KOL...",
    "contentSuggestion": "Para o tema \"Eficácia\" definido...",
    ...
  }
}
```

#### Passo 4: Completar Visita
```http
PUT /api/visits/45
Content-Type: application/json

{
  "status": "completed",
  "notes": "KOL demonstrou interesse. Solicitou material adicional.",
  "tags": ["efficacy", "safety"],
  "levelChange": {
    "from": 0,
    "to": 1,
    "justification": "Primeira interação positiva"
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "45",
    "status": "completed",
    ...
  },
  "kolUpdated": {
    "id": "43",
    "level": 1,
    "lastVisit": "2024-12-20"
  }
}
```

### Exemplo: Dashboard com Filtro de Semana

```http
GET /api/dashboard/metrics?start=2024-12-09&end=2024-12-15
```

**Response:**
```json
{
  "data": {
    "totalKols": 42,
    "scheduledVisits": 12,
    "completedVisitsMonth": 5,
    "avgEngagementLevel": 3.2,
    "trends": {
      "completedVisitsMonth": {
        "value": 25,
        "label": "vs. período anterior"
      }
    }
  }
}
```

### Exemplo: Listar Visitas Pendentes

```http
GET /api/visits?status=completed&hasReport=false
```

**Response:**
```json
{
  "data": [
    {
      "id": "10",
      "status": "completed",
      "notes": null,
      "date": "2024-11-15",
      ...
    }
  ]
}
```

### Exemplo: Upload e Transcrição de Áudio

#### Passo 1: Upload do Áudio
```http
POST /api/visits/45/audio
Content-Type: multipart/form-data

[arquivo de áudio: visit-recording.webm]
```

**Response (202 Accepted - Assíncrono):**
```json
{
  "data": {
    "id": "audio-789",
    "visitId": "45",
    "status": "processing",
    "audioUrl": "/uploads/audio/visit-45-20241220-140000.webm",
    "createdAt": "2024-12-20T14:00:00Z",
    "estimatedProcessingTime": 60
  }
}
```

#### Passo 2: Verificar Status da Transcrição
```http
GET /api/visits/45/audio/audio-789
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "audio-789",
    "visitId": "45",
    "status": "completed",
    "transcript": "Discussão sobre eficácia do tratamento em pacientes com perfil X. O médico demonstrou interesse nos dados do estudo recente. Solicitou material adicional sobre segurança cardiovascular.",
    "audioUrl": "/uploads/audio/visit-45-20241220-140000.webm",
    "duration": 180,
    "createdAt": "2024-12-20T14:00:00Z",
    "processedAt": "2024-12-20T14:01:15Z"
  }
}
```

**Nota:** O campo `audioTranscript` da visita foi automaticamente atualizado com o texto transcrito.

#### Passo 3: Verificar Visita Atualizada
```http
GET /api/visits/45
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "45",
    "kolId": "43",
    "status": "completed",
    "notes": "KOL demonstrou interesse...",
    "audioTranscript": "Discussão sobre eficácia do tratamento em pacientes com perfil X. O médico demonstrou interesse nos dados do estudo recente. Solicitou material adicional sobre segurança cardiovascular.",
    ...
  }
}
```

---

## Tratamento de Erros

### Formato Padrão de Erro

Todas as respostas de erro seguem o formato:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem de erro legível",
    "details": {} // Detalhes adicionais (opcional)
  }
}
```

### Códigos de Status HTTP

| Código | Descrição | Quando Usar |
|--------|-----------|-------------|
| `200 OK` | Sucesso | Operação bem-sucedida |
| `201 Created` | Criado | Recurso criado com sucesso |
| `202 Accepted` | Aceito | Requisição aceita para processamento assíncrono |
| `400 Bad Request` | Requisição inválida | Dados inválidos ou campos obrigatórios faltando |
| `401 Unauthorized` | Não autorizado | Token ausente ou inválido |
| `403 Forbidden` | Proibido | Usuário não tem permissão |
| `404 Not Found` | Não encontrado | Recurso não existe |
| `409 Conflict` | Conflito | Recurso já existe ou conflito de dados |
| `413 Payload Too Large` | Payload muito grande | Arquivo de áudio excede tamanho máximo |
| `415 Unsupported Media Type` | Tipo de mídia não suportado | Formato de áudio não suportado |
| `422 Unprocessable Entity` | Entidade não processável | Validação de negócio falhou |
| `500 Internal Server Error` | Erro interno | Erro no servidor |

### Exemplos de Erros

#### 400 Bad Request - Campos Obrigatórios Faltando
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campos obrigatórios faltando",
    "details": {
      "missing": ["name", "email"]
    }
  }
}
```

#### 404 Not Found - KOL Não Encontrado
```json
{
  "error": {
    "code": "KOL_NOT_FOUND",
    "message": "KOL com ID '999' não encontrado"
  }
}
```

#### 409 Conflict - Conflito de Agendamento
```json
{
  "error": {
    "code": "SCHEDULE_CONFLICT",
    "message": "Já existe uma visita agendada para esta data e horário",
    "details": {
      "conflictingVisitId": "12"
    }
  }
}
```

#### 422 Unprocessable Entity - Data no Passado
```json
{
  "error": {
    "code": "INVALID_DATE",
    "message": "Não é possível agendar visita com data no passado",
    "details": {
      "providedDate": "2024-11-01",
      "today": "2024-12-15"
    }
  }
}
```

#### 413 Payload Too Large - Arquivo de Áudio Muito Grande
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Arquivo de áudio excede o tamanho máximo permitido",
    "details": {
      "fileSize": 52428800,
      "maxSize": 52428800,
      "unit": "bytes"
    }
  }
}
```

#### 415 Unsupported Media Type - Formato de Áudio Não Suportado
```json
{
  "error": {
    "code": "UNSUPPORTED_AUDIO_FORMAT",
    "message": "Formato de áudio não suportado",
    "details": {
      "providedFormat": "audio/flac",
      "supportedFormats": ["audio/webm", "audio/mp3", "audio/wav", "audio/m4a", "audio/ogg"]
    }
  }
}
```

#### 500 Internal Server Error - Falha na Transcrição
```json
{
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "Não foi possível processar a transcrição do áudio",
    "details": {
      "audioId": "audio-123",
      "reason": "Serviço de transcrição indisponível"
    }
  }
}
```

---

## Notas de Implementação

### Denormalização
Alguns campos são denormalizados para performance:
- `kolName` e `kolSpecialty` em `Visit`: Evita JOINs frequentes
- Estes campos devem ser atualizados automaticamente quando o KOL é atualizado

### Sincronização Automática
O backend deve executar sincronização automática periodicamente (ex: a cada hora):
- Atualizar status de visitas agendadas que passaram da data
- Atualizar `lastVisit`/`nextVisit` dos KOLs
- Regenerar briefings

### Performance
- Endpoints de listagem devem suportar paginação
- Filtros devem ser eficientes (índices no banco de dados)
- Briefings são gerados sob demanda (não armazenados)

### Segurança
- Validar todos os inputs
- Sanitizar dados antes de salvar
- Implementar rate limiting
- Validar relacionamentos (ex: `kolId` deve existir)
- Validar tamanho e formato de arquivos de áudio antes de processar
- Implementar sanitização do texto transcrito antes de salvar

### Processamento de Áudio
- Integrar com serviço de Speech-to-Text confiável (Google Cloud, AWS Transcribe, Azure Speech, OpenAI Whisper)
- Implementar processamento assíncrono para arquivos grandes ou transcrições demoradas
- Armazenar arquivos de áudio em storage seguro (S3, Google Cloud Storage, Azure Blob)
- Implementar retry logic para falhas de transcrição
- Considerar webhooks ou polling para notificar front-end quando transcrição estiver pronta
- Validar qualidade do áudio (duração mínima, formato válido) antes de processar
- Implementar política de retenção de áudio (manter por X dias ou deletar após transcrição)

---

## Checklist de Implementação

### Fase 1: CRUD Básico
- [ ] GET /api/kols (listar)
- [ ] GET /api/kols/:id (obter)
- [ ] POST /api/kols (criar)
- [ ] PUT /api/kols/:id (atualizar)
- [ ] DELETE /api/kols/:id (deletar)
- [ ] GET /api/visits (listar)
- [ ] GET /api/visits/:id (obter)
- [ ] POST /api/visits (criar)
- [ ] PUT /api/visits/:id (atualizar)
- [ ] DELETE /api/visits/:id (deletar)

### Fase 2: Filtros e Queries
- [ ] Filtros em GET /api/kols (search, level, profile, etc)
- [ ] Filtros em GET /api/visits (status, kolId, dateRange, hasReport)
- [ ] Paginação em listagens

### Fase 3: Lógica de Negócio
- [ ] Sincronização automática de status de visitas
- [ ] Atualização automática de lastVisit/nextVisit
- [ ] Validações de negócio (datas, relacionamentos)
- [ ] Cálculo de métricas do dashboard
- [ ] Geração de briefings

### Fase 4: Funcionalidades Avançadas
- [ ] GET /api/dashboard/metrics com filtros de data
- [ ] GET /api/briefings/:kolId
- [ ] POST /api/chat/message
- [ ] GET /api/documents (com filtros)
- [ ] POST /api/sync

### Fase 5: Documentos e Admin
- [ ] CRUD completo de documentos
- [ ] POST /api/data/seed (dev)

### Fase 6: Audio e Transcrição
- [ ] POST /api/visits/:visitId/audio (upload e transcrição)
- [ ] GET /api/visits/:visitId/audio/:audioId (status de transcrição)
- [ ] PUT /api/visits/:visitId/audio/:audioId/transcript (atualizar transcrição)
- [ ] DELETE /api/visits/:visitId/audio/:audioId (deletar áudio)
- [ ] Integração com serviço de Speech-to-Text
- [ ] Armazenamento de arquivos de áudio
- [ ] Processamento assíncrono de transcrições (se necessário)

---

## Conclusão

Esta especificação documenta todas as operações necessárias para substituir localStorage e dados mockados do front-end. O backend deve implementar:

1. **CRUD completo** para KOLs e Visitas
2. **Filtros avançados** para consultas flexíveis
3. **Lógica de negócio** para sincronização e cálculos automáticos
4. **Endpoints especializados** para dashboard, briefings e chat
5. **Upload e transcrição de áudio** para visitas
6. **Validações robustas** e tratamento de erros adequado

Cada endpoint está documentado com exemplos de request/response e regras de negócio específicas. O backend deve seguir estas especificações para garantir compatibilidade total com o front-end existente.

**Nota sobre Áudio:** A funcionalidade de transcrição de áudio requer integração com um serviço de Speech-to-Text externo. Recomenda-se implementar processamento assíncrono para melhor experiência do usuário, especialmente para arquivos maiores ou quando o serviço de transcrição tiver latência alta.
