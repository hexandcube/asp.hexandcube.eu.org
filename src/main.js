import './styles.css'
import { argon2id } from 'hash-wasm'
import * as crypt from './crypto.js'
import * as asp from './asp.js'
import * as ui from './ui.js'
import i18next from 'i18next'

/** @type {string} */
const buildVersion = '__buildVersion__'
/** @type {string} */
const defaultDomain = '__configDefaultDomain__'

// @ts-ignore
/** @type {string} */
let encryptedKey
/** @type {string} */
let domain
/** @type {string} */
let aspeUri
/** @type {string} */
let fingerprint
/** @type {asp.AspProfile} */
let profile
/** @type {string} */
let requestAction = 'create'

/**
 * @readonly
 * @enum {string}
 */
const ExportMethod = {
  Upload: 'upload',
  Plaintext: 'plaintext'
}

const main = async () => {
  ui.fillInTemplates('build_version', buildVersion)
  ui.fillInTemplates('default_domain', defaultDomain)
  ui.initTranslations()
  ui.applyTranslations()

  if (typeof WebAssembly === 'undefined') {
    document.querySelector('#warning_wasm_support').classList.remove('hidden')
  }
}

// ----- HELPER FUNCTIONS -----//

/**
 * @function
 * @param {string} aspeUri
 */
const updateProofs = async (aspeUri) => {
  ui.fillInTemplates('direct_proof', aspeUri)

  const salt = new Uint8Array(16)
  window.crypto.getRandomValues(salt)
  const key = await argon2id({
    password: aspeUri.toLowerCase(),
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
 * @param {ExportMethod} method
 */
const uploadOrExportProfile = async method => {
  profile = ui.getProfileFromForm()

  const password = await ui.askUserForPassword().catch(_ => {
    return ''
  })
  if (password.length === 0) {
    return
  }
  const keypair = await crypt.importKey(encryptedKey, password)

  if (profile.name.length === 0) {
    ui.giveFeedback(i18next.t('edit_profile_feedback_missing_name'), 'warning')
    return
  }

  let jws, res

  switch (method) {
    case ExportMethod.Plaintext:
      jws = await asp.generateProfileJws(profile, keypair)

      document.querySelector('#export_profile p').innerHTML = `${i18next.t('edit_profile_export_dialog_profile')}
        <br>
        <span class="important_data">${jws}</span>
        <br>
        ${i18next.t('edit_profile_export_dialog_upload')}
        <br>
        <span class="important_data">https://${domain}/.well-known/aspe/id/${fingerprint}</span>`

      // @ts-ignore
      document.querySelector('#export_profile').showModal()
      break

    case ExportMethod.Upload:
      res = await asp.uploadProfile(profile, keypair, requestAction, domain)

      if (res) {
        requestAction = 'update'
        ui.giveFeedback(i18next.t('edit_profile_feedback_upload_successful'), 'success')
      } else {
        ui.giveFeedback(i18next.t('edit_profile_feedback_upload_failed'), 'failure')
      }
      break

    default:
      ui.giveFeedback('Error: not able to export', 'failure')
      break
  }
}

// ----- EVENT LISTENERS -----//

document.querySelector('#form_load_profile').addEventListener('submit', async evt => {
  evt.preventDefault()

  // @ts-ignore
  domain = document.querySelector('#input_server').value

  // @ts-ignore
  encryptedKey = document.querySelector('#input_secretkey').value

  const password = await ui.askUserForPassword().catch(_ => {
    return ''
  })
  if (password.length === 0) {
    return
  }
  const keypair = await crypt.importKey(encryptedKey, password)

  const jwkKey = await crypt.keyToJwk(keypair.privateKey)
  fingerprint = await crypt.computeJwkFingerprint(jwkKey)
  aspeUri = asp.generateAspeUri(domain, fingerprint)

  const profileJwsStr = await asp.getProfile(fingerprint, domain)

  const profile = await asp.extractProfileJws(profileJwsStr, fingerprint, keypair.publicKey)
  ui.fillInTemplates('secret_key', encryptedKey)
  ui.fillInTemplates('fingerprint', fingerprint)
  ui.fillInTemplates('aspe_uri', aspeUri)
  ui.putProfileToForm(profile)
  updateProofs(aspeUri)
  requestAction = 'update'

  ui.showPanel('edit_profile')
})

document.querySelector('#btn_create_profile').addEventListener('click', async _ => {
  const password = await ui.askUserForNewPassword().catch(_ => {
    return ''
  })
  if (password.length === 0) {
    return
  }

  // @ts-ignore
  domain = document.querySelector('#input_server').value

  const keypair = await crypt.generateKey()
  encryptedKey = await crypt.exportKey(keypair.privateKey, password)

  const jwkKey = await crypt.keyToJwk(keypair.privateKey)
  fingerprint = await crypt.computeJwkFingerprint(jwkKey)
  aspeUri = asp.generateAspeUri(domain, fingerprint)

  profile = new asp.AspProfile()

  ui.fillInTemplates('secret_key', encryptedKey)
  ui.fillInTemplates('fingerprint', fingerprint)
  ui.fillInTemplates('aspe_uri', aspeUri)
  updateProofs(aspeUri)
  ui.putProfileToForm(profile)
  ui.showPanel('edit_profile')
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

  uploadOrExportProfile(ExportMethod.Upload)
})

document.querySelector('#btn_export_profile').addEventListener('click', async evt => {
  uploadOrExportProfile(ExportMethod.Plaintext)
})

document.querySelector('#btn_delete_profile').addEventListener('click', async evt => {
  // @ts-ignore
  document.querySelector('#delete_profile').showModal()
})

document.querySelector('#delete_profile form').addEventListener('submit', async evt => {
  const password = await ui.askUserForPassword().catch(_ => {
    return ''
  })
  if (password.length === 0) {
    return
  }
  const keypair = await crypt.importKey(encryptedKey, password)

  const res = await asp.uploadProfile(profile, keypair, 'delete', domain)
  if (res) {
    ui.giveFeedback(i18next.t('edit_profile_feedback_deletion_successful'), 'success')
  } else {
    ui.giveFeedback(i18next.t('edit_profile_feedback_deletion_failed'), 'failure')
  }

  // @ts-ignore
  document.querySelector('dialog[open]').close()
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

// ----- CLAIM DIALOGS -----//

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
