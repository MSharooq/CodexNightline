import { FormEvent, useMemo, useState } from 'react'

type Page = 'home' | 'cases' | 'documents' | 'profile' | 'dashboard'
type Issue = 'unpaid_wages' | 'injury' | 'registration' | 'documents' | 'hospital' | 'benefits' | 'other'

type CaseItem = {
  id: string
  title: string
  issue: Issue
  createdAt: string
  status: 'Under review' | 'Awaiting you' | 'Resolved'
  nextAction: string
  urgency?: 'Urgent'
}

type HelpResult = {
  title: string
  eyebrow: string
  summary: string
  nextStep: string
  action: string
  issue: Issue
  needsCase?: boolean
  urgent?: boolean
}

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

const languages = [
  { label: 'English', name: 'English' },
  { label: 'বাংলা', name: 'Bengali' },
  { label: 'हिन्दी', name: 'Hindi' },
  { label: 'മലയാളം', name: 'Malayalam' },
  { label: 'தமிழ்', name: 'Tamil' },
  { label: 'ଓଡ଼ିଆ', name: 'Odia' },
  { label: 'অসমীয়া', name: 'Assamese' },
  { label: 'ಕನ್ನಡ', name: 'Kannada' },
  { label: 'తెలుగు', name: 'Telugu' },
  { label: 'मराठी', name: 'Marathi' },
]

const initialCases: CaseItem[] = [
  {
    id: 'SHY-2408',
    title: 'Wage payment support',
    issue: 'unpaid_wages',
    createdAt: 'Today, 10:42 AM',
    status: 'Under review',
    nextAction: 'A support worker is reviewing your payment details.',
  },
  {
    id: 'SHY-2371',
    title: 'ATHIDHI registration help',
    issue: 'registration',
    createdAt: '18 July',
    status: 'Awaiting you',
    nextAction: 'Upload a photo of your identity document.',
  },
]

const quickActions: { title: string; detail: string; issue: Issue; icon: string; tone: string }[] = [
  { title: 'My benefits', detail: 'Find support you may be able to use', issue: 'benefits', icon: '✦', tone: 'mint' },
  { title: 'Wages', detail: 'Payment not received or unclear', issue: 'unpaid_wages', icon: '₹', tone: 'pink' },
  { title: 'Injury or illness', detail: 'Get the right health support', issue: 'injury', icon: '✚', tone: 'yellow' },
  { title: 'Registration', detail: 'Help with ATHIDHI and documents', issue: 'registration', icon: '⌁', tone: 'blue' },
  { title: 'My documents', detail: 'ID, passport or papers kept by someone', issue: 'documents', icon: '▤', tone: 'lavender' },
  { title: 'Find a hospital', detail: 'Nearby government health support', issue: 'hospital', icon: '⌖', tone: 'mint' },
]

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'cases', label: 'My cases', icon: '◫' },
  { id: 'documents', label: 'Documents', icon: '▤' },
  { id: 'profile', label: 'Profile', icon: '☺' },
]

