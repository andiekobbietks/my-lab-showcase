import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import LabsSection from '@/components/LabsSection';
import GitHubSection from '@/components/GitHubSection';
import BlogSection from '@/components/BlogSection';
import CVSection from '@/components/CVSection';
import ContactSection from '@/components/ContactSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <LabsSection />
      <GitHubSection />
      <BlogSection />
      <CVSection />
      <ContactSection />
      <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Portfolio. Built with passion.
      </footer>
    </div>
  );
};

export default Index;
