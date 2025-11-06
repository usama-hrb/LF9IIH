import { Button } from "../components/ui/button";
import { Input } from "../../components/ui/input";
import { KeyRound, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { login, me, saveDoctorProfile } from "../lib/auth";
import { useAuth } from "../lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";

function TeacherLogin() {
  const [teacherId, setTeacherId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [dialog, setDialog] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call backend to set cookies
      const loginResult = await login({ code: teacherId.trim() });
      // Try to fetch profile; if it fails, fall back to whatever login returned
      let profile = null;
      try {
        profile = await me();
      } catch {
        // ignore; we'll use login result if it contains code
      }
      const candidate =
        profile || (loginResult && loginResult.code ? loginResult : null);
      if (candidate) {
        saveDoctorProfile(candidate);
        setUser(candidate);
      }
      navigate("/teacher/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في تسجيل الدخول",
        message:
          error?.message || "فشل تسجيل الدخول. تأكد من الرمز وحاول مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-white min-h-[90vh] w-[95vw] max-w-7xl rounded-lg overflow-hidden flex flex-col md:flex-row font-cairo transition-all duration-500 ease-in-out hover:shadow-2xl">
        <div className="hidden md:flex w-full md:w-1/2 bg-white min-h-[90vh] md:min-h-0 items-center justify-center p-6 md:p-8 transition-transform duration-500 ease-in-out">
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
        <div
          className="
        w-full md:w-1/2 bg-[#243048] border-2 border-white flex flex-col justify-center items-center min-h-[90vh] md:min-h-0 p-6 md:p-8"
        >
          <div className="mb-8">
            <Navigation />
          </div>
          <div className="flex flex-col items-center md:items-end justify-center w-full max-w-md gap-8 my-auto">
            <div className="text-center md:text-right space-y-4 w-full">
              <h1
                className="text-xl md:text-[25px] font-bold tracking-tight font-cairo text-white opacity-0"
                style={{
                  animation: "fadeInUp 0.6s ease-out forwards",
                }}
              >
                السلام عليكم أيها الاستاذ الفاضل
              </h1>
              <h2
                className="text-base md:text-[17px] font-bold text-gray-300 font-cairo opacity-0"
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.2s forwards",
                }}
              >
                سجل الدخول أو أنشئ حسابًا جديدًا للمتابعة.{" "}
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
                  placeholder="ادخل الرمز التعريفي للمعلم"
                  className="pr-12 text-lg text-right bg-white/10 border-white/20 text-white placeholder:text-gray-400 transition-all duration-300 focus:bg-white/20 focus:shadow-lg hover:bg-white/15"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  dir="rtl"
                />
              </div>

              <div className="flex justify-end">
                <Link
                  to="/teacher/register"
                  className="text-[#027E01] hover:text-[#027E01]/80 hover:underline text-sm transition-all duration-300 hover:scale-105 inline-block"
                >
                  ليس لديك حساب؟ أنشئ حسابًا.{" "}
                </Link>
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
      </div>

      {/* Dialog Component */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog({ ...dialog, open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>{dialog.title}</span>
            </DialogTitle>
            <DialogDescription className="text-right">
              {dialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDialog({ ...dialog, open: false })}
              className="w-full font-cairo"
            >
              حسناً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TeacherLogin;