function resultForIssue(issue: Issue, statement = ''): HelpResult {
  const spoken = statement || 'your request'
  const results: Record<Issue, HelpResult> = {
    unpaid_wages: {
      eyebrow: 'Wage support',
      title: 'We can help you prepare a wage-support request.',
      summary: `I understood: “${spoken}”. Save any payment messages, work photos, attendance records, or the contractor’s details. You do not need to explain this in Malayalam or English.`,
      nextStep: 'We will ask for the work period and unpaid amount, then connect you to a support worker.',
      action: 'Start wage support',
      issue,
      needsCase: true,
    },
    injury: {
      eyebrow: 'Health and safety',
      title: 'Your safety comes first.',
      summary: 'If there is heavy bleeding, severe pain, trouble breathing, or an immediate danger, contact emergency services or go to the nearest hospital now. Otherwise, Sahaayi can help prepare your injury-support request.',
      nextStep: 'We can find a government hospital and record what happened at work.',
      action: 'Find health support',
      issue,
      needsCase: true,
      urgent: true,
    },
    registration: {
      eyebrow: 'Registration help',
      title: 'Let’s make registration easier.',
      summary: 'Sahaayi can explain the process in your language and make a document checklist before you use an official registration service.',
      nextStep: 'Keep an identity document, your Kerala address, and employer or worksite details ready if you have them.',
      action: 'See my checklist',
      issue,
    },
    documents: {
      eyebrow: 'Document support',
      title: 'Your identity documents should stay safe.',
      summary: 'Tell us which document is missing or being held. We will help you record the details, save evidence, and find the right support path.',
      nextStep: 'A support worker can review this safely with you before any escalation.',
      action: 'Get document help',
      issue,
      needsCase: true,
    },
    hospital: {
      eyebrow: 'Health support',
      title: 'Find nearby public health support.',
      summary: 'Sahaayi can help you find a government hospital and explain what to take with you. Use emergency services immediately if the injury is serious.',
      nextStep: 'Share your area or use location to see verified options.',
      action: 'Share my area',
      issue,
      urgent: true,
    },
    benefits: {
      eyebrow: 'Benefits navigator',
      title: 'Let’s find the support that fits your situation.',
      summary: 'You can ask about registration, health cover, worker welfare, documents, wage support, or finding a hospital. Sahaayi explains the next step in your language.',
      nextStep: 'Start by telling us what you need help with today.',
      action: 'Ask about support',
      issue,
    },
    other: {
      eyebrow: 'Sahaayi is listening',
      title: 'I can help you find the next right step.',
      summary: `I understood: “${spoken}”. I will ask a few short questions and help you find the right service, benefit, or support person.`,
      nextStep: 'Your information is only used to help with your request.',
      action: 'Continue',
      issue,
    },
  }
  return results[issue]
}

function detectIssue(text: string): Issue {
  const value = text.toLowerCase()
  if (/(wage|paid|payment|salary|contractor)/.test(value)) return 'unpaid_wages'
  if (/(injur|hurt|hospital|ill|pain|accident)/.test(value)) return 'injury'
  if (/(register|registration|athidhi|guest)/.test(value)) return 'registration'
  if (/(document|id|passport|aadhar|identity)/.test(value)) return 'documents'
  if (/(benefit|scheme|welfare|support)/.test(value)) return 'benefits'
  return 'other'
}

function isIssue(value: unknown): value is Issue {
  return ['unpaid_wages', 'injury', 'registration', 'documents', 'hospital', 'benefits', 'other'].includes(String(value))
}

