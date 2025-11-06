import { apiFetch } from "./api";

/**
 * Create or update attendance record for a student
 * @param {string} studentCode - Student code
 * @param {Object} payload - { attendance_date: "YYYY-MM-DD", state: "present" | "absent" }
 */
export function createAttendance(studentCode, payload, options) {
  return apiFetch(`/attendance/${encodeURIComponent(studentCode)}/create`, {
    method: "POST",
    body: payload,
    ...(options || {}),
  });
}

/**
 * Get attendance records for a student for a specific month
 * @param {string} studentCode - Student code
 * @param {number} year - Year (optional, defaults to current year)
 * @param {number} month - Month (1-12) (optional, defaults to current month)
 */
export function getAttendanceRecord(
  studentCode,
  year = null,
  month = null,
  options
) {
  const params = new URLSearchParams();
  if (year) params.append("year", year);
  if (month) params.append("month", month);

  const queryString = params.toString();
  const url = `/attendance/${encodeURIComponent(studentCode)}/record${
    queryString ? `?${queryString}` : ""
  }`;

  return apiFetch(url, {
    method: "GET",
    ...(options || {}),
  });
}
