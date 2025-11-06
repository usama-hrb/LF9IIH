import { Button } from "../components/ui/button";
import { Input } from "../../components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  Home,
  Download,
  X,
  ArrowRight,
  Save,
  Edit,
  Trash2,
  Check,
  XCircle,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  createStudent,
  getStudentDetail,
  listStudents,
  updateStudent,
  deleteStudent,
} from "../lib/students";
import { createAttendance, getAttendanceRecord } from "../lib/attendance";
import AttendanceHistoryDialog from "../components/AttendanceHistoryDialog";
import AllStudentsAttendanceDialog from "../components/AllStudentsAttendanceDialog";
import { apiFetch } from "../lib/api";
import { formatDateArabic } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import MemorizationHistoryDialog from "../components/MemorizationHistoryDialog";
import ReviewHistoryDialog from "../components/ReviewHistoryDialog";

function StudentsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    parent: "",
    phone_number: "",
    memorization_method: "chapter",
    gender: "M",
    age: "",
  });
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    parent: "",
    phone_number: "",
    memorization_method: "chapter",
    gender: "M",
    age: "",
  });
  const [showReviewSession, setShowReviewSession] = useState(false);
  const [reviewData, setReviewData] = useState({
    currentReview: "",
    date: new Date().toISOString().split("T")[0],
    rating: 0,
    notes: "",
    quickNote: "",
  });

  // Memorization History Dialog
  const [showMemorizationHistory, setShowMemorizationHistory] = useState(false);

  // Review History Dialog
  const [showReviewHistory, setShowReviewHistory] = useState(false);

  // Attendance History Dialog
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);

  // All Students Attendance Dialog
  const [showAllStudentsAttendance, setShowAllStudentsAttendance] =
    useState(false);

  // Info section collapse state
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);

  // Session history data for statistics
  const [memorizationSessions, setMemorizationSessions] = useState([]);
  const [reviewSessions, setReviewSessions] = useState([]);

  // Dialog state for alerts and confirmations
  const [dialog, setDialog] = useState({
    open: false,
    type: "info", // 'info', 'success', 'error', 'confirm'
    title: "",
    message: "",
    onConfirm: null,
  });

  // Student data from backend
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  // Fetch students on mount
  useEffect(() => {
    async function fetchStudents() {
      setLoadingStudents(true);
      setStudentsError("");
      try {
        const data = await listStudents();
        console.log("Fetched students:", data);

        // Get today's date for attendance lookup
        const today = new Date().toISOString().split("T")[0];

        // Map backend data to UI format and load today's attendance
        const mapped = await Promise.all(
          (data || []).map(async (s) => {
            let todayAttendance = null;

            // Try to load today's attendance for this student
            try {
              const now = new Date();
              const attendanceRecords = await getAttendanceRecord(
                s.code,
                now.getFullYear(),
                now.getMonth() + 1
              );

              // Find today's attendance record
              const todayRecord = attendanceRecords?.find(
                (record) => record.attendance_date === today
              );

              if (todayRecord) {
                todayAttendance = todayRecord.state; // "present" or "absent"
              }
            } catch (error) {
              // If attendance fetch fails, just continue with null
              console.log(
                `Could not load attendance for student ${s.code}:`,
                error
              );
            }

            return {
              id: s.code, // Use code as id
              code: s.code,
              name: s.name,
              gender: s.gender === "M" ? "male" : "female",
              age: s.age,
              memorization: s.next_memorization_session || "لم يتم التحديد", // Display next memorization session
              review: s.next_review_session || "لم يتم التحديد", // Display next review session
              attendance: todayAttendance, // Set from database (null, "present", or "absent")
              level: "", // Not in list response
              enrollmentDate:
                s.date_of_registration ||
                new Date().toISOString().split("T")[0],
              memorizationStart: s.memorization_method || "",
              memorization_method: s.memorization_method, // Keep for session pages
              guardianName: "", // Not in list response
              phone: "", // Not in list response
              monthlyPayment: "unpaid", // Not in list response
              photo: null,
              sessions: { memorization: [], review: [] },
            };
          })
        );

        setStudents(mapped);
      } catch (e) {
        console.error("Error fetching students:", e);
        setStudentsError(e?.message || "فشل تحميل قائمة الطلاب");
        if (e?.status === 401 || e?.status === 403) {
          // Redirect to login if not authenticated
          setTimeout(() => {
            navigate("/teacher/login", {
              replace: true,
              state: { from: "/teacher/students" },
            });
          }, 2000);
        }
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchStudents();
  }, [navigate]);

  // Restore selected student from localStorage on mount
  useEffect(() => {
    if (students.length > 0 && !selectedStudent && !loadingStudents) {
      const savedStudentCode = localStorage.getItem("selectedStudentCode");
      if (savedStudentCode) {
        const student = students.find((s) => s.code === savedStudentCode);
        if (student) {
          console.log(
            "Restoring selected student from localStorage:",
            student.name
          );
          handleStudentClick(student);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, loadingStudents]); // Run when students list is loaded

  const handleAttendance = async (studentId, status) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Store previous state for rollback
    const previousAttendance = student.attendance;

    try {
      // Optimistically update UI
      setStudents(
        students.map((s) =>
          s.id === studentId ? { ...s, attendance: status } : s
        )
      );

      // Call API to save attendance
      const payload = {
        attendance_date: today,
        state: status, // "present" or "absent"
      };

      await createAttendance(student.code, payload);
      console.log(
        `✅ Attendance saved: Student ${student.name} marked as ${status} on ${today}`
      );

      // Update selectedStudent attendance records if this student is selected
      if (selectedStudent && selectedStudent.id === studentId) {
        // Check if today's record already exists
        const existingRecords = selectedStudent.attendanceRecords || [];
        const todayRecordIndex = existingRecords.findIndex(
          (record) => record.attendance_date === today
        );

        let updatedRecords;
        if (todayRecordIndex >= 0) {
          // Update existing record
          updatedRecords = existingRecords.map((record, index) =>
            index === todayRecordIndex ? { ...record, state: status } : record
          );
        } else {
          // Add new record at the beginning
          updatedRecords = [
            { attendance_date: today, state: status },
            ...existingRecords,
          ];
        }

        // Update selectedStudent with new attendance records
        setSelectedStudent({
          ...selectedStudent,
          attendance: status,
          attendanceRecords: updatedRecords,
        });
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      // Revert to previous state on error (could be null)
      setStudents(
        students.map((s) =>
          s.id === studentId ? { ...s, attendance: previousAttendance } : s
        )
      );

      // Revert selectedStudent if applicable
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({
          ...selectedStudent,
          attendance: previousAttendance,
        });
      }

      setDialog({
        open: true,
        type: "error",
        title: "خطأ في حفظ الحضور",
        message:
          error?.message || "حدث خطأ أثناء حفظ الحضور. يرجى المحاولة مرة أخرى.",
        onConfirm: null,
      });
    }
  };

  // Fetch session history for statistics
  const fetchSessionHistory = async (studentCode, memorizationMethod) => {
    const apiEndpoint =
      memorizationMethod === "chapter" ? "chapters" : "quarters";

    try {
      const response = await apiFetch(
        `/${apiEndpoint}/${studentCode}/completions`
      );
      const allSessions = response || [];

      // Separate memorization and review sessions, get last 10 of each
      const memSessions = allSessions
        .filter((s) => s.session_type === "memorization")
        .slice(0, 10);
      const revSessions = allSessions
        .filter((s) => s.session_type === "review")
        .slice(0, 10);

      setMemorizationSessions(memSessions);
      setReviewSessions(revSessions);
    } catch (err) {
      console.error("Error fetching session history:", err);
      setMemorizationSessions([]);
      setReviewSessions([]);
    }
  };

  const handleStudentClick = async (student) => {
    setErrorMsg("");
    setSelectedStudent(student); // optimistic
    setLoadingDetail(true);

    // Save selected student to localStorage for persistence
    localStorage.setItem("selectedStudentCode", student.code);

    try {
      // Load student detail
      const detail = await getStudentDetail(student.code);

      // Load attendance records for current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

      let attendanceRecords = [];
      try {
        attendanceRecords = await getAttendanceRecord(
          student.code,
          currentYear,
          currentMonth
        );
        console.log(
          `📅 Loaded ${attendanceRecords.length} attendance records for ${student.name}`
        );
      } catch (attErr) {
        console.warn("Could not load attendance records:", attErr);
        // Continue without attendance records
      }

      // Map backend detail to UI shape
      const mapped = {
        ...student,
        code: detail.code,
        name: detail.name,
        enrollmentDate: detail.date_of_registration || student.enrollmentDate,
        phone: detail.phone_number || student.phone,
        monthlyPayment: detail.payed ? "paid" : "unpaid",
        memorizationMethod:
          detail.memorization_method || student.memorizationMethod,
        memorization_method:
          detail.memorization_method || student.memorization_method, // Keep snake_case for ReviewSession
        age: detail.age ?? student.age,
        parent: detail.parent || student.parent,
        level: detail.level || student.level || "غير محدد", // Add level field
        memorizationStart:
          detail.memorization_start ||
          student.memorizationStart ||
          detail.date_of_registration, // Add memorizationStart
        guardianName: detail.parent || student.guardianName, // Add guardianName for compatibility
        photo: detail.photo || student.photo || null, // Add photo field
        attendanceRecords: attendanceRecords, // Add attendance records
      };
      setSelectedStudent(mapped);

      // Fetch session history for statistics
      await fetchSessionHistory(
        student.code,
        detail.memorization_method || student.memorization_method
      );
    } catch (e) {
      setErrorMsg(e?.message || "تعذر جلب بيانات الطالب");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownloadAttendance = () => {
    console.log("Downloading attendance sheet for:", selectedStudent?.name);
    // TODO: Implement download functionality
    setDialog({
      open: true,
      type: "info",
      title: "تنزيل لائحة الحضور",
      message: "جاري تحضير ملف الحضور للتنزيل...",
      onConfirm: null,
    });
  };

  // Edit student handlers
  const handleEditClick = () => {
    if (!selectedStudent) return;
    // Populate edit form with current student data
    setEditForm({
      first_name: selectedStudent.name?.split(" ")[0] || "",
      last_name: selectedStudent.name?.split(" ").slice(1).join(" ") || "",
      parent: selectedStudent.parent || "",
      phone_number: selectedStudent.phone || "",
      memorization_method:
        selectedStudent.memorizationMethod === "بالأثمان"
          ? "eighth"
          : "chapter",
      gender: selectedStudent.gender === "male" ? "M" : "F",
      age: selectedStudent.age?.toString() || "",
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditForm({
      first_name: "",
      last_name: "",
      parent: "",
      phone_number: "",
      memorization_method: "chapter",
      gender: "M",
      age: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent?.code) return;

    // Validate required fields
    if (!editForm.first_name || !editForm.last_name || !editForm.age) {
      setErrorMsg("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      setLoadingDetail(true);
      setErrorMsg("");

      // Call update API
      await updateStudent(selectedStudent.code, editForm);

      // Refresh student detail
      const detail = await getStudentDetail(selectedStudent.code);
      const mapped = {
        ...selectedStudent,
        code: detail.code,
        name: detail.name,
        enrollmentDate:
          detail.date_of_registration || selectedStudent.enrollmentDate,
        phone: detail.phone_number || selectedStudent.phone,
        monthlyPayment: detail.payed ? "paid" : "unpaid",
        memorizationMethod:
          detail.memorization_method || selectedStudent.memorizationMethod,
        age: detail.age ?? selectedStudent.age,
        parent: detail.parent || selectedStudent.parent,
      };
      setSelectedStudent(mapped);

      // Update in students list
      setStudents(
        students.map((s) => (s.code === selectedStudent.code ? mapped : s))
      );

      setIsEditMode(false);
      setDialog({
        open: true,
        type: "success",
        title: "تم التحديث بنجاح",
        message: "تم تحديث بيانات الطالب بنجاح!",
        onConfirm: null,
      });
    } catch (e) {
      console.error("Error updating student:", e);
      setErrorMsg(e?.message || "فشل تحديث بيانات الطالب");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent?.code) return;

    setDialog({
      open: true,
      type: "confirm",
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف الطالب "${selectedStudent.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      onConfirm: async () => {
        await performDelete();
      },
    });
  };

  const performDelete = async () => {
    if (!selectedStudent?.code) return;

    try {
      setLoadingDetail(true);
      setErrorMsg("");

      await deleteStudent(selectedStudent.code);

      // Remove from students list
      setStudents(students.filter((s) => s.code !== selectedStudent.code));

      // Close detail view
      setSelectedStudent(null);

      setDialog({
        open: true,
        type: "success",
        title: "تم الحذف بنجاح",
        message: "تم حذف الطالب بنجاح",
        onConfirm: null,
      });
    } catch (e) {
      console.error("Error deleting student:", e);
      setErrorMsg(e?.message || "فشل حذف الطالب");
      setLoadingDetail(false);
    }
  };

  const getInitials = (name) => {
    return name.split(" ")[0].charAt(0);
  };

  const handleShowReviewSession = () => {
    // Navigate to the dedicated review session page with student data
    navigate("/teacher/review-session", {
      state: { student: selectedStudent },
    });
  };

  const handleShowMemorizationSession = () => {
    // Navigate to the dedicated memorization session page with student data
    navigate("/teacher/memorization-session", {
      state: { student: selectedStudent },
    });
  };

  const handleBackFromReview = () => {
    setShowReviewSession(false);
  };

  const handleRatingClick = (rating) => {
    setReviewData({ ...reviewData, rating });
  };

  const handleSaveReview = () => {
    // Update the student's review in the students array
    setStudents(
      students.map((student) =>
        student.id === selectedStudent.id
          ? { ...student, review: reviewData.currentReview }
          : student
      )
    );

    // Update selected student
    setSelectedStudent({
      ...selectedStudent,
      review: reviewData.currentReview,
    });

    console.log("Saving review session:", reviewData);
    setDialog({
      open: true,
      type: "success",
      title: "تم الحفظ بنجاح",
      message: "تم حفظ حصة المراجعة بنجاح!",
      onConfirm: null,
    });
    setShowReviewSession(false);
  };

  const quickNotes = [
    "ممتاز - حفظ متقن",
    "جيد جداً - يحتاج مراجعة بسيطة",
    "جيد - يحتاج تحسين",
    "يحتاج مراجعة إضافية",
    "غائب",
  ];

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.includes(searchQuery) || student.code.includes(searchQuery);
    const matchesGender =
      genderFilter === "all" || student.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="min-h-screen w-full bg-gray-50 p-3 sm:p-4 md:p-5 lg:p-6">
      <div className="max-w-full mx-auto flex flex-col lg:flex-row-reverse gap-4 lg:gap-6">
        {/* Students List Section */}
        <div
          className={`transition-all duration-500 ${
            selectedStudent ? "w-full lg:w-1/2" : "w-full"
          }`}
        >
          {/* Page Title */}
          <div
            className="text-center mb-4 sm:mb-6 md:mb-8 opacity-0"
            style={{ animation: "fadeInUp 0.6s ease-out forwards" }}
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-cairo text-[#243048]/90 mb-2 px-2">
              لائحة الطلاب
            </h1>
            <div className="w-20 sm:w-24 h-1 bg-[#027E01] mx-auto rounded-full"></div>
          </div>

          {/* Search and Filters Card */}
          <div
            className="bg-white rounded-xl shadow-2xl p-3 sm:p-4 md:p-5 lg:p-6 mb-4 sm:mb-6 opacity-0"
            style={{ animation: "fadeInUp 0.6s ease-out 0.1s forwards" }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Left Side - Search Bar and Button */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن الطالب..."
                  className="flex-1 md:min-w-[250px] text-right transition-all duration-300 focus:shadow-lg text-sm border-2 focus:border-[#027E01]"
                  dir="rtl"
                />

                <Button
                  type="button"
                  className="bg-[#027E01] hover:bg-[#027E01]/90 text-white px-4 md:px-6 py-2 shrink-0 font-cairo font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>بحث</span>
                </Button>
              </div>

              {/* Right Side - Filter and Add Button */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="flex-1 md:flex-none md:w-auto px-3 md:px-4 py-2 text-right border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#027E01] focus:ring-2 focus:ring-[#027E01]/20 transition-all duration-300 font-cairo text-sm bg-white hover:border-[#027E01]/50 cursor-pointer"
                  dir="rtl"
                >
                  <option value="all">جميع الطلاب</option>
                  <option value="male">لائحة الذكور</option>
                  <option value="female">لائحة الإناث</option>
                </select>

                <Button
                  onClick={() => setShowCreateForm((s) => !s)}
                  className="bg-[#243048] hover:bg-[#243048]/90 text-white px-4 md:px-6 py-2 font-cairo font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">إضافة طالب جديد</span>
                  <span className="sm:hidden">إضافة</span>
                </Button>
              </div>
            </div>{" "}
            {showCreateForm && (
              <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-cairo font-bold text-[#243048] mb-3 text-right">
                  بيانات الطالب الجديد
                </h3>
                {errorMsg && (
                  <div className="text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-2 text-right">
                    {errorMsg}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Input
                    dir="rtl"
                    className="text-right"
                    placeholder="الاسم الأول"
                    value={createForm.first_name}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        first_name: e.target.value,
                      })
                    }
                  />
                  <Input
                    dir="rtl"
                    className="text-right"
                    placeholder="اسم العائلة"
                    value={createForm.last_name}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        last_name: e.target.value,
                      })
                    }
                  />
                  <Input
                    dir="rtl"
                    className="text-right"
                    placeholder="اسم ولي الأمر"
                    value={createForm.parent}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, parent: e.target.value })
                    }
                  />
                  <Input
                    dir="rtl"
                    className="text-right"
                    placeholder="رقم الهاتف"
                    value={createForm.phone_number}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        phone_number: e.target.value,
                      })
                    }
                  />
                  <select
                    dir="rtl"
                    className="border rounded px-3 py-2 text-right cursor-pointer"
                    value={createForm.memorization_method}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        memorization_method: e.target.value,
                      })
                    }
                  >
                    <option value="chapter">ورد: سورة/جزء</option>
                    <option value="eighth">ورد: ثمن/ربع</option>
                  </select>
                  <select
                    dir="rtl"
                    className="border rounded px-3 py-2 cursor-pointer"
                    value={createForm.gender}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, gender: e.target.value })
                    }
                  >
                    <option value="M">ذكر</option>
                    <option value="F">أنثى</option>
                  </select>
                  <Input
                    dir="rtl"
                    className="text-right"
                    placeholder="العمر"
                    type="number"
                    value={createForm.age}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, age: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    className="bg-gray-100 text-[#243048] cursor-pointer"
                    onClick={() => setShowCreateForm(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    className="bg-[#027E01] hover:bg-[#027E01]/90 text-white cursor-pointer"
                    onClick={async () => {
                      setErrorMsg("");
                      console.log("Creating student with payload:", createForm);
                      try {
                        const payload = {
                          ...createForm,
                          age: Number(createForm.age) || 0,
                        };
                        console.log("Calling createStudent API...");
                        const res = await createStudent(payload);
                        console.log("Create response:", res);
                        const code = String(res?.code || "");
                        // Fetch full detail for accurate mapping
                        console.log("Fetching detail for code:", code);
                        const detail = await getStudentDetail(code);
                        console.log("Detail response:", detail);
                        const mapped = {
                          id: Date.now(),
                          code: detail.code,
                          name: detail.name,
                          memorization: "",
                          review: "",
                          attendance: "present",
                          gender: createForm.gender,
                          level: "",
                          enrollmentDate:
                            detail.date_of_registration ||
                            new Date().toISOString().split("T")[0],
                          age: detail.age ?? payload.age,
                          memorizationMethod:
                            detail.memorization_method ||
                            payload.memorization_method,
                          parent: detail.parent || payload.parent,
                          phone: detail.phone_number || payload.phone_number,
                          monthlyPayment: detail.payed ? "paid" : "unpaid",
                          photo: null,
                          sessions: { memorization: [], review: [] },
                        };
                        setStudents((prev) => [mapped, ...prev]);
                        setSelectedStudent(mapped);
                        setShowCreateForm(false);
                        // reset create form
                        setCreateForm({
                          first_name: "",
                          last_name: "",
                          parent: "",
                          phone_number: "",
                          memorization_method: "chapter",
                          gender: "M",
                          age: "",
                        });
                      } catch (e) {
                        console.error("Error creating student:", e);
                        console.error("Error status:", e?.status);
                        console.error("Error data:", e?.data);
                        if (e?.status === 401 || e?.status === 403) {
                          setErrorMsg(
                            `خطأ ${e?.status}: ${
                              e?.message ||
                              "انتهت صلاحية الجلسة. يُرجى تسجيل الدخول مرة أخرى."
                            }`
                          );
                          // Optional: redirect to login after a short delay
                          setTimeout(() => {
                            navigate("/teacher/login", {
                              replace: true,
                              state: { from: "/teacher/students" },
                            });
                          }, 2000);
                        } else {
                          setErrorMsg(e?.message || "فشل إنشاء الطالب");
                        }
                      }
                    }}
                  >
                    حفظ الطالب
                  </Button>
                </div>
              </div>
            )}
            {/* Students Count - Better mobile layout */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => navigate("/teacher/dashboard")}
                  className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-[#243048] px-3 sm:px-4 py-2 font-cairo font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="h-4 w-4" />
                  <span>العودة للوحة التحكم</span>
                </Button>
                <Button
                  onClick={() => setShowAllStudentsAttendance(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#027E01] to-[#027E01]/80 hover:from-[#027E01]/90 hover:to-[#027E01]/70 text-white px-3 sm:px-4 py-2 font-cairo font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span>سجل الحضور اليومي</span>
                </Button>
              </div>
              <p className="font-cairo text-sm sm:text-base text-gray-700 text-center sm:text-right w-full sm:w-auto">
                عدد الطلاب:{" "}
                <span className="font-bold text-[#027E01] text-base sm:text-lg">
                  {filteredStudents.length}
                </span>
              </p>
            </div>
          </div>

          {/* Loading/Error Messages */}
          {loadingStudents && (
            <div className="bg-white rounded-xl shadow-2xl p-8 mb-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#027E01]"></div>
                <p className="font-cairo text-base text-gray-600">
                  جارٍ تحميل قائمة الطلاب...
                </p>
              </div>
            </div>
          )}

          {studentsError && !loadingStudents && (
            <div className="bg-white rounded-xl shadow-2xl p-6 mb-4">
              <div className="text-right text-red-600 bg-red-50 border border-red-200 rounded p-4">
                <p className="font-cairo font-bold mb-2">
                  خطأ في تحميل القائمة
                </p>
                <p className="font-cairo text-sm">{studentsError}</p>
              </div>
            </div>
          )}

          {/* Students Table */}
          {!loadingStudents && (
            <div
              className="bg-white rounded-t-xl shadow-2xl overflow-hidden opacity-0 border border-gray-200"
              style={{ animation: "fadeInUp 0.6s ease-out 0.2s forwards" }}
            >
              <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-linear-to-l from-[#B3B3B3]/25 to-[#B3B3B3]/15 border-b-2 border-[#B3B3B3]/40">
                      <th className="hidden md:table-cell p-3 sm:p-4 font-cairo text-xs sm:text-sm font-bold text-center text-[#243048] tracking-wide">
                        رقم الطالب
                      </th>
                      <th className="p-3 sm:p-4 font-cairo text-xs sm:text-sm font-bold text-center text-[#243048] border-x border-[#B3B3B3]/30 tracking-wide">
                        الاسم الكامل
                      </th>
                      <th
                        className={`hidden p-3 sm:p-4 font-cairo text-xs sm:text-sm font-bold text-center text-[#243048] border-l border-[#B3B3B3]/30 tracking-wide ${
                          !selectedStudent ? "md:table-cell" : ""
                        }`}
                      >
                        ورد الحفظ
                      </th>
                      <th
                        className={`hidden p-3 sm:p-4 font-cairo text-xs sm:text-sm font-bold text-center text-[#243048] border-l border-[#B3B3B3]/30 tracking-wide ${
                          !selectedStudent ? "md:table-cell" : ""
                        }`}
                      >
                        ورد المراجعة
                      </th>
                      <th className="p-3 sm:p-4 font-cairo text-xs sm:text-sm font-bold text-center text-[#243048] tracking-wide">
                        الحضور
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => (
                        <tr
                          key={student.id}
                          onClick={() => handleStudentClick(student)}
                          className={`group transition-all duration-300 hover:bg-linear-to-l hover:from-[#027E01]/10 hover:to-transparent cursor-pointer border-b border-gray-100 last:border-0 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          } ${
                            selectedStudent?.id === student.id
                              ? "bg-linear-to-l from-[#027E01]/15 to-transparent shadow-md border-r-4! border-r-[#027E01]!"
                              : ""
                          }`}
                        >
                          <td className="hidden md:table-cell p-3 sm:p-4 font-cairo text-xs sm:text-sm font-bold text-[#027E01] text-center transition-transform">
                            #{student.code}
                          </td>
                          <td className="p-3 sm:p-4 font-cairo text-xs sm:text-sm font-bold text-[#243048] text-center group-hover:text-[#027E01] transition-all duration-300">
                            {student.name}
                          </td>
                          <td
                            className={`hidden p-3 sm:p-4 font-cairo text-[10px] sm:text-xs text-gray-600 text-center transition-colors group-hover:text-gray-800 ${
                              !selectedStudent ? "md:table-cell" : ""
                            }`}
                          >
                            <span
                              className={`px-2 py-1 rounded-md transition-colors inline-block ${
                                student.memorization &&
                                student.memorization !== "لم يتم التحديد"
                                  ? "bg-purple-100 text-purple-700 font-bold border border-purple-300"
                                  : "bg-gray-100 text-gray-500"
                              } group-hover:shadow-md`}
                            >
                              {student.memorization === "لم يتم التحديد"
                                ? " "
                                : " "}
                              {student.memorization}
                            </span>
                          </td>
                          <td
                            className={`hidden p-3 sm:p-4 font-cairo text-[10px] sm:text-xs text-gray-600 text-center transition-colors group-hover:text-gray-800 ${
                              !selectedStudent ? "md:table-cell" : ""
                            }`}
                          >
                            <span
                              className={`px-2 py-1 rounded-md transition-colors inline-block ${
                                student.review &&
                                student.review !== "لم يتم التحديد"
                                  ? "bg-[#027E01]/10 text-[#027E01] font-bold border border-[#027E01]/30"
                                  : "bg-gray-100 text-gray-500"
                              } group-hover:shadow-md`}
                            >
                              {student.review === "لم يتم التحديد"
                                ? "  "
                                : "  "}
                              {student.review}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 font-cairo">
                            <div className="flex gap-1.5 sm:gap-2 justify-center items-center">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAttendance(student.id, "present");
                                }}
                                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold font-cairo transition-all duration-200 rounded-lg shadow-sm hover:shadow-md cursor-pointer ${
                                  student.attendance === "present"
                                    ? "bg-linear-to-r from-[#027E01] to-[#027E01]/90 text-white shadow-lg scale-[1.02] ring-2 ring-[#027E01]/30"
                                    : "bg-white text-[#027E01] border-2 border-gray-300 hover:border-[#027E01] hover:bg-linear-to-r hover:from-[#027E01]/5 hover:to-[#027E01]/10 hover:scale-[1.02]"
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  <span className="hidden sm:inline text-base">
                                    ✓
                                  </span>
                                  <span>حاضر</span>
                                </span>
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAttendance(student.id, "absent");
                                }}
                                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold font-cairo transition-all duration-200 rounded-lg shadow-sm hover:shadow-md cursor-pointer ${
                                  student.attendance === "absent"
                                    ? "bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg scale-[1.02] ring-2 ring-red-500/30"
                                    : "bg-white text-red-500 border-2 border-gray-300 hover:border-red-500 hover:bg-linear-to-r hover:from-red-50 hover:to-red-100 hover:scale-[1.02]"
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  <span className="hidden sm:inline text-base">
                                    ✗
                                  </span>
                                  <span>غائب</span>
                                </span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={selectedStudent ? "3" : "5"}
                          className="p-12 text-center bg-gray-50"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="text-5xl opacity-50">📭</div>
                            <p className="font-cairo text-base text-gray-500 font-medium">
                              لا توجد نتائج للبحث
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Student Details Panel or Review Session - Mobile & Desktop */}
        {selectedStudent && (
          <div
            className="w-full lg:w-1/2 opacity-0 mt-4 lg:mt-0"
            style={{ animation: "fadeIn 0.6s ease-out forwards" }}
          >
            <div className="bg-[#B3B3B3]/20 rounded-xl shadow-2xl p-4 sm:p-5 md:p-6 lg:sticky lg:top-6">
              {!showReviewSession ? (
                <>
                  {/* Student Info Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold font-cairo text-[#243048]">
                      معلومات الطالب والمتابعة
                    </h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        onClick={handleDownloadAttendance}
                        className="flex-1 sm:flex-none bg-[#027E01] hover:bg-[#027E01]/90 text-white px-3 sm:px-4 py-2 font-cairo font-bold text-[10px] sm:text-xs transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>لائحة الحضور</span>
                      </Button>
                      {/* Delete removed per request */}
                      <Button
                        onClick={() => {
                          setSelectedStudent(null);
                          localStorage.removeItem("selectedStudentCode");
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                  {loadingDetail && (
                    <div className="text-sm text-gray-600 mb-2">
                      جارٍ تحميل بيانات الطالب...
                    </div>
                  )}
                  {errorMsg && (
                    <div className="text-right text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-2">
                      {errorMsg}
                    </div>
                  )}

                  {/* Student Profile Header */}
                  <div className="bg-white rounded-lg p-4 mb-4 shadow-sm text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#243048] flex items-center justify-center text-white text-3xl sm:text-4xl font-bold font-cairo mx-auto mb-3">
                      {selectedStudent.photo ? (
                        <img
                          src={selectedStudent.photo}
                          alt={selectedStudent.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(selectedStudent.name)
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-cairo text-[#243048] mb-1">
                      {selectedStudent.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-cairo">
                      الرقم التعريفي:{" "}
                      <span className="font-bold text-[#027E01]">
                        {selectedStudent.code}
                      </span>
                    </p>
                  </div>

                  {/* Edit Form or Student Info */}
                  {isEditMode ? (
                    /* Edit Form */
                    <div className="mb-4 sm:mb-6 bg-white rounded-lg p-4">
                      <h3 className="text-lg font-bold font-cairo text-[#243048] mb-4 text-right">
                        تعديل بيانات الطالب
                      </h3>

                      <div className="space-y-4">
                        {/* First Name */}
                        <div>
                          <label className="block text-right font-cairo font-bold text-[#243048] text-sm mb-1">
                            الاسم الأول
                          </label>
                          <Input
                            type="text"
                            value={editForm.first_name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                first_name: e.target.value,
                              })
                            }
                            className="text-right"
                            dir="rtl"
                            required
                          />
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-right font-cairo font-bold text-[#243048] text-sm mb-1">
                            اللقب
                          </label>
                          <Input
                            type="text"
                            value={editForm.last_name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                last_name: e.target.value,
                              })
                            }
                            className="text-right"
                            dir="rtl"
                            required
                          />
                        </div>

                        {/* Age */}
                        <div>
                          <label className="block text-right font-cairo font-bold text-[#243048] text-sm mb-1">
                            العمر
                          </label>
                          <Input
                            type="number"
                            value={editForm.age}
                            onChange={(e) =>
                              setEditForm({ ...editForm, age: e.target.value })
                            }
                            className="text-right"
                            dir="rtl"
                            required
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="block text-right font-cairo font-bold text-[#243048] text-sm mb-1">
                            الجنس
                          </label>
                          <select
                            value={editForm.gender}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                gender: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027E01] font-cairo cursor-pointer"
                            dir="rtl"
                          >
                            <option value="M">ذكر</option>
                            <option value="F">أنثى</option>
                          </select>
                        </div>

                        {/* Parent Name */}
                        <div>
                          <label className="block text-right font-cairo font-bold text-[#243048] text-sm mb-1">
                            اسم ولي الأمر
                          </label>
                          <Input
                            type="text"
                            value={editForm.parent}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                parent: e.target.value,
                              })
                            }
                            className="text-right"
                            dir="rtl"
                            required
                          />
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label className="block text-right font-cairo font-bold text-[#243048] text-sm mb-1">
                            رقم الهاتف
                          </label>
                          <Input
                            type="tel"
                            value={editForm.phone_number}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                phone_number: e.target.value,
                              })
                            }
                            className="text-right"
                            dir="ltr"
                            required
                          />
                        </div>

                        {/* Memorization Method */}
                        <div>
                          <label className="block text-right font-cairo font-bold text-[#243048] text-sm mb-1">
                            طريقة الحفظ
                          </label>
                          <select
                            value={editForm.memorization_method}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                memorization_method: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027E01] font-cairo cursor-pointer"
                            dir="rtl"
                          >
                            <option value="chapter">بالأجزاء</option>
                            <option value="eighth">بالأثمان</option>
                          </select>
                        </div>

                        {/* Save/Cancel Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={handleSaveEdit}
                            disabled={loadingDetail}
                            className="flex-1 bg-[#027E01] hover:bg-[#027E01]/90 text-white font-cairo font-bold text-sm py-2 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Save className="h-4 w-4" />
                            حفظ التعديلات
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            disabled={loadingDetail}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-cairo font-bold text-sm py-2 cursor-pointer"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Student Information - Collapsible */
                    <div className="bg-white rounded-lg mb-4 shadow-sm overflow-hidden">
                      <button
                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <h4 className="font-cairo font-bold text-[#243048] text-sm">
                          المعلومات الأساسية
                        </h4>
                        {isInfoExpanded ? (
                          <ChevronUp className="h-5 w-5 text-[#243048]" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-[#243048]" />
                        )}
                      </button>

                      {isInfoExpanded && (
                        <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-cairo text-sm text-gray-600">
                              تاريخ الالتحاق:
                            </span>
                            <span className="font-cairo text-sm font-bold text-[#243048]">
                              {selectedStudent.enrollmentDate}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-cairo text-sm text-gray-600">
                              العمر:
                            </span>
                            <span className="font-cairo text-sm font-bold text-[#243048]">
                              {selectedStudent.age} سنة
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-cairo text-sm text-gray-600">
                              طريقة الحفظ:
                            </span>
                            <span className="font-cairo text-sm font-bold text-[#243048]">
                              {selectedStudent.memorizationMethod}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-cairo text-sm text-gray-600">
                              اسم ولي الأمر:
                            </span>
                            <span className="font-cairo text-sm font-bold text-[#243048]">
                              {selectedStudent.parent}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-cairo text-sm text-gray-600">
                              رقم الهاتف:
                            </span>
                            <span
                              className="font-cairo text-sm font-bold text-[#243048]"
                              dir="ltr"
                            >
                              {selectedStudent.phone}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="font-cairo text-sm text-gray-600">
                              الواجب الشهري:
                            </span>
                            <span
                              className={`font-cairo text-sm font-bold px-3 py-1 rounded ${
                                selectedStudent.monthlyPayment === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {selectedStudent.monthlyPayment === "paid"
                                ? "✓ مدفوع"
                                : "✗ غير مدفوع"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button
                      onClick={handleShowMemorizationSession}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-cairo font-bold text-sm py-3 cursor-pointer"
                    >
                      حصة الحفظ
                    </Button>
                    <Button
                      onClick={handleShowReviewSession}
                      className="bg-[#027E01] hover:bg-[#027E01]/90 text-white font-cairo font-bold text-sm py-3 cursor-pointer"
                    >
                      حصة المراجعة
                    </Button>
                    <Button
                      onClick={handleEditClick}
                      className="bg-[#243048] hover:bg-[#243048]/90 text-white font-cairo font-bold text-sm py-3 cursor-pointer"
                    >
                      تعديل البيانات
                    </Button>
                    <Button
                      onClick={handleDeleteStudent}
                      className="bg-red-600 hover:bg-red-700 text-white font-cairo font-bold text-sm py-3 cursor-pointer"
                    >
                      حذف الطالب
                    </Button>
                  </div>

                  {/* Recent Statistics - Side by Side */}
                  <div className="bg-white rounded-lg p-3 sm:p-4">
                    <h4 className="font-cairo font-bold text-[#243048] text-sm sm:text-base mb-3 text-center">
                      الإحصائيات الأخيرة
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Memorization Sessions */}
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <h5 className="font-cairo font-bold text-purple-800 text-xs mb-2 text-center pb-2 border-b border-purple-300">
                          حصة الحفظ
                        </h5>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {memorizationSessions.length > 0 ? (
                            memorizationSessions
                              .slice(0, 5)
                              .map((session, index) => (
                                <div
                                  key={session.code || index}
                                  className="flex items-center justify-between bg-white rounded px-2 py-1.5 text-xs"
                                >
                                  <span className="font-cairo text-purple-700 font-bold">
                                    #{memorizationSessions.length - index}
                                  </span>
                                  <span className="font-cairo text-gray-600 flex-1 text-center truncate px-1">
                                    {/* {console.log(session)} */}
                                    {session.surah
                                      ? session.surah.name + ` (${session.verse_from}-${session.verse_to})`
                                      : `الحزب${session.hizb_number}, الثمن ${session.eighth_number}`}
                                  </span>
                                  <span className="font-cairo text-yellow-600 font-bold text-sm">
                                    {"⭐".repeat(session.rating || 0)}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <p className="font-cairo text-xs text-gray-500 text-center py-3">
                              لا توجد حصص مسجلة
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => setShowMemorizationHistory(true)}
                          className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-cairo font-bold text-xs py-2 cursor-pointer"
                        >
                          عرض الكل
                        </Button>
                      </div>

                      {/* Review Sessions */}
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <h5 className="font-cairo font-bold text-green-800 text-xs mb-2 text-center pb-2 border-b border-green-300">
                          حصة المراجعة
                        </h5>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {reviewSessions.length > 0 ? (
                            reviewSessions.slice(0, 5).map((session, index) => (
                              <div
                                key={session.code || index}
                                className="flex items-center justify-between bg-white rounded px-2 py-1.5 text-xs"
                              >
                                <span className="font-cairo text-green-700 font-bold">
                                  #{reviewSessions.length - index}
                                </span>
                                <span className="font-cairo text-gray-600 flex-1 text-center truncate px-1">
                                  {session.surah
                                    ? session.surah.name  + ` (${session.verse_from}-${session.verse_to})`
                                    : `الحزب${session.hizb_number}, الثمن ${session.eighth_number}`}
                                </span>
                                <span className="font-cairo text-yellow-600 font-bold text-sm">
                                  {"⭐".repeat(session.rating || 0)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="font-cairo text-xs text-gray-500 text-center py-3">
                              لا توجد حصص مسجلة
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => setShowReviewHistory(true)}
                          className="w-full mt-2 bg-[#027E01] hover:bg-[#027E01]/90 text-white font-cairo font-bold text-xs py-2 cursor-pointer"
                        >
                          عرض الكل
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Record */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-cairo font-bold text-[#243048] text-sm sm:text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        سجل الحضور -{" "}
                        {formatDateArabic(new Date(), {
                          month: "long",
                          year: "numeric",
                        })}
                      </h4>
                    </div>

                    {selectedStudent.attendanceRecords &&
                    selectedStudent.attendanceRecords.length > 0 ? (
                      <div className="space-y-2">
                        {selectedStudent.attendanceRecords.map(
                          (record, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                            >
                              <span className="font-cairo text-xs sm:text-sm text-gray-600">
                                {formatDateArabic(
                                  new Date(record.attendance_date),
                                  {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                  }
                                )}
                              </span>
                              <span
                                className={`font-cairo text-xs sm:text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                                  record.state === "present"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {record.state === "present" ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    حاضر
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3" />
                                    غائب
                                  </>
                                )}
                              </span>
                            </div>
                          )
                        )}
                        <div className="pt-2 border-t text-center">
                          <span className="font-cairo text-xs text-gray-600">
                            عدد أيام الحضور:{" "}
                            {
                              selectedStudent.attendanceRecords.filter(
                                (r) => r.state === "present"
                              ).length
                            }{" "}
                            / {selectedStudent.attendanceRecords.length}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="font-cairo text-sm text-gray-500">
                          لا توجد سجلات حضور لهذا الشهر
                        </p>
                      </div>
                    )}

                    {/* View All Attendance Button */}
                    <Button
                      onClick={() => setShowAttendanceHistory(true)}
                      className="w-full mt-3 bg-[#027E01] hover:bg-[#027E01]/90 text-white font-cairo font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      عرض السجل الكامل
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Review Session Content */}
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      onClick={handleBackFromReview}
                      className="bg-[#243048] hover:bg-[#243048]/90 text-white p-2 transition-all duration-200 cursor-pointer"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl sm:text-2xl font-bold font-cairo text-[#243048]">
                      حصة المراجعة
                    </h1>
                  </div>

                  {/* Student Avatar and Info */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#243048] flex items-center justify-center text-white text-4xl sm:text-5xl font-bold font-cairo mb-3">
                      {selectedStudent.photo ? (
                        <img
                          src={selectedStudent.photo}
                          alt={selectedStudent.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(selectedStudent.name)
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-cairo text-[#243048] mb-2 text-center">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-sm sm:text-base font-cairo text-gray-600">
                      الرقم التعريفي:{" "}
                      <span className="font-bold text-[#243048]">
                        {selectedStudent.code}
                      </span>
                    </p>
                  </div>

                  {/* Student Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-cairo text-xs sm:text-sm text-gray-600">
                        المستوى:
                      </span>
                      <span className="font-cairo text-sm sm:text-base font-bold text-[#243048]">
                        {selectedStudent.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-cairo text-xs sm:text-sm text-gray-600">
                        تاريخ الالتحاق:
                      </span>
                      <span className="font-cairo text-sm sm:text-base font-bold text-[#243048]">
                        {selectedStudent.enrollmentDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-cairo text-xs sm:text-sm text-gray-600">
                        العمر:
                      </span>
                      <span className="font-cairo text-sm sm:text-base font-bold text-[#243048]">
                        {selectedStudent.age} سنة
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-cairo text-xs sm:text-sm text-gray-600">
                        بداية الحفظ:
                      </span>
                      <span className="font-cairo text-sm sm:text-base font-bold text-[#243048]">
                        {selectedStudent.memorizationMethod}
                      </span>
                    </div>
                  </div>

                  {/* Review Session Form */}
                  <div className="bg-white rounded-lg p-4 space-y-4">
                    {/* Current Review Input */}
                    <div>
                      <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
                        ورد المراجعة:
                      </label>
                      <Input
                        type="text"
                        value={reviewData.currentReview}
                        onChange={(e) =>
                          setReviewData({
                            ...reviewData,
                            currentReview: e.target.value,
                          })
                        }
                        placeholder="مثال: سورة البقرة - الآية 100"
                        className="w-full text-right font-cairo text-sm sm:text-base border-2 focus:border-[#027E01] transition-all"
                        dir="rtl"
                      />
                    </div>

                    {/* Review Date */}
                    <div>
                      <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
                        تاريخ المراجعة:
                      </label>
                      <Input
                        type="date"
                        value={reviewData.date}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, date: e.target.value })
                        }
                        className="w-full text-right font-cairo text-sm sm:text-base border-2 focus:border-[#027E01] transition-all"
                        dir="rtl"
                      />
                    </div>

                    {/* Rating System */}
                    <div>
                      <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-3">
                        التقييم:
                      </label>
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRatingClick(star)}
                            className={`text-3xl sm:text-4xl transition-all duration-200 hover:scale-110 cursor-pointer ${
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

                    {/* Quick Notes Dropdown */}
                    <div>
                      <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
                        ملاحظات سريعة:
                      </label>
                      <select
                        value={reviewData.quickNote}
                        onChange={(e) =>
                          setReviewData({
                            ...reviewData,
                            quickNote: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 sm:py-3 text-right border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#027E01] focus:ring-2 focus:ring-[#027E01]/20 transition-all duration-300 font-cairo text-sm sm:text-base bg-white cursor-pointer"
                        dir="rtl"
                      >
                        <option value="">اختر ملاحظة سريعة...</option>
                        {quickNotes.map((note, index) => (
                          <option key={index} value={note}>
                            {note}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes Textarea */}
                    <div>
                      <label className="block font-cairo text-sm sm:text-base font-bold text-[#243048] mb-2">
                        الملاحظات:
                      </label>
                      <textarea
                        value={reviewData.notes}
                        onChange={(e) =>
                          setReviewData({
                            ...reviewData,
                            notes: e.target.value,
                          })
                        }
                        placeholder="اكتب ملاحظاتك هنا..."
                        rows="4"
                        className="w-full px-4 py-3 text-right border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#027E01] focus:ring-2 focus:ring-[#027E01]/20 transition-all duration-300 font-cairo text-sm sm:text-base resize-none"
                        dir="rtl"
                      />
                    </div>

                    {/* Save Button */}
                    <Button
                      onClick={handleSaveReview}
                      className="w-full bg-[#027E01] hover:bg-[#027E01]/90 text-white font-cairo font-bold text-base sm:text-lg py-3 sm:py-4 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="h-5 w-5" />
                      <span>حفظ حصة المراجعة</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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
              {dialog.type === "info" && (
                <Info className="h-5 w-5 text-blue-500" />
              )}
              <span>{dialog.title}</span>
            </DialogTitle>
            <DialogDescription className="text-right">
              {dialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {dialog.type === "confirm" ? (
              <>
                <Button
                  onClick={() => setDialog({ ...dialog, open: false })}
                  variant="outline"
                  className="font-cairo"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => {
                    dialog.onConfirm?.();
                    setDialog({ ...dialog, open: false });
                  }}
                  className="bg-red-600 hover:bg-red-700 font-cairo"
                >
                  تأكيد
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setDialog({ ...dialog, open: false })}
                className="w-full font-cairo cursor-pointer"
              >
                حسناً
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Memorization History Dialog */}
      {selectedStudent && (
        <MemorizationHistoryDialog
          student={selectedStudent}
          open={showMemorizationHistory}
          onOpenChange={setShowMemorizationHistory}
          onSessionChanged={() =>
            fetchSessionHistory(
              selectedStudent.code,
              selectedStudent.memorization_method
            )
          }
        />
      )}

      {/* Review History Dialog */}
      {selectedStudent && (
        <ReviewHistoryDialog
          student={selectedStudent}
          open={showReviewHistory}
          onOpenChange={setShowReviewHistory}
          onSessionChanged={() =>
            fetchSessionHistory(
              selectedStudent.code,
              selectedStudent.memorization_method
            )
          }
        />
      )}

      {/* Attendance History Dialog */}
      {selectedStudent && (
        <AttendanceHistoryDialog
          student={selectedStudent}
          open={showAttendanceHistory}
          onOpenChange={setShowAttendanceHistory}
        />
      )}

      {/* All Students Attendance Dialog */}
      <AllStudentsAttendanceDialog
        open={showAllStudentsAttendance}
        onOpenChange={setShowAllStudentsAttendance}
      />
    </div>
  );
}

export default StudentsList;