function issueIcon(issue: Issue) {
  return ({ unpaid_wages: '₹', injury: '✚', registration: '⌁', documents: '▤', hospital: '⌖', benefits: '✦', other: '●' })[issue]
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [language, setLanguage] = useState(languages[0])
  const [isLanguageOpen, setLanguageOpen] = useState(false)
  const [isListening, setListening] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<HelpResult | null>(null)
  const [showCaseSheet, setShowCaseSheet] = useState(false)
  const [caseDraft, setCaseDraft] = useState<HelpResult | null>(null)
  const [isCallbackOpen, setCallbackOpen] = useState(false)
  const [isThinking, setThinking] = useState(false)
  const [isChatOpen, setChatOpen] = useState(false)
  const [cases, setCases] = useState(initialCases)
  const [toast, setToast] = useState('')

  const caseCount = useMemo(() => cases.filter((item) => item.status !== 'Resolved').length, [cases])

  const notify = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 3200)
  }

  const askForHelp = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return
    setThinking(true)
    setMessage('')
    try {
      const response = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, language: language.name }),
      })
      const data = await response.json() as { issueType?: unknown; answer?: unknown }
      const issue = isIssue(data.issueType) ? data.issueType : detectIssue(trimmed)
      const fallback = resultForIssue(issue, trimmed)
      setResult({ ...fallback, summary: typeof data.answer === 'string' && data.answer.trim() ? data.answer : fallback.summary })
    } catch {
      setResult(resultForIssue(detectIssue(trimmed), trimmed))
    } finally {
      setThinking(false)
    }
  }

  const startDemoVoice = () => {
    if (isListening) return
    setListening(true)
    window.setTimeout(() => {
      const demoStatement = 'My contractor has not paid me for two months.'
      setResult(resultForIssue('unpaid_wages', demoStatement))
      setListening(false)
    }, 1550)
  }

  const openQuickAction = (issue: Issue) => setResult(resultForIssue(issue))

  const createCase = () => {
    const type = caseDraft?.issue ?? 'other'
    const newCase: CaseItem = {
      id: `SHY-${Math.floor(2411 + Math.random() * 70)}`,
      title: caseDraft?.eyebrow ?? 'Support request',
      issue: type,
      createdAt: 'Just now',
      status: 'Under review',
      nextAction: 'A support worker will review the information you shared.',
      urgency: caseDraft?.urgent ? 'Urgent' : undefined,
    }
    setCases((current) => [newCase, ...current])
    setShowCaseSheet(false)
    setCaseDraft(null)
    setPage('cases')
    notify('Your support request is ready for review.')
  }

  const renderPage = () => {
    if (page === 'cases') {
      return <CasesPage cases={cases} onBack={() => setPage('home')} onOpenHelp={() => setPage('home')} />
    }
    if (page === 'documents') {
      return <DocumentsPage onNotify={notify} />
    }
    if (page === 'profile') {
      return <ProfilePage language={language.name} onOpenLanguage={() => setLanguageOpen(true)} />
    }
    if (page === 'dashboard') {
      return <Dashboard cases={cases} onExit={() => setPage('home')} />
    }

    return (
      <main className="home-page">
        <section className="welcome-row">
          <div>
            <p className="eyebrow hero-eyebrow"><span /> A worker-first guide for Kerala</p>
            <h1>Support that <em>speaks</em><br />your language.</h1>
            <p className="subtle">Tell Sahaayi what happened in {language.name}. We’ll help you find the next real step — without the paperwork maze.</p>
          </div>
          <div className="welcome-orbit" aria-hidden="true"><span className="orbit-sun" /><span className="orbit-face">✦</span><span className="orbit-word">സ</span></div>
        </section>

        <section className={`voice-card ${isListening ? 'is-listening' : ''}`} aria-live="polite">
          <div className="voice-copy">
            <span className="small-pill"><span className="pulse-dot" />{isListening ? 'Listening now' : `Ready in ${language.name}`}</span>
            <h2>{isListening ? 'Take your time. I’m here.' : 'Speak freely. We’ll find your way forward.'}</h2>
            <p>{isListening ? '“My contractor has not paid me for two months.”' : 'No forms to understand first. Just explain what is happening in your own words.'}</p>
          </div>
          <button className="voice-button" type="button" onClick={startDemoVoice} aria-label="Start voice help">
            <span className="mic-icon" aria-hidden="true" />
            <span className="voice-ring ring-one" />
            <span className="voice-ring ring-two" />
          </button>
          <div className="voice-foot">
            <span>{isListening ? 'Understanding your words' : 'Tap the mic to start speaking'}</span>
            <span className="privacy-note">✦ Your story stays yours</span>
          </div>
        </section>

        <section className="call-options" aria-label="Request a phone callback">
          <div className="call-options-copy">
            <span className="call-symbol">☎</span>
            <div><span className="call-kicker">Voice callback</span><strong>Prefer to talk on the phone?</strong><p>A Sahaayi voice agent can call you in a few minutes.</p></div>
          </div>
          <div className="call-options-actions">
            <button type="button" onClick={() => setCallbackOpen(true)}>Request a call <span>→</span></button>
          </div>
        </section>

        <form className="help-input" onSubmit={askForHelp}>
          <label htmlFor="help-message">Rather type it out?</label>
          <div>
            <input
              id="help-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="For example: My employer has my documents"
            />
            <button type="submit" aria-label="Ask Sahaayi" disabled={isThinking}>{isThinking ? '…' : '↑'}</button>
          </div>
        </form>

        <section className="quick-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Pick a starting point</p>
              <h2>What’s on your mind today?</h2>
            </div>
            <span className="language-chip">{language.label} {language.name}</span>
          </div>
          <div className="quick-grid">
            {quickActions.map((action) => (
              <button key={action.issue} className={`quick-card ${action.tone}`} type="button" onClick={() => openQuickAction(action.issue)}>
                <span className="quick-icon">{action.icon}</span>
                <span><strong>{action.title}</strong><small>{action.detail}</small></span>
                <span className="arrow">↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="two-up">
          <article className="support-card">
            <div className="support-card-icon">⌂</div>
            <p className="eyebrow">Nearby help</p>
            <h2>Find help near your work or home</h2>
            <p>Hospitals, help desks, and worker-support organisations near your area.</p>
            <button type="button" className="text-button" onClick={() => openQuickAction('hospital')}>Find support near me <span>→</span></button>
          </article>
          <article className="active-case-card">
            <div className="card-topline"><span className="eyebrow">Your cases</span><span className="count-dot">{caseCount}</span></div>
            <h2>{caseCount ? 'Your support is moving forward.' : 'You have no open cases.'}</h2>
            <p>{caseCount ? cases[0].nextAction : 'Whenever you need support, Sahaayi is here.'}</p>
            <button type="button" className="outline-light" onClick={() => setPage('cases')}>View my cases</button>
          </article>
        </section>

        <button type="button" className="caseworker-link" onClick={() => setPage('dashboard')}>I am a support worker <span>→</span></button>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => setPage('home')} aria-label="Sahaayi home"><span className="brand-mark">s</span><span>Sahaayi</span></button>
        <div className="top-actions">
          <div className="language-menu">
            <button className="language-switch" type="button" onClick={() => setLanguageOpen((open) => !open)}>{language.label}<span className="hide-on-small"> {language.name}</span><span>⌄</span></button>
            {isLanguageOpen && <div className="language-popover">{languages.map((item) => <button type="button" key={item.name} onClick={() => { setLanguage(item); setLanguageOpen(false) }}><span>{item.label}</span>{item.name === language.name && <span>✓</span>}<small>{item.name}</small></button>)}</div>}
          </div>
          <button type="button" className="emergency-link" onClick={() => setResult(resultForIssue('injury'))}><span>✚</span><span className="hide-on-small">Urgent help</span></button>
        </div>
      </header>

      <div className="content-wrap">{renderPage()}</div>

      {page !== 'dashboard' && <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => <button className={page === item.id ? 'selected' : ''} key={item.id} type="button" onClick={() => setPage(item.id)}><span>{item.icon}</span>{item.label}</button>)}
      </nav>}

      {result && <HelpSheet result={result} onClose={() => setResult(null)} onContinue={() => {
        if (result.needsCase) {
          setCaseDraft(result)
          setResult(null)
          setShowCaseSheet(true)
          return
        }
        notify('Your next-step checklist is ready.')
      }} />}
      {showCaseSheet && <CaseSheet result={caseDraft} onClose={() => { setShowCaseSheet(false); setCaseDraft(null) }} onCreate={createCase} />}
      {isCallbackOpen && <CallbackSheet language={language.name} onClose={() => setCallbackOpen(false)} onSuccess={(message) => { setCallbackOpen(false); notify(message) }} />}
      {page !== 'dashboard' && <button type="button" className="chat-launcher" onClick={() => setChatOpen(true)} aria-label="Open Sahaayi chat"><span>✦</span><strong>Chat with Sahaayi</strong></button>}
      {isChatOpen && <Chatbot language={language.name} onClose={() => setChatOpen(false)} onRequestCallback={() => { setChatOpen(false); setCallbackOpen(true) }} />}
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </div>
  )
}

