import { useState, useEffect } from 'react';
import {
  getProfile, saveProfile, getLabs, saveLab, deleteLab,
  getBlogPosts, saveBlogPost, deleteBlogPost, exportAllData, importAllData,
  Lab, BlogPost, Profile, LabMedia
} from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Save, Download, Upload, ArrowLeft, Sparkles, RefreshCw, Cpu, Cloud, FileText, Circle, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkFoundryStatus } from '@/lib/foundry-local';
import { generateNarration, type NarrationEngine, type NarrationProgress } from '@/lib/narration-engine';

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Profile
  const [profile, setProfile] = useState<Profile>(getProfile());

  // Labs
  const [labs, setLabs] = useState<Lab[]>(getLabs());
  const [editLab, setEditLab] = useState<Lab | null>(null);

  // Blog
  const [posts, setPosts] = useState<BlogPost[]>(getBlogPosts());
  const [editPost, setEditPost] = useState<BlogPost | null>(null);

  const refreshData = () => {
    setProfile(getProfile());
    setLabs(getLabs());
    setPosts(getBlogPosts());
  };

  // Profile handlers
  const handleSaveProfile = () => {
    saveProfile(profile);
    toast({ title: 'Profile saved!' });
  };

  const updateSkill = (idx: number, field: string, value: string | number) => {
    const skills = [...profile.skills];
    skills[idx] = { ...skills[idx], [field]: value };
    setProfile({ ...profile, skills });
  };

  const addSkill = () => {
    setProfile({ ...profile, skills: [...profile.skills, { name: '', level: 50, category: '' }] });
  };

  const removeSkill = (idx: number) => {
    setProfile({ ...profile, skills: profile.skills.filter((_, i) => i !== idx) });
  };

  const updateCert = (idx: number, field: string, value: string) => {
    const certs = [...profile.certifications];
    certs[idx] = { ...certs[idx], [field]: value };
    setProfile({ ...profile, certifications: certs });
  };

  const addCert = () => {
    setProfile({ ...profile, certifications: [...profile.certifications, { name: '', issuer: '', year: '' }] });
  };

  const removeCert = (idx: number) => {
    setProfile({ ...profile, certifications: profile.certifications.filter((_, i) => i !== idx) });
  };

  // Lab handlers
  const newLab = (): Lab => ({
    id: crypto.randomUUID(), title: '', description: '', tags: [], objective: '',
    environment: '', steps: [''], outcome: '', repoUrl: '', media: [], createdAt: new Date().toISOString()
  });

  const handleSaveLab = (lab: Lab) => {
    saveLab(lab);
    setEditLab(null);
    setLabs(getLabs());
    toast({ title: 'Lab saved!' });
  };

  const handleDeleteLab = (id: string) => {
    deleteLab(id);
    setLabs(getLabs());
    toast({ title: 'Lab deleted.' });
  };

  // Blog handlers
  const newPost = (): BlogPost => ({
    id: crypto.randomUUID(), title: '', content: '', date: new Date().toISOString().split('T')[0]
  });

  const handleSavePost = (post: BlogPost) => {
    saveBlogPost(post);
    setEditPost(null);
    setPosts(getBlogPosts());
    toast({ title: 'Post saved!' });
  };

  const handleDeletePost = (id: string) => {
    deleteBlogPost(id);
    setPosts(getBlogPosts());
    toast({ title: 'Post deleted.' });
  };

  // Export/Import
  const handleExport = () => {
    const blob = new Blob([exportAllData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'portfolio-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAllData(reader.result as string);
        refreshData();
        toast({ title: 'Data imported!' });
      } catch {
        toast({ title: 'Import failed', description: 'Invalid JSON file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />Import
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate('/admin/recorder')} className="bg-blue-600 hover:bg-blue-700">
              <Rocket className="h-4 w-4 mr-2" />Recorder
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Name</Label><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
                  <div><Label>Title</Label><Input value={profile.title} onChange={e => setProfile({ ...profile, title: e.target.value })} /></div>
                </div>
                <div><Label>Tagline</Label><Input value={profile.tagline} onChange={e => setProfile({ ...profile, tagline: e.target.value })} /></div>
                <div><Label>Bio</Label><Textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={4} /></div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><Label>GitHub Username</Label><Input value={profile.githubUsername} onChange={e => setProfile({ ...profile, githubUsername: e.target.value })} /></div>
                  <div><Label>LinkedIn URL</Label><Input value={profile.linkedinUrl} onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
                </div>
                <div><Label>CV URL (link to PDF)</Label><Input value={profile.cvUrl || ''} onChange={e => setProfile({ ...profile, cvUrl: e.target.value })} placeholder="https://..." /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Skills</CardTitle>
                <Button variant="outline" size="sm" onClick={addSkill}><Plus className="h-4 w-4 mr-1" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.skills.map((skill, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1"><Label>Name</Label><Input value={skill.name} onChange={e => updateSkill(i, 'name', e.target.value)} /></div>
                    <div className="w-24"><Label>Level</Label><Input type="number" min={0} max={100} value={skill.level} onChange={e => updateSkill(i, 'level', parseInt(e.target.value) || 0)} /></div>
                    <div className="flex-1"><Label>Category</Label><Input value={skill.category} onChange={e => updateSkill(i, 'category', e.target.value)} /></div>
                    <Button variant="ghost" size="icon" onClick={() => removeSkill(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Certifications</CardTitle>
                <Button variant="outline" size="sm" onClick={addCert}><Plus className="h-4 w-4 mr-1" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.certifications.map((cert, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1"><Label>Name</Label><Input value={cert.name} onChange={e => updateCert(i, 'name', e.target.value)} /></div>
                    <div className="flex-1"><Label>Issuer</Label><Input value={cert.issuer} onChange={e => updateCert(i, 'issuer', e.target.value)} /></div>
                    <div className="w-24"><Label>Year</Label><Input value={cert.year} onChange={e => updateCert(i, 'year', e.target.value)} /></div>
                    <Button variant="ghost" size="icon" onClick={() => removeCert(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button onClick={handleSaveProfile}><Save className="h-4 w-4 mr-2" />Save Profile</Button>
          </TabsContent>

          {/* LABS TAB */}
          <TabsContent value="labs" className="space-y-6">
            {editLab ? (
              <LabForm lab={editLab} onSave={handleSaveLab} onCancel={() => setEditLab(null)} />
            ) : (
              <>
                <Button onClick={() => setEditLab(newLab())}><Plus className="h-4 w-4 mr-2" />Add Lab</Button>
                <div className="space-y-3">
                  {labs.map(lab => (
                    <Card key={lab.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {lab.title || 'Untitled'}
                          {lab.status === 'draft' && (
                            <Badge className="ml-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">DRAFT</Badge>
                          )}
                          {lab.rrwebRecording && (
                            <Badge variant="outline" className="ml-2 text-xs">🎥 Recording</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{lab.tags.join(', ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditLab(lab)}>Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLab(lab.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* BLOG TAB */}
          <TabsContent value="blog" className="space-y-6">
            {editPost ? (
              <PostForm post={editPost} onSave={handleSavePost} onCancel={() => setEditPost(null)} />
            ) : (
              <>
                <Button onClick={() => setEditPost(newPost())}><Plus className="h-4 w-4 mr-2" />Add Post</Button>
                <div className="space-y-3">
                  {posts.map(post => (
                    <Card key={post.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-foreground">{post.title || 'Untitled'}</p>
                        <p className="text-sm text-muted-foreground">{post.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditPost(post)}>Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Confidence badge colors
const confidenceConfig = {
  high: { label: 'High Confidence', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  medium: { label: 'Medium Confidence', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  low: { label: 'Low Confidence', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

const sourceConfig = {
  foundry: { label: 'On-Device AI', icon: Cpu },
  cloud: { label: 'Cloud AI', icon: Cloud },
  text: { label: 'Text-Based', icon: FileText },
};

// Lab form sub-component with AI narration
const LabForm = ({ lab, onSave, onCancel }: { lab: Lab; onSave: (l: Lab) => void; onCancel: () => void }) => {
  const { toast } = useToast();
  const [form, setForm] = useState<Lab>({ ...lab, media: lab.media || [] });
  const [foundryAvailable, setFoundryAvailable] = useState<boolean | null>(null);
  const [engine, setEngine] = useState<NarrationEngine>('auto');
  const [narrating, setNarrating] = useState(false);
  const [progress, setProgress] = useState<NarrationProgress | null>(null);

  useEffect(() => {
    checkFoundryStatus().then(s => setFoundryAvailable(s.available));
  }, []);

  const updateStep = (idx: number, val: string) => {
    const steps = [...form.steps];
    steps[idx] = val;
    setForm({ ...form, steps });
  };

  const addMedia = () => {
    setForm({ ...form, media: [...(form.media || []), { url: '', type: 'video', caption: '' }] });
  };

  const updateMedia = (idx: number, field: keyof LabMedia, val: string) => {
    const media = [...(form.media || [])];
    media[idx] = { ...media[idx], [field]: val };
    setForm({ ...form, media });
  };

  const removeMedia = (idx: number) => {
    setForm({ ...form, media: (form.media || []).filter((_, i) => i !== idx) });
  };

  const handleGenerateNarration = async (mediaIndices?: number[]) => {
    if (!form.media?.length) return;
    setNarrating(true);
    setProgress(null);

    try {
      const { mediaResults, summary } = await generateNarration(form, {
        engine,
        onProgress: setProgress,
        mediaIndices,
      });

      // Update media with narration results
      const updatedMedia = [...(form.media || [])];
      for (const mr of mediaResults) {
        updatedMedia[mr.mediaIndex] = {
          ...updatedMedia[mr.mediaIndex],
          narration: mr.result.narration,
          narrationConfidence: mr.result.overallConfidence,
          narrationSource: mr.result.source,
        };
      }

      setForm({
        ...form,
        media: updatedMedia,
        aiNarration: summary.narration,
        narrationSource: summary.source,
      });

      toast({ title: 'Narration generated!', description: `Source: ${sourceConfig[summary.source].label}` });
    } catch (err: any) {
      toast({ title: 'Narration failed', description: err.message, variant: 'destructive' });
    } finally {
      setNarrating(false);
      setProgress(null);
    }
  };

  const progressPercent = progress ? ({
    extracting: 20,
    'analyzing-foundry': 50,
    'analyzing-cloud': 50,
    'generating-text': 70,
    complete: 100,
    error: 0,
  }[progress.stage] || 0) : 0;

  return (
    <Card>
      <CardHeader><CardTitle>{lab.id ? 'Edit Lab' : 'New Lab'}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
        <div><Label>Tags (comma-separated)</Label><Input value={form.tags.join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} /></div>
        <div><Label>Objective</Label><Textarea value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} rows={2} /></div>
        <div><Label>Environment</Label><Textarea value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })} rows={2} /></div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Steps</Label>
            <Button variant="outline" size="sm" onClick={() => setForm({ ...form, steps: [...form.steps, ''] })}><Plus className="h-3 w-3 mr-1" />Step</Button>
          </div>
          {form.steps.map((step, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input value={step} onChange={e => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}`} />
              <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
        <div><Label>Outcome</Label><Textarea value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} rows={2} /></div>
        <div><Label>Repo URL</Label><Input value={form.repoUrl || ''} onChange={e => setForm({ ...form, repoUrl: e.target.value })} /></div>

        {/* Media section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Media (Videos, GIFs, Screenshots)</Label>
            <Button variant="outline" size="sm" onClick={addMedia}><Plus className="h-3 w-3 mr-1" />Media</Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Add URLs to MP4 videos, GIFs, or images. These will appear as interactive previews on your lab cards and in the detail view.</p>
          {(form.media || []).map((m, i) => (
            <div key={i} className="mb-3 p-3 bg-secondary/20 border border-border rounded-md space-y-2">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input value={m.url} onChange={e => updateMedia(i, 'url', e.target.value)} placeholder="https://... (MP4, GIF, or image URL)" />
                  <div className="flex gap-2">
                    <select
                      value={m.type}
                      onChange={e => updateMedia(i, 'type', e.target.value)}
                      className="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground"
                    >
                      <option value="video">Video (MP4)</option>
                      <option value="gif">GIF</option>
                      <option value="image">Image</option>
                    </select>
                    <Input value={m.caption || ''} onChange={e => updateMedia(i, 'caption', e.target.value)} placeholder="Caption (optional)" className="flex-1" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeMedia(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>

              {/* Per-media narration */}
              {m.narration && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">AI Narration</Label>
                    {m.narrationSource && (
                      <Badge variant="outline" className="text-xs">
                        {sourceConfig[m.narrationSource]?.label || m.narrationSource}
                      </Badge>
                    )}
                    {m.narrationConfidence && (
                      <Badge variant="outline" className={`text-xs ${confidenceConfig[m.narrationConfidence].className}`}>
                        {confidenceConfig[m.narrationConfidence].label}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 text-xs"
                      onClick={() => handleGenerateNarration([i])}
                      disabled={narrating}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />Re-generate
                    </Button>
                  </div>
                  <Textarea
                    value={m.narration}
                    onChange={e => updateMedia(i, 'narration' as any, e.target.value)}
                    rows={4}
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Narration Controls */}
        {(form.media?.length ?? 0) > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AI Narration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className={`h-2.5 w-2.5 ${foundryAvailable ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                  <span className="text-xs text-muted-foreground">
                    Foundry {foundryAvailable ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs shrink-0">Engine:</Label>
                <select
                  value={engine}
                  onChange={e => setEngine(e.target.value as NarrationEngine)}
                  className="bg-background border border-input rounded-md px-3 py-1.5 text-sm text-foreground"
                >
                  <option value="auto">Auto (best available)</option>
                  <option value="foundry">On-Device Only</option>
                  <option value="cloud">Cloud Only</option>
                  <option value="text">Text Only</option>
                </select>
                <Button
                  size="sm"
                  onClick={() => handleGenerateNarration()}
                  disabled={narrating}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {narrating ? 'Generating...' : 'Generate Narration'}
                </Button>
              </div>

              {narrating && progress && (
                <div className="space-y-1">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progress.message}</p>
                </div>
              )}

              {/* Overall lab narration */}
              {form.aiNarration && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Lab Summary</Label>
                    {form.narrationSource && (
                      <Badge variant="outline" className="text-xs">
                        {sourceConfig[form.narrationSource]?.label || form.narrationSource}
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    value={form.aiNarration}
                    onChange={e => setForm({ ...form, aiNarration: e.target.value })}
                    rows={6}
                    className="text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button onClick={() => onSave(form)}><Save className="h-4 w-4 mr-2" />Save</Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Post form sub-component
const PostForm = ({ post, onSave, onCancel }: { post: BlogPost; onSave: (p: BlogPost) => void; onCancel: () => void }) => {
  const [form, setForm] = useState<BlogPost>({ ...post });

  return (
    <Card>
      <CardHeader><CardTitle>{post.id ? 'Edit Post' : 'New Post'}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8} /></div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(form)}><Save className="h-4 w-4 mr-2" />Save</Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Admin;
