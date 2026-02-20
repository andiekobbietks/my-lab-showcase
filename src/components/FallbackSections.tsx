import { defaultProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, Star, User, BookOpen, Calendar, Download, FileText, CheckCircle2, Github, Mail, Linkedin } from 'lucide-react';

const profile = defaultProfile;
const categories = [...new Set(profile.skills.map(s => s.category))];

export const FallbackHero = () => (
  <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20 pointer-events-none" />
    <div className="container relative z-10 text-center py-20 px-6">
      <p className="text-primary text-sm uppercase tracking-[0.3em] font-semibold mb-6">Cloud & SDDC Engineer</p>
      <h1 className="text-5xl md:text-8xl font-bold text-foreground mb-6 tracking-tight">{profile.name}</h1>
      <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-4 max-w-2xl mx-auto border-b border-primary/20 pb-4">{profile.title}</p>
      <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-light">{profile.tagline}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button size="lg" className="h-14 px-10 text-lg rounded-full" onClick={() => document.querySelector('#labs')?.scrollIntoView({ behavior: 'smooth' })}>Explore My Labs</Button>
        <Button variant="ghost" size="lg" className="h-14 px-8 text-lg rounded-full" onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}>View My Skills</Button>
      </div>
      <div className="mt-20 opacity-40 animate-bounce cursor-pointer" onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}>
        <ArrowDown className="h-6 w-6 text-muted-foreground mx-auto" />
      </div>
    </div>
    <div className="absolute bottom-6 left-6 text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors">
      <a href="/admin">Developer Mode: Convex unavailable. Showing default profile. [Go to Admin]</a>
    </div>
  </section>
);

export const FallbackAbout = () => (
  <section id="about" className="py-20 bg-card/50">
    <div className="container max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Badge variant="secondary" className="text-xs uppercase tracking-widest px-4 py-1 rounded-full"><User className="h-3 w-3 mr-1.5 inline" />About the Engineer</Badge>
      </div>
      <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-6">Expertise & Background</h2>
      <p className="text-center text-muted-foreground text-lg max-w-3xl mx-auto mb-16 italic leading-relaxed">"{profile.bio}"</p>
      <div className="grid md:grid-cols-2 gap-8 mb-20">
        {categories.map(cat => (
          <Card key={cat} className="bg-background/40 backdrop-blur-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold tracking-tight">{cat || 'Miscellaneous'}</CardTitle>
              <Star className="h-4 w-4 text-primary/40" />
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {profile.skills.filter(s => s.category === cat).map(skill => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export const FallbackLabs = () => (
  <section id="labs" className="py-20">
    <div className="container max-w-6xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold text-foreground mb-4">Lab Projects</h2>
      <p className="text-muted-foreground mb-8">Connect to Convex to see lab projects</p>
    </div>
  </section>
);

export const FallbackGitHub = () => (
  <section id="github" className="py-20 bg-background">
    <div className="container max-w-6xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold text-foreground mb-4">GitHub Activity</h2>
      <p className="text-muted-foreground">Configure your profile to see GitHub activity</p>
    </div>
  </section>
);

export const FallbackBlog = () => (
  <section id="blog" className="py-20">
    <div className="container max-w-6xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold text-foreground mb-4">Blog</h2>
      <p className="text-muted-foreground">Connect to Convex to see blog posts</p>
    </div>
  </section>
);

export const FallbackCV = () => (
  <section id="cv" className="py-20 bg-card/50">
    <div className="container max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold text-foreground mb-4">Curriculum Vitae</h2>
      <p className="text-muted-foreground">Configure your profile to enable CV download</p>
    </div>
  </section>
);

export const FallbackContact = () => (
  <section id="contact" className="py-20">
    <div className="container max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold text-foreground mb-4">Get in Touch</h2>
      <p className="text-muted-foreground">Connect to Convex to enable the contact form</p>
    </div>
  </section>
);
