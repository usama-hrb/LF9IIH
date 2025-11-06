import { useState } from "react";
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
  Filter,
  Users,
  TrendingUp,
} from "lucide-react";
import { formatDateArabic } from "@/lib/utils";

function AttendanceHistoryDialog({ student, open, onOpenChange }) {
  const [filter, setFilter] = useState("all"); // all, present, absent

  const attendanceRecords = student?.attendanceRecords || [];

  const filteredRecords = attendanceRecords.filter((record) => {
    if (filter === "all") return true;
    if (filter === "present") return record.state === "present";
    if (filter === "absent") return record.state === "absent";
    return true;
  });

  const presentCount = attendanceRecords.filter(
    (r) => r.state === "present"
  ).length;
  const absentCount = attendanceRecords.filter(
    (r) => r.state === "absent"
  ).length;
  const totalCount = attendanceRecords.length;
  const attendancePercentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const formatDate = (dateString) => {
    return formatDateArabic(new Date(dateString), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-cairo text-xl">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-[#027E01]" />
              <span>سجل الحضور الكامل - {student?.name}</span>
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
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-cairo text-sm text-blue-800">
                  إجمالي الأيام
                </span>
              </div>
              <p className="font-cairo text-3xl font-bold text-blue-900">
                {totalCount}
              </p>
            </div>

            <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-cairo text-sm text-green-800">
                  أيام الحضور
                </span>
              </div>
              <p className="font-cairo text-3xl font-bold text-green-900">
                {presentCount}
              </p>
            </div>

            <div className="bg-linear-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-cairo text-sm text-red-800">
                  أيام الغياب
                </span>
              </div>
              <p className="font-cairo text-3xl font-bold text-red-900">
                {absentCount}
              </p>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="font-cairo text-sm text-purple-800">
                  نسبة الحضور
                </span>
              </div>
              <p className="font-cairo text-3xl font-bold text-purple-900">
                {attendancePercentage}%
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="font-cairo text-sm font-bold text-gray-700">
                تصفية:
              </span>
            </div>
            <Button
              onClick={() => setFilter("all")}
              className={`font-cairo text-sm ${
                filter === "all"
                  ? "bg-[#027E01] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              الكل ({totalCount})
            </Button>
            <Button
              onClick={() => setFilter("present")}
              className={`font-cairo text-sm ${
                filter === "present"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              حاضر ({presentCount})
            </Button>
            <Button
              onClick={() => setFilter("absent")}
              className={`font-cairo text-sm ${
                filter === "absent"
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              غائب ({absentCount})
            </Button>
          </div>

          {/* Attendance Records List */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="font-cairo text-gray-600 text-lg">
                {filter === "all"
                  ? "لا توجد سجلات حضور"
                  : filter === "present"
                  ? "لا توجد أيام حضور"
                  : "لا توجد أيام غياب"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-cairo font-bold text-lg text-[#027E01] border-b pb-2">
                سجلات الحضور ({filteredRecords.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecords.map((record, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      record.state === "present"
                        ? "bg-green-50 border-green-200 hover:border-green-300"
                        : "bg-red-50 border-red-200 hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {record.state === "present" ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span
                            className={`font-cairo text-sm font-bold ${
                              record.state === "present"
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {record.state === "present" ? "حاضر" : "غائب"}
                          </span>
                        </div>
                        <p className="font-cairo text-sm text-gray-700">
                          {formatDate(record.attendance_date)}
                        </p>
                      </div>
                      <div
                        className={`text-2xl ${
                          record.state === "present"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {record.state === "present" ? "✓" : "✗"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Footer */}
          {filteredRecords.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-cairo text-xs text-gray-600">
                      النتيجة المعروضة
                    </p>
                    <p className="font-cairo text-2xl font-bold text-[#027E01]">
                      {filteredRecords.length}
                    </p>
                  </div>
                  {filter === "all" && (
                    <>
                      <div className="text-center">
                        <p className="font-cairo text-xs text-gray-600">
                          الحضور
                        </p>
                        <p className="font-cairo text-2xl font-bold text-green-700">
                          {presentCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-cairo text-xs text-gray-600">
                          الغياب
                        </p>
                        <p className="font-cairo text-2xl font-bold text-red-700">
                          {absentCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-cairo text-xs text-gray-600">
                          نسبة الحضور
                        </p>
                        <p className="font-cairo text-2xl font-bold text-purple-700">
                          {attendancePercentage}%
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AttendanceHistoryDialog;
