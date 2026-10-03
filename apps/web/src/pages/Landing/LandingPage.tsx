import LandingNav from "../../components/landing/LandingNav";
import HeroSection from "../../components/landing/HeroSection";
import FeatureGrid from "../../components/landing/FeatureGrid";
import MVPSection from "../../components/landing/MVPSection";
import AIPrivacySection from "../../components/landing/AIPrivacySection";
import RoadmapSection from "../../components/landing/RoadmapSection";
import PhilosophySection from "../../components/landing/PhilosophySection";
import FinalCTASection from "../../components/landing/FinalCTASection";
import LandingFooter from "../../components/landing/LandingFooter";

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col selection:bg-purple-100 selection:text-purple-900">
            {/* 1. Sticky Navigation Bar */}
            <LandingNav />

            {/* 2. Main Landing Page Sections */}
            <main className="flex-1">
                {/* Hero Section: Early Beta · MVP 1 */}
                <HeroSection />

                {/* What You Can Do Today: Track, Plan, Understand */}
                <FeatureGrid />

                {/* MVP 1: Getting the fundamentals right */}
                <MVPSection />

                {/* AI & Privacy: What we're exploring & The Three Principles */}
                <AIPrivacySection />

                {/* AI Exploration & Where Finance One is Heading */}
                <RoadmapSection />

                {/* Product Philosophy */}
                <PhilosophySection />

                {/* You're Early & Final Call to Action */}
                <FinalCTASection />
            </main>

            {/* 3. Minimal Fintech Footer */}
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
