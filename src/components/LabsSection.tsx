import { useState } from 'react';
import { getLabs, Lab } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, FlaskConical } from 'lucide-react';

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
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Objective</h4>
                  <p className="text-muted-foreground text-sm">{selected.objective}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Environment</h4>
                  <p className="text-muted-foreground text-sm">{selected.environment}</p>
                </div>
                {selected.steps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Steps</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      {selected.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Outcome</h4>
                  <p className="text-muted-foreground text-sm">{selected.outcome}</p>
                </div>
                {selected.repoUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" />View Repo</a>
                  </Button>
                )}
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </section>
  );
};

export default LabsSection;
