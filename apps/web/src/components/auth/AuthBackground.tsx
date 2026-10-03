import React from "react";

export const AuthBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            {/* Soft Ambient Light Orbs with Slow GPU Transforms */}
            <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] sm:w-[36rem] sm:h-[36rem] bg-indigo-200/35 rounded-full blur-3xl animate-float-slow-1 will-change-transform" />
            <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] sm:w-[40rem] sm:h-[40rem] bg-purple-200/30 rounded-full blur-3xl animate-float-slow-2 will-change-transform" />
            <div className="absolute top-1/2 left-1/2 w-[35rem] h-[35rem] sm:w-[48rem] sm:h-[48rem] bg-blue-100/25 rounded-full blur-3xl animate-float-slow-3 will-change-transform" />

            {/* Subtle Technical Grid Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f050_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f050_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_65%,transparent_100%)]" />
        </div>
    );
};

export default AuthBackground;
