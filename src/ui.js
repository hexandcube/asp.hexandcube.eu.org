import { AspProfile } from './asp'
import i18next from 'i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

/** @type {number} */
let timeoutId = NaN

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
 * @param {string} [formId]
 * @param {number} [timeout]
 */
export function giveFeedback (message, state, formId, timeout) {
  if (!Number.isNaN(timeoutId)) {
    clearTimeout(timeoutId)
  }
  formFeedback(message, state, formId)
  timeoutId = removeFeedback(formId, timeout)
}

/**
 * @function
 * @param {string} [formId]
 * @param {number} [timeout]
 * @returns {number}
 */
export function removeFeedback (formId, timeout) {
  // @ts-ignore
  return setTimeout(() => {
    formFeedback('', 'idle', formId)
  }, timeout || 5000)
}

/**
 * @function
 * @param {string} message
 * @param {string} [state]
 * @param {string} [formId]
 */
export function formFeedback (message, state, formId) {
  formId ||= 'form_edit_profile'

  if (message.length === 0) {
    // @ts-ignore
    document.querySelector(`#${formId} output`).dataset.state = 'idle'
    document.querySelector(`#${formId} button[type="submit"]`).removeAttribute('disabled')
    document.querySelector(`#${formId} output`).innerHTML = ''
  } else {
    // @ts-ignore
    document.querySelector(`#${formId} output`).dataset.state = state
    document.querySelector(`#${formId} output`).innerHTML = message
  }

  if (state === 'success') {
    document.querySelector(`#${formId} button[type="submit"]`).setAttribute('disabled', 'disabled')
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
        break

      default:
        el.innerHTML = value
        break
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
        <input type="text" data-i18n-placeholder="general_txt_identity_claim" placeholder="${i18next.t('general_txt_identity_claim')}" data-index="${i}" value="${claim}">
        <button type="button" data-index="${i}" class="btn_remove_claim" data-i18n="general_txt_remove">${i18next.t('general_txt_remove')}</button>
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

/**
 * @function
 * @returns {Promise<string>}
 */
export async function askUserForNewPassword () {
  const elDialog = document.querySelector('#input_new_password')
  return new Promise((resolve, reject) => {
    // @ts-ignore
    elDialog.addEventListener('close', () => {
      reject(Error('Dialog closed'))
    })

    elDialog.querySelector('form').addEventListener('submit', async evt => {
      evt.preventDefault()

      // @ts-ignore
      const password1 = evt.target.querySelector('[name="password1"]').value
      // @ts-ignore
      const password2 = evt.target.querySelector('[name="password2"]').value

      if (password1 !== password2) {
        giveFeedback('Passwords are not the same!', 'failure', 'input_new_password')
        return
      }

      // @ts-ignore
      elDialog.close()

      resolve(password1)
    })

    // @ts-ignore
    elDialog.showModal()
  })
}

/**
 * @function
 * @returns {Promise<string>}
 */
export async function askUserForPassword () {
  const elDialog = document.querySelector('#input_password')
  return new Promise((resolve, reject) => {
    // @ts-ignore
    elDialog.addEventListener('close', () => {
      reject(Error('Dialog closed'))
    })

    elDialog.querySelector('form').addEventListener('submit', async evt => {
      evt.preventDefault()

      // @ts-ignore
      const password = evt.target.querySelector('[name="password"]').value

      // @ts-ignore
      elDialog.close()

      resolve(password)
    })

    // @ts-ignore
    elDialog.showModal()
  })
}
