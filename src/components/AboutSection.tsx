import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, RefreshCw } from 'lucide-react';

const AboutSection = () => {
  const profile = useQuery(api.queries.getProfile);

  if (!profile) {
    return (
      <section id="about" className="py-20 bg-card/50">
        <div className="container flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const categories = [...new Set(profile.skills.map((s: any) => s.category))];

  return (
    <section id="about" className="py-20 bg-card/50">
      <div className="container">
        <h2 className="text-3xl font-bold text-foreground mb-2">About Me</h2>
        <p className="text-muted-foreground mb-10 max-w-3xl">{profile.bio}</p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {categories.map(cat => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-lg">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.skills.filter(s => s.category === cat).map(skill => (
                  <div key={skill.name}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-foreground">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {profile.certifications.length > 0 && (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-4">Certifications</h3>
            <div className="flex flex-wrap gap-3">
              {profile.certifications.map(cert => (
                <Card key={cert.name} className="flex items-center gap-3 p-4">
                  <Award className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{cert.name}</p>
                    <p className="text-sm text-muted-foreground">{cert.issuer} · {cert.year}</p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AboutSection;
