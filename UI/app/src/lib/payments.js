import { apiFetch } from "./api";

/**
 * Create or update a payment for a student
 * @param {string|number} studentCode - Student code or ID
 * @param {Object} payload - Payment data
 * @param {number} payload.month - Month (1-12)
 * @param {number} payload.year - Year (e.g., 2025)
 * @param {number} payload.amount - Payment amount
 * @returns {Promise} Payment data
 */
export function createPayment(studentCode, payload, options) {
  return apiFetch(`/payments/${encodeURIComponent(studentCode)}/create`, {
    method: "POST",
    body: payload,
    ...(options || {}),
  });
}

/**
 * Get all payments for a specific student
 * @param {string|number} studentCode - Student code or ID
 * @returns {Promise} Array of payment records
 */
export function getStudentPayments(studentCode, options) {
  return apiFetch(`/payments/${encodeURIComponent(studentCode)}/all`, {
    method: "GET",
    ...(options || {}),
  });
}

/**
 * Get all payments for all students for a specific month/year
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @returns {Promise} Array of payments for all students
 */
export function getAllPayments(month, year, options) {
  return apiFetch("/payments/all", {
    method: "GET",
    params: { month, year },
    ...(options || {}),
  });
}

/**
 * Get total payments amount for the authenticated teacher
 * @returns {Promise} Object with total amount
 */
export function getTotalPayments(options) {
  return apiFetch("/payments/total", {
    method: "GET",
    ...(options || {}),
  });
}
