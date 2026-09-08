/**
 * Tiny in-memory session store keyed on the farmer's WhatsApp number.
 * In production replace with Redis or DynamoDB.
 */

/** @type {Map<string, import('./types.js').FarmerSession>} */
const sessions = new Map();

export function getSession(phone) {
  return sessions.get(phone) ?? { step: "start", data: {} };
}

export function setSession(phone, session) {
  sessions.set(phone, session);
}

export function clearSession(phone) {
  sessions.delete(phone);
}
