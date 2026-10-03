import { useState, useEffect, useId } from "react";
import { User as UserIcon, Lock, CheckCircle2, AlertCircle, Save, ShieldCheck, Info } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile } from "../../services/user.service";
import { updateProfileSchema } from "../../utils/user.schema";
import ChangePasswordModal from "../../components/settings/ChangePasswordModal";

export const SettingsPage = () => {
    const fullNameId = useId();
    const emailAddressId = useId();
    const { user, updateUser } = useAuth();

    const [name, setName] = useState(user?.name || "");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);

    // Sync state when user context changes
    useEffect(() => {
        if (user?.name) {
            setName(user.name);
        }
    }, [user?.name]);

    const isNameChanged = name.trim() !== (user?.name || "");

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(null);

        const result = updateProfileSchema.safeParse({ name });
        if (!result.success) {
            setProfileError(result.error.issues[0]?.message || "Invalid name");
            return;
        }

        try {
            setIsSavingProfile(true);
            const response = await updateProfile({ name: name.trim() });
            if (response.user) {
                updateUser(response.user);
            }
            setProfileSuccess(response.message || "Profile updated successfully!");
            setTimeout(() => setProfileSuccess(null), 4000);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            const msg = apiError.response?.data?.message || "Failed to update profile. Please try again.";
            setProfileError(msg);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSuccess = () => {
        setPasswordSuccessMessage("Your password was changed successfully.");
        setTimeout(() => setPasswordSuccessMessage(null), 5000);
    };

    return (
        <div className="min-h-full bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                            ⚙
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                            Account & Security
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                        Settings
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Manage your Finance One personal details, security credentials, and preferences.
                    </p>
                </div>

                {/* Password changed toast banner */}
                {passwordSuccessMessage && (
                    <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{passwordSuccessMessage}</span>
                    </div>
                )}

                {/* Main Settings Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Section 1: Profile Information */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Profile Information</h2>
                                <p className="text-xs text-slate-500">
                                    Update your display name and view your registered email address.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                            {profileSuccess && (
                                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span>{profileSuccess}</span>
                                </div>
                            )}

                            {profileError && (
                                <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                    <span>{profileError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Full Name Field */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor={fullNameId}
                                        className="block text-xs font-semibold text-slate-700"
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        id={fullNameId}
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your full name"
                                        disabled={isSavingProfile}
                                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-3 focus:ring-indigo-100 transition-colors"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400">
                                        This name is displayed across your dashboard and greetings.
                                    </p>
                                </div>

                                {/* Email Field (Read-only) */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor={emailAddressId}
                                        className="block text-xs font-semibold text-slate-700"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        id={emailAddressId}
                                        type="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed select-none"
                                    />
                                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                        <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                        <span>Email changes aren&apos;t available yet.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={!isNameChanged || isSavingProfile || !name.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isSavingProfile ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Section 2: Security & Password */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Account Security</h2>
                                <p className="text-xs text-slate-500">
                                    Manage your account password and security settings.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800">Password</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <ShieldCheck className="w-3 h-3" />
                                        Encrypted & Protected
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-mono tracking-widest">
                                    ••••••••••••
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Ensure your account uses a strong password with at least 8 characters.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer flex-shrink-0"
                            >
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                <span>Change Password</span>
                            </button>
                        </div>
                    </div>

                    {/* Section 3: Account Overview & Details */}
                    <div className="bg-slate-100/70 rounded-3xl border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                        <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">Finance One Smart Account</p>
                            <p className="text-slate-500">Account ID: #{user?.id || "N/A"} · Status: Active</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 self-start sm:self-auto">
                            Standard Tier
                        </span>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSuccess={handlePasswordSuccess}
            />
        </div>
    );
};

export default SettingsPage;
