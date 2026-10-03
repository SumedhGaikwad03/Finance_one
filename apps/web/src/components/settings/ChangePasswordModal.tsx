import { useState, useEffect, useId } from "react";
import { Lock, Eye, EyeOff, X, Check, AlertCircle, ShieldCheck } from "lucide-react";
import { changePassword } from "../../services/user.service";
import { changePasswordSchema } from "../../utils/user.schema";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const ChangePasswordModal = ({
    isOpen,
    onClose,
    onSuccess,
}: ChangePasswordModalProps) => {
    const currentPassId = useId();
    const newPassId = useId();
    const confirmPassId = useId();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [isSuccess, setIsSuccess] = useState(false);

    // Reset state when opened or closed
    useEffect(() => {
        if (isOpen) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setErrorMessage(null);
            setFieldErrors({});
            setIsSuccess(false);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isSubmitting) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose, isSubmitting]);

    if (!isOpen) return null;

    // Password strength computation
    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return { score: 0, label: "None", color: "bg-slate-200" };
        let score = 0;
        if (pwd.length >= 8) score += 1;
        if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
        if (/\d/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

        if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-600" };
        if (score <= 3) return { score: 2, label: "Good", color: "bg-amber-500", text: "text-amber-600" };
        return { score: 3, label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" };
    };

    const strength = getPasswordStrength(newPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setFieldErrors({});

        // Validate with Zod
        const result = changePasswordSchema.safeParse({
            currentPassword,
            newPassword,
            confirmPassword,
        });

        if (!result.success) {
            const formattedErrors: { [key: string]: string } = {};
            result.error.issues.forEach((err) => {
                const field = err.path[0] as string;
                if (field && !formattedErrors[field]) {
                    formattedErrors[field] = err.message;
                }
            });
            setFieldErrors(formattedErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            await changePassword({
                currentPassword,
                newPassword,
            });
            setIsSuccess(true);
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1200);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            const msg = apiError.response?.data?.message || "Failed to update password. Please try again.";
            setErrorMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
        >
            <div
                className="fixed inset-0"
                onClick={() => !isSubmitting && onClose()}
                aria-hidden="true"
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 z-10 space-y-5 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h2
                                id="change-password-title"
                                className="text-base font-bold text-slate-900 tracking-tight"
                            >
                                Change Password
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                Keep your account safe with a strong, updated password.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">Password Updated!</h3>
                        <p className="text-xs text-slate-500 max-w-xs">
                            Your password has been changed securely.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errorMessage && (
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Current Password */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor={currentPassId}
                                className="block text-xs font-semibold text-slate-700"
                            >
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    id={currentPassId}
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter your current password"
                                    disabled={isSubmitting}
                                    className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border ${
                                        fieldErrors.currentPassword
                                            ? "border-rose-400 focus:ring-rose-200"
                                            : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                                    } bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-3 transition-colors`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.currentPassword && (
                                <p className="text-[11px] text-rose-600 font-medium">
                                    {fieldErrors.currentPassword}
                                </p>
                            )}
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor={newPassId}
                                    className="block text-xs font-semibold text-slate-700"
                                >
                                    New Password
                                </label>
                                {newPassword.length > 0 && (
                                    <span className={`text-[11px] font-semibold ${strength.text}`}>
                                        {strength.label}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    id={newPassId}
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    disabled={isSubmitting}
                                    className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border ${
                                        fieldErrors.newPassword
                                            ? "border-rose-400 focus:ring-rose-200"
                                            : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                                    } bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-3 transition-colors`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Password strength visual bars */}
                            {newPassword.length > 0 && (
                                <div className="grid grid-cols-3 gap-1 pt-1">
                                    <div
                                        className={`h-1 rounded-full ${
                                            strength.score >= 1 ? strength.color : "bg-slate-100"
                                        }`}
                                    />
                                    <div
                                        className={`h-1 rounded-full ${
                                            strength.score >= 2 ? strength.color : "bg-slate-100"
                                        }`}
                                    />
                                    <div
                                        className={`h-1 rounded-full ${
                                            strength.score >= 3 ? strength.color : "bg-slate-100"
                                        }`}
                                    />
                                </div>
                            )}

                            {fieldErrors.newPassword && (
                                <p className="text-[11px] text-rose-600 font-medium">
                                    {fieldErrors.newPassword}
                                </p>
                            )}
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor={confirmPassId}
                                className="block text-xs font-semibold text-slate-700"
                            >
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    id={confirmPassId}
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    disabled={isSubmitting}
                                    className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border ${
                                        fieldErrors.confirmPassword
                                            ? "border-rose-400 focus:ring-rose-200"
                                            : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                                    } bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-3 transition-colors`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="text-[11px] text-rose-600 font-medium">
                                    {fieldErrors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2.5 pt-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Update Password</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePasswordModal;
