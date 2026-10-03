export const PhilosophySection = () => {
    return (
        <section id="philosophy" className="py-20 sm:py-28 bg-slate-900 text-white relative overflow-hidden">
            {/* Ambient Background Blur */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-0"
                aria-hidden="true"
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-400">
                    Product Philosophy
                </span>

                <blockquote className="text-2xl sm:text-3.5xl lg:text-4xl font-black tracking-tight leading-tight sm:leading-snug text-slate-100">
                    “Personal finance shouldn't feel like maintaining a spreadsheet.”
                </blockquote>

                <p className="text-sm sm:text-base text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                    Finance One is designed around a simple idea: make recording your money easy, make understanding it clear, and gradually make the experience more intelligent.
                </p>
            </div>
        </section>
    );
};

export default PhilosophySection;
