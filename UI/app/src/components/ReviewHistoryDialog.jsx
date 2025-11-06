import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  X,
  Star,
  Calendar,
  BookOpen,
  TrendingUp,
  Award,
  Trash2,
  Edit,
  Save,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { formatDateArabic } from "@/lib/utils";

function ReviewHistoryDialog({
  student,
  open,
  onOpenChange,
  onSessionChanged,
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isChapterMethod = student?.memorization_method === "chapter";
  const apiEndpoint = isChapterMethod ? "chapters" : "quarters";

  useEffect(() => {
    if (open && student) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(
        `/${apiEndpoint}/${student.code}/completions`
      );
      // Filter only REVIEW sessions
      const reviewSessions = (response || []).filter(
        (c) => c.session_type === "review"
      );
      setHistory(reviewSessions);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("فشل تحميل سجل المراجعة");
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: "ضعيف",
      2: "مقبول",
      3: "جيد",
      4: "جيد جداً",
      5: "ممتاز",
    };
    return labels[rating] || "غير مقيّم";
  };

  const getProgressPercentage = () => {
    if (!history.length) return 0;
    if (isChapterMethod) {
      const completedSurahs = history.filter(
        (h) => h.is_surah_completed
      ).length;
      return Math.round((completedSurahs / 114) * 100);
    } else {
      const completedHizbs = history.filter((h) => h.is_hizb_completed).length;
      return Math.round((completedHizbs / 60) * 100);
    }
  };

  const getAverageRating = () => {
    if (!history.length) return 0;
    const ratings = history.filter((h) => h.rating).map((h) => h.rating);
    if (!ratings.length) return 0;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  };

  const getCompletedCount = () => {
    if (isChapterMethod) {
      return history.filter((h) => h.is_surah_completed).length;
    } else {
      return history.filter((h) => h.is_hizb_completed).length;
    }
  };

  const formatDate = (dateString) => {
    return formatDateArabic(new Date(dateString), {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeleteSession = async (sessionCode) => {
    try {
      setLoading(true);
      await apiFetch(`/${apiEndpoint}/${student.code}/delete/${sessionCode}`, {
        method: "DELETE",
      });
      setDeleteConfirm(null);
      setSelectedSession(null);
      await fetchHistory();
      if (onSessionChanged) onSessionChanged();
    } catch (err) {
      console.error("Error deleting session:", err);
      setError("فشل حذف الحصة");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (session) => {
    setEditingSession(session);
    setEditForm({
      rating: session.rating || 0,
      evaluation: session.evaluation || "",
      verse_from: session.verse_from || "",
      verse_to: session.verse_to || "",
    });
  };

  const handleUpdateSession = async () => {
    try {
      setLoading(true);
      const updateData = {
        rating: editForm.rating,
        evaluation: editForm.evaluation,
      };

      if (isChapterMethod && editForm.verse_from && editForm.verse_to) {
        updateData.verse_from = parseInt(editForm.verse_from);
        updateData.verse_to = parseInt(editForm.verse_to);
      }

      await apiFetch(
        `/${apiEndpoint}/${student.code}/update/${editingSession.code}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      setEditingSession(null);
      setEditForm({});
      setSelectedSession(null);
      await fetchHistory();
      if (onSessionChanged) onSessionChanged();
    } catch (err) {
      console.error("Error updating session:", err);
      setError("فشل تحديث الحصة");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between font-cairo text-xl">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-[#027E01]" />
                <span>سجل المراجعة - {student?.name}</span>
              </div>
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#027E01]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="font-cairo text-red-600">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span className="font-cairo text-sm text-blue-800">
                      إجمالي الحصص
                    </span>
                  </div>
                  <p className="font-cairo text-3xl font-bold text-blue-900">
                    {history.length}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span className="font-cairo text-sm text-green-800">
                      {isChapterMethod ? "السور المراجعة" : "الأحزاب المراجعة"}
                    </span>
                  </div>
                  <p className="font-cairo text-3xl font-bold text-green-900">
                    {getCompletedCount()}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span className="font-cairo text-sm text-yellow-800">
                      متوسط التقييم
                    </span>
                  </div>
                  <p className="font-cairo text-3xl font-bold text-yellow-900">
                    {getAverageRating()}/5
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-cairo text-sm text-purple-800">
                      نسبة الإنجاز
                    </span>
                  </div>
                  <p className="font-cairo text-3xl font-bold text-purple-900">
                    {getProgressPercentage()}%
                  </p>
                </div>
              </div>

              {/* Sessions List */}
              {history.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="font-cairo text-gray-600 text-lg">
                    لا توجد حصص مراجعة مسجلة بعد
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-cairo font-bold text-lg text-[#027E01] border-b pb-2">
                    جميع حصص المراجعة ({history.length})
                  </h3>
                  {history.map((session, index) => (
                    <div
                      key={session.code || index}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-[#027E01] transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedSession(session)}
                        >
                          {/* Session Header */}
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-cairo font-bold text-[#027E01]">
                              الحصة #{history.length - index}
                            </span>
                            {(session.is_surah_completed ||
                              session.is_hizb_completed) && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-cairo font-bold flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                مكتملة
                              </span>
                            )}
                          </div>

                          {/* Session Content */}
                          <div className="space-y-1">
                            {isChapterMethod ? (
                              <>
                                {session.surah && (
                                  <p className="font-cairo text-sm">
                                    <span className="text-gray-600">
                                      السورة:{" "}
                                    </span>
                                    <span className="font-bold text-[#243048]">
                                      {session.surah.name}
                                    </span>
                                    {session.verse_from && session.verse_to && (
                                      <span className="text-gray-600">
                                        {" "}
                                        (من آية {session.verse_from} إلى{" "}
                                        {session.verse_to})
                                      </span>
                                    )}
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                {session.hizb_number && (
                                  <p className="font-cairo text-sm">
                                    <span className="text-gray-600">
                                      الحزب:{" "}
                                    </span>
                                    <span className="font-bold text-[#243048]">
                                      {session.hizb_number}
                                    </span>
                                    {session.eighth_number && (
                                      <span className="text-gray-600">
                                        {" "}
                                        - الثمن: {session.eighth_number}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </>
                            )}

                            {/* Rating */}
                            {session.rating && (
                              <div className="flex items-center gap-2">
                                <span className="font-cairo text-xs text-gray-600">
                                  التقييم:
                                </span>
                                <div className="flex gap-1">
                                  {getRatingStars(session.rating)}
                                </div>
                                <span className="font-cairo text-xs text-gray-700 font-bold">
                                  {getRatingLabel(session.rating)}
                                </span>
                              </div>
                            )}

                            {/* Quick Notes */}
                            {session.quick_notes && (
                              <p className="font-cairo text-xs text-gray-600 italic">
                                💡 {session.quick_notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1 text-gray-500 mb-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-cairo text-xs">
                              {formatDate(session.completion_date)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(session);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 h-8 w-8"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(session.code);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 h-8 w-8"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Session Detail Dialog */}
      {selectedSession && (
        <Dialog
          open={!!selectedSession}
          onOpenChange={() => setSelectedSession(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl flex items-center justify-between">
                <span>تفاصيل حصة المراجعة</span>
                <Button
                  onClick={() => setSelectedSession(null)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Session Info */}
              <div className="bg-gradient-to-r from-[#027E01] to-[#027E01]/80 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    {isChapterMethod && selectedSession.surah && (
                      <h3 className="font-cairo text-xl font-bold mb-1">
                        {selectedSession.surah.name}
                      </h3>
                    )}
                    {!isChapterMethod && selectedSession.hizb_number && (
                      <h3 className="font-cairo text-xl font-bold mb-1">
                        الحزب {selectedSession.hizb_number} - الثمن{" "}
                        {selectedSession.eighth_number}
                      </h3>
                    )}
                    <p className="font-cairo text-sm opacity-90">
                      {formatDate(selectedSession.completion_date)}
                    </p>
                  </div>
                  {(selectedSession.is_surah_completed ||
                    selectedSession.is_hizb_completed) && (
                    <Award className="h-12 w-12 opacity-80" />
                  )}
                </div>
              </div>

              {/* Verse Range (for chapter method) */}
              {isChapterMethod &&
                selectedSession.verse_from &&
                selectedSession.verse_to && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="font-cairo text-sm text-blue-800">
                      <span className="font-bold">نطاق الآيات:</span> من الآية{" "}
                      {selectedSession.verse_from} إلى الآية{" "}
                      {selectedSession.verse_to}
                    </p>
                  </div>
                )}

              {/* Rating */}
              {selectedSession.rating && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="font-cairo text-sm text-gray-700 mb-2 font-bold">
                    التقييم:
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {getRatingStars(selectedSession.rating)}
                    </div>
                    <span className="font-cairo text-lg font-bold text-yellow-800">
                      {getRatingLabel(selectedSession.rating)}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Notes */}
              {selectedSession.quick_notes && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="font-cairo text-sm text-gray-700 mb-1 font-bold">
                    ملاحظات سريعة:
                  </p>
                  <p className="font-cairo text-sm text-purple-800">
                    {selectedSession.quick_notes}
                  </p>
                </div>
              )}

              {/* Evaluation */}
              {selectedSession.evaluation && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="font-cairo text-sm text-gray-700 mb-1 font-bold">
                    التقييم التفصيلي:
                  </p>
                  <p className="font-cairo text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedSession.evaluation}
                  </p>
                </div>
              )}

              {/* Feedback */}
              {selectedSession.feedback && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="font-cairo text-sm text-gray-700 mb-1 font-bold">
                    الملاحظات والتوجيهات:
                  </p>
                  <p className="font-cairo text-sm text-green-800 whitespace-pre-wrap">
                    {selectedSession.feedback}
                  </p>
                </div>
              )}

              {/* Next Session (if planned) */}
              {((isChapterMethod && selectedSession.next_surah) ||
                (!isChapterMethod && selectedSession.next_hizb_number)) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-cairo text-sm text-gray-700 mb-1 font-bold">
                    الحصة القادمة المخططة:
                  </p>
                  {isChapterMethod && selectedSession.next_surah && (
                    <p className="font-cairo text-sm text-blue-800">
                      {selectedSession.next_surah.name}
                      {selectedSession.next_verse_from &&
                        selectedSession.next_verse_to &&
                        ` (من آية ${selectedSession.next_verse_from} إلى ${selectedSession.next_verse_to})`}
                    </p>
                  )}
                  {!isChapterMethod && selectedSession.next_hizb_number && (
                    <p className="font-cairo text-sm text-blue-800">
                      الحزب {selectedSession.next_hizb_number}
                      {selectedSession.next_eighth_number &&
                        ` - الثمن ${selectedSession.next_eighth_number}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Session Dialog */}
      {editingSession && (
        <Dialog
          open={!!editingSession}
          onOpenChange={() => {
            setEditingSession(null);
            setEditForm({});
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                <span>تعديل حصة المراجعة</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Session Info (Read-only) */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-cairo text-sm text-gray-700">
                  {isChapterMethod && editingSession.surah && (
                    <span className="font-bold">
                      {editingSession.surah.name}
                    </span>
                  )}
                  {!isChapterMethod && editingSession.hizb_number && (
                    <span className="font-bold">
                      الحزب {editingSession.hizb_number} - الثمن{" "}
                      {editingSession.eighth_number}
                    </span>
                  )}
                </p>
              </div>

              {/* Verse Range (for chapter method) */}
              {isChapterMethod && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-cairo text-sm font-bold text-gray-700 mb-1">
                      من آية
                    </label>
                    <Input
                      type="number"
                      value={editForm.verse_from}
                      onChange={(e) =>
                        setEditForm({ ...editForm, verse_from: e.target.value })
                      }
                      className="text-right font-cairo"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block font-cairo text-sm font-bold text-gray-700 mb-1">
                      إلى آية
                    </label>
                    <Input
                      type="number"
                      value={editForm.verse_to}
                      onChange={(e) =>
                        setEditForm({ ...editForm, verse_to: e.target.value })
                      }
                      className="text-right font-cairo"
                      dir="rtl"
                    />
                  </div>
                </div>
              )}

              {/* Rating */}
              <div>
                <label className="block font-cairo text-sm font-bold text-gray-700 mb-2">
                  التقييم
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEditForm({ ...editForm, rating: star })}
                      className={`text-3xl transition-all ${
                        star <= editForm.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-center font-cairo text-sm text-gray-600 mt-1">
                  {editForm.rating === 0 && "لم يتم التقييم"}
                  {editForm.rating === 1 && "ضعيف"}
                  {editForm.rating === 2 && "مقبول"}
                  {editForm.rating === 3 && "جيد"}
                  {editForm.rating === 4 && "جيد جداً"}
                  {editForm.rating === 5 && "ممتاز"}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-cairo text-sm font-bold text-gray-700 mb-1">
                  الملاحظات
                </label>
                <textarea
                  value={editForm.evaluation}
                  onChange={(e) =>
                    setEditForm({ ...editForm, evaluation: e.target.value })
                  }
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-cairo text-sm text-right"
                  dir="rtl"
                  placeholder="أضف ملاحظاتك هنا..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleUpdateSession}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-cairo font-bold flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  حفظ التعديلات
                </Button>
                <Button
                  onClick={() => {
                    setEditingSession(null);
                    setEditForm({});
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-cairo font-bold"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Dialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                <span>تأكيد الحذف</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="font-cairo text-sm text-gray-700 text-right">
                هل أنت متأكد من حذف هذه الحصة؟ لا يمكن التراجع عن هذا الإجراء.
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleDeleteSession(deleteConfirm)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-cairo font-bold flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  نعم، احذف
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-cairo font-bold"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default ReviewHistoryDialog;
