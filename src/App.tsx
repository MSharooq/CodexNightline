import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { setBrowserPageLanguage } from './browserTranslation'

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

type DocumentItem = {
  id: string
  title: string
  detail: string
  icon: string
  status: string
  fileName?: string
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

function getInitialLanguage() {
  if (typeof window === 'undefined') return languages[0]
  const savedLanguage = window.localStorage.getItem('sahaayi-preferred-language')
  return languages.find((item) => item.name === savedLanguage) ?? languages[0]
}

const initialCases: CaseItem[] = [
  {
    id: 'SHY-2408',
    title: 'Wage payment support · ₹12,500 pending',
    issue: 'unpaid_wages',
    createdAt: 'Today, 10:42 AM · Bengali',
    status: 'Under review',
    nextAction: 'Anjali, a support worker, is reviewing 3 payment-message screenshots.',
  },
  {
    id: 'SHY-2371',
    title: 'ATHIDHI registration help',
    issue: 'registration',
    createdAt: '18 July · Hindi',
    status: 'Awaiting you',
    nextAction: 'Add an identity-document photo to complete your checklist.',
  },
]

const initialDocuments: DocumentItem[] = [
  { id: 'identity', title: 'Identity document', detail: 'Aadhaar card · added 18 July', icon: '▤', status: 'Ready', fileName: 'aadhaar-front.jpg' },
  { id: 'payments', title: 'Payment messages', detail: '3 WhatsApp screenshots for wage support', icon: '◫', status: 'Attached', fileName: 'payment-messages.zip' },
  { id: 'worksite', title: 'Worksite photos', detail: 'Optional evidence for a support request', icon: '◉', status: 'Add photo' },
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

function issueIcon(issue: Issue) {
  return ({ unpaid_wages: '₹', injury: '✚', registration: '⌁', documents: '▤', hospital: '⌖', benefits: '✦', other: '●' })[issue]
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [language, setLanguage] = useState(getInitialLanguage)
  const [isLanguageOpen, setLanguageOpen] = useState(false)
  const [result, setResult] = useState<HelpResult | null>(null)
  const [showCaseSheet, setShowCaseSheet] = useState(false)
  const [caseDraft, setCaseDraft] = useState<HelpResult | null>(null)
  const [isCallbackOpen, setCallbackOpen] = useState(false)
  const [isChatOpen, setChatOpen] = useState(false)
  const [cases, setCases] = useState(initialCases)
  const [documents, setDocuments] = useState(initialDocuments)
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (language.name === 'English') return
    void setBrowserPageLanguage(language.name).catch(() => {
      setToast('Website translation could not load. Sahaayi will still reply in your selected language.')
    })
  }, [language.name])

  const caseCount = useMemo(() => cases.filter((item) => item.status !== 'Resolved').length, [cases])

  const notify = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 3200)
  }

  const changeLanguage = (nextLanguage: (typeof languages)[number]) => {
    window.localStorage.setItem('sahaayi-preferred-language', nextLanguage.name)
    setLanguage(nextLanguage)
    setLanguageOpen(false)

    if (nextLanguage.name === 'English') {
      void setBrowserPageLanguage(nextLanguage.name)
    }
  }

  const openQuickAction = (issue: Issue) => setResult(resultForIssue(issue))

  const attachDocument = (id: string, fileName: string) => {
    setDocuments((current) => current.map((item) => item.id === id
      ? { ...item, status: 'Attached', detail: 'Added just now to this device', fileName }
      : item))
    notify(`${fileName} is attached to this demo request.`)
  }

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
      return <CasesPage cases={cases} onBack={() => setPage('home')} onOpenHelp={() => setPage('home')} onViewCase={setSelectedCase} />
    }
    if (page === 'documents') {
      return <DocumentsPage documents={documents} onAttach={attachDocument} />
    }
    if (page === 'profile') {
      return <ProfilePage language={language.name} onOpenLanguage={() => setLanguageOpen(true)} onNotify={notify} />
    }
    if (page === 'dashboard') {
      return <Dashboard cases={cases} onExit={() => setPage('home')} onOpenCase={setSelectedCase} />
    }

    return (
      <main className="home-page">
        <section className="intro-hero" aria-labelledby="intro-title">
          <div className="intro-copy">
            <p className="eyebrow hero-eyebrow"><span /> A multilingual helper for migrant workers in Kerala</p>
            <h1 id="intro-title">Support for your work and life in Kerala.<br /><em>In your language.</em></h1>
            <p className="intro-summary">Sahaayi is a voice and chat helper for migrant workers living and working in Kerala. Understand benefits, solve workplace problems and find the right official or community support.</p>
            <label className="hero-language-select"><span>Start in your language</span><select value={language.name} onChange={(event) => { const selected = languages.find((item) => item.name === event.target.value); if (selected) changeLanguage(selected) }}>{languages.map((item) => <option key={item.name} value={item.name}>{item.label} · {item.name}</option>)}</select></label>
            <div className="intro-actions">
              <div className="intro-callback-action"><button type="button" className="intro-primary-action" onClick={() => setCallbackOpen(true)}>Request a voice callback <span>→</span></button><small>We’ll call the number you share in a few minutes.</small></div>
              <button type="button" className="intro-secondary-action" onClick={() => setChatOpen(true)}>Chat with Sahaayi</button>
            </div>
            <ul className="intro-proof" aria-label="Ways Sahaayi can help"><li><span>✓</span> Wages &amp; workplace safety</li><li><span>✓</span> Documents &amp; registration</li><li><span>✓</span> Benefits &amp; nearby services</li></ul>
          </div>
          <div className="intro-images" aria-label="Construction workers at work">
            <img className="intro-main-photo" src="/images/worker-hero.jpg" alt="Construction workers at a job site in India" />
            <img className="intro-small-photo" src="/images/worker-sunset.jpg" alt="Construction workers at sunset" loading="lazy" />
            <div className="intro-language-card"><span>◎</span><div><small>Speak naturally in</small><strong>{language.label} · {language.name}</strong></div></div>
            <p className="photo-credit">Photos: Pexels</p>
          </div>
        </section>

        <section className="voice-card callback-hero" aria-label="Sahaayi voice agent callback">
          <div className="voice-copy">
            <span className="small-pill"><span className="pulse-dot" />Voice agent callback · {language.name}</span>
            <h2>Let a Sahaayi call you.</h2>
            <p>Enter your number and our AI voice agent will call you in a few minutes. Explain your problem naturally — no forms first.</p>
            <button type="button" className="voice-callback-button" onClick={() => setCallbackOpen(true)}>Request a voice callback <span>→</span></button>
          </div>
          <div className="callback-agent-orb" aria-hidden="true"><span>☎</span><i /><b /></div>
          <div className="voice-foot">
            <span className="voice-start-label">A phone call in the language you choose</span>
            <span className="privacy-note">✦ Private, patient and simple</span>
          </div>
        </section>

        <section className="chat-spotlight" aria-label="Chat with Sahaayi AI">
          <div className="chat-spotlight-icon">✦</div>
          <div className="chat-spotlight-copy"><span className="chat-kicker">Sahaayi chatbot</span><h2>Prefer typing? Use the chatbot.</h2><p>Ask a question, get a simple answer, then take your next step.</p></div>
          <button type="button" onClick={() => setChatOpen(true)}>Open chatbot <span>→</span></button>
        </section>

        <section className="how-it-works" aria-labelledby="how-it-works-title">
          <div className="how-it-works-heading">
            <div><p className="eyebrow">How Sahaayi works</p><h2 id="how-it-works-title">One conversation. A clearer next step.</h2></div>
            <span className="how-it-works-badge">Made for migrant workers</span>
          </div>
          <div className="flow-steps">
            <article><span className="flow-number">01</span><span className="flow-icon">☎</span><h3>Speak or type</h3><p>Request a callback in your language, or use the chatbot when it is easier.</p></article>
            <article><span className="flow-number">02</span><span className="flow-icon">✦</span><h3>Sahaayi understands</h3><p>Explain the problem naturally. Sahaayi identifies what support, information or evidence may help.</p></article>
            <article><span className="flow-number">03</span><span className="flow-icon">↗</span><h3>Take the right next step</h3><p>Get a checklist, create a support request, or connect with the relevant service or support worker.</p></article>
          </div>
          <p className="how-it-works-note">Sahaayi helps you navigate existing support. It does not replace emergency, medical or legal services.</p>
        </section>

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

        <section className="trust-card" aria-labelledby="trust-card-title">
          <div className="trust-card-heading"><p className="eyebrow">Know what to expect</p><h2 id="trust-card-title">What Sahaayi can and cannot do</h2><p>Sahaayi makes existing support easier to understand and use. You stay in control of every next step.</p></div>
          <div className="trust-columns"><article><span className="trust-icon can">✓</span><div><h3>Sahaayi can help you</h3><ul><li>Understand a support path</li><li>Prepare a simple checklist</li><li>Connect with a relevant service or support worker</li></ul></div></article><article><span className="trust-icon cannot">!</span><div><h3>Sahaayi cannot</h3><ul><li>Decide benefit eligibility</li><li>Replace a doctor, lawyer or emergency service</li><li>Promise a government outcome</li></ul></div></article></div>
          <button type="button" className="trust-urgent-link" onClick={() => setResult(resultForIssue('injury'))}>Need urgent help now? <span>→</span></button>
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
          <div className="language-menu notranslate" translate="no">
            <button className="language-switch" type="button" onClick={() => setLanguageOpen((open) => !open)}><span className="language-icon">◎</span><span className="language-copy"><small>Language</small><strong>{language.label}<span className="hide-on-small"> · {language.name}</span></strong></span><span>⌄</span></button>
            {isLanguageOpen && <div className="language-popover">{languages.map((item) => <button type="button" key={item.name} onClick={() => changeLanguage(item)}><span>{item.label}</span>{item.name === language.name && <span>✓</span>}<small>{item.name}</small></button>)}</div>}
          </div>
          <button type="button" className="emergency-link" onClick={() => setResult(resultForIssue('injury'))}><span>✚</span><span className="hide-on-small">Urgent help</span></button>
        </div>
      </header>

      <div className="content-wrap">{renderPage()}</div>

      <footer className="site-footer">
        <div className="site-footer-inner"><div className="footer-brand"><span className="brand-mark">s</span><div><strong>Sahaayi</strong><small>A multilingual helper for workers in Kerala</small></div></div><div className="footer-note"><strong>Privacy</strong><p>How Sahaayi uses your number: only to request the callback you approve. Please do not share bank or identity numbers in chat.</p></div><div className="footer-note emergency"><strong>Not an emergency service</strong><p>For immediate danger or a serious medical emergency, seek urgent local help first.</p></div></div>
      </footer>

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
      {selectedCase && <CaseDetailSheet item={selectedCase} onClose={() => setSelectedCase(null)} onAskSahaayi={() => { setSelectedCase(null); setChatOpen(true) }} />}
      {showCaseSheet && <CaseSheet result={caseDraft} onClose={() => { setShowCaseSheet(false); setCaseDraft(null) }} onCreate={createCase} />}
      {isCallbackOpen && <CallbackSheet language={language.name} onClose={() => setCallbackOpen(false)} onSuccess={(message) => { setCallbackOpen(false); notify(message) }} />}
      {page !== 'dashboard' && <button type="button" className="chat-launcher" onClick={() => setChatOpen(true)} aria-label="Open Sahaayi chat"><span>✦</span><strong>Chat with Sahaayi</strong></button>}
      {isChatOpen && <Chatbot language={language.name} onClose={() => setChatOpen(false)} onRequestCallback={() => { setChatOpen(false); setCallbackOpen(true) }} />}
      {toast && <div className="toast" role="status">✓ {toast}</div>}
      <div id="sahaayi-google-translate" className="browser-translate-root" aria-hidden="true" />
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

function CaseDetailSheet({ item, onClose, onAskSahaayi }: { item: CaseItem; onClose: () => void; onAskSahaayi: () => void }) {
  const updates = item.status === 'Under review'
    ? ['Request received', 'Evidence summary prepared', 'Support worker review in progress']
    : ['Request received', 'Checklist prepared', 'Waiting for your identity document']

  return <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="help-sheet case-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="case-detail-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="sheet-handle" />
      <button className="close-button" type="button" onClick={onClose} aria-label="Close case">×</button>
      <div className={`result-icon ${item.issue}`}>{issueIcon(item.issue)}</div>
      <p className="eyebrow">{item.id} · {item.status}</p>
      <h2 id="case-detail-title">{item.title}</h2>
      <p className="result-summary">{item.nextAction}</p>
      <div className="case-timeline">{updates.map((update, index) => <div key={update}><span>{index === updates.length - 1 ? '●' : '✓'}</span><p>{update}</p></div>)}</div>
      <button type="button" className="primary-button" onClick={onAskSahaayi}>Ask Sahaayi about this case <span>→</span></button>
    </section>
  </div>
}

function CasesPage({ cases, onBack, onOpenHelp, onViewCase }: { cases: CaseItem[]; onBack: () => void; onOpenHelp: () => void; onViewCase: (item: CaseItem) => void }) {
  return <main className="inner-page">
    <button type="button" className="back-link" onClick={onBack}>← Home</button>
    <div className="page-heading"><div><p className="eyebrow">Your support</p><h1>My cases</h1><p className="subtle">You can always see what is happening next.</p></div><div className="case-count-large">{cases.length}<span>cases</span></div></div>
    <div className="case-list">
      {cases.map((item) => <article className="case-card" key={item.id}>
        <div className={`issue-symbol ${item.issue}`}>{issueIcon(item.issue)}</div>
        <div className="case-main"><div className="case-title-row"><h2>{item.title}</h2>{item.urgency && <span className="urgent-pill">{item.urgency}</span>}</div><p className="case-meta">{item.id} · {item.createdAt}</p><p className="case-next"><strong>Next:</strong> {item.nextAction}</p></div>
        <div className="case-side"><span className={`status-pill ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span><button type="button" onClick={() => onViewCase(item)}>View <span>→</span></button></div>
      </article>)}
    </div>
    <section className="need-more-card"><div><span className="help-dot">?</span><h2>Need help with something else?</h2><p>Tell Sahaayi in your own words. You do not need to choose the right department first.</p></div><button type="button" className="primary-button" onClick={onOpenHelp}>Ask Sahaayi <span>→</span></button></section>
  </main>
}

function DocumentsPage({ documents, onAttach }: { documents: DocumentItem[]; onAttach: (id: string, fileName: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [documentToAttach, setDocumentToAttach] = useState<DocumentItem | null>(null)

  const selectDocument = (document: DocumentItem) => {
    setDocumentToAttach(document)
    fileInput.current?.click()
  }

  const attachSelectedFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && documentToAttach) onAttach(documentToAttach.id, selectedFile.name)
    event.target.value = ''
  }

  return <main className="inner-page">
    <div className="page-heading"><div><p className="eyebrow">Keep things together</p><h1>My documents</h1><p className="subtle">Only share what is needed for your support request.</p></div></div>
    <div className="document-tip"><span>⌁</span><p><strong>Your documents stay yours.</strong> Sahaayi will always show you what you are sharing and why.</p></div>
    <input ref={fileInput} className="visually-hidden" type="file" accept="image/*,.pdf" onChange={attachSelectedFile} />
    <div className="document-list">{documents.map((document) => <article key={document.id} className="document-card"><span className="document-icon">{document.icon}</span><div><h2>{document.title}</h2><p>{document.detail}</p>{document.fileName && <small>{document.fileName}</small>}</div><button type="button" onClick={() => selectDocument(document)}>{document.status === 'Attached' || document.status === 'Ready' ? 'Replace' : document.status} <span>→</span></button></article>)}</div>
  </main>
}

function ProfilePage({ language, onOpenLanguage, onNotify }: { language: string; onOpenLanguage: () => void; onNotify: (message: string) => void }) {
  return <main className="inner-page profile-page">
    <div className="profile-hero"><div className="profile-avatar">☺</div><div><p className="eyebrow">Your space</p><h1>Welcome to Sahaayi</h1><p>Choose how you want Sahaayi to speak with you.</p></div></div>
    <div className="profile-settings"><button type="button" onClick={onOpenLanguage}><span><strong>Language</strong><small>Currently speaking in {language}</small></span><span>›</span></button><button type="button" onClick={() => onNotify('Privacy setting: support workers only see information you send for a request.')}><span><strong>Privacy and sharing</strong><small>Share only when you approve</small></span><span>›</span></button><button type="button" onClick={() => onNotify('Sahaayi guides you to official services, NGOs and support workers.')}><span><strong>About Sahaayi</strong><small>How this helper connects you to support</small></span><span>›</span></button></div>
    <p className="profile-footer">Sahaayi is a support navigator. Always seek urgent medical or emergency help when you are in immediate danger.</p>
  </main>
}

function Dashboard({ cases, onExit, onOpenCase }: { cases: CaseItem[]; onExit: () => void; onOpenCase: (item: CaseItem) => void }) {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'unassigned'>('all')
  const queue: CaseItem[] = [
    ...cases,
    { id: 'SHY-2419', title: 'Workplace injury support · cut at worksite', issue: 'injury', createdAt: '9 min ago · Hindi', status: 'Under review', nextAction: 'Route to public hospital and safety support', urgency: 'Urgent' },
    { id: 'SHY-2414', title: 'Hospital navigation · Kochi', issue: 'hospital', createdAt: '22 min ago · Bengali', status: 'Awaiting you', nextAction: 'Confirm nearest verified centre' },
    { id: 'SHY-2405', title: 'Missing passport support', issue: 'documents', createdAt: '48 min ago · Odia', status: 'Under review', nextAction: 'Document safety review' },
  ]
  const visibleQueue = queue.filter((item) => filter === 'all' || (filter === 'urgent' ? Boolean(item.urgency) : item.status === 'Awaiting you'))
  const urgent = queue.filter((item) => item.urgency).length
  return <main className="dashboard-page">
    <aside className="dashboard-nav"><button type="button" className="brand"><span className="brand-mark">s</span><span>Sahaayi</span></button><p className="dashboard-role">Support workspace</p><button className="dashboard-nav-item selected" type="button">◫ Case inbox <span>{queue.length}</span></button><button className="dashboard-nav-item" type="button">✦ My assignments</button><button className="dashboard-nav-item" type="button">⌁ Service directory</button><button className="dashboard-nav-item" type="button">▥ Insights</button><button className="exit-dashboard" type="button" onClick={onExit}>← Worker app</button></aside>
    <section className="dashboard-main"><header className="dashboard-header"><div><p className="eyebrow">Caseworker dashboard</p><h1>Good morning, Anjali.</h1></div><div className="dashboard-header-actions"><button type="button">⌕ Search</button><span className="agent-avatar">A</span></div></header>
      <section className="metrics"><article><span className="metric-icon blue">◫</span><div><strong>{queue.length}</strong><p>New cases</p></div><span className="metric-change">+3 today</span></article><article><span className="metric-icon danger">✚</span><div><strong>{urgent}</strong><p>Urgent review</p></div><span className="metric-change danger-text">Needs attention</span></article><article><span className="metric-icon mint">✓</span><div><strong>18</strong><p>Resolved this week</p></div><span className="metric-change">+24%</span></article></section>
      <section className="inbox-heading"><div><h2>Incoming cases</h2><p>AI-generated summaries must be reviewed before action.</p></div><div className="filters"><button type="button" className={filter === 'all' ? 'filter-active' : ''} onClick={() => setFilter('all')}>All cases</button><button type="button" className={filter === 'urgent' ? 'filter-active' : ''} onClick={() => setFilter('urgent')}>Urgent</button><button type="button" className={filter === 'unassigned' ? 'filter-active' : ''} onClick={() => setFilter('unassigned')}>Needs worker reply</button></div></section>
      <section className="case-table"><div className="table-head"><span>Worker request</span><span>Language</span><span>Urgency</span><span>Recommended path</span><span /></div>
        {visibleQueue.map((item, index) => <article className="table-row" key={`${item.id}-${index}`}><div className="table-request"><span className={`issue-symbol small ${item.issue}`}>{issueIcon(item.issue)}</span><div><strong>{item.title}</strong><small>{item.id} · {item.createdAt}</small></div></div><span>{item.createdAt.includes('Hindi') ? 'Hindi' : item.createdAt.includes('Odia') ? 'Odia' : 'Bengali'}</span><span>{item.urgency ? <span className="urgent-pill">Urgent</span> : <span className="review-pill">Review</span>}</span><span className="path-text">{item.nextAction}</span><button type="button" className="open-case" onClick={() => onOpenCase(item)}>Open <span>→</span></button></article>)}
      </section>
    </section>
  </main>
}

export default App
