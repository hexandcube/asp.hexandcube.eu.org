import './styles.css'
import { argon2id } from 'hash-wasm'
import * as crypt from './crypto.js'
import * as asp from './asp.js'
import * as ui from './ui.js'

/** @type {string} */
const buildVersion = '__buildVersion__'
/** @type {string} */
const defaultDomain = '__configDefaultDomain__'

// @ts-ignore
/** @type {jose.GenerateKeyPairResult<jose.KeyLike>} */
let keypair
/** @type {string} */
let domain
/** @type {string} */
let aspeUri
/** @type {asp.AspProfile} */
let profile
/** @type {string} */
let requestAction = 'create'
/** @type {number} */
let timeoutId = NaN

const main = async () => {
  ui.fillInTemplates('build_version', buildVersion)
  ui.fillInTemplates('default_domain', defaultDomain)
  ui.initTranslations()
  ui.applyTranslations()
}

/**
 * @function
 * @param {string} aspeUri
 */
const updateProofs = async (aspeUri) => {
  ui.fillInTemplates('direct_proof', aspeUri)

  const salt = new Uint8Array(16)
  window.crypto.getRandomValues(salt)
  const key = await argon2id({
    password: aspeUri.toUpperCase(),
    salt,
    parallelism: 1,
    iterations: 256,
    memorySize: 512,
    hashLength: 32,
    outputType: 'encoded'
  })

  ui.fillInTemplates('hashed_proof', key)
}

/**
 * @function
 * @param {string} message
 * @param {string} [state]
 */
const giveFeedback = (message, state) => {
  if (!Number.isNaN(timeoutId)) {
    clearTimeout(timeoutId)
  }
  ui.formFeedback(message, state)
  timeoutId = removeFeedback()
}

/**
 * @function
 * @returns {number}
 */
const removeFeedback = () => {
  // @ts-ignore
  return setTimeout(() => {
    ui.formFeedback('', 'idle')
  }, 5000)
}

document.querySelector('#form_load_profile').addEventListener('submit', async evt => {
  evt.preventDefault()

  // @ts-ignore
  domain = document.querySelector('#input_server').value

  /** @type {string} */
  // @ts-ignore
  const encodedKeyStr = document.querySelector('#input_secretkey').value

  const privateKey = await crypt.importKey(encodedKeyStr)
  // @ts-ignore
  const publicKey = await crypt.privateKeyToPublicKey(privateKey)

  keypair = {
    privateKey,
    publicKey
  }

  const jwkKey = await crypt.keyToJwk(keypair.privateKey)
  const fingerprint = await crypt.computeJwkFingerprint(jwkKey)
  aspeUri = asp.generateAspeUri(domain, fingerprint)

  const profileJwsStr = await asp.getProfile(fingerprint, domain)

  const profile = await asp.extractProfileJws(profileJwsStr, fingerprint, keypair.publicKey)
  ui.fillInTemplates('fingerprint', fingerprint)
  ui.fillInTemplates('aspe_uri', aspeUri)
  ui.putProfileToForm(profile)
  updateProofs(aspeUri)
  requestAction = 'update'

  ui.showPanel('edit_profile')
})

document.querySelector('#btn_create_profile').addEventListener('click', async evt => {
  evt.preventDefault()

  // @ts-ignore
  domain = document.querySelector('#input_server').value

  keypair = await crypt.generateKey()
  const jwkKey = await crypt.keyToJwk(keypair.privateKey)
  const fingerprint = await crypt.computeJwkFingerprint(jwkKey)
  aspeUri = asp.generateAspeUri(domain, fingerprint)

  profile = new asp.AspProfile()

  ui.fillInTemplates('fingerprint', fingerprint)
  ui.fillInTemplates('aspe_uri', aspeUri)
  updateProofs(aspeUri)
  ui.putProfileToForm(profile)
  ui.showPanel('edit_profile')
})

document.querySelector('#btn_reveal_secret_key').addEventListener('click', async evt => {
  evt.preventDefault()

  ui.fillInTemplates('secret_key', await crypt.exportKey(keypair.privateKey))

  document.querySelectorAll('[data-template="secret_key"]').forEach(el => {
    el.classList.remove('important_data--hidden')
  })

  // @ts-ignore
  evt.target.remove()
})

