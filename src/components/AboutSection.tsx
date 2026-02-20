import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, RefreshCw, User, Star } from 'lucide-react';
import { defaultProfile } from '@/lib/data';

const AboutSection = () => {
  const convexProfile = useQuery(api.queries.getProfile);

  if (convexProfile === undefined) {
    return (
      <section id="about" className="py-20 bg-card/50">
        <div className="container flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  // Use cloud profile or fallback to original default
  const profile = convexProfile || defaultProfile;
  const categories = [...new Set((profile.skills || []).map((s: any) => s.category))] as string[];

  return (
    <section id="about" className="py-24 bg-gradient-to-b from-background to-card/50 border-y border-border/50">
      <div className="container px-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2 px-4 py-1.5 bg-secondary/50 rounded-full border border-border">
            <User className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">About the Engineer</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>

        <h2 className="text-4xl font-bold text-center text-foreground mb-6">Expertise & Background</h2>
        <p className="text-muted-foreground text-center mb-16 max-w-3xl mx-auto text-lg leading-relaxed font-light italic">
          "{profile.bio}"
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-20">
          {categories.map((cat, idx) => (
            <Card key={cat} className="bg-background/40 backdrop-blur-sm border-border/60 hover:border-primary/40 transition-all group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                  {cat || 'Miscellaneous'}
                </CardTitle>
                <Star className="h-4 w-4 text-primary/40" />
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {profile.skills.filter(s => s.category === cat).map(skill => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground font-medium">{skill.name}</span>
                      <span className="text-primary font-mono font-bold">{skill.level}%</span>
                    </div>
                    <div className="relative h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        style={{ width: `${skill.level}%`, transitionDelay: `${idx * 100}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {(profile.certifications || []).length > 0 && (
          <div className="relative">
            <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              Professional Certifications
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.certifications.map(cert => (
                <div key={cert.name} className="group relative p-6 bg-card border border-border rounded-xl hover:shadow-xl hover:shadow-primary/5 transition-all">
                  <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary/40 transition-colors">
                    <Award className="h-10 w-10" />
                  </div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{cert.issuer}</p>
                  <h4 className="text-lg font-bold text-foreground leading-tight mb-2 pr-10">{cert.name}</h4>
                  <p className="text-sm text-muted-foreground">{cert.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutSection;
