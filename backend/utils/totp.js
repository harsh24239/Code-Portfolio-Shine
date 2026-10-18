import crypto from 'node:crypto';
import { generate, generateSecret, generateURI, verify } from 'otplib';

const normalizeCode = (value) => String(value || '').replace(/[^0-9]/g, '').slice(0, 8);

export const createTotpSetup = (username) => {
  const secret = generateSecret();
  const uri = generateURI({
    issuer: process.env.MFA_ISSUER || 'Harsh.dev Admin',
    label: username,
    secret,
  });
  return { secret, uri };
};

export const verifyTotp = async (secret, value, lastUsedStep = -1) => {
  const token = normalizeCode(value);
  if (token.length !== 6) return { valid: false, timeStep: null };

  const result = await verify({ token, secret, epochTolerance: 1 });
  if (!result.valid || result.timeStep <= Number(lastUsedStep || -1)) {
    return { valid: false, timeStep: result.timeStep ?? null };
  }

  return { valid: true, timeStep: result.timeStep };
};

export const generateBackupCodes = (count = 10) =>
  Array.from({ length: count }, () => crypto.randomBytes(5).toString('hex').toUpperCase());

export const normalizeBackupCode = (value) => String(value || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();

export const generatePreviewCode = async (secret) => generate({ secret });
