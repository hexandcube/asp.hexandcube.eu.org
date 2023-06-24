import { AspProfile } from './asp'
import i18next from 'i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

/**
 * @function
 */
export function initTranslations () {
  i18next
    .use(Backend)
    .use(LanguageDetector)
    .init({
      fallbackLng: 'en',
      debug: false,
      backend: {
        loadPath: './locales/{{lng}}.json'
      }
    }).then(_ => {
      // @ts-ignore
      document.querySelector('#input_i18n').value = i18next.language
    })
}
/**
 * @function
 * @param {string} [lng]
 */
export function applyTranslations (lng) {
  i18next
    .changeLanguage(lng || i18next.language)
    .then(t => {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        // @ts-ignore
        el.innerHTML = i18next.t(el.dataset.i18n)
      })
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        // @ts-ignore
        el.placeholder = i18next.t(el.dataset.i18nPlaceholder)
      })
    })
}

/**
 * @function
 * @param {string} panelName
 */
export function showPanel (panelName) {
  document.querySelectorAll('section.panel').forEach(panel => {
    panel.classList.remove('panel--visible')
  })
  document.querySelector(`#${panelName}`).classList.add('panel--visible')
}

/**
 * @function
 * @param {string} message
 * @param {string} [state]
 */
export function formFeedback (message, state) {
  if (message.length === 0) {
    // @ts-ignore
    document.querySelector('#form_edit_profile output').dataset.state = 'idle'
    document.querySelector('#form_edit_profile button[type="submit"]').removeAttribute('disabled')
    document.querySelector('#form_edit_profile output').innerHTML = ''
  } else {
    // @ts-ignore
    document.querySelector('#form_edit_profile output').dataset.state = state
    document.querySelector('#form_edit_profile output').innerHTML = message
  }

  if (state === 'success') {
    document.querySelector('#form_edit_profile button[type="submit"]').setAttribute('disabled', 'disabled')
  }
}

/**
 * @function
 * @param {string} id
 * @param {string} value
 */
export function fillInTemplates (id, value) {
  document.querySelectorAll(`[data-template="${id}"]`).forEach(el => {
    switch (el.nodeName) {
      case 'INPUT':
        // @ts-ignore
        if (el.value === '') {
          // @ts-ignore
          el.value = value
        }
        break;
    
      default:
        el.innerHTML = value
        break;
    }
  })
}

/**
 * @function
 * @param {AspProfile} profile
 */
export function putProfileToForm (profile) {
  // @ts-ignore
  document.querySelector('#input_profile_name').value = profile.name || ''
  // @ts-ignore
  document.querySelector('#input_profile_description').value = profile.description || ''
  // @ts-ignore
  document.querySelector('#input_profile_color').value = profile.color || ''

  document.querySelector('#container_identity_claim_inputs').innerHTML = ''
  if (profile.claims) {
    profile.claims.forEach((claim, i) => {
      document.querySelector('#container_identity_claim_inputs').innerHTML += `<p>
    <div class="input_button">
        <input type="text" placeholder="Identity claim" data-index="${i}" value="${claim}">
        <button type="button" data-index="${i}" class="btn_remove_claim">Remove</button>
    </div>
<p>
`
    })
  }
}

/**
 * @function
 * @returns {AspProfile}
 */
export function getProfileFromForm () {
  const profile = new AspProfile()

  // @ts-ignore
  profile.name = document.querySelector('#input_profile_name').value || ''
  // @ts-ignore
  profile.description = document.querySelector('#input_profile_description').value || ''
  // @ts-ignore
  profile.color = document.querySelector('#input_profile_color').value || ''

  document.querySelectorAll('#container_identity_claim_inputs input').forEach(input => {
    // @ts-ignore
    profile.claims.push(input.value || '')
  })

  return profile
}
