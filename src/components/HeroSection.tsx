import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, ArrowDown, RefreshCw } from 'lucide-react';
import { defaultProfile } from '@/lib/data';

const HeroSection = () => {
  const convexProfile = useQuery(api.queries.getProfile);

  // Still loading from cloud
  if (convexProfile === undefined) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  // Use cloud profile or fallback to original default
  const profile = convexProfile || defaultProfile;

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20 pointer-events-none" />

      {/* Animated subtle shapes for UX depth */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="container relative z-10 text-center py-20 px-6">
        <p className="text-primary text-sm uppercase tracking-[0.3em] font-semibold mb-6 animate-fade-in">
          Cloud & SDDC Engineer
        </p>

        <h1 className="text-5xl md:text-8xl font-bold text-foreground mb-6 tracking-tight">
          {profile.name}
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-4 max-w-2xl mx-auto border-b border-primary/20 pb-4">
          {profile.title}
        </p>

        <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-light">
          {profile.tagline}
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-12">
          {profile.githubUsername && (
            <Button variant="outline" size="lg" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all" asChild>
              <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5 mr-2" /> GitHub
              </a>
            </Button>
          )}
          {profile.linkedinUrl && (
            <Button variant="outline" size="lg" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all" asChild>
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5 mr-2" /> LinkedIn
              </a>
            </Button>
          )}
          {profile.email && (
            <Button variant="outline" size="lg" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all" asChild>
              <a href={`mailto:${profile.email}`}>
                <Mail className="h-5 w-5 mr-2" /> Contact
              </a>
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform" onClick={() => document.querySelector('#labs')?.scrollIntoView({ behavior: 'smooth' })}>
            Explore My Labs
          </Button>
          <Button variant="ghost" size="lg" className="h-14 px-8 text-lg rounded-full hover:bg-secondary/50" onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}>
            View My Skills
          </Button>
        </div>

        <div className="mt-20 opacity-40 animate-bounce cursor-pointer" onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}>
          <ArrowDown className="h-6 w-6 text-muted-foreground mx-auto" />
        </div>
      </div>

      {/* Admin Quick Access (Only if database is empty - helping the user) */}
      {!convexProfile && (
        <div className="absolute bottom-6 left-6 text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors">
          <a href="/admin">Developer Mode: Database is empty. Showing default profile. [Go to Admin]</a>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
