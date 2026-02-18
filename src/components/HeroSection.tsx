import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, ArrowDown, RefreshCw } from 'lucide-react';

const HeroSection = () => {
  const profile = useQuery(api.queries.getProfile);

  if (profile === undefined) {
    return (
      <section className="min-h-[50vh] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="min-h-[50vh] flex items-center justify-center p-12 text-center border-b border-dashed">
        <div className="space-y-4 max-w-md mx-auto">
          <h1 className="text-4xl font-bold">Welcome to Your Portfolio</h1>
          <p className="text-muted-foreground">This site is now powered by **Convex**. To get started, seed your data or create a profile in the admin panel.</p>
          <Button asChild>
            <a href="/admin">Go to Admin Panel</a>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Gradient background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20 pointer-events-none" />
      <div className="container relative z-10 text-center py-20">
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-4">Welcome</p>
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4">{profile.name}</h1>
        <p className="text-xl md:text-2xl text-primary font-semibold mb-2">{profile.title}</p>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">{profile.tagline}</p>

        <div className="flex gap-3 justify-center mb-8">
          {profile.githubUsername && (
            <Button variant="outline" size="icon" asChild>
              <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer"><Github className="h-5 w-5" /></a>
            </Button>
          )}
          {profile.linkedinUrl && (
            <Button variant="outline" size="icon" asChild>
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5" /></a>
            </Button>
          )}
          {profile.email && (
            <Button variant="outline" size="icon" asChild>
              <a href={`mailto:${profile.email}`}><Mail className="h-5 w-5" /></a>
            </Button>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => document.querySelector('#labs')?.scrollIntoView({ behavior: 'smooth' })}>
            View My Labs
          </Button>
          <Button variant="secondary" onClick={() => document.querySelector('#cv')?.scrollIntoView({ behavior: 'smooth' })}>
            Download CV
          </Button>
        </div>

        <div className="mt-16 animate-bounce">
          <ArrowDown className="h-6 w-6 text-muted-foreground mx-auto" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