document.querySelector('#btn_generate_proofs').addEventListener('click', async evt => {
  updateProofs(aspeUri)
})

document.querySelector('#btn_add_claim').addEventListener('click', async evt => {
  evt.preventDefault()

  // @ts-ignore
  const claimTarget = document.querySelector('#input_service_provider').value

  switch (claimTarget) {
    case 'manual':
      profile = ui.getProfileFromForm()
      profile.claims.push('')
      ui.putProfileToForm(profile)
      break

    default:
      // @ts-ignore
      document.querySelector(`#add_claim_${claimTarget}`).showModal()
      break
  }
})

document.querySelector('#form_edit_profile').addEventListener('submit', async evt => {
  evt.preventDefault()

  profile = ui.getProfileFromForm()
  if (profile.name.length === 0) {
    giveFeedback('Please enter a name', 'warning')
    return
  }

  const res = await asp.uploadProfile(profile, keypair, requestAction, domain)
  if (res) {
    requestAction = 'update'
    giveFeedback('Upload successful!', 'success')
  } else {
    giveFeedback('Upload failed', 'failure')
  }
})

document.querySelector('#container_identity_claim_inputs').addEventListener('click', evt => {
  /** @type {HTMLButtonElement} */
  // @ts-ignore
  const target = evt.target

  // @ts-ignore
  if (target.classList.contains('btn_remove_claim')) {
    profile = ui.getProfileFromForm()
    profile.claims.splice(parseInt(target.dataset.index), 1)
    ui.putProfileToForm(profile)
  }
})

document.querySelector('#input_i18n').addEventListener('change', evt => {
  // @ts-ignore
  ui.applyTranslations(evt.target.value)
})

document.querySelectorAll('.close_dialog').forEach(el => {
  el.addEventListener('click', _ => {
    // @ts-ignore
    document.querySelector('dialog[open]').close()
  })
})

// ----- CLAIM DIALOGS-----//

document.querySelector('#add_claim_mastodon form').addEventListener('submit', evt => {
  const el = document.querySelector('#add_claim_mastodon form')

  /** @type {string} */
  // @ts-ignore
  const input = el.querySelector('input.identifier').value
  const matches = input.match(/@(.*)@(.*)/)

  if (!(matches && matches.length < 2)) {
    evt.preventDefault()
  }

  profile = ui.getProfileFromForm()
  profile.claims.push(`https://${matches[2]}/@${matches[1]}`)
  ui.putProfileToForm(profile)

  // @ts-ignore
  document.querySelector('dialog[open]').close()
})

document.querySelector('#add_claim_pixelfed form').addEventListener('submit', evt => {
  const el = document.querySelector('#add_claim_pixelfed form')

  /** @type {string} */
  // @ts-ignore
  const input = el.querySelector('input.identifier').value
  const matches = input.match(/@(.*)@(.*)/)

  if (!(matches && matches.length < 2)) {
    evt.preventDefault()
  }

  profile = ui.getProfileFromForm()
  profile.claims.push(`https://${matches[2]}/@${matches[1]}`)
  ui.putProfileToForm(profile)

  // @ts-ignore
  document.querySelector('dialog[open]').close()
})

document.querySelector('#add_claim_dns form').addEventListener('submit', evt => {
  const el = document.querySelector('#add_claim_dns form')

  /** @type {string} */
  // @ts-ignore
  const input = el.querySelector('input.domain').value

  profile = ui.getProfileFromForm()
  profile.claims.push(`dns:${input}?type=TXT`)
  ui.putProfileToForm(profile)

  // @ts-ignore
  document.querySelector('dialog[open]').close()
})

document.querySelector('#add_claim_forgejo form').addEventListener('submit', evt => {
  const el = document.querySelector('#add_claim_forgejo form')

  /** @type {string} */
  // @ts-ignore
  const inputDomain = el.querySelector('input.domain').value
  /** @type {string} */
  // @ts-ignore
  const inputUsername = el.querySelector('input.username').value
  /** @type {string} */
  // @ts-ignore
  const inputRepo = el.querySelector('input.repo').value

  profile = ui.getProfileFromForm()
  profile.claims.push(`https://${inputDomain}/${inputUsername}/${inputRepo}`)
  ui.putProfileToForm(profile)

  // @ts-ignore
  document.querySelector('dialog[open]').close()
})

main()
