import LandingNav from "../../components/landing/LandingNav";
import HeroSection from "../../components/landing/HeroSection";
import FeatureGrid from "../../components/landing/FeatureGrid";
import MVPSection from "../../components/landing/MVPSection";
import AIDirectionSection from "../../components/landing/AIDirectionSection";
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
                {/* Hero Section */}
                <HeroSection />

                {/* Core Capabilities */}
                <FeatureGrid />

                {/* MVP 1.0 Milestone & Development Stage */}
                <MVPSection />

                {/* AI Beta & Exploration Direction */}
                <AIDirectionSection />

                {/* Product Philosophy */}
                <PhilosophySection />

                {/* Final Call to Action */}
                <FinalCTASection />
            </main>

            {/* 3. Minimal Fintech Footer */}
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
