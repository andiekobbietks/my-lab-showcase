import { useState } from 'react';
import { getLabs, Lab } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, FlaskConical, Target, Server, CheckCircle2, CircleDot } from 'lucide-react';

const LabsSection = () => {
  const labs = getLabs();
  const [selected, setSelected] = useState<Lab | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const allTags = [...new Set(labs.flatMap(l => l.tags))];
  const filtered = filter ? labs.filter(l => l.tags.includes(filter)) : labs;

  return (
    <section id="labs" className="py-20">
      <div className="container">
        <h2 className="text-3xl font-bold text-foreground mb-2">Labs Portfolio</h2>
        <p className="text-muted-foreground mb-6">Hands-on lab projects mirroring real-world SDDC environments.</p>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant={filter === null ? 'default' : 'outline'} size="sm" onClick={() => setFilter(null)}>All</Button>
            {allTags.map(tag => (
              <Button key={tag} variant={filter === tag ? 'default' : 'outline'} size="sm" onClick={() => setFilter(tag)}>{tag}</Button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No labs yet. Add your first lab from the admin panel at <code className="text-primary">/admin</code>.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(lab => (
              <Card key={lab.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelected(lab)}>
                <CardHeader>
                  <CardTitle className="text-lg">{lab.title}</CardTitle>
                  <CardDescription>{lab.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {lab.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          {selected && (
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selected.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight">{selected.title}</DialogTitle>
                <p className="text-muted-foreground text-sm mt-1">{selected.description}</p>
              </DialogHeader>

              <div className="space-y-6 mt-2">
                {/* Objective & Environment cards side by side */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {selected.objective && (
                    <div className="flex gap-3 p-4 bg-secondary/30 border border-border rounded-lg">
                      <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Objective</p>
                        <p className="text-sm text-foreground leading-relaxed">{selected.objective}</p>
                      </div>
                    </div>
                  )}
                  {selected.environment && (
                    <div className="flex gap-3 p-4 bg-secondary/30 border border-border rounded-lg">
                      <Server className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Environment</p>
                        <p className="text-sm text-foreground leading-relaxed">{selected.environment}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline steps */}
                {selected.steps.length > 0 && selected.steps.some(s => s.trim()) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Process</p>
                    <div className="relative pl-6">
                      {/* Timeline line */}
                      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                      <div className="space-y-4">
                        {selected.steps.filter(s => s.trim()).map((step, i, arr) => (
                          <div key={i} className="relative flex gap-4 items-start">
                            {/* Timeline dot */}
                            <div className="absolute -left-6 top-1">
                              {i === arr.length - 1 ? (
                                <CheckCircle2 className="h-[18px] w-[18px] text-primary" />
                              ) : (
                                <CircleDot className="h-[18px] w-[18px] text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 pb-1">
                              <span className="text-xs font-mono text-muted-foreground mr-2">Step {i + 1}</span>
                              <p className="text-sm text-foreground leading-relaxed mt-0.5">{step}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Outcome */}
                {selected.outcome && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Outcome</p>
                    <p className="text-sm text-foreground leading-relaxed">{selected.outcome}</p>
                  </div>
                )}

                {/* Repo link */}
                {selected.repoUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" />View Repo</a>
                  </Button>
                )}
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </section>
  );
};

export default LabsSection;
