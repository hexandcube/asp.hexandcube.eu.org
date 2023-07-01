import { scrypt } from 'hash-wasm'
import * as jose from 'jose'
import { base32, base64, base64url } from 'rfc4648'

/** @type {number} */
const SCRYPT_N = 16384
/** @type {number} */
const SCRYPT_R = 8
/** @type {number} */
const SCRYPT_P = 1

/**
 * @function
 * @returns {Promise<jose.GenerateKeyPairResult<jose.KeyLike>>}
 */
export async function generateKey () {
  return await jose.generateKeyPair('ES256', { extractable: true })
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
  const thumbprint = await jose.calculateJwkThumbprint(key, 'sha512')
  const fingerprintBytes = base64url.parse(thumbprint, { loose: true }).slice(0, 16)
  const fingerprint = base32.stringify(fingerprintBytes, { pad: false })

  return fingerprint
}

/**
 * @function
 * @param {string} encryptedKey
 * @param {string} [password]
 * @returns {Promise<jose.GenerateKeyPairResult<jose.KeyLike>>}
 */
export async function importKey (encryptedKey, password) {
  let encodedKeyStr, encodedKeyBuffer

  if (password) {
    encodedKeyStr = await decryptKey(encryptedKey, password)

    /** @type {Uint8Array} */
    encodedKeyBuffer = base64.parse(encodedKeyStr)
  } else {
    const encodedKeyBinary = atob(encryptedKey)
    const bytes = new Uint8Array(encodedKeyBinary.length)
    for (let i = 0; i < encodedKeyBinary.length; i++) {
      bytes[i] = encodedKeyBinary.charCodeAt(i)
    }
    /** @type {ArrayBuffer} */
    encodedKeyBuffer = bytes
  }

  const privateKey = await crypto.subtle.importKey('pkcs8', encodedKeyBuffer.buffer, {
    name: 'ECDSA',
    namedCurve: 'P-256'
  }, true, ['sign'])

  // @ts-ignore
  const publicKey = await privateKeyToPublicKey(privateKey)

  return {
    privateKey,
    publicKey
  }
}

/**
 * @function
 * @param {jose.KeyLike} privateKey
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function exportKey (privateKey, password) {
  // @ts-ignore
  return encryptKey(privateKey, password)
}

/**
 * @function
 * @param {CryptoKey} privateKey
 * @param {string} password
 * @returns {Promise<string>}
 */
async function encryptKey (privateKey, password) {
  const salt = new Uint8Array(16)
  window.crypto.getRandomValues(salt)

  const pkExport = await crypto.subtle.exportKey('pkcs8', privateKey)

  const pdkey = await scrypt({
    password,
    salt,
    costFactor: SCRYPT_N,
    blockSize: SCRYPT_R,
    parallelism: SCRYPT_P,
    hashLength: pkExport.byteLength,
    outputType: 'binary'
  })

  const pkEncryptedExport = new Uint8Array(pkExport).map((x, i) => x ^ pdkey[i])
  const pkEncryptedExportStr = base64.stringify(new Uint8Array(pkEncryptedExport))

  const pkEncryptedExportObj = {
    alg: 'scrypt',
    prm: {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P
    },
    slt: base64.stringify(salt),
    key: pkEncryptedExportStr
  }

  const utf8Encode = new TextEncoder()
  return base64.stringify(utf8Encode.encode(JSON.stringify(pkEncryptedExportObj)))
}

/**
 * @function
 * @param {string} encryptedKey
 * @param {string} password
 * @returns {Promise<string>}
 */
async function decryptKey (encryptedKey, password) {
  const utf8Decode = new TextDecoder()
  const encryptedKeyObj = JSON.parse(utf8Decode.decode(base64.parse(encryptedKey)))
  const encryptedKeyBytes = base64.parse(encryptedKeyObj.key)

  const pdkey = await scrypt({
    password,
    salt: base64.parse(encryptedKeyObj.slt),
    costFactor: encryptedKeyObj.prm.N,
    blockSize: encryptedKeyObj.prm.r,
    parallelism: encryptedKeyObj.prm.p,
    hashLength: encryptedKeyBytes.byteLength,
    outputType: 'binary'
  })

  const pkDecryptedExport = new Uint8Array(encryptedKeyBytes).map((x, i) => x ^ pdkey[i])
  return base64.stringify(new Uint8Array(pkDecryptedExport))
}
