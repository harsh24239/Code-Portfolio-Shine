import crypto from 'node:crypto';

const getKey = () => {
  const raw = process.env.MFA_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error('MFA_ENCRYPTION_KEY must be configured before enabling MFA.');

  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('MFA_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  return key;
};

export const encryptSecret = (plaintext) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
};

export const decryptSecret = (encrypted) => {
  if (!encrypted?.iv || !encrypted?.ciphertext || !encrypted?.authTag) {
    throw new Error('MFA secret is incomplete.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(encrypted.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};
