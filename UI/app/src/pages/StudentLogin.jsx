import { Button } from "../components/ui/button";
import { Input } from "../../components/ui/input";
import { KeyRound, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { studentLogin } from "../lib/student-api";

function StudentLogin() {
  const [studentId, setStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!studentId.trim()) {
      setError("الرجاء إدخال رمز التعريف");
      return;
    }

    setIsLoading(true);

    try {
      const data = await studentLogin(studentId);

      // Store student data in localStorage
      localStorage.setItem("student_code", data.code);
      localStorage.setItem("student_data", JSON.stringify(data));

      // Redirect to student dashboard
      navigate("/student/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.message || "رمز التعريف غير صحيح. الرجاء المحاولة مرة أخرى"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-white min-h-[90vh] w-[95vw] max-w-7xl rounded-lg overflow-hidden flex flex-col md:flex-row font-cairo transition-all duration-500 ease-in-out hover:shadow-2xl">
        {/* Left Side - White */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center min-h-[90vh] md:min-h-0 p-6 md:p-8 transition-transform duration-500 ease-in-out">
          <div className="mb-8">
            <Navigation />
          </div>
          <div className="flex flex-col items-center md:items-end justify-center w-full max-w-md gap-8 my-auto">
            <div className="text-center md:text-right space-y-4 w-full">
              <h1
                className="text-xl md:text-[25px] font-bold tracking-tight font-cairo opacity-0"
                style={{
                  animation: "fadeInUp 0.6s ease-out forwards",
                }}
              >
                السلام عليكم أيها الطالب أو ولي الأمر الكريم!
              </h1>
              <h2
                className="text-base md:text-[17px] font-bold text-gray-600 font-cairo opacity-0"
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.2s forwards",
                }}
              >
                يرجى إدخال رمز التعريف الخاص بالطالب للمتابعة.
              </h2>
            </div>

            <form
              onSubmit={handleLogin}
              className="w-full space-y-6 mt-[92px] opacity-0"
              style={{
                animation: "fadeIn 0.6s ease-out 0.4s forwards",
              }}
            >
              <div className="relative group">
                <KeyRound className="absolute right-3 top-4 h-6 w-6 text-[#027E01] transition-transform duration-300 group-focus-within:scale-110" />
                <Input
                  type="text"
                  placeholder="ادخل الرمز التعريفي للطالب"
                  className="pr-12 text-lg text-right transition-all duration-300 focus:shadow-lg hover:shadow-md"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setError("");
                  }}
                  dir="rtl"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-right font-cairo text-sm text-red-800">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <a
                  href="#"
                  className="text-[#027E01] hover:text-[#027E01]/80 hover:underline text-sm transition-all duration-300 hover:scale-105 inline-block"
                >
                  نسيت الرمز التعريفي؟
                </a>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-2/3 bg-[#027E01] hover:bg-[#027E01]/90 text-white text-lg py-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      جاري تسجيل الدخول...
                    </span>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Dark Blue */}
        <div className="hidden md:flex w-full md:w-1/2 bg-[#243048] border border-white items-center justify-center p-8">
          <div
            className="w-full max-w-2xl opacity-0"
            style={{
              animation: "fadeIn 0.8s ease-out 0.6s forwards",
            }}
          >
            <DotLottieReact
              src="https://lottie.host/e4f1b51b-9f73-484f-a1dd-416670f54a6e/4sQFcqUWhK.lottie"
              loop
              autoplay
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
