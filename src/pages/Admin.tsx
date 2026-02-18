import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Lab, BlogPost, Profile, LabMedia
} from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Save, Download, Upload, ArrowLeft, Sparkles, RefreshCw, Cpu, Cloud, FileText, Circle, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkOnDeviceAIStatus, type OnDeviceAIStatus, getAISuggestions } from '@/lib/foundry-local';
import { generateNarration, type NarrationEngine, type NarrationProgress } from '@/lib/narration-engine';
import { SuggestionChips } from '@/components/SuggestionChips';

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Convex Data
  const convexProfile = useQuery(api.queries.getProfile);
  const convexLabs = useQuery(api.queries.getLabs, {});
  const convexPosts = useQuery(api.queries.getBlogPosts);

  const updateProfileMutation = useMutation(api.mutations.updateProfile);
  const saveLabMutation = useMutation(api.mutations.saveLab);
  const deleteLabMutation = useMutation(api.mutations.deleteLab);
  const savePostMutation = useMutation(api.mutations.saveBlogPost);
  const deletePostMutation = useMutation(api.mutations.deleteBlogPost);

  // Local state for forms
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editLab, setEditLab] = useState<any | null>(null);
  const [editPost, setEditPost] = useState<any | null>(null);
  const [onDeviceStatus, setOnDeviceStatus] = useState<OnDeviceAIStatus | null>(null);

  useEffect(() => {
    if (convexProfile) {
      setProfile(convexProfile as any);
    }
  }, [convexProfile]);

  useEffect(() => {
    checkOnDeviceAIStatus().then(setOnDeviceStatus);
  }, []);

  // Profile handlers
  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      await updateProfileMutation({
        ...profile,
        id: (convexProfile as any)?._id
      } as any);
      toast({ title: 'Profile saved!' });
    } catch (err) {
      toast({ title: 'Error saving profile', variant: 'destructive' });
    }
  };

  const updateSkill = (idx: number, field: string, value: string | number) => {
    if (!profile) return;
    const skills = [...profile.skills];
    skills[idx] = { ...skills[idx], [field]: value };
    setProfile({ ...profile, skills });
  };

  const addSkill = () => {
    if (!profile) return;
    setProfile({ ...profile, skills: [...profile.skills, { name: '', level: 50, category: '' }] });
  };

  const removeSkill = (idx: number) => {
    if (!profile) return;
    setProfile({ ...profile, skills: profile.skills.filter((_, i) => i !== idx) });
  };

  const updateCert = (idx: number, field: string, value: string) => {
    if (!profile) return;
    const certs = [...profile.certifications];
    certs[idx] = { ...certs[idx], [field]: value };
    setProfile({ ...profile, certifications: certs });
  };

  const addCert = () => {
    if (!profile) return;
    setProfile({ ...profile, certifications: [...profile.certifications, { name: '', issuer: '', year: '' }] });
  };

  const removeCert = (idx: number) => {
    if (!profile) return;
    setProfile({ ...profile, certifications: profile.certifications.filter((_, i) => i !== idx) });
  };

  // Lab handlers
  const handleSaveLab = async (lab: any) => {
    try {
      const { _id, _creationTime, ...data } = lab;
      await saveLabMutation({
        ...data,
        id: _id
      });
      setEditLab(null);
      toast({ title: 'Lab saved!' });
    } catch (err) {
      toast({ title: 'Error saving lab', variant: 'destructive' });
    }
  };

  const handleDeleteLab = async (id: any) => {
    try {
      await deleteLabMutation({ id });
      toast({ title: 'Lab deleted.' });
    } catch (err) {
      toast({ title: 'Error deleting lab', variant: 'destructive' });
    }
  };

  // Blog handlers
  const handleSavePost = async (post: any) => {
    try {
      const { _id, _creationTime, ...data } = post;
      await savePostMutation({
        ...data,
        id: _id
      });
      setEditPost(null);
      toast({ title: 'Post saved!' });
    } catch (err) {
      toast({ title: 'Error saving post', variant: 'destructive' });
    }
  };

  const handleDeletePost = async (id: any) => {
    try {
      await deletePostMutation({ id });
      toast({ title: 'Post deleted.' });
    } catch (err) {
      toast({ title: 'Error deleting post', variant: 'destructive' });
    }
  };

  // Export/Import
  const handleExport = () => {
    const data = {
      profile: convexProfile,
      labs: convexLabs,
      blog: convexPosts,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'portfolio-data-convex.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.profile) await updateProfileMutation(data.profile);
        if (data.labs) {
          for (const lab of data.labs) {
            const { _id, _creationTime, ...rest } = lab;
            await saveLabMutation(rest);
          }
        }
        if (data.blog) {
          for (const post of data.blog) {
            const { _id, _creationTime, ...rest } = post;
            await savePostMutation(rest);
          }
        }
        toast({ title: 'Data imported to Convex!' });
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
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6">
            {!profile ? (
              <div className="flex items-center justify-center p-12"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <Card>
                  <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label>Name</Label><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /><SuggestionChips field="Name" value={profile.name} onSelect={v => setProfile({ ...profile, name: v })} /></div>
                      <div><Label>Title</Label><Input value={profile.title} onChange={e => setProfile({ ...profile, title: e.target.value })} /><SuggestionChips field="Professional Title" value={profile.title} onSelect={v => setProfile({ ...profile, title: v })} /></div>
                    </div>
                    <div><Label>Tagline</Label><Input value={profile.tagline} onChange={e => setProfile({ ...profile, tagline: e.target.value })} /><SuggestionChips field="Tagline" value={profile.tagline} onSelect={v => setProfile({ ...profile, tagline: v })} /></div>
                    <div><Label>Bio</Label><Textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={4} /><SuggestionChips field="Professional Bio" value={profile.bio} onSelect={v => setProfile({ ...profile, bio: v })} /></div>
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
                        <div className="flex-1">
                          <Label>Name</Label>
                          <Input value={skill.name} onChange={e => updateSkill(i, 'name', e.target.value)} />
                          <SuggestionChips field="Skill Name" value={skill.name} onSelect={v => updateSkill(i, 'name', v)} />
                        </div>
                        <div className="w-24"><Label>Level</Label><Input type="number" min={0} max={100} value={skill.level} onChange={e => updateSkill(i, 'level', parseInt(e.target.value) || 0)} /></div>
                        <div className="flex-1">
                          <Label>Category</Label>
                          <Input value={skill.category} onChange={e => updateSkill(i, 'category', e.target.value)} />
                          <SuggestionChips field="Skill Category" value={skill.category} onSelect={v => updateSkill(i, 'category', v)} />
                        </div>
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
              </>
            )}
          </TabsContent>

          {/* LABS TAB */}
          <TabsContent value="labs" className="space-y-6">
            {editLab ? (
              <LabForm lab={editLab} onSave={handleSaveLab} onCancel={() => setEditLab(null)} onDeviceStatus={onDeviceStatus} />
            ) : (
              <>
                <Button onClick={() => setEditLab({
                  title: '', description: '', tags: [], objective: '',
                  environment: '', steps: [''], outcome: '', repoUrl: '', media: []
                })}><Plus className="h-4 w-4 mr-2" />Add Lab</Button>
                <div className="space-y-3">
                  {!convexLabs ? (
                    <div className="flex items-center justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    convexLabs.map((lab: any) => (
                      <Card key={lab._id} className="flex items-center justify-between p-4">
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
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteLab(lab._id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </Card>
                    ))
                  )}
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
                <Button onClick={() => setEditPost({
                  title: '', content: '', date: new Date().toISOString().split('T')[0]
                })}><Plus className="h-4 w-4 mr-2" />Add Post</Button>
                <div className="space-y-3">
                  {!convexPosts ? (
                    <div className="flex items-center justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    convexPosts.map((post: any) => (
                      <Card key={post._id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold text-foreground">{post.title || 'Untitled'}</p>
                          <p className="text-sm text-muted-foreground">{post.date}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditPost(post)}>Edit</Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post._id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-500" />
                  Remote AI Fallback (Resilience)
                </CardTitle>
                <CardDescription>
                  Configure a high-speed remote API (Groq or Cerebras) to ensure AI features work even when local browser flags are disabled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Remote Provider</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={localStorage.getItem('portfolio_remote_ai_provider') === 'groq' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        localStorage.setItem('portfolio_remote_ai_provider', 'groq');
                        toast({ title: 'Remote Provider set to Groq' });
                        checkOnDeviceAIStatus().then(setOnDeviceStatus);
                      }}
                    >Groq (LPU Speed)</Button>
                    <Button
                      variant={localStorage.getItem('portfolio_remote_ai_provider') === 'cerebras' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        localStorage.setItem('portfolio_remote_ai_provider', 'cerebras');
                        toast({ title: 'Remote Provider set to Cerebras' });
                        checkOnDeviceAIStatus().then(setOnDeviceStatus);
                      }}
                    >Cerebras (Fastest Inference)</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="gsk_..."
                      defaultValue={localStorage.getItem('portfolio_remote_ai_key') || ''}
                      onChange={(e) => localStorage.setItem('portfolio_remote_ai_key', e.target.value)}
                    />
                    <Button variant="secondary" onClick={() => checkOnDeviceAIStatus().then(setOnDeviceStatus)}>Verify</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">KEYS ARE STORED LOCALLY IN YOUR BROWSER ONLY.</p>
                </div>
              </CardContent>
            </Card>
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
  browser: { label: 'Browser AI', icon: Sparkles },
  remote: { label: 'Remote AI (Fallback)', icon: Rocket },
  cloud: { label: 'Cloud AI', icon: Cloud },
  text: { label: 'Text-Based', icon: FileText },
};

// Lab form sub-component with AI narration
const LabForm = ({ lab, onSave, onCancel, onDeviceStatus }: { lab: Lab; onSave: (l: Lab) => void; onCancel: () => void; onDeviceStatus: OnDeviceAIStatus | null }) => {
  const { toast } = useToast();
  const [form, setForm] = useState<Lab>({ ...lab, media: lab.media || [] });
  const [engine, setEngine] = useState<NarrationEngine>('auto');
  const [narrating, setNarrating] = useState(false);
  const [progress, setProgress] = useState<NarrationProgress | null>(null);

  const updateStep = (idx: number, val: string) => {
    const steps = [...form.steps];
    steps[idx] = val;
    setForm({ ...form, steps });
  };

  const updateField = (field: keyof Lab, val: any) => {
    setForm({ ...form, [field]: val });
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
                  <Circle className={`h-2.5 w-2.5 ${onDeviceStatus?.available ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                  <span className="text-xs text-muted-foreground">
                    {onDeviceStatus?.provider === 'browser' ? 'Chrome/Edge AI' : 'Foundry'} {onDeviceStatus?.available ? 'Ready' : 'Offline'}
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
