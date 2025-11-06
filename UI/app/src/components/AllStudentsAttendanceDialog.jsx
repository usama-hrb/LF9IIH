import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../components/ui/button";
import {
  X,
  Calendar,
  Check,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Download,
  CalendarDays,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { formatDateArabic } from "@/lib/utils";

function AllStudentsAttendanceDialog({ open, onOpenChange }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, present, absent, not-marked
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  useEffect(() => {
    if (open) {
      fetchAttendanceForDate(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDate]);

  const fetchAttendanceForDate = async (date) => {
    setLoading(true);
    setError("");
    try {
      const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
      console.log("Fetching attendance for date:", formattedDate);
      const response = await apiFetch(`/attendance/all?date=${formattedDate}`);
      console.log("Attendance response:", response);
      setAttendanceData(response || []);
      setCurrentPage(1); // Reset to first page when changing date
    } catch (err) {
      console.error("Error fetching attendance:", err);
      console.error("Error details:", err.message, err.status);
      setError(`فشل تحميل سجل الحضور: ${err.message || "خطأ غير معروف"}`);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Filter students based on status
  const filteredStudents = attendanceData.filter((student) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "present") return student.status === "present";
    if (filterStatus === "absent") return student.status === "absent";
    if (filterStatus === "not-marked") return !student.status;
    return true;
  });

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Statistics
  const presentCount = attendanceData.filter(
    (s) => s.status === "present"
  ).length;
  const absentCount = attendanceData.filter(
    (s) => s.status === "absent"
  ).length;
  const notMarkedCount = attendanceData.filter((s) => !s.status).length;
  const totalCount = attendanceData.length;
  const attendanceRate =
    totalCount > 0
      ? Math.round((presentCount / (totalCount - notMarkedCount || 1)) * 100)
      : 0;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDateDisplay = (date) => {
    return formatDateArabic(date, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Check if selected date is in the future
  const isFutureDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected > today;
  };

  // Get message for future date
  const getFutureDateMessage = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const diffTime = selected - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "هذا التاريخ يخص يوم غد";
    } else if (diffDays === 2) {
      return "هذا التاريخ يخص بعد غد";
    } else {
      return `هذا التاريخ في المستقبل (بعد ${diffDays} أيام)`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-cairo text-xl">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-[#027E01]" />
              <span>سجل حضور جميع الطلاب</span>
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

        <div className="space-y-6">
          {/* Date Navigation */}
          <div className="bg-gradient-to-r from-[#243048] to-[#027E01] text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={goToPreviousDay}
                className="bg-white/20 hover:bg-white/30 text-white border-none cursor-pointer"
                size="sm"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CalendarDays className="h-5 w-5" />
                  <p className="font-cairo text-2xl font-bold">
                    {formatDateDisplay(selectedDate)}
                  </p>
                </div>
                <Button
                  onClick={goToToday}
                  className="bg-white/20 hover:bg-white/30 text-white border-none text-xs cursor-pointer"
                  size="sm"
                >
                  اليوم
                </Button>
              </div>

              <Button
                onClick={goToNextDay}
                className="bg-white/20 hover:bg-white/30 text-white border-none cursor-pointer"
                size="sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-cairo text-sm text-blue-800 font-bold">
                  إجمالي الطلاب
                </span>
              </div>
              <p className="font-cairo text-3xl font-bold text-blue-900">
                {totalCount}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-cairo text-sm text-green-800 font-bold">
                  حاضر
                </span>
              </div>
              <p className="font-cairo text-3xl font-bold text-green-900">
                {presentCount}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border-2 border-red-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-cairo text-sm text-red-800 font-bold">
                  غائب
                </span>
              </div>
              <p className="font-cairo text-3xl font-bold text-red-900">
                {absentCount}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="font-cairo text-sm text-purple-800 font-bold">
                  نسبة الحضور
                </span>
              </div>
              <p className="font-cairo text-3xl font-bold text-purple-900">
                {attendanceRate}%
              </p>
            </div>
          </div>

          {/* Future Date Warning */}
          {isFutureDate() && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 rounded-full p-2">
                  <Calendar className="h-6 w-6 text-yellow-900" />
                </div>
                <div className="flex-1">
                  <h4 className="font-cairo font-bold text-yellow-900 text-lg mb-1">
                    تنبيه: تاريخ مستقبلي
                  </h4>
                  <p className="font-cairo text-yellow-800 text-sm">
                    {getFutureDateMessage()}. لن يتم تسجيل الحضور لهذا اليوم
                    بعد.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="font-cairo text-sm font-bold text-gray-700">
                تصفية:
              </span>
            </div>
            <Button
              onClick={() => setFilterStatus("all")}
              className={`font-cairo text-sm transition-all cursor-pointer ${
                filterStatus === "all"
                  ? "bg-[#027E01] text-white shadow-md scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
              size="sm"
            >
              الكل ({totalCount})
            </Button>
            <Button
              onClick={() => setFilterStatus("present")}
              className={`font-cairo text-sm transition-all cursor-pointer ${
                filterStatus === "present"
                  ? "bg-green-600 text-white shadow-md scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
              size="sm"
            >
              حاضر ({presentCount})
            </Button>
            <Button
              onClick={() => setFilterStatus("absent")}
              className={`font-cairo text-sm transition-all cursor-pointer ${
                filterStatus === "absent"
                  ? "bg-red-600 text-white shadow-md scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
              size="sm"
            >
              غائب ({absentCount})
            </Button>
            <Button
              onClick={() => setFilterStatus("not-marked")}
              className={`font-cairo text-sm transition-all cursor-pointer ${
                filterStatus === "not-marked"
                  ? "bg-gray-600 text-white shadow-md scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
              size="sm"
            >
              غير مسجل ({notMarkedCount})
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#027E01] mx-auto mb-4"></div>
              <p className="font-cairo text-gray-600">جارٍ تحميل البيانات...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="font-cairo text-red-700 text-lg">{error}</p>
            </div>
          )}

          {/* Students List */}
          {!loading && !error && currentStudents.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="font-cairo text-gray-600 text-lg">
                {filterStatus === "all"
                  ? "لا توجد سجلات للطلاب"
                  : "لا توجد نتائج للتصفية المحددة"}
              </p>
            </div>
          )}

          {!loading && !error && currentStudents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cairo font-bold text-lg text-[#027E01]">
                  قائمة الطلاب ({filteredStudents.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-cairo text-xs gap-2"
                >
                  <Download className="h-4 w-4" />
                  تصدير Excel
                </Button>
              </div>

              <div className="space-y-2">
                {currentStudents.map((student, index) => (
                  <div
                    key={student.code || index}
                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      student.status === "present"
                        ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:border-green-300"
                        : student.status === "absent"
                        ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:border-red-300"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-cairo font-bold text-xl ${
                            student.status === "present"
                              ? "bg-green-600 text-white"
                              : student.status === "absent"
                              ? "bg-red-600 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {indexOfFirstStudent + index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-cairo font-bold text-lg text-gray-800">
                            {student.name}
                          </h4>
                          <p className="font-cairo text-sm text-gray-600">
                            الكود: {student.code}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {student.status === "present" ? (
                          <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md">
                            <Check className="h-5 w-5" />
                            <span className="font-cairo font-bold">حاضر</span>
                          </div>
                        ) : student.status === "absent" ? (
                          <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md">
                            <XCircle className="h-5 w-5" />
                            <span className="font-cairo font-bold">غائب</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded-lg shadow-md">
                            <Calendar className="h-5 w-5" />
                            <span className="font-cairo font-bold">
                              غير مسجل
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="font-cairo bg-[#243048] hover:bg-[#243048]/90 disabled:opacity-50 cursor-pointer"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => (
                      <>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span
                            key={`ellipsis-${page}`}
                            className="font-cairo text-gray-500"
                          >
                            ...
                          </span>
                        )}
                        <Button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`font-cairo w-10 h-10 transition-all cursor-pointer ${
                            currentPage === page
                              ? "bg-[#027E01] text-white shadow-lg scale-110"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                          size="sm"
                        >
                          {page}
                        </Button>
                      </>
                    ))}

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="font-cairo bg-[#243048] hover:bg-[#243048]/90 disabled:opacity-50 cursor-pointer"
                    size="sm"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Page Info */}
              <div className="text-center mt-4">
                <p className="font-cairo text-sm text-gray-600">
                  عرض {indexOfFirstStudent + 1} إلى{" "}
                  {Math.min(indexOfLastStudent, filteredStudents.length)} من أصل{" "}
                  {filteredStudents.length} طالب
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AllStudentsAttendanceDialog;
