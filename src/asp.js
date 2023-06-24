import * as jose from 'jose'
import { computeJwkFingerprint, keyToJwk } from './crypto'

/**
 * @function
 * @param {string} domain
 * @param {string} fingerprint
 * @returns {string}
 */
export class AspProfile {
  constructor () {
    /** @type {string} */
    this.name = ''
    /** @type {string} */
    this.description = ''
    /** @type {string[]} */
    this.claims = []
    /** @type {string} */
    this.color = ''
  }
}

/**
 * @function
 * @param {string} domain
 * @param {string} fingerprint
 * @returns {string}
 */
export function generateAspeUri (domain, fingerprint) {
  return `aspe:${domain}:${fingerprint}`
}

/**
 * @function
 * @param {AspProfile} profile
 * @param {jose.GenerateKeyPairResult<jose.KeyLike>} keypair
 * @returns {Promise<string>}
 */
export async function generateProfileJws (profile, keypair) {
  const jwk = await keyToJwk(keypair.publicKey)

  const profileJson = {
    'http://ariadne.id/version': 0,
    'http://ariadne.id/type': 'profile',
    'http://ariadne.id/name': profile.name || '',
    'http://ariadne.id/claims': JSON.stringify(profile.claims.filter(x => x.length > 0)) || ''
  }
  if (profile.description.length > 0) {
    profileJson['http://ariadne.id/description'] = profile.description
  }
  if (profile.color.length === 7) {
    profileJson['http://ariadne.id/color'] = profile.color
  }

  const jwt = await new jose.SignJWT(profileJson)
    .setProtectedHeader({
      typ: 'JWT',
      alg: 'ES256',
      kid: await computeJwkFingerprint(jwk),
      jwk
    })
    .sign(keypair.privateKey)

  return jwt
}

/**
 * @function
 * @param {AspProfile} profile
 * @param {jose.GenerateKeyPairResult<jose.KeyLike>} keypair
 * @param {string} action
 * @returns {Promise<string>}
 */
export async function generateRequestJws (profile, keypair, action) {
  const jwk = await keyToJwk(keypair.publicKey)

  const jwt = await new jose.SignJWT({
    'http://ariadne.id/version': 0,
    'http://ariadne.id/type': 'request',
    'http://ariadne.id/action': action,
    'http://ariadne.id/profile_jws': await generateProfileJws(profile, keypair)
  })
    .setIssuedAt()
    .setProtectedHeader({
      typ: 'JWT',
      alg: 'ES256',
      kid: await computeJwkFingerprint(jwk),
      jwk
    })
    .sign(keypair.privateKey)

  return jwt
}

/**
 * @function
 * @param {string} profileJws
 * @param {string} fingerprint
 * @param {jose.KeyLike} publicKey
 * @returns {Promise<AspProfile>}
 */
export async function extractProfileJws (profileJws, fingerprint, publicKey) {
  const { payload, protectedHeader } = await jose.compactVerify(profileJws, publicKey)

  if (protectedHeader.typ !== 'JWT') {
    throw new Error('Wrong JWK typ')
  }
  if (protectedHeader.alg !== 'ES256') {
    throw new Error('Wrong JWK alg')
  }
  if (protectedHeader.kid !== fingerprint) {
    throw new Error('Wrong JWK fingerprint')
  }

  const payloadJson = JSON.parse(new TextDecoder().decode(payload))

  if (payloadJson['http://ariadne.id/version'] > 0) {
    throw new Error('Unsupported ASP version')
  }
  if (payloadJson['http://ariadne.id/type'] !== 'profile') {
    throw new Error('JWS is not a profile')
  }

  const profile = new AspProfile()
  profile.name = payloadJson['http://ariadne.id/name'] || ''
  profile.description = payloadJson['http://ariadne.id/description'] || ''
  profile.color = payloadJson['http://ariadne.id/color'] || ''
  if (payloadJson['http://ariadne.id/claims'].length > 0) {
    profile.claims = JSON.parse(payloadJson['http://ariadne.id/claims']) || ''
  }

  return profile
}

/**
 * @function
 * @param {string} fingerprint
 * @param {string} domain
 * @returns {Promise<string>}
 */
export async function getProfile (fingerprint, domain) {
  const res = await fetch(`https://${domain}/.well-known/aspe/id/${fingerprint}`, {
    method: 'GET',
    headers: {
      Accept: 'application/jose; charset=UTF-8'
    }
  })

  if (res.status === 404) {
    throw new Error('ASP not found')
  }

  if (res.status >= 400) {
    throw new Error('ASPE error')
  }

  return await res.text()
}

/**
 * @function
 * @param {AspProfile} profile
 * @param {jose.GenerateKeyPairResult<jose.KeyLike>} keypair
 * @param {string} action
 * @param {string} domain
 * @returns {Promise<boolean>}
 */
export async function uploadProfile (profile, keypair, action, domain) {
  const requestJws = await generateRequestJws(profile, keypair, action)

  const res = await fetch(`https://${domain}/.well-known/aspe/post`, {
    method: 'POST',
    body: requestJws,
    headers: {
      'Content-Type': 'application/jose; charset=UTF-8'
    }
  })

  if (res.status >= 400) {
    return false
  }

  return true
}
