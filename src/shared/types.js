/** @typedef {'client'|'admin'|'superadmin'} Role */
/** @typedef {'anaemia'|'oral'} ScreeningKind */
/** @typedef {'issued'|'attended'|'not attended'|'confirmed outcome'} ReferralStatus */
/** @typedef {{id:number,username:string,role:Role,village_id:string|null,force_password_change:boolean}} SessionUser */
/**
 * @typedef {Object} QueuedScreening
 * @property {string} client_key Stable idempotency key generated on the device.
 * @property {string} patient_id Pseudonymous local patient code only.
 * @property {string} village_id Assigned village / PHC code.
 * @property {string} age_band
 * @property {string} sex
 * @property {ScreeningKind} kind
 * @property {true} consent
 * @property {Record<string,unknown>} payload Must not contain names, contact details, addresses, or images.
 * @property {string} triage
 */
export const API_CONTRACT_VERSION = 1;
