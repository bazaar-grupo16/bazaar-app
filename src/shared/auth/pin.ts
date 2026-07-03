import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const PIN_ENABLED_KEY = "bazaar.pin.enabled";
const PIN_USER_ID_KEY = "bazaar.pin.userId";
const PIN_HASH_KEY = "bazaar.pin.hash";
const PIN_SALT_KEY = "bazaar.pin.salt";
const PIN_FAILED_ATTEMPTS_KEY = "bazaar.pin.failedAttempts";
const PIN_LOCKED_UNTIL_KEY = "bazaar.pin.lockedUntil";

export const PIN_MIN_LENGTH = 6;
export const PIN_MAX_ATTEMPTS = 3;
export const PIN_LOCK_MINUTES = 5;

export type PinValidationResult =
  | { ok: true }
  | { ok: false; reason: "invalid_format" | "mismatch" };

export type PinAttemptResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_configured" | "locked" | "invalid_pin";
      remainingAttempts?: number;
      lockedUntil?: Date;
    };

function getLockDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPinFormatError(pin: string) {
  return /^\d{6,}$/.test(pin) ? null : "invalid_format";
}

async function hashPin(pin: string, salt: string, userId: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${userId}:${pin}`,
  );
}

async function setFailedAttempts(value: number) {
  await SecureStore.setItemAsync(PIN_FAILED_ATTEMPTS_KEY, String(value));
}

export function validatePinInputs(pin: string, confirmation: string): PinValidationResult {
  const formatError = getPinFormatError(pin);
  if (formatError) return { ok: false, reason: formatError };
  if (pin !== confirmation) return { ok: false, reason: "mismatch" };
  return { ok: true };
}

export async function isPinConfigured() {
  const enabled = await SecureStore.getItemAsync(PIN_ENABLED_KEY);
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  const userId = await SecureStore.getItemAsync(PIN_USER_ID_KEY);
  return enabled === "true" && Boolean(hash) && Boolean(userId);
}

export async function getPinLockInfo() {
  const lockedUntil = getLockDate(await SecureStore.getItemAsync(PIN_LOCKED_UNTIL_KEY));
  if (!lockedUntil) return null;
  if (lockedUntil.getTime() <= Date.now()) {
    await SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY);
    await setFailedAttempts(0);
    return null;
  }
  return lockedUntil;
}

export async function savePinConfiguration(userId: string, pin: string) {
  const salt = Crypto.randomUUID();
  const hash = await hashPin(pin, salt, userId);

  await SecureStore.setItemAsync(PIN_ENABLED_KEY, "true");
  await SecureStore.setItemAsync(PIN_USER_ID_KEY, userId);
  await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  await setFailedAttempts(0);
  await SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY);
}

export async function clearPinConfiguration() {
  await SecureStore.deleteItemAsync(PIN_ENABLED_KEY);
  await SecureStore.deleteItemAsync(PIN_USER_ID_KEY);
  await SecureStore.deleteItemAsync(PIN_HASH_KEY);
  await SecureStore.deleteItemAsync(PIN_SALT_KEY);
  await SecureStore.deleteItemAsync(PIN_FAILED_ATTEMPTS_KEY);
  await SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY);
}

export async function resetPinFailuresForUser(userId: string | null) {
  const configuredUserId = await SecureStore.getItemAsync(PIN_USER_ID_KEY);
  if (!userId || configuredUserId !== userId) return;
  await setFailedAttempts(0);
  await SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY);
}

export async function verifyPinAttempt(pin: string): Promise<PinAttemptResult> {
  const lockedUntil = await getPinLockInfo();
  if (lockedUntil) {
    return { ok: false, reason: "locked", lockedUntil };
  }

  const enabled = await isPinConfigured();
  const userId = await SecureStore.getItemAsync(PIN_USER_ID_KEY);
  const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);
  const savedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);

  if (!enabled || !userId || !salt || !savedHash) {
    return { ok: false, reason: "not_configured" };
  }

  if (getPinFormatError(pin)) {
    return { ok: false, reason: "invalid_pin", remainingAttempts: PIN_MAX_ATTEMPTS };
  }

  const currentHash = await hashPin(pin, salt, userId);
  if (currentHash === savedHash) {
    await setFailedAttempts(0);
    await SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY);
    return { ok: true };
  }

  const rawAttempts = await SecureStore.getItemAsync(PIN_FAILED_ATTEMPTS_KEY);
  const nextAttempts = (Number(rawAttempts) || 0) + 1;

  if (nextAttempts >= PIN_MAX_ATTEMPTS) {
    const nextLockedUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
    await setFailedAttempts(nextAttempts);
    await SecureStore.setItemAsync(PIN_LOCKED_UNTIL_KEY, nextLockedUntil.toISOString());
    return { ok: false, reason: "locked", lockedUntil: nextLockedUntil };
  }

  await setFailedAttempts(nextAttempts);
  return {
    ok: false,
    reason: "invalid_pin",
    remainingAttempts: PIN_MAX_ATTEMPTS - nextAttempts,
  };
}
