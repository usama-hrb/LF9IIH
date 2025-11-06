import { Button } from "../components/ui/button";
import { Input } from "../../components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import {
  Search,
  Users,
  Settings,
  BookOpen,
  DollarSign,
  TrendingUp,
  Calendar,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { listStudents } from "../lib/students";
import {
  createPayment,
  getStudentPayments,
  getAllPayments,
  getTotalPayments,
} from "../lib/payments";

function TeacherDashboard() {
  const navigate = useNavigate();

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    String(currentMonth).padStart(2, "0")
  ); // Auto-set to current month
  const [selectedYear, setSelectedYear] = useState(String(currentYear)); // Auto-set to current year
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMonth, setReportMonth] = useState(
    String(currentMonth).padStart(2, "0")
  ); // Report month selection
  const [reportYear, setReportYear] = useState(String(currentYear)); // Report year selection
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [dialog, setDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null, // Add callback for confirmation actions
    confirmText: null, // Add custom confirm button text
    showCancel: false, // Add flag to show cancel button
  });
  const [_pendingPaymentOverride, setPendingPaymentOverride] = useState(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest(".search-container")) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const fetchStudents = async () => {
    try {
      const data = await listStudents();
      console.log("Fetched students:", data); // Debug log
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setDialog({
        open: true,
        type: "error",
        title: "خطأ",
        message: "فشل في تحميل قائمة الطلاب",
      });
    }
  };

  const fetchTotalPayments = async () => {
    try {
      const data = await getTotalPayments();
      setTotalPayments(data?.total || 0);
    } catch (error) {
      console.error("Error fetching total payments:", error);
    }
  };

  const fetchMonthlyReport = useCallback(async (month, year) => {
    setReportLoading(true);
    try {
      const data = await getAllPayments(month, year);
      setMonthlyReport(data || []);
    } catch (error) {
      console.error("Error fetching monthly report:", error);
      setDialog({
        open: true,
        type: "error",
        title: "خطأ",
        message: "فشل في تحميل التقرير الشهري",
      });
    } finally {
      setReportLoading(false);
    }
  }, []);

  // Fetch students on component mount - placed after fetchMonthlyReport is defined
  useEffect(() => {
    fetchStudents();
    fetchTotalPayments();
    fetchMonthlyReport(currentMonth, currentYear); // Auto-load monthly report on mount
  }, [fetchMonthlyReport, currentMonth, currentYear]);

  // Fetch report when month/year selection changes
  useEffect(() => {
    const month = parseInt(reportMonth);
    const year = parseInt(reportYear);
    if (month && year) {
      fetchMonthlyReport(month, year);
    }
  }, [reportMonth, reportYear, fetchMonthlyReport]);

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    console.log("Search query:", query); // Debug log
    console.log("Total students:", students.length); // Debug log
    if (students.length > 0) {
      console.log("First student data:", students[0]); // Debug: check structure
    }

    if (query.trim().length > 0) {
      const searchLower = query.toLowerCase().trim();

      // Filter and score students based on query
      const scoredStudents = students
        .map((student) => {
          // Handle both formats: {first_name, last_name} OR {name}
          const firstName = (student.first_name || "").toLowerCase();
          const lastName = (student.last_name || "").toLowerCase();
          const combinedName =
            student.name ||
            `${student.first_name || ""} ${student.last_name || ""}`.trim();
          const fullName = combinedName.trim();
          const code = (student.code || "").toLowerCase();
          const fullNameLower = fullName.toLowerCase();

          let score = 0;

          // Highest priority: starts with query
          if (firstName.startsWith(searchLower)) score += 100;
          if (lastName.startsWith(searchLower)) score += 90;
          if (fullNameLower.startsWith(searchLower)) score += 95;
          if (code.startsWith(searchLower)) score += 85;

          // Medium priority: word starts with query
          const words = fullNameLower.split(" ");
          if (words.some((word) => word.startsWith(searchLower))) score += 50;

          // Lower priority: contains query
          if (firstName.includes(searchLower)) score += 30;
          if (lastName.includes(searchLower)) score += 25;
          if (code.includes(searchLower)) score += 20;
          if (fullNameLower.includes(searchLower)) score += 15;

          return { student, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ student }) => student);

      console.log("Filtered students:", scoredStudents.length); // Debug log
      setFilteredStudents(scoredStudents);
      setShowSuggestions(scoredStudents.length > 0);
    } else {
      setFilteredStudents([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectStudent = (student) => {
    // Handle both formats: {first_name, last_name} OR {name}
    const fullName =
      student.name ||
      `${student.first_name || ""} ${student.last_name || ""}`.trim();

    setSelectedStudent({
      id: student.id,
      code: student.code,
      name: fullName || "بدون اسم",
    });
    setSearchQuery(fullName || "");
    setShowSuggestions(false);
    setFilteredStudents([]);
  };

  const handleStudentSearch = () => {
    if (!searchQuery.trim()) {
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في البحث",
        message: "الرجاء إدخال اسم الطالب أو رقم التعريف",
      });
      return;
    }

    // Search in the students list with safe null handling
    const query = searchQuery.toLowerCase().trim();
    const foundStudent = students.find((student) => {
      const code = (student.code || "").toLowerCase();
      const firstName = (student.first_name || "").toLowerCase();
      const lastName = (student.last_name || "").toLowerCase();
      const combinedName =
        student.name ||
        `${student.first_name || ""} ${student.last_name || ""}`.trim();
      const fullName = combinedName.toLowerCase();

      return (
        code.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query)
      );
    });

    if (foundStudent) {
      const fullName =
        foundStudent.name ||
        `${foundStudent.first_name || ""} ${
          foundStudent.last_name || ""
        }`.trim();
      setSelectedStudent({
        id: foundStudent.id,
        code: foundStudent.code,
        name: fullName || "بدون اسم",
      });
      setShowSuggestions(false);
      setDialog({
        open: true,
        type: "success",
        title: "تم العثور على الطالب",
        message: `تم العثور على الطالب: ${fullName || "بدون اسم"}`,
      });
    } else {
      setDialog({
        open: true,
        type: "error",
        title: "لم يتم العثور على الطالب",
        message: "لا يوجد طالب بهذا الاسم أو رقم التعريف",
      });
    }
  };

  const handleConfirmPaymentOverride = async (studentCode, paymentData) => {
    try {
      setLoading(true);
      setDialog({ ...dialog, open: false }); // Close confirmation dialog

      // Call API to update payment
      await createPayment(studentCode, paymentData);

      // Clear payment amount and reset month/year to current
      setSelectedMonth(String(currentMonth).padStart(2, "0"));
      setSelectedYear(String(currentYear));
      setPaymentAmount("");
      setPendingPaymentOverride(null);

      // Refresh total payments and monthly report
      await fetchTotalPayments();
      await fetchMonthlyReport(parseInt(reportMonth), parseInt(reportYear)); // Refresh report with selected month

      // Show success message
      setDialog({
        open: true,
        type: "success",
        title: "تم التحديث بنجاح",
        message: `تم تحديث الدفع بنجاح للطالب: ${
          selectedStudent.name
        }\n\nالشهر: ${getMonthName(paymentData.month)} ${
          paymentData.year
        }\nالمبلغ الجديد: ${paymentData.amount} درهم`,
      });
    } catch (error) {
      console.error("Error updating payment:", error);
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في التحديث",
        message:
          error.message || "فشل في تحديث الدفع. الرجاء المحاولة مرة أخرى",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    // Check if student is selected
    if (!selectedStudent) {
      setDialog({
        open: true,
        type: "error",
        title: "خطأ",
        message: "الرجاء البحث عن الطالب أولاً",
      });
      return;
    }

    // Check if all payment fields are filled
    if (!selectedMonth || !selectedYear || !paymentAmount) {
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في البيانات",
        message: "الرجاء إدخال جميع معلومات الدفع (الشهر، السنة، المبلغ)",
      });
      return;
    }

    // Validate amount
    if (parseFloat(paymentAmount) <= 0) {
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في المبلغ",
        message: "يجب أن يكون المبلغ أكبر من صفر",
      });
      return;
    }

    // Check if selected date is not the current month
    const monthNum = parseInt(selectedMonth);
    const yearNum = parseInt(selectedYear);
    const selectedDate = new Date(yearNum, monthNum - 1);
    const currentDate = new Date(currentYear, currentMonth - 1);

    // Show warning for both past and future months
    if (selectedDate.getTime() !== currentDate.getTime()) {
      const isPast = selectedDate < currentDate;

      setDialog({
        open: true,
        type: "error",
        title: isPast ? "⚠️ تحذير: شهر سابق" : "⚠️ تحذير: شهر مستقبلي",
        message: isPast
          ? `لقد اخترت شهر ${getMonthName(
              monthNum
            )} ${yearNum}، وهو شهر سابق.\n\nهل أنت متأكد من أنك تريد تسجيل دفع لهذا الشهر؟`
          : `لقد اخترت شهر ${getMonthName(
              monthNum
            )} ${yearNum}، وهو شهر مستقبلي.\n\nهل أنت متأكد من أنك تريد تسجيل دفع لهذا الشهر؟`,
        showCancel: true,
        confirmText: "نعم، متأكد",
        onConfirm: () => processPayment(monthNum, yearNum),
      });
      return;
    }

    // Proceed with payment
    await processPayment(monthNum, yearNum);
  };

  const processPayment = async (monthNum, yearNum) => {
    try {
      setLoading(true);
      setDialog({ ...dialog, open: false }); // Close warning dialog if open

      // Check if student already paid for this month/year
      const payments = await getStudentPayments(selectedStudent.code);

      // Check if a payment already exists for this month/year
      const existingPayment = payments?.find((payment) => {
        // Parse the date field which is in format "MM-YYYY" or similar
        const dateParts = payment.date?.split("-");
        if (dateParts && dateParts.length >= 2) {
          const paymentMonth = parseInt(dateParts[0]);
          const paymentYear = parseInt(dateParts[1]);
          return paymentMonth === monthNum && paymentYear === yearNum;
        }
        return false;
      });

      if (existingPayment) {
        // Store the pending payment data for override
        const paymentData = {
          month: monthNum,
          year: yearNum,
          amount: parseFloat(paymentAmount),
        };
        setPendingPaymentOverride(paymentData);

        setDialog({
          open: true,
          type: "error",
          title: "⚠️ دفع موجود بالفعل",
          message: `الطالب ${
            selectedStudent.name
          } قد دفع بالفعل لشهر ${getMonthName(
            monthNum
          )} ${yearNum}.\n\nالمبلغ السابق: ${
            existingPayment.amount
          } درهم\nالمبلغ الجديد: ${paymentAmount} درهم\n\nهل تريد تحديث المبلغ؟`,
          showCancel: true,
          confirmText: "نعم، تحديث المبلغ",
          onConfirm: () =>
            handleConfirmPaymentOverride(selectedStudent.code, paymentData),
        });
        setLoading(false);
        return;
      }

      // Prepare payment data
      const paymentData = {
        month: monthNum,
        year: yearNum,
        amount: parseFloat(paymentAmount),
      };

      // Call API to create/update payment
      await createPayment(selectedStudent.code, paymentData);

      // Clear payment amount and reset month/year to current
      setSelectedMonth(String(currentMonth).padStart(2, "0"));
      setSelectedYear(String(currentYear));
      setPaymentAmount("");

      // Refresh total payments and monthly report
      await fetchTotalPayments();
      await fetchMonthlyReport(parseInt(reportMonth), parseInt(reportYear)); // Refresh report with selected month

      // Show success message
      setDialog({
        open: true,
        type: "success",
        title: "تم التسجيل بنجاح",
        message: `تم تسجيل الدفع بنجاح للطالب: ${
          selectedStudent.name
        }\n\nالشهر: ${getMonthName(
          monthNum
        )} ${yearNum}\nالمبلغ: ${paymentAmount} درهم`,
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      setDialog({
        open: true,
        type: "error",
        title: "خطأ في التسجيل",
        message:
          error.message || "فشل في تسجيل الدفع. الرجاء المحاولة مرة أخرى",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPayments = async () => {
    // Check if student is selected
    if (!selectedStudent) {
      setDialog({
        open: true,
        type: "error",
        title: "خطأ",
        message: "الرجاء البحث عن الطالب أولاً",
      });
      return;
    }

    try {
      setLoading(true);

      // Fetch student's payment history
      const payments = await getStudentPayments(selectedStudent.code);

      if (!payments || payments.length === 0) {
        setDialog({
          open: true,
          type: "info",
          title: "لا توجد مدفوعات",
          message: `لا توجد مدفوعات مسجلة للطالب: ${selectedStudent.name}`,
        });
        return;
      }

      // Generate PDF-ready content
      const pdfContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير مدفوعات ${selectedStudent.name}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
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
            .info {
              margin-bottom: 20px;
              font-size: 16px;
            }
            .info strong {
              color: #243048;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 14px;
            }
            th, td { 
              border: 2px solid #ddd; 
              padding: 12px; 
              text-align: right; 
            }
            th { 
              background-color: #243048; 
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .total { 
              font-weight: bold; 
              background-color: #027E01; 
              color: white;
              font-size: 16px;
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
          <h1>تقرير مدفوعات الطالب</h1>
          <div class="info">
            <p><strong>اسم الطالب:</strong> ${selectedStudent.name}</p>
            <p><strong>رقم التعريف:</strong> ${selectedStudent.code}</p>
            <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString(
              "ar-MA"
            )}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>التاريخ (شهر-سنة)</th>
                <th>المبلغ (درهم)</th>
              </tr>
            </thead>
            <tbody>
              ${payments
                .map(
                  (payment) => `
                <tr>
                  <td>${payment.date}</td>
                  <td>${parseFloat(payment.amount).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
              <tr class="total">
                <td>المجموع</td>
                <td>${payments
                  .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                  .toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة دار القرآن</p>
          </div>
        </body>
        </html>
      `;

      // Create a new window for PDF generation
      const pdfWindow = window.open("", "_blank");
      pdfWindow.document.write(pdfContent);
      pdfWindow.document.close();

      // Wait for content to load, then trigger print dialog (user can save as PDF)
      setTimeout(() => {
        pdfWindow.print();
      }, 250);

      setDialog({
        open: true,
        type: "success",
        title: "جاهز للتحميل",
        message: `تم تحضير تقرير مدفوعات الطالب ${selectedStudent.name}.\n\nفي نافذة الطباعة، اختر "حفظ كـ PDF" لتحميل الملف.`,
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      setDialog({
        open: true,
        type: "error",
        title: "خطأ",
        message: "فشل في تحميل مدفوعات الطالب",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedStudent(null);
    setSelectedMonth(String(currentMonth).padStart(2, "0")); // Reset to current month
    setSelectedYear(String(currentYear)); // Reset to current year
    setPaymentAmount("");
    setShowSuggestions(false);
    setFilteredStudents([]);
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

  const handlePrintMonthlyReport = () => {
    if (monthlyReport.length === 0) return;

    const totalAmount = monthlyReport.reduce((sum, s) => sum + s.amount, 0);
    const paidCount = monthlyReport.filter((s) => s.amount > 0).length;
    const selectedReportMonth = parseInt(reportMonth);
    const selectedReportYear = parseInt(reportYear);

    const pdfContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير مدفوعات ${getMonthName(
          selectedReportMonth
        )} ${selectedReportYear}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
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
          .info {
            margin-bottom: 20px;
            font-size: 16px;
          }
          .info strong {
            color: #243048;
          }
          .summary { 
            background: #f5f5f5; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 8px;
            border: 2px solid #ddd;
          }
          .summary p {
            margin: 8px 0;
            font-size: 16px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 14px;
          }
          th, td { 
            border: 2px solid #ddd; 
            padding: 12px; 
            text-align: right; 
          }
          th { 
            background-color: #243048; 
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) { 
            background-color: #f9f9f9; 
          }
          .paid { 
            background-color: #d4edda !important;
          }
          .unpaid { 
            background-color: #f8d7da !important;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-paid {
            background-color: #027E01;
            color: white;
          }
          .status-unpaid {
            background-color: #dc3545;
            color: white;
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
        <h1>تقرير مدفوعات الشهر - ${getMonthName(
          selectedReportMonth
        )} ${selectedReportYear}</h1>
        <div class="info">
          <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString(
            "ar-MA"
          )}</p>
        </div>
        <div class="summary">
          <p><strong>إجمالي المدفوعات:</strong> ${totalAmount.toFixed(
            2
          )} درهم</p>
          <p><strong>عدد الطلاب الذين دفعوا:</strong> ${paidCount} من ${
      monthlyReport.length
    }</p>
          <p><strong>عدد الطلاب غير المدفوعين:</strong> ${
            monthlyReport.length - paidCount
          }</p>
          <p><strong>نسبة المدفوعات:</strong> ${(
            (paidCount / monthlyReport.length) *
            100
          ).toFixed(1)}%</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطالب</th>
              <th>المبلغ (درهم)</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyReport
              .map(
                (student, index) => `
              <tr class="${student.amount > 0 ? "paid" : "unpaid"}">
                <td>${index + 1}</td>
                <td>${student.student_name}</td>
                <td>${student.amount > 0 ? student.amount.toFixed(2) : "-"}</td>
                <td>
                  <span class="status-badge ${
                    student.amount > 0 ? "status-paid" : "status-unpaid"
                  }">
                    ${student.amount > 0 ? "مدفوع" : "غير مدفوع"}
                  </span>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة دار القرآن</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window for PDF generation
    const pdfWindow = window.open("", "_blank");
    pdfWindow.document.write(pdfContent);
    pdfWindow.document.close();

    // Wait for content to load, then trigger print dialog (user can save as PDF)
    setTimeout(() => {
      pdfWindow.print();
    }, 250);

    setDialog({
      open: true,
      type: "success",
      title: "جاهز للتحميل",
      message: `تم تحضير تقرير ${getMonthName(
        selectedReportMonth
      )} ${selectedReportYear}.\n\nفي نافذة الطباعة، اختر "حفظ كـ PDF" لتحميل الملف.`,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-4 md:mb-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out forwards" }}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
            {/* Settings Icon Button */}
            <Button className="bg-[#243048] hover:bg-[#243048]/90 text-white p-2 sm:p-2.5 md:p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg shrink-0 cursor-pointer">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Page Title - Center */}
            <div className="flex-1 text-center min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold font-cairo text-[#243048] truncate px-1">
                لوحة تحكم الأستاذ
              </h1>
              <p className="text-gray-600 font-cairo mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm hidden sm:block">
                إدارة معلومات الطلاب وتتبع الأداء
              </p>
            </div>

            {/* Students List Button */}
            <Button
              onClick={() => navigate("/teacher/students")}
              className="bg-[#027E01] hover:bg-[#027E01]/90 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-bold font-cairo transition-all duration-300 hover:scale-105 hover:shadow-lg shrink-0 whitespace-nowrap cursor-pointer"
            >
              لائحة الطلاب
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 opacity-0"
          style={{ animation: "fadeInUp 0.6s ease-out 0.2s forwards" }}
        >
          {/* Total Students */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#027E01] hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-gray-600 font-cairo text-sm mb-1">
                  إجمالي الطلاب
                </p>
                <p className="text-3xl font-bold text-[#243048] font-cairo">
                  {students.length}
                </p>
              </div>
              <div className="bg-[#027E01]/10 p-3 rounded-full">
                <Users className="h-8 w-8 text-[#027E01]" />
              </div>
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-gray-600 font-cairo text-sm mb-1">
                  إجمالي المدفوعات
                </p>
                <p className="text-2xl font-bold text-[#243048] font-cairo">
                  {parseFloat(totalPayments).toFixed(2)} درهم
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-full">
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Monthly Payments Count */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-gray-600 font-cairo text-sm mb-1">
                  المدفوعات هذا الشهر
                </p>
                <p className="text-3xl font-bold text-[#243048] font-cairo">
                  {monthlyReport.filter((s) => s.amount > 0).length}
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Student Section */}
        <div
          className="space-y-4 sm:space-y-6 opacity-0"
          style={{ animation: "fadeIn 0.6s ease-out 0.4s forwards" }}
        >
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-cairo text-[#243048] mb-3 sm:mb-4 text-right">
              البحث عن طالب
            </h2>
            <div className="space-y-3">
              <div className="flex justify-center items-center gap-2 sm:gap-3 relative search-container">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleStudentSearch()
                    }
                    onFocus={() => {
                      // Show suggestions if there's already a query and results
                      if (searchQuery.trim() && filteredStudents.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="ابحث باسم الطالب أو رقم التعريف..."
                    className="w-full text-right transition-all duration-300 focus:shadow-lg text-sm sm:text-base"
                    dir="rtl"
                  />

                  {/* Suggestions Dropdown */}
                  {showSuggestions && filteredStudents.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredStudents.slice(0, 10).map((student) => {
                        // Handle both formats: {first_name, last_name} OR {name}
                        const fullName =
                          student.name ||
                          `${student.first_name || ""} ${
                            student.last_name || ""
                          }`.trim();
                        const firstLetter =
                          fullName.charAt(0) ||
                          (student.first_name &&
                            student.first_name.charAt(0)) ||
                          (student.last_name && student.last_name.charAt(0)) ||
                          "؟";

                        return (
                          <div
                            key={student.id || student.code}
                            onClick={() => handleSelectStudent(student)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-right flex-1">
                                <p className="font-cairo font-bold text-[#243048] text-sm">
                                  {fullName || "بدون اسم"}
                                </p>
                                <p className="font-cairo text-xs text-gray-600">
                                  الرقم: {student.code || "غير محدد"}
                                </p>
                              </div>
                              <div className="bg-[#027E01] text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0">
                                {firstLetter}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {filteredStudents.length > 10 && (
                        <div className="p-2 text-center text-xs text-gray-500 font-cairo bg-gray-50">
                          و {filteredStudents.length - 10} طالب آخر...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleStudentSearch}
                  className="bg-[#027E01] hover:bg-[#027E01]/90 text-white px-6 sm:px-8 py-2.5 sm:py-3 shrink-0 font-cairo font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">بحث</span>
                </Button>
              </div>

              {/* Selected Student Info */}
              {selectedStudent && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="text-right">
                      <p className="font-cairo font-bold text-[#243048] text-sm">
                        الطالب المحدد: {selectedStudent.name}
                      </p>
                      <p className="font-cairo text-xs text-gray-600">
                        رقم التعريف: {selectedStudent.code}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="outline"
                    className="text-xs px-3 py-1 h-auto font-cairo cursor-pointer"
                  >
                    مسح
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Month Selection and Payment */}
          <div
            className={`bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8 ${
              !selectedStudent && "opacity-50"
            }`}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-cairo text-[#243048] mb-4 sm:mb-6 text-right">
              اختيار الشهر والدفع
            </h2>

            {!selectedStudent && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-right font-cairo text-sm text-yellow-800">
                  ⚠️ الرجاء البحث عن الطالب أولاً لتسجيل الدفع
                </p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Month Selection */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-right font-cairo font-bold text-[#243048] text-sm sm:text-base">
                    اختر الشهر
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Month Dropdown */}
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      disabled={!selectedStudent}
                      className="w-full px-3 py-2 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027E01] transition-all duration-300 font-cairo text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                      dir="rtl"
                    >
                      <option value="">الشهر</option>
                      <option value="01">يناير</option>
                      <option value="02">فبراير</option>
                      <option value="03">مارس</option>
                      <option value="04">أبريل</option>
                      <option value="05">مايو</option>
                      <option value="06">يونيو</option>
                      <option value="07">يوليو</option>
                      <option value="08">أغسطس</option>
                      <option value="09">سبتمبر</option>
                      <option value="10">أكتوبر</option>
                      <option value="11">نوفمبر</option>
                      <option value="12">ديسمبر</option>
                    </select>

                    {/* Year Dropdown */}
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={!selectedStudent}
                      className="w-full px-3 py-2 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027E01] transition-all duration-300 font-cairo text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                      dir="rtl"
                    >
                      <option value="">السنة</option>
                      <option value="2020">2020</option>
                      <option value="2021">2021</option>
                      <option value="2022">2022</option>
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>
                </div>

                {/* Payment Price */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-right font-cairo font-bold text-[#243048] text-sm sm:text-base">
                    ثمن الأداء
                  </label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    disabled={!selectedStudent}
                    placeholder="أدخل المبلغ"
                    className="text-right transition-all duration-300 focus:shadow-lg text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Button
                  type="button"
                  onClick={handlePaymentSubmit}
                  disabled={!selectedStudent || loading}
                  className="bg-[#027E01] hover:bg-[#027E01]/90 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold font-cairo transition-all duration-300 hover:scale-105 hover:shadow-lg flex-1 md:flex-none md:min-w-[200px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2 inline-block" />
                      جاري التسجيل...
                    </>
                  ) : (
                    "تسجيل الدفع للطالب"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handlePrintPayments}
                  disabled={!selectedStudent || loading}
                  className="bg-[#243048] hover:bg-[#243048]/90 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold font-cairo transition-all duration-300 hover:scale-105 hover:shadow-lg flex-1 md:flex-none md:min-w-[220px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2 inline-block" />
                      جاري التحضير...
                    </>
                  ) : (
                    "تحميل مدفوعات الطالب PDF"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Monthly Report - All Students */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-cairo text-[#243048] mb-4 sm:mb-6 text-right">
              تقرير المدفوعات - جميع الطلاب
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <p className="text-right font-cairo text-gray-600 text-sm sm:text-base">
                عرض قائمة بجميع الطلاب ومن قام بالدفع ومن لم يقم بالدفع
              </p>

              {/* Month and Year Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="block text-right font-cairo font-bold text-[#243048] text-sm">
                    اختر الشهر
                  </label>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full px-3 py-2 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027E01] transition-all duration-300 font-cairo text-sm"
                    dir="rtl"
                  >
                    <option value="01">يناير</option>
                    <option value="02">فبراير</option>
                    <option value="03">مارس</option>
                    <option value="04">أبريل</option>
                    <option value="05">مايو</option>
                    <option value="06">يونيو</option>
                    <option value="07">يوليو</option>
                    <option value="08">أغسطس</option>
                    <option value="09">سبتمبر</option>
                    <option value="10">أكتوبر</option>
                    <option value="11">نوفمبر</option>
                    <option value="12">ديسمبر</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-right font-cairo font-bold text-[#243048] text-sm">
                    اختر السنة
                  </label>
                  <select
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                    className="w-full px-3 py-2 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027E01] transition-all duration-300 font-cairo text-sm"
                    dir="rtl"
                  >
                    <option value="2020">2020</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                    <option value="2030">2030</option>
                  </select>
                </div>
              </div>

              {monthlyReport.length > 0 && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={handlePrintMonthlyReport}
                    className="bg-[#243048] hover:bg-[#243048]/90 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold font-cairo transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto cursor-pointer"
                  >
                    تحميل التقرير PDF
                  </Button>
                </div>
              )}

              {/* Report Preview - Always visible */}
              {reportLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#027E01]" />
                  <span className="mr-3 font-cairo text-gray-600">
                    جاري التحميل...
                  </span>
                </div>
              ) : monthlyReport.length > 0 ? (
                <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-bold font-cairo text-[#243048] mb-3 sm:mb-4 text-right">
                    معاينة التقرير - {getMonthName(parseInt(reportMonth))}{" "}
                    {reportYear}
                  </h3>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                      <table className="w-full text-right border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-[#243048] text-white">
                            <th className="p-2 sm:p-3 font-cairo border border-gray-300 text-xs sm:text-sm md:text-base">
                              الاسم
                            </th>
                            <th className="p-2 sm:p-3 font-cairo border border-gray-300 text-xs sm:text-sm md:text-base">
                              المبلغ (درهم)
                            </th>
                            <th className="p-2 sm:p-3 font-cairo border border-gray-300 text-xs sm:text-sm md:text-base">
                              الحالة
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyReport.map((student, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="p-2 sm:p-3 font-cairo border border-gray-300 text-xs sm:text-sm">
                                {student.student_name}
                              </td>
                              <td className="p-2 sm:p-3 font-cairo border border-gray-300 text-xs sm:text-sm whitespace-nowrap">
                                {student.amount > 0
                                  ? student.amount.toFixed(2)
                                  : "-"}
                              </td>
                              <td className="p-2 sm:p-3 font-cairo border border-gray-300">
                                <span
                                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm inline-block ${
                                    student.amount > 0
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {student.amount > 0 ? "مدفوع" : "غير مدفوع"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <p className="font-cairo text-sm text-gray-600">
                      <span className="font-bold">إجمالي المدفوعات:</span>{" "}
                      {monthlyReport
                        .reduce((sum, s) => sum + s.amount, 0)
                        .toFixed(2)}{" "}
                      درهم
                    </p>
                    <p className="font-cairo text-sm text-gray-600">
                      <span className="font-bold">عدد الطلاب الذين دفعوا:</span>{" "}
                      {monthlyReport.filter((s) => s.amount > 0).length} من{" "}
                      {monthlyReport.length}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 font-cairo">
                  <Info className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>لا توجد بيانات للعرض</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Component */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) {
            // Reset pending override when closing
            setPendingPaymentOverride(null);
          }
          setDialog({ ...dialog, open });
        }}
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
              {dialog.type === "info" && (
                <Info className="h-5 w-5 text-blue-500" />
              )}
              <span>{dialog.title}</span>
            </DialogTitle>
            <DialogDescription className="text-right whitespace-pre-line">
              {dialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={dialog.showCancel ? "gap-2" : ""}>
            {dialog.showCancel ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPendingPaymentOverride(null);
                    setDialog({ ...dialog, open: false });
                  }}
                  className="flex-1 font-cairo"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => {
                    if (dialog.onConfirm) {
                      dialog.onConfirm();
                    }
                  }}
                  className="flex-1 font-cairo bg-[#027E01] hover:bg-[#027E01]/90"
                >
                  {dialog.confirmText || "تأكيد"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setDialog({ ...dialog, open: false })}
                className="w-full font-cairo"
              >
                حسناً
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TeacherDashboard;
