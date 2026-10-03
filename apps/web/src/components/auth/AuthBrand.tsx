import React from "react";
import { Wallet } from "lucide-react";

export const AuthBrand: React.FC = () => {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <Wallet className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    Finance One
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                    SMART LEDGER
                </span>
            </div>
        </div>
    );
};

export default AuthBrand;
