import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import { registerSchema, type RegisterFormData } from "../../utils/auth.schema";
import { useAuth } from "../../contexts/AuthContext";
import AuthBackground from "../../components/auth/AuthBackground";
import AuthBrand from "../../components/auth/AuthBrand";
import AuthFeatureCards from "../../components/auth/AuthFeatureCards";

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register: registerUser } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerUser(data);
            toast.success("Account created successfully! Please log in.");
            navigate("/login");
        } catch (error: any) {
            console.error("Registration Error:", error);
            const serverMessage =
                error?.response?.data?.message ||
                (error?.response?.data?.errors && error.response.data.errors[0]?.message) ||
                error?.message ||
                "Registration failed. Please verify your details and try again.";
            toast.error(serverMessage);
        }
    };

    return (
        <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-[#FAFAFF] overflow-hidden">
            {/* Dynamic Ambient Background with Reduced Motion Support */}
            <AuthBackground />

            <div className="relative z-10 w-full max-w-6xl mx-auto py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
                    {/* Left Column: Brand Hero & Narrative */}
                    <div className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8 text-left">
                        {/* Brand Logo Header */}
                        <AuthBrand />

                        {/* Eyebrow & Headline */}
                        <div className="space-y-3 sm:space-y-4">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wider uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                A CLEARER PICTURE OF YOUR MONEY
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                                Create your account and{" "}
                                <span className="text-indigo-600">
                                    take control.
                                </span>
                            </h1>

                            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
                                Start building a clearer picture of your money. Track your spending, set meaningful goals, and make smarter decisions.
                            </p>
                        </div>

                        {/* Feature Cards: Track, Plan, Grow */}
                        <AuthFeatureCards />
                    </div>

                    {/* Right Column: Elevated Registration Card */}
                    <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
                        <div className="w-full bg-white border border-slate-200/80 shadow-[0_16px_48px_rgba(15,23,42,0.06)] rounded-3xl p-7 sm:p-9 text-left">
                            <div className="mb-6 space-y-1">
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    Create your account
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    Start building a clearer picture of your money
                                </p>
                            </div>

                            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="name"
                                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider px-1"
                                    >
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            autoComplete="name"
                                            className={`w-full h-12 bg-slate-50/60 border ${
                                                errors.name
                                                    ? "border-rose-400 focus:ring-rose-500/30 focus:border-rose-500"
                                                    : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-600"
                                            } rounded-xl px-4 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-3 focus:bg-white transition-all duration-200`}
                                            {...register("name")}
                                        />
                                    </div>
                                    {errors.name?.message && (
                                        <p className="text-rose-600 text-xs font-medium px-1 mt-0.5">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider px-1"
                                    >
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            className={`w-full h-12 bg-slate-50/60 border ${
                                                errors.email
                                                    ? "border-rose-400 focus:ring-rose-500/30 focus:border-rose-500"
                                                    : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-600"
                                            } rounded-xl px-4 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-3 focus:bg-white transition-all duration-200`}
                                            {...register("email")}
                                        />
                                    </div>
                                    {errors.email?.message && (
                                        <p className="text-rose-600 text-xs font-medium px-1 mt-0.5">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider px-1"
                                    >
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="At least 8 characters"
                                            autoComplete="new-password"
                                            className={`w-full h-12 bg-slate-50/60 border ${
                                                errors.password
                                                    ? "border-rose-400 focus:ring-rose-500/30 focus:border-rose-500"
                                                    : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-600"
                                            } rounded-xl px-4 pr-12 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-3 focus:bg-white transition-all duration-200`}
                                            {...register("password")}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-100"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password?.message && (
                                        <p className="text-rose-600 text-xs font-medium px-1 mt-0.5">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Creating account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Create account &rarr;</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                                <span>Already have an account?</span>
                                <Link
                                    to="/login"
                                    className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                                >
                                    Log in
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default RegisterPage;