import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherRegister from "./pages/TeacherRegister";
import StudentsList from "./pages/StudentsList";
import ReviewSession from "./pages/ReviewSession";
import MemorizationSession from "./pages/MemorizationSession";
import {
  AuthProvider,
  ProtectedRoute,
  PublicOnlyRoute,
} from "./lib/auth-context";

function App() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-cover bg-center bg-no-repeat bg-[url('./assets/images/bg.svg')]">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<Welcome />} />

            {/* Student Routes */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />

            {/* Only when not authenticated */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher/register" element={<TeacherRegister />} />
            </Route>

            {/* Teacher Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/students" element={<StudentsList />} />
              <Route
                path="/teacher/review-session"
                element={<ReviewSession />}
              />
              <Route
                path="/teacher/memorization-session"
                element={<MemorizationSession />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
