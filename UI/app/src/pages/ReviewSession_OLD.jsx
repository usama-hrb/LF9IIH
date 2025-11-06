import { Button } from "../components/ui/button";
import { Input } from "../../components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Save, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { apiFetch } from "../lib/api";

function ReviewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const student = location.state?.student;

  const [reviewData, setReviewData] = useState({
    current: "",
    next: "",
    completionDate: new Date().toISOString().split("T")[0],
    rating: 0,
    evaluation: "",
    progress: "",
    feedback: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [completions, setCompletions] = useState([]);
  const [dialog, setDialog] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // Determine API endpoint based on memorization method
  const isChapterMethod = student?.memorization_method === "chapter";
  const apiEndpoint = isChapterMethod ? "chapters" : "quarters";

  // Load existing completions
  useEffect(() => {
    if (!student) return;

    const fetchCompletions = async () => {
      try {
        const response = await apiFetch(
          `/${apiEndpoint}/${student.code}/completions`
        );
        setCompletions(response || []);
      } catch (error) {
        console.error("Error fetching completions:", error);
      }
    };
    fetchCompletions();
  }, [student, apiEndpoint]);

  // Redirect back if no student data
  useEffect(() => {
    if (!student) {
      navigate("/teacher/students");
    }
  }, [student, navigate]);

  if (!student) {
    return null;
  }

  const getInitials = (name) => {
    return name.split(" ")[0].charAt(0);
  };

  const handleRatingClick = (rating) => {
    setReviewData({ ...reviewData, rating });
  };

  const getRatingLabel = (rating) => {
    const labels = {
      0: "لم يتم التقييم بعد",
      1: "ضعيف",
      2: "مقبول",
      3: "جيد",
      4: "جيد جداً",
      5: "ممتاز",
    };
    return labels[rating] || "";
  };

  const handleSave = async () => {
    // Validation
    if (!reviewData.current.trim()) {
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في البيانات",
        message: "الرجاء إدخال الورد الحالي",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        [isChapterMethod ? "chapter" : "quarter"]: reviewData.current,
        completion_date: reviewData.completionDate,
        evaluation: `${getRatingLabel(reviewData.rating)}${
          reviewData.evaluation ? " - " + reviewData.evaluation : ""
        }`,
        progress: reviewData.progress,
        feedback: reviewData.feedback,
      };

      await apiFetch(`/${apiEndpoint}/${student.code}/create`, {
        method: "POST",
        body: payload,
      });

      setDialog({
        open: true,
        type: "success",
        title: "تم الحفظ بنجاح",
        message: "تم حفظ حصة المراجعة بنجاح!",
      });

      // Navigate after showing success dialog
      setTimeout(() => {
        navigate("/teacher/students", {
          state: {
            updatedReview: reviewData.current,
            studentId: student.code,
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Error saving review session:", error);
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في الحفظ",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء حفظ حصة المراجعة",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-3 sm:p-4 md:p-5 lg:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div
          className="bg-white rounded-xl shadow-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out forwards" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={() => navigate("/teacher/students")}
              className="bg-[#243048] hover:bg-[#243048]/90 text-white p-2 transition-all duration-200"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-cairo text-[#243048]">
              حصة المراجعة
            </h1>
          </div>

          {/* Student Avatar and Info */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#243048] flex items-center justify-center text-white text-4xl sm:text-5xl font-bold font-cairo mb-3">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(student.name)
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-cairo text-[#243048] mb-2 text-center">
              {student.name}
            </h2>
            <p className="text-sm sm:text-base font-cairo text-gray-600">
              الرقم التعريفي:{" "}
              <span className="font-bold text-[#243048]">{student.code}</span>
            </p>
          </div>

          {/* Student Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="font-cairo text-xs sm:text-sm text-gray-600">
                المستوى:
              </span>
              <span className="font-cairo text-sm sm:text-base font-bold text-[#243048]">
                {student.level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-cairo text-xs sm:text-sm text-gray-600">
                تاريخ الالتحاق:
              </span>
              <span className="font-cairo text-sm sm:text-base font-bold text-[#243048]">
                {student.enrollmentDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-cairo text-xs sm:text-sm text-gray-600">
                العمر:
              </span>
              <span className="font-cairo text-sm sm:text-base font-bold text-[#243048]">
                {student.age} سنة
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-cairo text-xs sm:text-sm text-gray-600">
                بداية الحفظ:
              </span>
              <span className="font-cairo text-sm sm:text-base font-bold text-[#243048]">
                {student.memorizationStart}
              </span>
            </div>
          </div>
        </div>

        {/* Review Session Form */}
        <div
          className="bg-white rounded-xl shadow-2xl p-4 sm:p-5 md:p-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out 0.1s forwards" }}
        >
          {/* Memorization Method Info */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-center font-cairo text-sm text-blue-800">
              طريقة الحفظ:{" "}
              <span className="font-bold">
                {isChapterMethod ? "بالأجزاء" : "بالأثمان (8 أثمان = حزب)"}
              </span>
            </p>
          </div>

          {/* Current and Next Review Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Current Review */}
            <div>
              <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
                الورد الحالي: <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={reviewData.current}
                onChange={(e) =>
                  setReviewData({ ...reviewData, current: e.target.value })
                }
                placeholder={
                  isChapterMethod
                    ? "مثال: 5 (رقم الجزء)"
                    : "مثال: 1-3 (رقم الثمن من 1-8)"
                }
                className="w-full text-right font-cairo text-sm sm:text-base border-2 focus:border-[#027E01] transition-all"
                dir="rtl"
                required
              />
            </div>

            {/* Next Review */}
            <div>
              <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
                الورد التالي:
              </label>
              <Input
                type="text"
                value={reviewData.next}
                onChange={(e) =>
                  setReviewData({ ...reviewData, next: e.target.value })
                }
                placeholder={
                  isChapterMethod
                    ? "مثال: 6 (رقم الجزء القادم)"
                    : "مثال: 4 (رقم الثمن القادم)"
                }
                className="w-full text-right font-cairo text-sm sm:text-base border-2 focus:border-[#027E01] transition-all"
                dir="rtl"
              />
            </div>
          </div>

          {/* Completion Date */}
          <div className="mb-6">
            <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
              تاريخ الإتمام: <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={reviewData.completionDate}
              onChange={(e) =>
                setReviewData({
                  ...reviewData,
                  completionDate: e.target.value,
                })
              }
              className="w-full text-right font-cairo text-sm sm:text-base border-2 focus:border-[#027E01] transition-all"
              dir="rtl"
              required
            />
          </div>

          {/* Rating System */}
          <div className="mb-6">
            <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-3">
              التقييم:
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingClick(star)}
                  className={`text-3xl sm:text-4xl md:text-5xl transition-all duration-200 hover:scale-110 ${
                    star <= reviewData.rating
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-center font-cairo text-xs sm:text-sm text-gray-600 mt-2">
              {reviewData.rating === 0 && "لم يتم التقييم بعد"}
              {reviewData.rating === 1 && "ضعيف"}
              {reviewData.rating === 2 && "مقبول"}
              {reviewData.rating === 3 && "جيد"}
              {reviewData.rating === 4 && "جيد جداً"}
              {reviewData.rating === 5 && "ممتاز"}
            </p>
          </div>

          {/* Evaluation Details */}
          <div className="mb-6">
            <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
              تفاصيل التقييم:
            </label>
            <textarea
              value={reviewData.evaluation}
              onChange={(e) =>
                setReviewData({ ...reviewData, evaluation: e.target.value })
              }
              placeholder="تفاصيل إضافية حول التقييم..."
              rows="3"
              className="w-full px-4 py-3 text-right border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#027E01] focus:ring-2 focus:ring-[#027E01]/20 transition-all duration-300 font-cairo text-sm sm:text-base resize-none"
              dir="rtl"
            />
          </div>

          {/* Progress Notes */}
          <div className="mb-6">
            <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
              ملاحظات التقدم:
            </label>
            <textarea
              value={reviewData.progress}
              onChange={(e) =>
                setReviewData({ ...reviewData, progress: e.target.value })
              }
              placeholder="مثال: أكمل نصف الجزء، يحتاج مراجعة..."
              rows="3"
              className="w-full px-4 py-3 text-right border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#027E01] focus:ring-2 focus:ring-[#027E01]/20 transition-all duration-300 font-cairo text-sm sm:text-base resize-none"
              dir="rtl"
            />
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
              الملاحظات والتوجيهات:
            </label>
            <textarea
              value={reviewData.feedback}
              onChange={(e) =>
                setReviewData({ ...reviewData, feedback: e.target.value })
              }
              placeholder="مثال: واصل بنفس الوتيرة، ركز على التجويد..."
              rows="4"
              className="w-full px-4 py-3 text-right border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#027E01] focus:ring-2 focus:ring-[#027E01]/20 transition-all duration-300 font-cairo text-sm sm:text-base resize-none"
              dir="rtl"
            />
          </div>

          {/* Completed Count Info */}
          {completions.length > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-center font-cairo text-sm text-green-800">
                {isChapterMethod
                  ? `تم إكمال ${completions.length} جزء`
                  : `تم إكمال ${completions.length} ثمن ${
                      Math.floor(completions.length / 8) > 0
                        ? `(${Math.floor(completions.length / 8)} حزب)`
                        : ""
                    }`}
              </p>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-[#027E01] hover:bg-[#027E01]/90 text-white font-cairo font-bold text-base sm:text-lg py-3 sm:py-4 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
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
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>حفظ حصة المراجعة</span>
              </>
            )}
          </Button>
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
              {dialog.type === "error" && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {dialog.type === "success" && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
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

export default ReviewSession;
