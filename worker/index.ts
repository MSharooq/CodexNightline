type IssueType = 'unpaid_wages' | 'injury' | 'registration' | 'documents' | 'hospital' | 'benefits' | 'other'

type SahaayiEnv = {
  BOLNA_API_KEY?: string
  BOLNA_AGENT_ID?: string
  BOLNA_FROM_PHONE_NUMBER?: string
  BOLNA_FUNCTION_TOKEN?: string
  OPENAI_API_KEY?: string
  OPENAI_MODEL?: string
}

type CasePayload = {
  workerLanguage?: string
  issueType?: string
  urgency?: 'standard' | 'urgent'
  statement?: string
  evidence?: string[]
}

type CallbackPayload = {
  phoneNumber?: string
  name?: string
  language?: string
}

type HelpPayload = {
  message?: string
  language?: string
  history?: ChatHistoryItem[]
}

const languageCodes: Record<string, string> = {
  English: 'en',
  Bengali: 'bn',
  Hindi: 'hi',
  Malayalam: 'ml',
  Tamil: 'ta',
  Odia: 'or',
  Assamese: 'as',
  Kannada: 'kn',
  Telugu: 'te',
  Marathi: 'mr',
}

type ChatHistoryItem = {
  role?: string
  content?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: corsHeaders })

function detectIssue(text: string): IssueType {
  const value = text.toLowerCase()
  if (/(wage|paid|payment|salary|contractor)/.test(value)) return 'unpaid_wages'
  if (/(injur|hurt|hospital|ill|pain|accident|bleed)/.test(value)) return 'injury'
  if (/(register|registration|athidhi|guest)/.test(value)) return 'registration'
  if (/(document|id|passport|aadhar|identity)/.test(value)) return 'documents'
  if (/(benefit|scheme|welfare|support)/.test(value)) return 'benefits'
  return 'other'
}

