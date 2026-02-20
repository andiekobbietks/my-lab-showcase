import { useState, useRef } from 'react';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { api } from '../../convex/_generated/api';
import { Lab, LabMedia } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, FlaskConical, Target, Server, CheckCircle2, CircleDot, Play, ChevronLeft, ChevronRight, Sparkles, Cpu, Cloud, FileText, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

const sourceConfig = {
  foundry: { label: 'On-Device AI', icon: Cpu },
  browser: { label: 'Browser-Based AI', icon: Sparkles },
  cloud: { label: 'Cloud AI', icon: Cloud },
  text: { label: 'Text-Based', icon: FileText },
};

// ... (MediaPreview, NarrationCard, MediaGallery, CardThumbnail stay same)
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
            <Play className="h-8 w-8 text-white" />
          </div>
        )}
        {media.caption && <p className="text-xs text-muted-foreground mt-1">{media.caption}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <img src={media.url} alt={media.caption || 'Lab preview'} className="w-full h-full object-cover rounded-md" />
      {media.caption && <p className="text-xs text-muted-foreground mt-1">{media.caption}</p>}
    </div>
  );
};

const NarrationCard = ({ media }: { media: LabMedia }) => {
  if (!media.narration) return null;
  const SourceIcon = media.narrationSource ? (sourceConfig as any)[media.narrationSource]?.icon : FileText;

  return (
    <div className="mt-4 p-5 bg-primary/5 border border-primary/10 rounded-xl space-y-3 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <div className="flex items-center gap-2 relative z-10">
        <div className="bg-primary/20 p-1.5 rounded-lg">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-primary">AI Insights</span>
        {media.narrationSource && (
          <Badge variant="secondary" className="text-[10px] ml-auto">
            <SourceIcon className="h-3 w-3 mr-1" />
            {(sourceConfig as any)[media.narrationSource]?.label}
          </Badge>
        )}
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed relative z-10">{media.narration}</p>
    </div>
  );
};

