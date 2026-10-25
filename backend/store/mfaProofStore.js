import { Admin } from '../models/Admin.js';
import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback } from '../config/security.js';
import { memoryStore } from './memoryStore.js';

/** Claim one proof once, even when different challenges are verified concurrently. */
export const claimMfaProof = async ({ adminId, tokenVersion, secretCiphertext, timeStep = null, backupHash = '' }) => {
  if (isDbConnected) {
    const filter = { _id: adminId, tokenVersion, mfaEnabled: true, 'mfaSecret.ciphertext': secretCiphertext };
    let update;
    if (timeStep !== null) {
      filter.$or = [{ mfaLastUsedStep: { $lt: timeStep } }, { mfaLastUsedStep: { $exists: false } }];
      update = { $set: { mfaLastUsedStep: timeStep } };
    } else {
      if (!backupHash) return false;
      filter.mfaBackupCodes = { $elemMatch: { hash: backupHash, usedAt: null } };
      update = { $set: { 'mfaBackupCodes.$.usedAt': new Date() } };
    }
    const admin = await Admin.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    return Boolean(admin);
  }

  if (!allowInMemoryFallback) return false;
  const admin = memoryStore.adminCredentials;
  if (!admin.mfaEnabled || (admin.tokenVersion || 0) !== tokenVersion || admin.mfaSecret?.ciphertext !== secretCiphertext) return false;
  // No await occurs between checking and claiming the in-memory proof.
  if (timeStep !== null) {
    if (timeStep <= (admin.mfaLastUsedStep ?? -1)) return false;
    admin.mfaLastUsedStep = timeStep;
    return true;
  }
  const backupCode = (admin.mfaBackupCodes || []).find(code => code.hash === backupHash && !code.usedAt);
  if (!backupCode) return false;
  backupCode.usedAt = new Date();
  return true;
};