function normaliseIndianPhoneNumber(value: string) {
  const cleaned = value.replace(/[\s()-]/g, '')
  if (/^\+91\d{10}$/.test(cleaned)) return cleaned
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`
  return null
}

function hasFunctionAccess(request: Request, token?: string) {
  if (!token) return true
  return request.headers.get('Authorization') === `Bearer ${token}`
}

function demoAnswer(issueType: IssueType) {
  const answers: Record<IssueType, string> = {
    unpaid_wages: 'I can help you prepare a wage-support request. Keep any payment messages, work photos, attendance records, and contractor details you have. Would you like to request a callback so we can collect the details together?',
    injury: 'Your safety comes first. If there is heavy bleeding, severe pain, trouble breathing, or immediate danger, go to the nearest hospital or seek emergency help now. Otherwise, I can help record what happened and find public health support.',
    registration: 'I can explain registration in your language. Keep an identity document, Kerala address, and employer or worksite details ready if you have them. I can also arrange a callback to guide you through the official process.',
    documents: 'Tell me which document is missing or being held. Do not share document numbers here. Keep a photo or note of any proof you already have, and Sahaayi can help identify a safe next step.',
    hospital: 'I can help you find public health support near you. If the injury or illness is serious or immediate, please go to the nearest hospital or seek emergency help now.',
    benefits: 'I can help you understand the next step for registration, worker welfare, health support, documents, or wages. Tell me what you need most today, and I will guide you in your language.',
    other: 'I can help you find the next right step. Please tell me what happened, without sharing sensitive document or bank numbers. You can also request a callback to speak with Sahaayi.',
  }
  return answers[issueType]
}

function formatHistory(history: ChatHistoryItem[]) {
  return history
    .slice(-6)
    .map((item) => {
      const content = item.content?.trim().slice(0, 600)
      if (!content) return ''
      return `${item.role === 'assistant' ? 'Sahaayi' : 'Worker'}: ${content}`
    })
    .filter(Boolean)
    .join('\n')
}

async function getOpenAIHelp(message: string, language: string, env: SahaayiEnv, history: ChatHistoryItem[] = []) {
  const issueType = detectIssue(message)
  if (!env.OPENAI_API_KEY) {
    return {
      issueType,
      answer: demoAnswer(issueType),
      mode: 'demo',
    }
  }

  const instructions = [
    'You are Sahaayi, a calm and respectful multilingual support navigator for migrant workers in Kerala.',
    `Reply in ${language}. Use short, plain sentences suitable for a phone or low-literacy interface.`,
    'Explain only the next practical step. Do not invent eligibility, government contacts, legal outcomes, or medical diagnoses.',
    'If the request suggests immediate danger or a serious injury, tell the worker to seek emergency medical help immediately.',
    'Do not ask for Aadhaar, passport, bank, or other sensitive numbers unless a future verified workflow specifically needs it.',
    'Keep the answer under 110 words.',
  ].join(' ')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-5.6-luna',
      instructions,
      input: [formatHistory(history), `Worker: ${message}`].filter(Boolean).join('\n'),
      max_output_tokens: 280,
    }),
  })

  if (!response.ok) {
    return {
      issueType,
      answer: 'I can still help you find the next step. Please choose a support option below or ask for a callback.',
      mode: 'fallback',
    }
  }

  const data = await response.json() as { output_text?: unknown }
  const answer = typeof data.output_text === 'string' && data.output_text.trim()
    ? data.output_text.trim()
    : 'I can help you find the next right step. Please tell me a little more about what happened.'

  return { issueType, answer, mode: 'openai' }
}

export default {
  async fetch(request: Request, env: SahaayiEnv): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'sahaayi-api',
        voiceReady: Boolean(env.BOLNA_API_KEY && env.BOLNA_AGENT_ID),
        openAIReady: Boolean(env.OPENAI_API_KEY),
      })
    }

    if (url.pathname === '/api/help' && request.method === 'POST') {
      const payload = await request.json<HelpPayload>()
      const message = payload.message?.trim().slice(0, 1_200)
      if (!message) return json({ error: 'Please tell Sahaayi what you need help with.' }, 400)

      return json(await getOpenAIHelp(message, payload.language?.trim() || 'English', env, payload.history ?? []))
    }

    if (url.pathname === '/api/callback' && request.method === 'POST') {
      const payload = await request.json<CallbackPayload>()
      const phoneNumber = normaliseIndianPhoneNumber(payload.phoneNumber ?? '')
      const preferredLanguage = payload.language?.trim().slice(0, 40) || 'English'
      if (!phoneNumber) return json({ error: 'Enter a valid Indian phone number, for example +91 98765 43210.' }, 400)

      if (!env.BOLNA_API_KEY || !env.BOLNA_AGENT_ID) {
        return json({ error: 'The Sahaayi phone agent is not configured yet. Add the Bolna agent details first.' }, 503)
      }

      const bolnaPayload = {
        agent_id: env.BOLNA_AGENT_ID,
        recipient_phone_number: phoneNumber,
        ...(env.BOLNA_FROM_PHONE_NUMBER ? { from_phone_number: env.BOLNA_FROM_PHONE_NUMBER } : {}),
        user_data: {
          caller_name: payload.name?.trim().slice(0, 80) || 'Worker',
          preferred_language: preferredLanguage,
          preferred_language_code: languageCodes[preferredLanguage] ?? 'en',
          language_instruction: `Speak only in ${preferredLanguage}, unless the worker asks to change language.`,
          entry_point: 'sahaayi_callback',
        },
      }

      const bolnaResponse = await fetch('https://api.bolna.ai/call', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.BOLNA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bolnaPayload),
      })

      const bolnaData = await bolnaResponse.json().catch(() => ({})) as { status?: string; execution_id?: string; message?: string }
      if (!bolnaResponse.ok || bolnaData.status === 'failed') {
        return json({ error: 'We could not request a callback right now. Please try again shortly.' }, 502)
      }

      return json({
        message: 'Your callback has been requested. Please keep this phone nearby.',
        executionId: bolnaData.execution_id,
        status: bolnaData.status ?? 'queued',
      }, 202)
    }

    if (url.pathname === '/api/caller-context') {
      if (!hasFunctionAccess(request, env.BOLNA_FUNCTION_TOKEN)) return json({ error: 'Unauthorized' }, 401)
      return json({
        contact_number: url.searchParams.get('contact_number') ?? '',
        known_worker: false,
        note: 'No worker profile is stored yet. Ask for a preferred language and how Sahaayi can help.',
      })
    }

    if (url.pathname === '/api/bolna/case' && request.method === 'POST') {
      if (!hasFunctionAccess(request, env.BOLNA_FUNCTION_TOKEN)) return json({ error: 'Unauthorized' }, 401)

      const payload = await request.json<CasePayload>()
      const caseId = `SHY-${Math.floor(2400 + Math.random() * 500)}`
      return json({
        caseId,
        status: 'under_review',
        received: {
          language: payload.workerLanguage ?? 'unknown',
          issueType: payload.issueType ?? 'other',
          urgency: payload.urgency ?? 'standard',
          statement: payload.statement ?? '',
          evidenceCount: payload.evidence?.length ?? 0,
        },
        note: 'Demo response. Connect Supabase to persist this case after the hackathon demo flow is confirmed.',
      }, 201)
    }

    if (url.pathname === '/api/services') {
      return json({
        services: [
          { category: 'registration', title: 'Registration support', action: 'Prepare document checklist' },
          { category: 'health', title: 'Government health support', action: 'Find nearby service' },
          { category: 'wages', title: 'Wage support', action: 'Create a reviewed support request' },
        ],
      })
    }

    return json({ error: 'Not found' }, 404)
  },
} satisfies ExportedHandler<SahaayiEnv>