const MediaGallery = ({ media, showNarration }: { media: LabMedia[]; showNarration: boolean }) => {
  const [current, setCurrent] = useState(0);
  if (!media.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verification Media</p>
        <div className="text-[10px] text-muted-foreground font-mono bg-secondary/30 px-2 py-0.5 rounded">
          {current + 1} / {media.length}
        </div>
      </div>
      <div className="relative group/gallery">
        <Card className="aspect-video bg-secondary/20 border-border/40 rounded-xl overflow-hidden">
          <MediaPreview media={media[current]} className="h-full" />
        </Card>
        {media.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity shadow-lg"
              onClick={() => setCurrent(p => (p - 1 + media.length) % media.length)}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity shadow-lg"
              onClick={() => setCurrent(p => (p + 1) % media.length)}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-20 h-14 rounded-lg border-2 overflow-hidden transition-all ${i === current ? 'border-primary shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {showNarration && <NarrationCard media={media[current]} />}
    </div>
  );
};

const CardThumbnail = ({ lab }: { lab: Lab }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const firstMedia = lab.media?.[0];
  if (!firstMedia) {
    return (
      <div className="aspect-video bg-secondary/20 flex items-center justify-center rounded-t-xl -mx-6 -mt-6 mb-4">
        <FlaskConical className="h-10 w-10 text-muted-foreground/30" />
      </div>
    );
  }

  if (firstMedia.type === 'video') {
    return (
      <div className="relative aspect-video bg-secondary/30 overflow-hidden rounded-t-xl -mx-6 -mt-6 mb-4">
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
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/40 text-white backdrop-blur-sm border-0"><Play className="h-3 w-3 mr-1" />Preview</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-secondary/30 overflow-hidden rounded-t-xl -mx-6 -mt-6 mb-4">
      <img src={firstMedia.url} alt={lab.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
    </div>
  );
};

const SAMPLE_LABS: Partial<Lab>[] = [
  {
    title: "VMware Cloud Foundation Setup",
    description: "End-to-end deployment of an SDDC stack with automated lifecycle management.",
    tags: ["VMware", "VCF", "SDDC"],
    objective: "Automate the deployment of compute, storage, and networking layers.",
    environment: "On-Premises Private Cloud",
    steps: ["Phase 1: Deployment Parameter Sheet", "Phase 2: Cloud Builder Execution", "Phase 3: Workload Domain Creation"],
    outcome: "A fully operational hybrid cloud foundation ready for application deployment.",
    status: "published" as const
  },
  {
    title: "NSX-T Micro-segmentation",
    description: "Zero-trust network security implementation using distributed firewall rules.",
    tags: ["Security", "Networking", "NSX-T"],
    objective: "Isolate production workloads from development environments at the vNIC level.",
    environment: "Multi-Tier Web Application Stack",
    steps: ["Segment Definition", "Security Group Assignment", "DFW Rule Configuration"],
    outcome: "Hardened security posture with unified policy management.",
    status: "published" as const
  }
];

const LabsSection = () => {
  const convexLabs = useSafeQuery(api.queries.getLabs, { status: 'published' });
  const [selected, setSelected] = useState<any | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showNarration, setShowNarration] = useState(false);

  // Loading state
  if (convexLabs === undefined) {
    return (
      <section id="labs" className="py-20">
        <div className="container flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  // Use cloud data or show sample data to keep UI rich
  const labs = (convexLabs && convexLabs.length > 0) ? convexLabs : SAMPLE_LABS;
  const allTags = [...new Set((labs || []).flatMap((l: any) => l.tags || []))] as string[];
  const filtered = filter ? (labs || []).filter((l: any) => (l.tags || []).includes(filter)) : (labs || []);

  const hasAnyNarration = selected?.media?.some((m: any) => m.narration) || !!selected?.aiNarration;

  return (
    <section id="labs" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="container px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Technical Showroom</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground">Labs & Deployments</h2>
            <p className="text-muted-foreground mt-2 max-w-xl">Deep-dives into specific infrastructure challenges, solved through code and architecture.</p>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(null)}
                className="rounded-full px-4"
              >
                All Projects
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={filter === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(tag)}
                  className="rounded-full px-4"
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <Card className="p-20 text-center bg-background/50 border-dashed border-2 border-border/60">
            <FlaskConical className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">No projects match the criteria</h3>
            <p className="text-muted-foreground">Try clearing your filters or adding new labs from the admin panel.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((lab: any, idx: number) => (
              <Card
                key={lab._id || idx}
                className="group cursor-pointer bg-background hover:bg-card/30 border-border/60 hover:border-primary/40 transition-all duration-300 overflow-hidden flex flex-col h-full"
                onClick={() => { setSelected(lab); setShowNarration(false); }}
              >
                <CardHeader className="p-6 pb-2">
                  <CardThumbnail lab={lab} />
                  <div className="flex items-center gap-2 mb-2">
                    {lab.tags.slice(0, 2).map((t: string) => (
                      <Badge key={t} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-tight">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{lab.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 mt-auto">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6">{lab.description}</p>
                  <div className="flex items-center text-xs font-bold text-primary group-hover:gap-2 transition-all">
                    VIEW LAB DETAILS <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Developer Help Tooltip */}
        {!convexLabs || convexLabs.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground/40 italic">Showing sample projects. Connect your Convex database to see live deployments. <a href="/admin" className="underline hover:text-primary">Admin Access</a></p>
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          {selected && (
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/60 p-0 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Hero Detail Image */}
                <div className="aspect-[21/9] w-full relative overflow-hidden bg-black/20">
                  <img src={selected.media?.[0]?.url || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc48?auto=format&fit=crop&q=80&w=2000'} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  <div className="absolute bottom-6 left-8 right-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selected.tags.map((t: string) => <Badge key={t} variant="secondary" className="bg-white/10 text-white backdrop-blur-md border-white/20">{t}</Badge>)}
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight">{selected.title}</h2>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                      <div>
                        <p className="text-lg text-foreground/80 leading-relaxed font-light">{selected.description}</p>
                      </div>

                      {selected.media && selected.media.length > 0 && (
                        <MediaGallery media={selected.media} showNarration={showNarration} />
                      )}

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="p-6 bg-secondary/20 border border-border/40 rounded-2xl relative overflow-hidden group">
                          <Target className="absolute -bottom-4 -right-4 h-24 w-24 text-primary/5 group-hover:text-primary/10 transition-colors" />
                          <div className="flex items-center gap-3 mb-3">
                            <Target className="h-5 w-5 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Objective</span>
                          </div>
                          <p className="text-sm leading-relaxed">{selected.objective}</p>
                        </div>
                        <div className="p-6 bg-secondary/20 border border-border/40 rounded-2xl relative overflow-hidden group">
                          <Server className="absolute -bottom-4 -right-4 h-24 w-24 text-primary/5 group-hover:text-primary/10 transition-colors" />
                          <div className="flex items-center gap-3 mb-3">
                            <Server className="h-5 w-5 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Environment</span>
                          </div>
                          <p className="text-sm leading-relaxed">{selected.environment}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {hasAnyNarration && (
                        <Button
                          variant={showNarration ? 'default' : 'outline'}
                          className="w-full h-12 rounded-xl border-primary/20"
                          onClick={() => setShowNarration(!showNarration)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Walkthrough Mode
                        </Button>
                      )}

                      {(selected.steps || []).length > 0 && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deployment Logic</p>
                          </div>
                          <div className="space-y-4">
                            {selected.steps.map((step: string, i: number) => (
                              <div key={i} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                  <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-mono group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    {i + 1}
                                  </div>
                                  {i < selected.steps.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                                </div>
                                <p className="text-sm pt-1 pb-4 flex-1 text-foreground/80">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selected.outcome && (
                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Deployment Result</p>
                          <p className="text-sm leading-relaxed italic">"{selected.outcome}"</p>
                        </div>
                      )}

                      {selected.repoUrl && (
                        <Button variant="default" className="w-full h-12 rounded-xl" asChild>
                          <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Source Documentation</a>
                        </Button>
                      )}
                    </div>
                  </div>
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
