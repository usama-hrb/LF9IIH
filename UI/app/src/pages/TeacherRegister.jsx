    import { useState } from "react";
    import { useNavigate, Link } from "react-router-dom";
    import { Button } from "../components/ui/button";
    import { Input } from "../../components/ui/input";
    import { Navigation } from "../components/Navigation";
    import { signup, login, me, saveDoctorProfile } from "../lib/auth";
    import { useAuth } from "../lib/auth-context";

    function TeacherRegister() {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        phone_number: "",
        email: "",
        password: "",
        confirm_password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successInfo, setSuccessInfo] = useState(null); // { profile }
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!form.first_name || !form.last_name)
        return "الاسم الأول واسم العائلة مطلوبان";
        if (!/^[0-9]{10,14}$/.test(form.phone_number))
        return "رقم الهاتف يجب أن يكون من 10 إلى 14 رقمًا";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return "البريد الإلكتروني غير صالح";
        if (form.password.length < 8)
        return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
        if (form.password !== form.confirm_password)
        return "كلمتا المرور غير متطابقتين";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const v = validate();
        if (v) {
        setError(v);
        return;
        }
        setIsLoading(true);
        try {
        const payload = {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            phone_number: form.phone_number.trim(),
            email: form.email.trim(),
            password: form.password,
        };
        const result = await signup(payload); // may return { code } or success
        let profile = null;
        try {
            profile = await me();
        } catch {
            // Fallback: if signup didn't set cookie but returned a code, try logging in
            const returnedCode = result?.code;
            if (returnedCode) {
            try {
                await login({ code: String(returnedCode) });
                profile = await me();
            } catch {
                /* ignore fallback failure */
            }
            }
        }
        const finalProfile =
            profile || (result?.code ? { code: result.code } : null);
        if (finalProfile) {
            saveDoctorProfile(finalProfile);
            setUser(finalProfile);
        }
        setSuccessInfo({ profile: finalProfile });
        } catch (err) {
        // Show first useful message
        const msg =
            err?.data?.detail || err?.message || "حدث خطأ أثناء إنشاء الحساب";
        setError(msg);
        } finally {
        setIsLoading(false);
        }
    };

    if (successInfo) {
        const { profile } = successInfo;
        return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
            <div className="bg-white min-h-[90vh] w-[95vw] max-w-3xl rounded-lg overflow-hidden flex flex-col font-cairo transition-all duration-500 ease-in-out hover:shadow-2xl">
            <div className="w-full bg-[#243048] border-b-2 border-white p-6 text-white">
                <Navigation />
            </div>
            <div className="p-6 md:p-10 text-center space-y-6">
                <h1 className="text-2xl md:text-3xl font-bold text-[#243048]">
                تم إنشاء حساب المعلم بنجاح
                </h1>
                <p className="text-gray-700">
                احتفظ بالرمز التعريفي الخاص بك لتسجيل الدخول مستقبلاً:
                </p>
                <div className="inline-flex items-center justify-center gap-3 bg-[#F4F6FA] border border-gray-200 rounded-xl px-6 py-4 text-[#243048] text-lg font-semibold">
                <span>الرمز:</span>
                <span className="font-mono text-2xl">{profile?.code}</span>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                <Button
                    className="bg-[#027E01] hover:bg-[#027E01]/90"
                    onClick={() => navigate("/teacher/dashboard")}
                >
                    اذهب إلى لوحة التحكم
                </Button>
                <Button
                    variant="outline"
                    className="border-[#027E01] text-[#027E01] hover:bg-[#027E01]/10"
                    onClick={() => navigate("/teacher/login")}
                >
                    الذهاب إلى تسجيل الدخول
                </Button>
                </div>
            </div>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="bg-white min-h-[90vh] w-[95vw] max-w-5xl rounded-lg overflow-hidden flex flex-col md:flex-row font-cairo transition-all duration-500 ease-in-out hover:shadow-2xl">
            <div className="hidden md:flex w-full md:w-1/2 bg-white min-h-[90vh] md:min-h-0 items-center justify-center p-6 md:p-8">
            {/* You can place an illustration here similar to login */}
            <div className="w-full max-w-2xl">
                <img
                src="/vite.svg"
                alt="register"
                className="w-48 h-48 opacity-60 mx-auto"
                />
            </div>
            </div>
            <div className="w-full md:w-1/2 bg-[#243048] border-2 border-white flex flex-col justify-center items-center min-h-[90vh] md:min-h-0 p-6 md:p-8">
            <div className="mb-8 w-full flex justify-center md:justify-end">
                <Navigation />
            </div>
            <div className="flex flex-col items-center md:items-end justify-center w-full max-w-md gap-6 my-auto">
                <div className="text-center md:text-right space-y-2 w-full">
                <h1 className="text-xl md:text-[24px] font-bold font-cairo text-white">
                    تسجيل حساب معلم جديد
                </h1>
                <p className="text-sm md:text-[14px] font-cairo text-gray-300">
                    أدخل بياناتك لإنشاء حسابك.
                </p>
                </div>

                {error && (
                <div className="w-full text-right text-red-300 bg-red-900/30 border border-red-700 rounded-lg p-3">
                    {error}
                </div>
                )}

                <form onSubmit={handleSubmit} className="w-full space-y-4 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                    name="first_name"
                    type="text"
                    placeholder="الاسم الأول"
                    className="text-right bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    value={form.first_name}
                    onChange={onChange}
                    autoComplete="given-name"
                    disabled={isLoading}
                    dir="rtl"
                    />
                    <Input
                    name="last_name"
                    type="text"
                    placeholder="اسم العائلة"
                    className="text-right bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    value={form.last_name}
                    onChange={onChange}
                    autoComplete="family-name"
                    disabled={isLoading}
                    dir="rtl"
                    />
                </div>

                <Input
                    name="phone_number"
                    type="tel"
                    placeholder="رقم الهاتف (10-14 رقمًا)"
                    className="text-right bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    value={form.phone_number}
                    onChange={onChange}
                    autoComplete="tel"
                    disabled={isLoading}
                    dir="rtl"
                />

                <Input
                    name="email"
                    type="email"
                    placeholder="البريد الإلكتروني"
                    className="text-right bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    value={form.email}
                    onChange={onChange}
                    autoComplete="email"
                    disabled={isLoading}
                    dir="rtl"
                />

                <Input
                    name="password"
                    type="password"
                    placeholder="كلمة المرور"
                    className="text-right bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    value={form.password}
                    onChange={onChange}
                    autoComplete="new-password"
                    disabled={isLoading}
                    dir="rtl"
                />

                <Input
                    name="confirm_password"
                    type="password"
                    placeholder="تأكيد كلمة المرور"
                    className="text-right bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    value={form.confirm_password}
                    onChange={onChange}
                    autoComplete="new-password"
                    disabled={isLoading}
                    dir="rtl"
                />

                <div className="flex justify-between items-center pt-2">
                    <Link
                    to="/teacher/login"
                    className="text-[#027E01] hover:underline text-sm"
                    >
                    لديك حساب؟ تسجيل الدخول
                    </Link>
                    <Button
                    type="submit"
                    className="bg-[#027E01] hover:bg-[#027E01]/90 text-white text-base py-5 w-40"
                    disabled={isLoading}
                    >
                    {isLoading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
                    </Button>
                </div>
                <p className="text-xs text-gray-300 text-right">
                    يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل وتتضمن حروفًا
                    كبيرة وصغيرة وأرقامًا.
                </p>
                </form>
            </div>
            </div>
        </div>
        </div>
    );
    }

    export default TeacherRegister;
