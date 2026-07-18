export const browserLanguageCodes: Record<string, string> = {
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

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (options: Record<string, unknown>, elementId: string) => unknown
      }
    }
    sahaayiGoogleTranslateInit?: () => void
  }
}

let translatorPromise: Promise<void> | undefined
let translatorReady = false

function setGoogleTranslationCookie(value: string) {
  document.cookie = `googtrans=${value}; path=/; max-age=31536000; SameSite=Lax`
}

function clearGoogleTranslationCookie() {
  document.cookie = 'googtrans=; path=/; max-age=0; SameSite=Lax'
}

function ensureGoogleTranslateElement() {
  if (translatorReady || document.querySelector('.goog-te-combo')) {
    translatorReady = true
    return Promise.resolve()
  }

  if (translatorPromise) return translatorPromise

  translatorPromise = new Promise((resolve, reject) => {
    window.sahaayiGoogleTranslateInit = () => {
      try {
        if (!translatorReady && window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: Object.values(browserLanguageCodes).join(','),
              autoDisplay: false,
            },
            'sahaayi-google-translate',
          )
          translatorReady = true
        }
        resolve()
      } catch (error) {
        reject(error)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://translate.google.com/translate_a/element.js?cb=sahaayiGoogleTranslateInit'
    script.async = true
    script.onerror = () => reject(new Error('Browser translation could not be loaded.'))
    document.head.appendChild(script)
  })

  return translatorPromise
}

/**
 * Uses Google Translate's browser widget from the client. No app secret is sent
 * or required; translation is performed by the browser widget's service.
 */
export async function setBrowserPageLanguage(languageName: string) {
  const targetLanguage = browserLanguageCodes[languageName] ?? 'en'

  if (targetLanguage === 'en') {
    clearGoogleTranslationCookie()
    // Google Translate cannot reliably restore changed DOM nodes in-place.
    // Reloading gives React its original English markup back.
    window.location.reload()
    return
  }

  setGoogleTranslationCookie(`/en/${targetLanguage}`)
  await ensureGoogleTranslateElement()

  const selector = document.querySelector<HTMLSelectElement>('.goog-te-combo')
  if (!selector) throw new Error('Browser translation control was not created.')

  selector.value = targetLanguage
  selector.dispatchEvent(new Event('change', { bubbles: true }))
}
