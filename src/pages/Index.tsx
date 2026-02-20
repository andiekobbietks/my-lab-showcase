import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import LabsSection from '@/components/LabsSection';
import GitHubSection from '@/components/GitHubSection';
import BlogSection from '@/components/BlogSection';
import CVSection from '@/components/CVSection';
import ContactSection from '@/components/ContactSection';
import { ConvexErrorBoundary } from '@/components/ConvexErrorBoundary';
import {
  FallbackHero, FallbackAbout, FallbackLabs, FallbackGitHub,
  FallbackBlog, FallbackCV, FallbackContact
} from '@/components/FallbackSections';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ConvexErrorBoundary fallback={<FallbackHero />}>
        <HeroSection />
      </ConvexErrorBoundary>
      <ConvexErrorBoundary fallback={<FallbackAbout />}>
        <AboutSection />
      </ConvexErrorBoundary>
      <ConvexErrorBoundary fallback={<FallbackLabs />}>
        <LabsSection />
      </ConvexErrorBoundary>
      <ConvexErrorBoundary fallback={<FallbackGitHub />}>
        <GitHubSection />
      </ConvexErrorBoundary>
      <ConvexErrorBoundary fallback={<FallbackBlog />}>
        <BlogSection />
      </ConvexErrorBoundary>
      <ConvexErrorBoundary fallback={<FallbackCV />}>
        <CVSection />
      </ConvexErrorBoundary>
      <ConvexErrorBoundary fallback={<FallbackContact />}>
        <ContactSection />
      </ConvexErrorBoundary>
      <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Portfolio. Built with passion.
      </footer>
    </div>
  );
};

export default Index;
