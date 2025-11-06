import { apiFetch } from "./api";

// Student Authentication
export function studentLogin(code, options) {
  return apiFetch("/student/auth/login", {
    method: "POST",
    body: { code },
    ...(options || {}),
  });
}

// Student Profile
export function getStudentProfile(studentCode, options) {
  return apiFetch(`/student/${encodeURIComponent(studentCode)}/profile`, {
    method: "GET",
    ...(options || {}),
  });
}

// Student Statistics
export function getStudentStatistics(studentCode, options) {
  return apiFetch(`/student/${encodeURIComponent(studentCode)}/statistics`, {
    method: "GET",
    ...(options || {}),
  });
}

// Student Memorization History
export function getStudentMemorizationHistory(studentCode, options) {
  return apiFetch(
    `/student/${encodeURIComponent(studentCode)}/memorization-history`,
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

// Student Review History
export function getStudentReviewHistory(studentCode, options) {
  return apiFetch(
    `/student/${encodeURIComponent(studentCode)}/review-history`,
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

// Student Attendance History
export function getStudentAttendanceHistory(studentCode, options) {
  return apiFetch(
    `/student/${encodeURIComponent(studentCode)}/attendance-history`,
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

// Student Payment History
export function getStudentPaymentHistory(studentCode, options) {
  return apiFetch(
    `/student/${encodeURIComponent(studentCode)}/payment-history`,
    {
      method: "GET",
      ...(options || {}),
    }
  );
}
