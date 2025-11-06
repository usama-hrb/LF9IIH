import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Calendar,
  BookOpen,
  TrendingUp,
  DollarSign,
  Download,
  LogOut,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  Award,
  BarChart3,
} from "lucide-react";
import {
  getStudentStatistics,
  getStudentMemorizationHistory,
  getStudentReviewHistory,
  getStudentAttendanceHistory,
  getStudentPaymentHistory,
} from "../lib/student-api";

function StudentDashboard() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [memorizationHistory, setMemorizationHistory] = useState([]);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Get student data from localStorage
    const storedData = localStorage.getItem("student_data");
    const studentCode = localStorage.getItem("student_code");

    if (!storedData || !studentCode) {
      navigate("/student-login");
      return;
    }

    const data = JSON.parse(storedData);
    setStudentData(data);

    // Fetch all data
    fetchAllData(studentCode);
  }, [navigate]);

  const fetchAllData = async (studentCode) => {
    try {
      setLoading(true);
      const [stats, memorization, review, attendance, payments] =
        await Promise.all([
          getStudentStatistics(studentCode),
          getStudentMemorizationHistory(studentCode),
          getStudentReviewHistory(studentCode),
          getStudentAttendanceHistory(studentCode),
          getStudentPaymentHistory(studentCode),
        ]);

      setStatistics(stats);
      setMemorizationHistory(memorization);
      setReviewHistory(review);
      setAttendanceHistory(attendance);
      setPaymentHistory(payments);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("student_code");
    localStorage.removeItem("student_data");
    navigate("/student-login");
  };

  const handleDownloadReport = () => {
    if (!studentData || !statistics) return;

    const pdfContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الطالب - ${studentData.name}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { 
            font-family: 'Cairo', 'Arial', sans-serif; 
            direction: rtl; 
            padding: 20px;
            line-height: 1.6;
          }
          h1 { 
            text-align: center; 
            color: #243048;
            margin-bottom: 30px;
            font-size: 28px;
          }
          h2 {
            color: #027E01;
            border-bottom: 2px solid #027E01;
            padding-bottom: 8px;
            margin-top: 25px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .info-item {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #243048;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: right; 
          }
          th { 
            background-color: #243048; 
            color: white;
          }
          .stat-card {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>تقرير الطالب الشامل</h1>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">الاسم:</span> ${studentData.name}
          </div>
          <div class="info-item">
            <span class="info-label">رقم التعريف:</span> ${studentData.code}
          </div>
          <div class="info-item">
            <span class="info-label">الأستاذ:</span> ${studentData.doctor.name}
          </div>
          <div class="info-item">
            <span class="info-label">رقم الهاتف:</span> ${
              studentData.phone_number
            }
          </div>
          <div class="info-item">
            <span class="info-label">العمر:</span> ${studentData.age} سنة
          </div>
          <div class="info-item">
            <span class="info-label">طريقة الحفظ:</span> ${
              studentData.memorization_method === "chapter"
                ? "حفظ السور"
                : "حفظ الأحزاب"
            }
          </div>
        </div>

        <h2>الإحصائيات العامة</h2>
        
        <div class="stat-card">
          <p><strong>نسبة الحضور:</strong> ${statistics.attendance.rate}% (${
      statistics.attendance.present
    } من ${statistics.attendance.total})</p>
          <p><strong>جلسات الحفظ:</strong> ${
            statistics.memorization.total_sessions
          }</p>
          <p><strong>جلسات المراجعة:</strong> ${
            statistics.memorization.total_review_sessions
          }</p>
          <p><strong>متوسط التقييم:</strong> ${
            statistics.memorization.average_rating
          } / 5</p>
          ${
            statistics.memorization.completed_surahs > 0
              ? `<p><strong>السور المكتملة:</strong> ${statistics.memorization.completed_surahs}</p>`
              : ""
          }
        </div>

        <h2>آخر جلسات الحفظ</h2>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>التفاصيل</th>
              <th>التقييم</th>
            </tr>
          </thead>
          <tbody>
            ${memorizationHistory
              .slice(0, 10)
              .map(
                (session) => `
              <tr>
                <td>${session.completion_date || "-"}</td>
                <td>${
                  session.type === "chapter"
                    ? `${session.surah_name || ""} (${
                        session.verse_from || ""
                      } - ${session.verse_to || ""})`
                    : `حزب ${session.hizb_number || ""} - ثُمن ${
                        session.eighth_number || ""
                      }`
                }</td>
                <td>${session.rating ? "⭐".repeat(session.rating) : "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <h2>سجل المدفوعات</h2>
        <table>
          <thead>
            <tr>
              <th>الشهر/السنة</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${paymentHistory
              .slice(0, 12)
              .map(
                (payment) => `
              <tr>
                <td>${payment.date}</td>
                <td>${payment.amount.toFixed(2)} درهم</td>
              </tr>
            `
              )
              .join("")}
            <tr style="background: #027E01; color: white; font-weight: bold;">
              <td>الإجمالي</td>
              <td>${statistics.payments.total_amount.toFixed(2)} درهم</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>تم إنشاء هذا التقرير في ${new Date().toLocaleDateString(
            "ar-MA"
          )}</p>
          <p>نظام إدارة دار القرآن</p>
        </div>
      </body>
      </html>
    `;

    const pdfWindow = window.open("", "_blank");
    pdfWindow.document.write(pdfContent);
    pdfWindow.document.close();

    setTimeout(() => {
      pdfWindow.print();
    }, 250);
  };

  const getMonthName = (month) => {
    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    return months[month - 1] || "";
  };

  if (loading || !studentData || !statistics) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#027E01] mx-auto mb-4" />
          <p className="font-cairo text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out forwards" }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#027E01] text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                {studentData.name.charAt(0)}
              </div>
              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-bold font-cairo text-[#243048]">
                  {studentData.name}
                </h1>
                <p className="text-gray-600 font-cairo text-sm">
                  رقم التعريف: {studentData.code}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadReport}
                className="bg-[#243048] hover:bg-[#243048]/90 text-white font-cairo flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                تحميل التقرير
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="font-cairo flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out 0.2s forwards" }}
        >
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#027E01]">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-gray-600 font-cairo text-sm mb-1">
                  نسبة الحضور
                </p>
                <p className="text-3xl font-bold text-[#243048] font-cairo">
                  {statistics.attendance.rate}%
                </p>
              </div>
              <div className="bg-[#027E01]/10 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-[#027E01]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-gray-600 font-cairo text-sm mb-1">
                  جلسات الحفظ
                </p>
                <p className="text-3xl font-bold text-[#243048] font-cairo">
                  {statistics.memorization.total_sessions}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-gray-600 font-cairo text-sm mb-1">
                  متوسط التقييم
                </p>
                <p className="text-3xl font-bold text-[#243048] font-cairo">
                  {statistics.memorization.average_rating}/5
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <Star className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-gray-600 font-cairo text-sm mb-1">
                  إجمالي المدفوعات
                </p>
                <p className="text-2xl font-bold text-[#243048] font-cairo">
                  {statistics.payments.total_amount.toFixed(2)} درهم
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-full">
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Student Info Card */}
        <div
          className="bg-white rounded-lg shadow-md p-6 mb-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out 0.4s forwards" }}
        >
          <h2 className="text-xl font-bold font-cairo text-[#243048] mb-4 text-right">
            المعلومات الشخصية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-[#027E01]" />
              <div className="text-right flex-1">
                <p className="text-xs text-gray-600 font-cairo">ولي الأمر</p>
                <p className="font-bold font-cairo text-[#243048]">
                  {studentData.parent}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-[#027E01]" />
              <div className="text-right flex-1">
                <p className="text-xs text-gray-600 font-cairo">رقم الهاتف</p>
                <p className="font-bold font-cairo text-[#243048]">
                  {studentData.phone_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-[#027E01]" />
              <div className="text-right flex-1">
                <p className="text-xs text-gray-600 font-cairo">
                  تاريخ التسجيل
                </p>
                <p className="font-bold font-cairo text-[#243048]">
                  {new Date(
                    studentData.date_of_registration
                  ).toLocaleDateString("ar-MA")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-[#027E01]" />
              <div className="text-right flex-1">
                <p className="text-xs text-gray-600 font-cairo">الأستاذ</p>
                <p className="font-bold font-cairo text-[#243048]">
                  {studentData.doctor.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-[#027E01]" />
              <div className="text-right flex-1">
                <p className="text-xs text-gray-600 font-cairo">هاتف الأستاذ</p>
                <p className="font-bold font-cairo text-[#243048]">
                  {studentData.doctor.phone_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-[#027E01]" />
              <div className="text-right flex-1">
                <p className="text-xs text-gray-600 font-cairo">طريقة الحفظ</p>
                <p className="font-bold font-cairo text-[#243048]">
                  {studentData.memorization_method === "chapter"
                    ? "حفظ السور"
                    : "حفظ الأحزاب"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2 border-b">
            {[
              { id: "overview", label: "نظرة عامة", icon: BarChart3 },
              { id: "memorization", label: "سجل الحفظ", icon: BookOpen },
              { id: "review", label: "سجل المراجعة", icon: TrendingUp },
              { id: "attendance", label: "سجل الحضور", icon: CheckCircle },
              { id: "payments", label: "سجل المدفوعات", icon: DollarSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-cairo text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "text-[#027E01] border-b-2 border-[#027E01]"
                    : "text-gray-600 hover:text-[#027E01]"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-cairo text-[#243048] text-right mb-4">
                الإحصائيات التفصيلية
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-bold font-cairo text-green-800 mb-2">
                    الحضور
                  </h4>
                  <div className="space-y-2 text-sm font-cairo">
                    <p>إجمالي الجلسات: {statistics.attendance.total}</p>
                    <p>الحضور: {statistics.attendance.present}</p>
                    <p>الغياب: {statistics.attendance.absent}</p>
                    <p>النسبة: {statistics.attendance.rate}%</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold font-cairo text-blue-800 mb-2">
                    الحفظ والمراجعة
                  </h4>
                  <div className="space-y-2 text-sm font-cairo">
                    <p>جلسات الحفظ: {statistics.memorization.total_sessions}</p>
                    <p>
                      جلسات المراجعة:{" "}
                      {statistics.memorization.total_review_sessions}
                    </p>
                    {statistics.memorization.completed_surahs > 0 && (
                      <p>
                        السور المكتملة:{" "}
                        {statistics.memorization.completed_surahs}
                      </p>
                    )}
                    <p>
                      متوسط التقييم: {statistics.memorization.average_rating}/5
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-bold font-cairo text-yellow-800 mb-2">
                    المدفوعات
                  </h4>
                  <div className="space-y-2 text-sm font-cairo">
                    <p>عدد المدفوعات: {statistics.payments.total_count}</p>
                    <p>
                      المبلغ الإجمالي:{" "}
                      {statistics.payments.total_amount.toFixed(2)} درهم
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center">
                    <Award className="h-16 w-16 text-purple-500 mx-auto mb-2" />
                    <p className="font-bold font-cairo text-purple-800">
                      طالب مميز!
                    </p>
                    <p className="text-sm font-cairo text-purple-600">
                      استمر في التفوق
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "memorization" && (
            <div>
              <h3 className="text-lg font-bold font-cairo text-[#243048] text-right mb-4">
                سجل جلسات الحفظ
              </h3>
              {memorizationHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#243048] text-white">
                        <th className="p-3 font-cairo">التاريخ</th>
                        <th className="p-3 font-cairo">التفاصيل</th>
                        <th className="p-3 font-cairo">التقييم</th>
                        <th className="p-3 font-cairo">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memorizationHistory.map((session, index) => (
                        <tr
                          key={session.id}
                          className={index % 2 === 0 ? "bg-gray-50" : ""}
                        >
                          <td className="p-3 font-cairo">
                            {session.completion_date || "-"}
                          </td>
                          <td className="p-3 font-cairo">
                            {session.type === "chapter"
                              ? `${session.surah_name || ""} (${
                                  session.verse_from || ""
                                }-${session.verse_to || ""})`
                              : `حزب ${session.hizb_number || ""} - ثُمن ${
                                  session.eighth_number || ""
                                }`}
                          </td>
                          <td className="p-3 font-cairo">
                            {session.rating ? (
                              <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < session.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 font-cairo text-sm">
                            {session.quick_notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 font-cairo py-8">
                  لا توجد جلسات حفظ مسجلة
                </p>
              )}
            </div>
          )}

          {activeTab === "review" && (
            <div>
              <h3 className="text-lg font-bold font-cairo text-[#243048] text-right mb-4">
                سجل جلسات المراجعة
              </h3>
              {reviewHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#243048] text-white">
                        <th className="p-3 font-cairo">التاريخ</th>
                        <th className="p-3 font-cairo">التفاصيل</th>
                        <th className="p-3 font-cairo">التقييم</th>
                        <th className="p-3 font-cairo">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewHistory.map((session, index) => (
                        <tr
                          key={session.id}
                          className={index % 2 === 0 ? "bg-gray-50" : ""}
                        >
                          <td className="p-3 font-cairo">
                            {session.completion_date || "-"}
                          </td>
                          <td className="p-3 font-cairo">
                            {session.type === "chapter"
                              ? `${session.surah_name || ""} (${
                                  session.verse_from || ""
                                }-${session.verse_to || ""})`
                              : `حزب ${session.hizb_number || ""} - ثُمن ${
                                  session.eighth_number || ""
                                }`}
                          </td>
                          <td className="p-3 font-cairo">
                            {session.rating ? (
                              <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < session.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 font-cairo text-sm">
                            {session.quick_notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 font-cairo py-8">
                  لا توجد جلسات مراجعة مسجلة
                </p>
              )}
            </div>
          )}

          {activeTab === "attendance" && (
            <div>
              <h3 className="text-lg font-bold font-cairo text-[#243048] text-right mb-4">
                سجل الحضور
              </h3>
              {attendanceHistory.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {attendanceHistory.map((record) => (
                    <div
                      key={record.id}
                      className={`p-3 rounded-lg border-2 ${
                        record.state === "present"
                          ? "bg-green-50 border-green-500"
                          : "bg-red-50 border-red-500"
                      }`}
                    >
                      <div className="text-center">
                        {record.state === "present" ? (
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        )}
                        <p className="font-cairo text-sm font-bold">
                          {new Date(record.attendance_date).toLocaleDateString(
                            "ar-MA"
                          )}
                        </p>
                        <p className="font-cairo text-xs text-gray-600">
                          {record.state === "present" ? "حاضر" : "غائب"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 font-cairo py-8">
                  لا توجد سجلات حضور
                </p>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              <h3 className="text-lg font-bold font-cairo text-[#243048] text-right mb-4">
                سجل المدفوعات
              </h3>
              {paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#243048] text-white">
                        <th className="p-3 font-cairo">الشهر/السنة</th>
                        <th className="p-3 font-cairo">المبلغ</th>
                        <th className="p-3 font-cairo">تاريخ الدفع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className={index % 2 === 0 ? "bg-gray-50" : ""}
                        >
                          <td className="p-3 font-cairo">
                            {getMonthName(payment.month)} {payment.year}
                          </td>
                          <td className="p-3 font-cairo font-bold text-[#027E01]">
                            {payment.amount.toFixed(2)} درهم
                          </td>
                          <td className="p-3 font-cairo">
                            {new Date(payment.created_at).toLocaleDateString(
                              "ar-MA"
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-[#027E01] text-white font-bold">
                        <td className="p-3 font-cairo">الإجمالي</td>
                        <td className="p-3 font-cairo" colSpan="2">
                          {statistics.payments.total_amount.toFixed(2)} درهم
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 font-cairo py-8">
                  لا توجد مدفوعات مسجلة
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