function Chatbot({ language, onClose, onRequestCallback }: { language: string; onClose: () => void; onRequestCallback: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: `Hi, I’m Sahaayi. You can ask me about benefits, wages, registration, documents, or health support. I’ll reply in ${language}.` },
  ])
  const [input, setInput] = useState('')
  const [isSending, setSending] = useState(false)

  const sendMessage = async (text: string) => {
    const message = text.trim()
    if (!message || isSending) return
    const userMessage: ChatMessage = { id: `user-${messages.length}`, role: 'user', content: message }
    const history = messages.slice(-6).map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, userMessage])
    setInput('')
    setSending(true)
    try {
      const response = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language, history }),
      })
      const data = await response.json() as { answer?: unknown }
      const answer = typeof data.answer === 'string' && data.answer.trim()
        ? data.answer
        : 'I can help you find the next right step. Could you tell me a little more?'
      setMessages((current) => [...current, { id: `assistant-${current.length}`, role: 'assistant', content: answer }])
    } catch {
      setMessages((current) => [...current, { id: `assistant-${current.length}`, role: 'assistant', content: 'I’m having trouble connecting right now. You can still request a callback and speak to Sahaayi by phone.' }])
    } finally {
      setSending(false)
    }
  }

  const submitChat = (event: FormEvent) => {
    event.preventDefault()
    void sendMessage(input)
  }

  return <aside className="chat-panel" role="dialog" aria-modal="false" aria-label="Chat with Sahaayi">
    <header className="chat-header"><div><span className="chat-avatar">✦</span><div><strong>Sahaayi</strong><small>Here to help in {language}</small></div></div><button type="button" onClick={onClose} aria-label="Close chat">×</button></header>
    <div className="chat-messages" aria-live="polite">
      {messages.map((message) => <div className={`chat-message ${message.role}`} key={message.id}>{message.content}</div>)}
      {isSending && <div className="chat-message assistant typing" aria-label="Sahaayi is typing"><span /><span /><span /></div>}
    </div>
    <div className="chat-suggestions" aria-label="Suggested questions">
      {['My wages are unpaid', 'Help with registration', 'Find a hospital'].map((suggestion) => <button type="button" key={suggestion} onClick={() => void sendMessage(suggestion)}>{suggestion}</button>)}
    </div>
    <form className="chat-input" onSubmit={submitChat}>
      <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your question…" aria-label="Message Sahaayi" disabled={isSending} />
      <button type="submit" disabled={!input.trim() || isSending} aria-label="Send message">↑</button>
    </form>
    <button type="button" className="chat-callback" onClick={onRequestCallback}>Prefer to speak? Request a call <span>→</span></button>
  </aside>
}

