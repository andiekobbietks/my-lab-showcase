import { useState, useRef } from 'react';
import { getLabs, Lab, LabMedia } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, FlaskConical, Target, Server, CheckCircle2, CircleDot, Play, ChevronLeft, ChevronRight, Sparkles, Cpu, Cloud, FileText, AlertTriangle } from 'lucide-react';

const sourceConfig = {
  foundry: { label: 'On-Device AI', icon: Cpu },
  browser: { label: 'Browser-Based AI', icon: Sparkles },
  cloud: { label: 'Cloud AI', icon: Cloud },
  text: { label: 'Text-Based', icon: FileText },
};

const MediaPreview = ({ media, className = '' }: { media: LabMedia; className?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (media.type === 'video') {
    return (
      <div className={`relative group ${className}`}>
        <video
          ref={videoRef}
          src={media.url}
          muted
          loop
          playsInline
          className="w-full h-full object-cover rounded-md"
          onMouseEnter={() => { videoRef.current?.play(); setIsPlaying(true); }}
          onMouseLeave={() => { videoRef.current?.pause(); setIsPlaying(false); }}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-md">
            <Play className="h-8 w-8 text-foreground" />
          </div>
        )}
        {media.caption && <p className="text-xs text-muted-foreground mt-1">{media.caption}</p>}
      </div>
    );
  }

  if (media.type === 'gif') {
    return (
      <div className={className}>
        <img src={media.url} alt={media.caption || 'Lab demo'} className="w-full h-full object-cover rounded-md" />
        {media.caption && <p className="text-xs text-muted-foreground mt-1">{media.caption}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <img src={media.url} alt={media.caption || 'Lab screenshot'} className="w-full h-full object-cover rounded-md" />
      {media.caption && <p className="text-xs text-muted-foreground mt-1">{media.caption}</p>}
    </div>
  );
};

const NarrationCard = ({ media }: { media: LabMedia }) => {
  if (!media.narration) return null;

  const SourceIcon = media.narrationSource ? sourceConfig[media.narrationSource]?.icon : FileText;

  return (
    <div className="mt-3 p-4 bg-secondary/30 border border-border rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Walkthrough</span>
        {media.narrationSource && (
          <Badge variant="outline" className="text-xs ml-auto">
            <SourceIcon className="h-3 w-3 mr-1" />
            {sourceConfig[media.narrationSource]?.label}
          </Badge>
        )}
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{media.narration}</p>
      {media.narrationConfidence && media.narrationConfidence !== 'high' && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3" />
          <span>{media.narrationConfidence === 'medium' ? 'Some observations may need verification' : 'Low confidence — review recommended'}</span>
        </div>
      )}
    </div>
  );
};

const MediaGallery = ({ media, showNarration }: { media: LabMedia[]; showNarration: boolean }) => {
  const [current, setCurrent] = useState(0);
  if (!media.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Demo Gallery</p>
      <div className="relative">
        <div className="aspect-video bg-secondary/30 border border-border rounded-lg overflow-hidden">
          <MediaPreview media={media[current]} className="h-full" />
        </div>
        {media.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-80"
              onClick={() => setCurrent(p => (p - 1 + media.length) % media.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-80"
              onClick={() => setCurrent(p => (p + 1) % media.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-12 rounded border overflow-hidden transition-all ${i === current ? 'border-primary ring-1 ring-primary' : 'border-border opacity-60 hover:opacity-100'}`}
            >
              {m.type === 'video' ? (
                <video src={m.url} muted className="w-full h-full object-cover" />
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Narration card synced to current media */}
      {showNarration && <NarrationCard media={media[current]} />}
    </div>
  );
};

const CardThumbnail = ({ lab }: { lab: Lab }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const firstMedia = lab.media?.[0];
  if (!firstMedia) return null;

  if (firstMedia.type === 'video') {
    return (
      <div className="relative aspect-video bg-secondary/30 overflow-hidden rounded-t-md -mx-6 -mt-6 mb-4">
        <video
          ref={videoRef}
          src={firstMedia.url}
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onMouseEnter={() => videoRef.current?.play()}
          onMouseLeave={() => { videoRef.current?.pause(); if (videoRef.current) videoRef.current.currentTime = 0; }}
        />
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-xs"><Play className="h-3 w-3 mr-1" />Video</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-secondary/30 overflow-hidden rounded-t-md -mx-6 -mt-6 mb-4">
      <img src={firstMedia.url} alt={lab.title} className="w-full h-full object-cover" />
      {firstMedia.type === 'gif' && (
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-xs">GIF</Badge>
        </div>
      )}
    </div>
  );
};

const LabsSection = () => {
  const labs = getLabs();
  const [selected, setSelected] = useState<Lab | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showNarration, setShowNarration] = useState(false);

  const allTags = [...new Set(labs.flatMap(l => l.tags))];
  const filtered = filter ? labs.filter(l => l.tags.includes(filter)) : labs;

  const hasAnyNarration = selected?.media?.some(m => m.narration) || !!selected?.aiNarration;

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
              <Card key={lab.id} className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden" onClick={() => { setSelected(lab); setShowNarration(false); }}>
                <CardHeader className="relative">
                  <CardThumbnail lab={lab} />
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
                {/* AI Walkthrough toggle */}
                {hasAnyNarration && (
                  <div className="flex justify-end">
                    <Button
                      variant={showNarration ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowNarration(!showNarration)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      AI Walkthrough
                    </Button>
                  </div>
                )}

                {/* Overall AI summary */}
                {showNarration && selected.aiNarration && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">AI Lab Summary</span>
                      {selected.narrationSource && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {sourceConfig[selected.narrationSource]?.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{selected.aiNarration}</p>
                  </div>
                )}

                {/* Media gallery */}
                {selected.media && selected.media.length > 0 && (
                  <MediaGallery media={selected.media} showNarration={showNarration} />
                )}

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
                      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                      <div className="space-y-4">
                        {selected.steps.filter(s => s.trim()).map((step, i, arr) => (
                          <div key={i} className="relative flex gap-4 items-start">
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
