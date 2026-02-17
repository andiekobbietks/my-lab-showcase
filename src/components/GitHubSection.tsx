import { useEffect, useState } from 'react';
import { getProfile } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Star, GitFork, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Repo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

const GitHubSection = () => {
  const profile = getProfile();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile.githubUsername) { setLoading(false); return; }
    fetch(`https://api.github.com/users/${profile.githubUsername}/repos?sort=updated&per_page=6`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRepos(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile.githubUsername]);

  if (!profile.githubUsername) {
    return (
      <section id="github" className="py-20 bg-card/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-foreground mb-4">GitHub</h2>
          <p className="text-muted-foreground">Set your GitHub username in the admin panel to display your repos here.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="github" className="py-20 bg-card/50">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">GitHub</h2>
          <Button variant="outline" size="sm" asChild>
            <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4 mr-2" />Profile
            </a>
          </Button>
        </div>

        {/* Contribution graph placeholder */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-3">Contribution Activity</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {Array.from({ length: 52 }, (_, week) => (
                <div key={week} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }, (_, day) => {
                    const level = Math.floor(Math.random() * 5);
                    return (
                      <div
                        key={day}
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: level === 0
                            ? 'hsl(var(--muted) / 0.3)'
                            : `hsl(var(--primary) / ${0.2 + level * 0.2})`
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-muted-foreground">Loading repos…</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map(repo => (
              <Card key={repo.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Github className="h-4 w-4 shrink-0" />
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors truncate">
                      {repo.name}
                    </a>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{repo.description || 'No description'}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {repo.language && <Badge variant="secondary">{repo.language}</Badge>}
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" />{repo.stargazers_count}</span>
                    <span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{repo.forks_count}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default GitHubSection;
