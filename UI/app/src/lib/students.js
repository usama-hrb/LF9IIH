import { apiFetch } from "./api";

// Get all students for the authenticated doctor
export function listStudents(options) {
  return apiFetch("/student/list", {
    method: "GET",
    ...(options || {}),
  });
}

// Create a student
// payload: { first_name, last_name, parent, phone_number, memorization_method, gender, age }
export function createStudent(payload, options) {
  console.log("Creating student with payload:", payload);
  console.log("Current cookies:", document.cookie);
  return apiFetch("/student/create", {
    method: "POST",
    body: payload,
    ...(options || {}),
  });
}

// Get student details by code
export function getStudentDetail(code, options) {
  return apiFetch(`/student/${encodeURIComponent(code)}/detail`, {
    method: "GET",
    ...(options || {}),
  });
}

// Update student fully (PUT)
export function updateStudent(code, payload, options) {
  return apiFetch(`/student/${encodeURIComponent(code)}/update`, {
    method: "PUT",
    body: payload,
    ...(options || {}),
  });
}

// Update student partially (PATCH)
export function patchStudent(code, payload, options) {
  return apiFetch(`/student/${encodeURIComponent(code)}/update`, {
    method: "PATCH",
    body: payload,
    ...(options || {}),
  });
}

// Delete student by code
export function deleteStudent(code, options) {
  return apiFetch(`/student/${encodeURIComponent(code)}/delete`, {
    method: "DELETE",
    ...(options || {}),
  });
}
