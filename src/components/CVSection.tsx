import { api } from '../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, RefreshCw, CheckCircle2 } from 'lucide-react';
import { defaultProfile } from '@/lib/data';
import { useSafeQuery } from '@/hooks/use-safe-query';

const CVSection = () => {
  const convexProfile = useSafeQuery(api.queries.getProfile);

  if (convexProfile === undefined) {
    return (
      <section id="cv" className="py-20 bg-card/50">
        <div className="container flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const profile = convexProfile || defaultProfile;

  return (
    <section id="cv" className="py-24 bg-card/30 border-y border-border/40">
      <div className="container px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8 bg-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Professional Credentials</span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Resume & CV</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                My professional journey from networking fundamentals to advanced SDDC architecture. Download the full PDF for a detailed breakdown of my experience and technical stack.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">CCNA & AWS Certified</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Expertise in VMware Ecosystem</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Automation-First Mindset</span>
                </div>
              </div>
            </div>

            <div className="relative group">
              {/* Decorative elements */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

              <Card className="relative bg-background/80 backdrop-blur-xl border-border/60 overflow-hidden rounded-2xl shadow-2xl">
                <CardContent className="p-10 text-center">
                  <div className="bg-primary/10 h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{profile.name}</h3>
                  <p className="text-primary font-medium mb-6">{profile.title}</p>

                  {profile.cvUrl ? (
                    <Button size="lg" className="w-full h-14 rounded-xl text-lg shadow-lg shadow-primary/20" asChild>
                      <a href={profile.cvUrl} download>
                        <Download className="h-5 w-5 mr-2" /> Download Full CV
                      </a>
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Button disabled size="lg" className="w-full h-14 rounded-xl text-lg opacity-50 hover:bg-primary">
                        <Download className="h-5 w-5 mr-2" /> CV Pending
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-4 italic">
                        Manage your CV link in the <a href="/admin" className="underline hover:text-primary">Admin Panel</a>.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVSection;
