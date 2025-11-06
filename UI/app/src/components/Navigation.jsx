import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Home } from "lucide-react";

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show navigation on welcome page
  if (currentPath === "/") return null;

  return (
    <div
      className="relative top-0 left-0 right-0 text-white p-4 flex justify-between items-center font-cairo gap-50 opacity-0"
      style={{
        animation: "fadeIn 0.5s ease-out forwards",
      }}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="hover:bg-white/10 transition-all duration-300"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-[#027E01] rounded-full hover:bg-[#027E01]/90 hover:rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg">
            <Home className="text-white size-5" />
          </div>
        </Button>
      </div>
      <div className="flex gap-4">
        {currentPath !== "/student/login" && (
          <Button
            onClick={() => navigate("/student/login")}
            className="text-white bg-[#027E01] hover:bg-[#027E01]/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            منصة الطلاب
          </Button>
        )}
        {currentPath !== "/teacher/login" && (
          <Button
            onClick={() => navigate("/teacher/login")}
            className="text-white bg-[#027E01] hover:bg-[#027E01]/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            منصة الأساتذة
          </Button>
        )}
      </div>
    </div>
  );
}