function CallbackSheet({ language, onClose, onSuccess }: { language: string; onClose: () => void; onSuccess: (message: string) => void }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [name, setName] = useState('')
  const [callbackLanguage, setCallbackLanguage] = useState(language)
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const requestCallback = async (event: FormEvent) => {
    event.preventDefault()
    if (!consent) {
      setError('Please confirm that Sahaayi may call this number.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, name, language: callbackLanguage }),
      })
      const data = await response.json() as { error?: string; message?: string }
      if (!response.ok) throw new Error(data.error ?? 'We could not request a callback right now.')
      onSuccess(data.message ?? 'Sahaayi’s voice agent will call you in a few minutes.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not request a callback right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="help-sheet callback-sheet" role="dialog" aria-modal="true" aria-labelledby="callback-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="sheet-handle" />
      <button className="close-button" type="button" onClick={onClose} aria-label="Close callback request">×</button>
      <div className="callback-icon">☎</div>
      <p className="eyebrow">Sahaayi can call you</p>
      <h2 id="callback-title">Request a callback</h2>
      <p className="result-summary">Choose a language and enter a number you can answer. Sahaayi’s voice agent will call you in a few minutes and speak in your chosen language.</p>
      <form className="callback-form" onSubmit={requestCallback}>
        <label htmlFor="callback-language">Preferred language</label>
        <select id="callback-language" value={callbackLanguage} onChange={(event) => setCallbackLanguage(event.target.value)}>
          {languages.map((item) => <option key={item.name} value={item.name}>{item.label} — {item.name}</option>)}
        </select>
        <label htmlFor="callback-phone">Phone number</label>
        <input id="callback-phone" required inputMode="tel" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+91 98765 43210" />
        <label htmlFor="callback-name">Name <span>Optional</span></label>
        <input id="callback-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="What should Sahaayi call you?" />
        <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree that Sahaayi may call this number about my support request.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Requesting your call…' : <>Request a call <span>→</span></>}</button>
      </form>
      <p className="data-note">Do not use this form for an immediate medical emergency.</p>
    </section>
  </div>
}

function HelpSheet({ result, onClose, onContinue }: { result: HelpResult; onClose: () => void; onContinue: () => void }) {
  return <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="help-sheet" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="sheet-handle" />
      <button className="close-button" type="button" onClick={onClose} aria-label="Close help">×</button>
      {result.urgent && <div className="urgent-banner"><span>✚</span> If there is immediate danger, seek emergency help now.</div>}
      <div className={`result-icon ${result.issue}`}>{issueIcon(result.issue)}</div>
      <p className="eyebrow">{result.eyebrow}</p>
      <h2 id="help-title">{result.title}</h2>
      <p className="result-summary">{result.summary}</p>
      <div className="next-step"><span>→</span><div><strong>Next step</strong><p>{result.nextStep}</p></div></div>
      <button type="button" className="primary-button" onClick={onContinue}>{result.action} <span>→</span></button>
      <p className="data-note">Sahaayi gives guidance and connects you to support. It does not replace emergency, legal, or medical advice.</p>
    </section>
  </div>
}

function CaseSheet({ result, onClose, onCreate }: { result: HelpResult | null; onClose: () => void; onCreate: () => void }) {
  return <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="help-sheet case-sheet" role="dialog" aria-modal="true" aria-labelledby="case-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="sheet-handle" />
      <button className="close-button" type="button" onClick={onClose} aria-label="Close">×</button>
      <p className="eyebrow">Review before sharing</p>
      <h2 id="case-title">Your support request is ready.</h2>
      <p className="result-summary">A trained support worker will see a short summary in the language they use. You can add evidence later.</p>
      <div className="case-preview">
        <div><span>Support needed</span><strong>{result?.eyebrow ?? 'Worker support'}</strong></div>
        <div><span>Priority</span><strong>{result?.urgent ? 'Urgent review' : 'Standard review'}</strong></div>
        <div><span>What happens next</span><strong>Support worker review</strong></div>
      </div>
      <button type="button" className="primary-button" onClick={onCreate}>Send for support <span>→</span></button>
      <button type="button" className="secondary-button" onClick={onClose}>Go back and edit</button>
    </section>
  </div>
}

function CasesPage({ cases, onBack, onOpenHelp }: { cases: CaseItem[]; onBack: () => void; onOpenHelp: () => void }) {
  return <main className="inner-page">
    <button type="button" className="back-link" onClick={onBack}>← Home</button>
    <div className="page-heading"><div><p className="eyebrow">Your support</p><h1>My cases</h1><p className="subtle">You can always see what is happening next.</p></div><div className="case-count-large">{cases.length}<span>cases</span></div></div>
    <div className="case-list">
      {cases.map((item) => <article className="case-card" key={item.id}>
        <div className={`issue-symbol ${item.issue}`}>{issueIcon(item.issue)}</div>
        <div className="case-main"><div className="case-title-row"><h2>{item.title}</h2>{item.urgency && <span className="urgent-pill">{item.urgency}</span>}</div><p className="case-meta">{item.id} · {item.createdAt}</p><p className="case-next"><strong>Next:</strong> {item.nextAction}</p></div>
        <div className="case-side"><span className={`status-pill ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span><button type="button">View <span>→</span></button></div>
      </article>)}
    </div>
    <section className="need-more-card"><div><span className="help-dot">?</span><h2>Need help with something else?</h2><p>Tell Sahaayi in your own words. You do not need to choose the right department first.</p></div><button type="button" className="primary-button" onClick={onOpenHelp}>Ask Sahaayi <span>→</span></button></section>
  </main>
}

function DocumentsPage({ onNotify }: { onNotify: (message: string) => void }) {
  const documents = [
    { title: 'Identity document', detail: 'Not uploaded yet', icon: '▤', status: 'Add safely' },
    { title: 'Payment messages', detail: 'Can help with wage support', icon: '◫', status: 'Upload proof' },
    { title: 'Worksite photos', detail: 'Optional evidence for a support request', icon: '◉', status: 'Add photo' },
  ]
  return <main className="inner-page">
    <div className="page-heading"><div><p className="eyebrow">Keep things together</p><h1>My documents</h1><p className="subtle">Only share what is needed for your support request.</p></div></div>
    <div className="document-tip"><span>⌁</span><p><strong>Your documents stay yours.</strong> Sahaayi will always show you what you are sharing and why.</p></div>
    <div className="document-list">{documents.map((document) => <article key={document.title} className="document-card"><span className="document-icon">{document.icon}</span><div><h2>{document.title}</h2><p>{document.detail}</p></div><button type="button" onClick={() => onNotify('Document upload will be connected to secure storage once Supabase is configured.')}>{document.status} <span>→</span></button></article>)}</div>
  </main>
}

function ProfilePage({ language, onOpenLanguage }: { language: string; onOpenLanguage: () => void }) {
  return <main className="inner-page profile-page">
    <div className="profile-hero"><div className="profile-avatar">☺</div><div><p className="eyebrow">Your space</p><h1>Welcome to Sahaayi</h1><p>Choose how you want Sahaayi to speak with you.</p></div></div>
    <div className="profile-settings"><button type="button" onClick={onOpenLanguage}><span><strong>Language</strong><small>Currently speaking in {language}</small></span><span>›</span></button><button type="button"><span><strong>Privacy and sharing</strong><small>Control what support workers can see</small></span><span>›</span></button><button type="button"><span><strong>About Sahaayi</strong><small>How this helper connects you to support</small></span><span>›</span></button></div>
    <p className="profile-footer">Sahaayi is a support navigator. Always seek urgent medical or emergency help when you are in immediate danger.</p>
  </main>
}

function Dashboard({ cases, onExit }: { cases: CaseItem[]; onExit: () => void }) {
  const urgent = cases.filter((item) => item.urgency).length + 1
  return <main className="dashboard-page">
    <aside className="dashboard-nav"><button type="button" className="brand"><span className="brand-mark">s</span><span>Sahaayi</span></button><p className="dashboard-role">Support workspace</p><button className="dashboard-nav-item selected" type="button">◫ Case inbox <span>{cases.length + 7}</span></button><button className="dashboard-nav-item" type="button">✦ My assignments</button><button className="dashboard-nav-item" type="button">⌁ Service directory</button><button className="dashboard-nav-item" type="button">▥ Insights</button><button className="exit-dashboard" type="button" onClick={onExit}>← Worker app</button></aside>
    <section className="dashboard-main"><header className="dashboard-header"><div><p className="eyebrow">Caseworker dashboard</p><h1>Good morning, Anjali.</h1></div><div className="dashboard-header-actions"><button type="button">⌕ Search</button><span className="agent-avatar">A</span></div></header>
      <section className="metrics"><article><span className="metric-icon blue">◫</span><div><strong>{cases.length + 7}</strong><p>New cases</p></div><span className="metric-change">+3 today</span></article><article><span className="metric-icon danger">✚</span><div><strong>{urgent}</strong><p>Urgent review</p></div><span className="metric-change danger-text">Needs attention</span></article><article><span className="metric-icon mint">✓</span><div><strong>18</strong><p>Resolved this week</p></div><span className="metric-change">+24%</span></article></section>
      <section className="inbox-heading"><div><h2>Incoming cases</h2><p>AI-generated summaries must be reviewed before action.</p></div><div className="filters"><button type="button" className="filter-active">All cases</button><button type="button">Urgent</button><button type="button">Unassigned</button></div></section>
      <section className="case-table"><div className="table-head"><span>Worker request</span><span>Language</span><span>Urgency</span><span>Recommended path</span><span /></div>
        {[...cases, { id: 'SHY-2419', title: 'Workplace injury support', issue: 'injury' as Issue, createdAt: '9 min ago', status: 'Under review' as const, nextAction: 'Health support', urgency: 'Urgent' as const }, { id: 'SHY-2414', title: 'Hospital navigation', issue: 'hospital' as Issue, createdAt: '22 min ago', status: 'Awaiting you' as const, nextAction: 'Nearest verified centre' }].map((item, index) => <article className="table-row" key={`${item.id}-${index}`}><div className="table-request"><span className={`issue-symbol small ${item.issue}`}>{issueIcon(item.issue)}</span><div><strong>{item.title}</strong><small>{item.id} · {item.createdAt}</small></div></div><span>{index % 2 ? 'Hindi' : 'Bengali'}</span><span>{item.urgency ? <span className="urgent-pill">Urgent</span> : <span className="review-pill">Review</span>}</span><span className="path-text">{item.nextAction}</span><button type="button" className="open-case">Open <span>→</span></button></article>)}
      </section>
    </section>
  </main>
}

export default App
