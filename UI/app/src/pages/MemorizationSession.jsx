import { Button } from "../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Save,
  CheckCircle,
  AlertCircle,
  Trophy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { apiFetch } from "../lib/api";

function MemorizationSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const student = location.state?.student;

  const [surahs, setSurahs] = useState([]);
  const [completedSurahs, setCompletedSurahs] = useState([]);
  const [completedHizbs, setCompletedHizbs] = useState([]);
  const [memorizationData, setMemorizationData] = useState({
    // Current session
    surah: "",
    verseFrom: "",
    verseTo: "",
    isSurahCompleted: false,
    // Next session
    nextSurah: "",
    nextVerseFrom: "",
    nextVerseTo: "",
    // Hizb/Eighth for quarters method
    hizbNumber: "",
    eighthNumber: "",
    isHizbCompleted: false,
    nextHizbNumber: "",
    nextEighthNumber: "",
    // Common fields
    completionDate: new Date().toISOString().split("T")[0],
    rating: 0,
    quickNotes: "",
    evaluation: "",
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

  // Quick notes options
  const quickNotesOptions = [
    "ممتاز - حفظ متقن",
    "جيد جداً - حفظ جيد مع بعض الأخطاء البسيطة",
    "جيد - يحتاج تحسين",
    "يحتاج مزيد من التركيز",
    "حفظ سريع ومتقن",
    "يحتاج وقت أطول للحفظ",
  ];

  // Load Surahs list (for chapter method)
  useEffect(() => {
    if (!student || !isChapterMethod) return;

    const fetchSurahs = async () => {
      try {
        const response = await apiFetch(`/chapters/${student.code}/surahs`);
        setSurahs(response || []);
      } catch (error) {
        console.error("Error fetching Surahs:", error);
      }
    };
    fetchSurahs();
  }, [student, isChapterMethod]);

  // Load existing completions
  useEffect(() => {
    if (!student) return;

    const fetchCompletions = async () => {
      try {
        const response = await apiFetch(
          `/${apiEndpoint}/${student.code}/completions`
        );
        // Filter only MEMORIZATION sessions
        const memorizationSessions = (response || []).filter(
          (c) => c.session_type === "memorization"
        );
        setCompletions(memorizationSessions);

        // Extract completed Surahs or Hizbs from MEMORIZATION sessions only
        if (isChapterMethod) {
          const completed = memorizationSessions
            .filter((c) => c.is_surah_completed && c.surah)
            .map((c) => c.surah.code);
          setCompletedSurahs(completed);
        } else {
          // Extract completed Hizbs from MEMORIZATION sessions only
          const completed = memorizationSessions
            .filter((c) => c.is_hizb_completed && c.hizb_number)
            .map((c) => c.hizb_number);
          setCompletedHizbs(completed);
        }
      } catch (error) {
        console.error("Error fetching completions:", error);
      }
    };
    fetchCompletions();
  }, [student, apiEndpoint, isChapterMethod]);

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
    setMemorizationData({ ...memorizationData, rating });
  };

  const getRatingLabel = (rating) => {
    const labels = {
      0: "لم يتم التقييم",
      1: "ضعيف",
      2: "مقبول",
      3: "جيد",
      4: "جيد جداً",
      5: "ممتاز",
    };
    return labels[rating] || "";
  };

  const getSelectedSurahInfo = (surahCode) => {
    const surah = surahs.find((s) => s.code === parseInt(surahCode));
    return surah || null;
  };

  const handleSave = async () => {
    // Validation for chapter method
    if (isChapterMethod) {
      if (!memorizationData.surah) {
        setDialog({
          open: true,
          type: "error",
          title: "خطأ في البيانات",
          message: "الرجاء اختيار السورة",
        });
        return;
      }
      if (!memorizationData.verseFrom || !memorizationData.verseTo) {
        setDialog({
          open: true,
          type: "error",
          title: "خطأ في البيانات",
          message: "الرجاء إدخال نطاق الآيات (من - إلى)",
        });
        return;
      }
    } else {
      // Validation for quarters method
      if (!memorizationData.hizbNumber || !memorizationData.eighthNumber) {
        setDialog({
          open: true,
          type: "error",
          title: "خطأ في البيانات",
          message: "الرجاء إدخال رقم الحزب والثمن",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = isChapterMethod
        ? {
            session_type: "memorization",
            chapter: parseInt(memorizationData.surah),
            surah: parseInt(memorizationData.surah),
            verse_from: parseInt(memorizationData.verseFrom),
            verse_to: parseInt(memorizationData.verseTo),
            is_surah_completed: memorizationData.isSurahCompleted,
            next_surah: memorizationData.nextSurah
              ? parseInt(memorizationData.nextSurah)
              : null,
            next_verse_from: memorizationData.nextVerseFrom
              ? parseInt(memorizationData.nextVerseFrom)
              : null,
            next_verse_to: memorizationData.nextVerseTo
              ? parseInt(memorizationData.nextVerseTo)
              : null,
            completion_date: memorizationData.completionDate,
            rating: memorizationData.rating,
            quick_notes: memorizationData.quickNotes,
            evaluation: memorizationData.evaluation,
            feedback: memorizationData.feedback,
          }
        : {
            session_type: "memorization",
            hizb_number: parseInt(memorizationData.hizbNumber),
            eighth_number: parseInt(memorizationData.eighthNumber),
            is_hizb_completed: memorizationData.isHizbCompleted,
            next_hizb_number: memorizationData.nextHizbNumber
              ? parseInt(memorizationData.nextHizbNumber)
              : null,
            next_eighth_number: memorizationData.nextEighthNumber
              ? parseInt(memorizationData.nextEighthNumber)
              : null,
            completion_date: memorizationData.completionDate,
            rating: memorizationData.rating,
            quick_notes: memorizationData.quickNotes,
            evaluation: memorizationData.evaluation,
            feedback: memorizationData.feedback,
          };

      await apiFetch(`/${apiEndpoint}/${student.code}/create`, {
        method: "POST",
        body: payload,
      });

      setDialog({
        open: true,
        type: "success",
        title: "تم الحفظ بنجاح",
        message:
          memorizationData.isSurahCompleted || memorizationData.isHizbCompleted
            ? "🎉 تهانينا! تم إكمال السورة/الحزب وحفظها في إنجازات الطالب"
            : "تم حفظ حصة الحفظ بنجاح!",
      });

      // Navigate after showing success dialog
      setTimeout(() => {
        navigate("/teacher/students", {
          state: {
            updatedMemorization: true,
            studentId: student.code,
          },
        });
      }, 2000);
    } catch (error) {
      console.error("Error saving memorization session:", error);
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في الحفظ",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء حفظ حصة الحفظ",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get available Surahs (excluding completed ones)
  const availableSurahs = surahs.filter(
    (s) => !completedSurahs.includes(s.code)
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 p-3 sm:p-4 md:p-5 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out forwards" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Button
              onClick={() => navigate("/teacher/students")}
              className="bg-[#243048] hover:bg-[#243048]/90 text-white p-2"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-cairo text-[#243048]">
              حصة الحفظ
            </h1>
          </div>

          {/* Student Info */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
            <div className="w-16 h-16 rounded-full bg-[#243048] flex items-center justify-center text-white text-2xl font-bold font-cairo">
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
            <div className="flex-1">
              <h2 className="text-lg font-bold font-cairo text-[#243048]">
                {student.name}
              </h2>
              <p className="text-sm font-cairo text-gray-600">
                {student.code} • {student.level}
              </p>
            </div>
            {completedSurahs.length > 0 && isChapterMethod && (
              <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-cairo text-sm text-yellow-800">
                  {completedSurahs.length} سورة مكتملة
                </span>
              </div>
            )}
            {completedHizbs.length > 0 && !isChapterMethod && (
              <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-cairo text-sm text-yellow-800">
                  {completedHizbs.length} حزب مكتمل
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Memorization Form */}
        <div
          className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out 0.1s forwards" }}
        >
          {/* Method Indicator */}
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <p className="font-cairo text-sm text-purple-800">
              طريقة الحفظ:{" "}
              <span className="font-bold">
                {isChapterMethod ? "بالسور والآيات" : "بالأحزاب والأثمان"}
              </span>
            </p>
          </div>

          {/* CHAPTER METHOD FORM */}
          {isChapterMethod ? (
            <>
              {/* Current Session */}
              <div className="mb-6 border-b pb-6">
                <h3 className="font-cairo font-bold text-lg text-[#243048] mb-4">
                  الحفظ الحالي
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Surah Selection */}
                  <div className="md:col-span-3">
                    <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
                      السورة: <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={memorizationData.surah}
                      onChange={(e) => {
                        const newSurah = e.target.value;
                        const surahInfo = getSelectedSurahInfo(newSurah);
                        setMemorizationData({
                          ...memorizationData,
                          surah: newSurah,
                          verseFrom: "",
                          verseTo: surahInfo ? surahInfo.number_of_verses : "",
                        });
                      }}
                      className="w-full text-right"
                      dir="rtl"
                    >
                      <option value="">اختر السورة...</option>
                      {availableSurahs.map((surah) => (
                        <option key={surah.code} value={surah.code}>
                          {surah.name} ({surah.number_of_verses} آية)
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Verse Range */}
                  <div>
                    <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
                      من الآية: <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={memorizationData.verseFrom}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          verseFrom: e.target.value,
                        })
                      }
                      placeholder="1"
                      className="w-full text-center"
                      disabled={!memorizationData.surah}
                    />
                  </div>

                  <div>
                    <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
                      إلى الآية: <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={memorizationData.verseTo}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          verseTo: e.target.value,
                        })
                      }
                      placeholder={
                        memorizationData.surah
                          ? getSelectedSurahInfo(memorizationData.surah)
                              ?.number_of_verses
                          : ""
                      }
                      className="w-full text-center"
                      disabled={!memorizationData.surah}
                    />
                  </div>

                  {/* Surah Completion Checkbox */}
                  <div className="flex items-center gap-2 md:col-span-1">
                    <input
                      type="checkbox"
                      id="surahCompleted"
                      checked={memorizationData.isSurahCompleted}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          isSurahCompleted: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-[#027E01] border-gray-300 rounded focus:ring-[#027E01]"
                    />
                    <label
                      htmlFor="surahCompleted"
                      className="font-cairo text-sm font-bold text-[#027E01] cursor-pointer"
                    >
                      تم إكمال السورة كاملة ✓
                    </label>
                  </div>
                </div>
              </div>

              {/* Next Session Planning */}
              <div className="mb-6 border-b pb-6">
                <h3 className="font-cairo font-bold text-lg text-[#243048] mb-4">
                  الحصة القادمة (اختياري)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block font-cairo text-sm font-bold text-gray-700 mb-2">
                      السورة القادمة:
                    </label>
                    <Select
                      value={memorizationData.nextSurah}
                      onChange={(e) => {
                        const newSurah = e.target.value;
                        const surahInfo = getSelectedSurahInfo(newSurah);
                        setMemorizationData({
                          ...memorizationData,
                          nextSurah: newSurah,
                          nextVerseFrom: "1",
                          nextVerseTo: surahInfo
                            ? surahInfo.number_of_verses
                            : "",
                        });
                      }}
                      className="w-full text-right"
                      dir="rtl"
                    >
                      <option value="">اختر السورة...</option>
                      {availableSurahs.map((surah) => (
                        <option key={surah.code} value={surah.code}>
                          {surah.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block font-cairo text-sm font-bold text-gray-700 mb-2">
                      من الآية:
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={memorizationData.nextVerseFrom}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          nextVerseFrom: e.target.value,
                        })
                      }
                      placeholder="1"
                      className="w-full text-center"
                      disabled={!memorizationData.nextSurah}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-cairo text-sm font-bold text-gray-700 mb-2">
                      إلى الآية:
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={memorizationData.nextVerseTo}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          nextVerseTo: e.target.value,
                        })
                      }
                      placeholder={
                        memorizationData.nextSurah
                          ? getSelectedSurahInfo(memorizationData.nextSurah)
                              ?.number_of_verses
                          : ""
                      }
                      className="w-full text-center"
                      disabled={!memorizationData.nextSurah}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* QUARTERS/EIGHTHS METHOD FORM */
            <>
              {/* Current Session */}
              <div className="mb-6 border-b pb-6">
                <h3 className="font-cairo font-bold text-lg text-[#243048] mb-4">
                  الحفظ الحالي
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
                      رقم الحزب: <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={memorizationData.hizbNumber}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          hizbNumber: e.target.value,
                        })
                      }
                      className="w-full text-center"
                    >
                      <option value="">اختر...</option>
                      {Array.from({ length: 60 }, (_, i) => i + 1)
                        .filter((num) => !completedHizbs.includes(num))
                        .map((num) => (
                          <option key={num} value={num}>
                            الحزب {num}
                          </option>
                        ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
                      رقم الثمن: <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={memorizationData.eighthNumber}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          eighthNumber: e.target.value,
                        })
                      }
                      className="w-full text-center"
                    >
                      <option value="">اختر...</option>
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          الثمن {num}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hizbCompleted"
                      checked={memorizationData.isHizbCompleted}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          isHizbCompleted: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-[#027E01] border-gray-300 rounded focus:ring-[#027E01]"
                    />
                    <label
                      htmlFor="hizbCompleted"
                      className="font-cairo text-sm font-bold text-[#027E01] cursor-pointer"
                    >
                      تم إكمال الحزب ✓
                    </label>
                  </div>
                </div>
              </div>

              {/* Next Session */}
              <div className="mb-6 border-b pb-6">
                <h3 className="font-cairo font-bold text-lg text-[#243048] mb-4">
                  الحصة القادمة (اختياري)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-cairo text-sm font-bold text-gray-700 mb-2">
                      رقم الحزب:
                    </label>
                    <Select
                      value={memorizationData.nextHizbNumber}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          nextHizbNumber: e.target.value,
                        })
                      }
                      className="w-full text-center"
                    >
                      <option value="">اختر...</option>
                      {Array.from({ length: 60 }, (_, i) => i + 1)
                        .filter((num) => !completedHizbs.includes(num))
                        .map((num) => (
                          <option key={num} value={num}>
                            الحزب {num}
                          </option>
                        ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block font-cairo text-sm font-bold text-gray-700 mb-2">
                      رقم الثمن:
                    </label>
                    <Select
                      value={memorizationData.nextEighthNumber}
                      onChange={(e) =>
                        setMemorizationData({
                          ...memorizationData,
                          nextEighthNumber: e.target.value,
                        })
                      }
                      className="w-full text-center"
                    >
                      <option value="">اختر...</option>
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          الثمن {num}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Common Fields */}
          {/* Completion Date */}
          <div className="mb-4">
            <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
              تاريخ الإتمام: <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={memorizationData.completionDate}
              onChange={(e) =>
                setMemorizationData({
                  ...memorizationData,
                  completionDate: e.target.value,
                })
              }
              className="w-full text-right font-cairo text-sm"
              dir="rtl"
            />
          </div>

          {/* Rating System */}
          <div className="mb-4">
            <label className="block font-cairo text-sm font-bold text-[#243048] mb-3">
              التقييم:
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingClick(star)}
                  className={`text-3xl sm:text-4xl transition-all duration-200 hover:scale-110 ${
                    star <= memorizationData.rating
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-center font-cairo text-xs sm:text-sm text-gray-600 mt-2">
              {getRatingLabel(memorizationData.rating)}
            </p>
          </div>

          {/* Quick Notes Select */}
          <div className="mb-4">
            <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
              ملاحظات سريعة:
            </label>
            <Select
              value={memorizationData.quickNotes}
              onChange={(e) =>
                setMemorizationData({
                  ...memorizationData,
                  quickNotes: e.target.value,
                })
              }
              className="w-full text-right"
              dir="rtl"
            >
              <option value="">اختر ملاحظة...</option>
              {quickNotesOptions.map((note, index) => (
                <option key={index} value={note}>
                  {note}
                </option>
              ))}
            </Select>
          </div>

          {/* Evaluation */}
          <div className="mb-4">
            <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
              التقييم التفصيلي:
            </label>
            <textarea
              value={memorizationData.evaluation}
              onChange={(e) =>
                setMemorizationData({
                  ...memorizationData,
                  evaluation: e.target.value,
                })
              }
              placeholder="تفاصيل إضافية حول التقييم..."
              rows="2"
              className="w-full px-4 py-2 text-right border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#027E01] focus:ring-2 focus:ring-[#027E01]/20 transition-all font-cairo text-sm resize-none"
              dir="rtl"
            />
          </div>

          {/* Feedback and Guidance */}
          <div className="mb-6">
            <label className="block font-cairo text-sm font-bold text-[#243048] mb-2">
              الملاحظات والتوجيهات:
            </label>
            <textarea
              value={memorizationData.feedback}
              onChange={(e) =>
                setMemorizationData({
                  ...memorizationData,
                  feedback: e.target.value,
                })
              }
              placeholder="توجيهات وملاحظات للطالب..."
              rows="3"
              className="w-full px-4 py-2 text-right border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#027E01] focus:ring-2 focus:ring-[#027E01]/20 transition-all font-cairo text-sm resize-none"
              dir="rtl"
            />
          </div>

          {/* Progress Summary */}
          {completions.length > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-center font-cairo text-sm text-green-800">
                {isChapterMethod
                  ? `تم تسجيل ${completions.length} حصة حفظ${
                      completedSurahs.length > 0
                        ? ` • ${completedSurahs.length} سورة مكتملة`
                        : ""
                    }`
                  : `تم تسجيل ${completions.length} حصة حفظ${
                      Math.floor(completions.length / 8) > 0
                        ? ` • ${Math.floor(completions.length / 8)} حزب مكتمل`
                        : ""
                    }`}
              </p>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-[#027E01] hover:bg-[#027E01]/90 text-white font-cairo font-bold text-base py-3 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>حفظ حصة الحفظ</span>
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
            <DialogTitle className="flex items-center gap-2 font-cairo">
              {dialog.type === "error" && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {dialog.type === "success" && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <span>{dialog.title}</span>
            </DialogTitle>
            <DialogDescription className="text-right font-cairo">
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

export default MemorizationSession;
