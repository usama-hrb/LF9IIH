import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-white w-full min-h-[90vh] max-w-7xl rounded-lg overflow-hidden flex flex-col md:flex-row font-cairo transition-all duration-500 ease-in-out hover:shadow-2xl">
        {/* Left Side - White */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center min-h-[90vh] md:min-h-0 p-6 md:p-8">
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md gap-8">
            <div className="text-center space-y-6">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-cairo opacity-0"
                style={{
                  animation: "fadeInUp 0.8s ease-out forwards",
                }}
              >
                السلام عليكم
              </h1>
              <h2
                className="text-lg sm:text-xl md:text-2xl font-medium text-gray-600 font-cairo opacity-0"
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.2s forwards",
                }}
              >
                يرجى الانتقال الى منصتك
              </h2>
            </div>
            <div
              className="flex flex-col gap-4 w-full opacity-0"
              style={{
                animation: "fadeIn 0.6s ease-out 0.4s forwards",
              }}
            >
              <Button
                size="lg"
                className="bg-[#027E01] hover:bg-[#027E01]/90 text-white text-base sm:text-lg py-6 transition-all duration-300 hover:scale-102 hover:shadow-xl"
                onClick={() => navigate("/student/login")}
              >
                منصة الطلاب
              </Button>
              <Button
                size="lg"
                className="bg-[#027E01] hover:bg-[#027E01]/90 text-white text-base sm:text-lg py-6 transition-all duration-300 hover:scale-102 hover:shadow-xl"
                onClick={() => navigate("/teacher/login")}
              >
                منصة الأساتذة
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side - Dark Blue (Hidden on mobile) */}
        <div className="hidden md:flex w-full md:w-1/2 bg-[#243048] border border-white items-center justify-center p-8">
          <div
            className="w-full max-w-max opacity-0"
            style={{
              animation: "fadeIn 0.8s ease-out 0.6s forwards",
            }}
          >
            <DotLottieReact
              src="https://lottie.host/3155ee74-87d2-4cbb-8913-4a98bef56762/tPHCWLx2W1.json"
              loop
              autoplay
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default Welcome;
