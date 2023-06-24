import * as jose from 'jose'
import { sha512 } from 'hash-wasm'
import { base32 } from 'rfc4648'
import { Buffer } from 'buffer'

/**
 * @function
 * @returns {Promise<jose.GenerateKeyPairResult<jose.KeyLike>>}
 */
export async function generateKey () {
  return await jose.generateKeyPair('ES256', { extractable: true })
}

/**
 * @function
 * @param {string} encodedKeyStr
 * @returns {Promise<jose.KeyLike>}
 */
export async function importKey (encodedKeyStr) {
  /** @type {string} */
  // @ts-ignore
  const encodedKeyBinary = atob(encodedKeyStr)

  const bytes = new Uint8Array(encodedKeyBinary.length)
  for (let i = 0; i < encodedKeyBinary.length; i++) {
    bytes[i] = encodedKeyBinary.charCodeAt(i)
  }
  /** @type {ArrayBuffer} */
  const encodedKeyBuffer = bytes.buffer

  return await crypto.subtle.importKey('pkcs8', encodedKeyBuffer, {
    name: 'ECDSA',
    namedCurve: 'P-256'
  }, true, ['sign'])
}

/**
 * @function
 * @param {jose.KeyLike} privateKey
 * @returns {Promise<string>}
 */
export async function exportKey (privateKey) {
  /** @type {ArrayBuffer} */
  // @ts-ignore
  const exportedSecretKey = await crypto.subtle.exportKey('pkcs8', privateKey)
  return btoa(String.fromCharCode.apply(null, new Uint8Array(exportedSecretKey)))
}

/**
 * @function
 * @param {jose.KeyLike} privateKey
 * @returns {Promise<jose.JWK>}
 */
export async function keyToJwk (privateKey) {
  return await jose.exportJWK(privateKey)
}

/**
 * @function
 * @param {CryptoKey} privateKey
 * @returns {Promise<jose.KeyLike>}
 */
export async function privateKeyToPublicKey (privateKey) {
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', privateKey)
  delete privateKeyJwk.d
  privateKeyJwk.key_ops = ['verify']
  return crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify'])
}

/**
 * @function
 * @param {jose.JWK} key
 * @returns {Promise<string>}
 */
export async function computeJwkFingerprint (key) {
  const keyStr = key.x
  const keyBytes = Buffer.from(keyStr, 'base64')
  const keyHash = await sha512(keyBytes)
  const keyHashBytes = hexToBytes(keyHash).slice(0, 16)
  const fingerprint = base32.stringify(keyHashBytes, { pad: false })
  return fingerprint
}

/**
 * @function
 * @param {string} hex
 * @returns {number[]}
 */
function hexToBytes (hex) {
  const bytes = []
  for (let c = 0; c < hex.length; c += 2) { bytes.push(parseInt(hex.substr(c, 2), 16)) }
  return bytes
}
