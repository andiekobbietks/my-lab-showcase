import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { RefreshCw, Github, ExternalLink, Star, GitFork } from 'lucide-react';
import { defaultProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const GitHubSection = () => {
  const convexProfile = useQuery(api.queries.getProfile);

  if (convexProfile === undefined) {
    return (
      <section id="github" className="py-20 bg-background">
        <div className="container flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const profile = convexProfile || defaultProfile;
  const username = profile.githubUsername || 'your-github-username';

  return (
    <section id="github" className="py-24 bg-background">
      <div className="container px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-zinc-900 border-zinc-800 text-white overflow-hidden rounded-3xl shadow-2xl">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <Github className="h-6 w-6 text-white" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Open Source Integrity</span>
                  </div>
                  <h2 className="text-4xl font-bold mb-6 tracking-tight">Code Visibility</h2>
                  <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                    All lab configurations, automation scripts, and documentation are version-controlled and public. Transparency in infrastructure is key to reliable deployments.
                  </p>
                  <Button size="lg" variant="secondary" className="w-fit rounded-xl px-8 h-14 text-lg hover:bg-white hover:text-black transition-all" asChild>
                    <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-5 w-5 mr-2" /> Explore Repository
                    </a>
                  </Button>
                </div>

                <div className="bg-zinc-800/50 p-12 flex items-center justify-center border-l border-zinc-700/50">
                  <div className="space-y-6 w-full">
                    <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-zinc-700 rounded-full flex items-center justify-center">
                          <Star className="h-5 w-5 text-yellow-500" />
                        </div>
                        <span className="font-bold">Active Projects</span>
                      </div>
                      <span className="text-zinc-500 font-mono">24+</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-zinc-700 rounded-full flex items-center justify-center">
                          <GitFork className="h-5 w-5 text-blue-400" />
                        </div>
                        <span className="font-bold">Contributions</span>
                      </div>
                      <span className="text-zinc-500 font-mono">Last 12 Months</span>
                    </div>
                    <div className="text-center pt-4">
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-4">GitHub Profile Activity</p>
                      <div className="flex gap-1 justify-center">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className={`h-8 w-2 rounded-sm ${i % 3 === 0 ? 'bg-green-500' : 'bg-green-900/40'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {!profile.githubUsername && (
            <p className="text-center mt-6 text-[10px] text-muted-foreground/30 italic">
              Showing generic GitHub section. Add your username in the <a href="/admin" className="underline hover:text-primary">Admin Panel</a> to link your live profile.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default GitHubSection;
