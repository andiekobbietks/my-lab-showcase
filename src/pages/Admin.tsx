import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Lab, BlogPost, Profile, LabMedia, defaultProfile
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
import { Trash2, Plus, Save, Download, Upload, ArrowLeft, Sparkles, RefreshCw, Cpu, Cloud, FileText, Circle, Rocket, FlaskConical, BookOpen, ExternalLink, Link2, Monitor, Layout } from 'lucide-react';
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

  // CRITICAL FIX: Handle empty database by falling back to defaultProfile for initialization
  useEffect(() => {
    if (convexProfile === null) {
      setProfile(defaultProfile);
    } else if (convexProfile) {
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
      <div className="container max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-12 w-12 rounded-2xl bg-secondary/50 hover:bg-secondary">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Admin Dashboard</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Cloud Portfolio Content Control</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl border-border/60">
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-xl border-border/60">
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />Import
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate('/admin/recorder')} className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20">
              <Rocket className="h-4 w-4 mr-2" />Recorder
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-secondary/30 p-1 border border-border/40 rounded-2xl w-full flex overflow-x-auto h-auto scrollbar-hide">
            <TabsTrigger value="profile" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md">Profile</TabsTrigger>
            <TabsTrigger value="labs" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md">Labs</TabsTrigger>
            <TabsTrigger value="blog" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md">Blog</TabsTrigger>
            <TabsTrigger value="cv" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md">Resume / CV</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md">System Settings</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {convexProfile === undefined ? (
              <div className="flex items-center justify-center p-24 bg-card/30 border border-dashed rounded-3xl">
                <div className="text-center">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Waking up Convex...</p>
                </div>
              </div>
            ) : !profile ? (
              <div className="p-12 text-center bg-card/30 rounded-3xl border border-dashed border-border/60">
                <h3 className="text-xl font-bold mb-2">Initializing Profile</h3>
                <p className="text-muted-foreground mb-6">Setting up your professional environment for the first time.</p>
              </div>
            ) : (
              <>
                <div className="grid lg:grid-cols-2 gap-8">
                  <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden">
                    <CardHeader>
                      <div className="bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center mb-2">
                        <Monitor className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tighter">Primary Identity</CardTitle>
                      <CardDescription>How you're presented on the landing page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest ml-1">Full Name</Label>
                          <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="rounded-xl h-12 bg-secondary/30" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest ml-1">Job Title</Label>
                          <Input value={profile.title} onChange={e => setProfile({ ...profile, title: e.target.value })} className="rounded-xl h-12 bg-secondary/30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest ml-1">Tagline</Label>
                        <Input value={profile.tagline || ''} onChange={e => setProfile({ ...profile, tagline: e.target.value })} className="rounded-xl h-12 bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest ml-1">Bio / Journey</Label>
                        <Textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={6} className="rounded-2xl bg-secondary/30 resize-none" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden">
                    <CardHeader>
                      <div className="bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center mb-2">
                        <Link2 className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tighter">Connected Hooks</CardTitle>
                      <CardDescription>Social presence and automation links.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest ml-1">GitHub Username</Label>
                        <Input value={profile.githubUsername} onChange={e => setProfile({ ...profile, githubUsername: e.target.value })} className="rounded-xl h-12 bg-secondary/30" placeholder="e.g. janesmith" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest ml-1">LinkedIn URL</Label>
                        <Input value={profile.linkedinUrl} onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })} className="rounded-xl h-12 bg-secondary/30" placeholder="https://linkedin.com/in/..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest ml-1">Public Email</Label>
                        <Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="rounded-xl h-12 bg-secondary/30" placeholder="hello@domain.com" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest ml-1">CV / Resume Permalink</Label>
                        <div className="flex gap-2">
                          <Input value={profile.cvUrl || ''} onChange={e => setProfile({ ...profile, cvUrl: e.target.value })} className="rounded-xl h-12 bg-secondary/30 flex-1" placeholder="https://..." />
                          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" asChild>
                            <a href={profile.cvUrl || '#'} target="_blank" rel="noreferrer" aria-label="View current resume"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-background/20 border-border/40 border-dashed rounded-3xl p-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="text-xl font-bold uppercase tracking-tight">Technical Skills Matrix</CardTitle>
                      <CardDescription className="text-xs uppercase font-bold tracking-widest text-primary/60">Proficiency & Categorization</CardDescription>
                    </div>
                    <Button variant="secondary" size="sm" onClick={addSkill} className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Add Skill</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      {profile.skills.map((skill, i) => (
                        <div key={i} className="group flex flex-col sm:flex-row gap-4 p-4 bg-secondary/10 border border-transparent hover:border-border/60 hover:bg-secondary/30 transition-all rounded-2xl items-center">
                          <div className="flex-1 w-full"><Label className="text-[10px] font-bold uppercase opacity-40 ml-1">Name</Label><Input value={skill.name} onChange={e => updateSkill(i, 'name', e.target.value)} className="h-10 rounded-lg" /></div>
                          <div className="w-full sm:w-20"><Label className="text-[10px] font-bold uppercase opacity-40 ml-1">Level (%)</Label><Input type="number" min={0} max={100} value={skill.level} onChange={e => updateSkill(i, 'level', parseInt(e.target.value) || 0)} className="h-10 rounded-lg text-center" /></div>
                          <div className="flex-[1.2] w-full"><Label className="text-[10px] font-bold uppercase opacity-40 ml-1">Category</Label><Input value={skill.category} onChange={e => updateSkill(i, 'category', e.target.value)} className="h-10 rounded-lg" /></div>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 rounded-lg mt-4 sm:mt-0" onClick={() => removeSkill(i)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between p-8 bg-primary/5 border border-primary/20 rounded-3xl">
                  <div>
                    <h3 className="text-lg font-bold">Synchronize Changes</h3>
                    <p className="text-sm text-muted-foreground italic">Publish these updates to the live portfolio on Convex.</p>
                  </div>
                  <Button onClick={handleSaveProfile} size="lg" className="rounded-2xl h-16 px-10 text-lg font-bold shadow-xl shadow-primary/20"><Save className="h-5 w-5 mr-3" />Commit Profile</Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* LABS TAB */}
          <TabsContent value="labs" className="space-y-6 animate-in fade-in duration-300">
            {editLab ? (
              <LabForm lab={editLab} onSave={handleSaveLab} onCancel={() => setEditLab(null)} onDeviceStatus={onDeviceStatus} />
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 bg-card/40 border border-border/50 rounded-3xl">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Deployment Registry</h2>
                    <p className="text-muted-foreground text-sm font-medium">Manage technical labs and cloud walkthroughs.</p>
                  </div>
                  <Button onClick={() => setEditLab({
                    title: '', description: '', tags: [], objective: '',
                    environment: '', steps: [''], outcome: '', repoUrl: '', media: []
                  })} size="lg" className="rounded-2xl h-14 px-8 font-bold"><Plus className="h-5 w-5 mr-2" />Deploy New Lab</Button>
                </div>

                <div className="grid gap-4">
                  {convexLabs === undefined ? (
                    <div className="flex items-center justify-center p-20"><RefreshCw className="h-10 w-10 animate-spin text-primary" /></div>
                  ) : convexLabs.length === 0 ? (
                    <div className="p-24 text-center bg-background/20 rounded-3xl border border-dashed border-border/60">
                      <FlaskConical className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                      <h3 className="text-xl font-bold mb-2">No Labs registered</h3>
                      <p className="text-muted-foreground mb-8">Ready to showcase your infrastructure build-outs?</p>
                      <Button variant="outline" onClick={() => setEditLab({ title: '', description: '', tags: [], objective: '', environment: '', steps: [''], outcome: '', repoUrl: '', media: [] })} className="rounded-xl border-dashed">Start first deployment</Button>
                    </div>
                  ) : (
                    convexLabs.map((lab: any) => (
                      <Card key={lab._id} className="group p-6 bg-card/40 hover:bg-card hover:border-primary/30 transition-all duration-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                        <div className="flex items-center gap-6 w-full">
                          <div className="h-16 w-16 bg-secondary/50 rounded-2xl flex items-center justify-center shrink-0">
                            <FlaskConical className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold tracking-tight">{lab.title || 'Untitled Archive'}</h3>
                              {lab.status === 'draft' ? (
                                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] h-5">DRAFT</Badge>
                              ) : (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] h-5">PUBLISHED</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {lab.tags.map((t: string) => <Badge key={t} variant="secondary" className="px-2 py-0 text-[10px] font-mono tracking-tighter opacity-70">{t}</Badge>)}
                              {lab.rrwebRecording && <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-[0.1em] ml-2"><Rocket className="h-3 w-3" /> Live Capture</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" onClick={() => setEditLab(lab)} className="rounded-xl flex-1 px-6 border-border/60">Modify</Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteLab(lab._id)} className="text-muted-foreground hover:text-red-500 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* BLOG TAB */}
          <TabsContent value="blog" className="space-y-6 animate-in fade-in duration-300">
            {editPost ? (
              <PostForm post={editPost} onSave={handleSavePost} onCancel={() => setEditPost(null)} />
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 bg-card/40 border border-border/50 rounded-3xl">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Insights Feed</h2>
                    <p className="text-muted-foreground text-sm font-medium">Manage technical blog posts and industry reflections.</p>
                  </div>
                  <Button onClick={() => setEditPost({
                    title: '', content: '', date: new Date().toISOString().split('T')[0]
                  })} size="lg" className="rounded-2xl h-14 px-8 font-bold"><Plus className="h-5 w-5 mr-2" />New Post</Button>
                </div>

                <div className="grid gap-4">
                  {convexPosts === undefined ? (
                    <div className="flex items-center justify-center p-20"><RefreshCw className="h-10 w-10 animate-spin text-primary" /></div>
                  ) : convexPosts.length === 0 ? (
                    <div className="p-24 text-center bg-background/20 rounded-3xl border border-dashed border-border/60">
                      <BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                      <h3 className="text-xl font-bold mb-2">Knowledge Base Empty</h3>
                      <p className="text-muted-foreground mb-8">Ready to share your insights with the world?</p>
                      <Button variant="outline" onClick={() => setEditPost({ title: '', content: '', date: new Date().toISOString().split('T')[0] })} className="rounded-xl border-dashed">Write first post</Button>
                    </div>
                  ) : (
                    convexPosts.map((post: any) => (
                      <Card key={post._id} className="group p-6 bg-card/40 hover:bg-card hover:border-primary/30 transition-all duration-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-mono text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-md uppercase tracking-widest">{post.date}</span>
                            <div className="h-1 w-1 rounded-full bg-border" />
                            <span className="text-[10px] font-bold text-primary uppercase">Active Article</span>
                          </div>
                          <h3 className="text-xl font-bold tracking-tight">{post.title || 'Untitled Draft'}</h3>
                          <p className="text-xs text-muted-foreground font-light line-clamp-1 italic">"{post.content.slice(0, 100)}..."</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" onClick={() => setEditPost(post)} className="rounded-xl flex-1 px-6 border-border/60">Refine</Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post._id)} className="text-muted-foreground hover:text-red-500 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* CV TAB */}
          <TabsContent value="cv" className="animate-in fade-in duration-300">
            <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden p-8">
              <div className="bg-primary/10 h-16 w-16 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-tight">Professional Credentials</h2>
              <p className="text-muted-foreground mb-12 max-w-xl text-lg">
                Manage the public link to your resume. This link should point to a PDF hosted on a reliable cloud source (e.g. Google Drive, Dropbox, or your own S3 bucket).
              </p>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest ml-1">Live Resume Permalink</Label>
                    <div className="relative group">
                      <Input
                        value={profile?.cvUrl || ''}
                        onChange={e => profile && setProfile({ ...profile, cvUrl: e.target.value })}
                        placeholder="https://example.com/resume.pdf"
                        className="rounded-xl h-14 bg-secondary/30 pr-12 focus:bg-background transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">
                        <Link2 className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-secondary/20 rounded-2xl border border-border/40">
                    <div className="flex items-center gap-3 mb-2 text-primary">
                      <Layout className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Visibility Preview</span>
                    </div>
                    <p className="text-sm italic opacity-60">"When updated, the 'Resume / CV' card on your portfolio will instantly direct recruiters and collaborators to this document."</p>
                  </div>
                  <Button onClick={handleSaveProfile} size="lg" className="w-full h-16 rounded-2xl text-lg font-bold"><Save className="h-5 w-5 mr-3" />Update Credentials</Button>
                </div>

                <Card className="bg-background/40 border-border/40 border-dashed rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                  <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Download className="h-10 w-10 text-primary opacity-40" />
                  </div>
                  <h4 className="font-bold mb-2 uppercase tracking-tight">Active Link Status</h4>
                  {profile?.cvUrl ? (
                    <div className="space-y-4">
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Online & Published</Badge>
                      <p className="text-[10px] text-muted-foreground font-mono break-all line-clamp-1">{profile.cvUrl}</p>
                      <Button variant="outline" size="sm" asChild className="rounded-xl h-10 px-6">
                        <a href={profile.cvUrl} target="_blank" rel="noreferrer">Verify Document <ExternalLink className="h-3 w-3 ml-2" /></a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Badge variant="outline" className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-orange-500/30 text-orange-500/60">Offline / Pending</Badge>
                      <p className="text-xs text-muted-foreground italic">No public resume link has been provided for this profile yet.</p>
                    </div>
                  )}
                </Card>
              </div>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="animate-in fade-in duration-300">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Remote AI Fallback */}
              <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden">
                <CardHeader>
                  <div className="bg-blue-500/10 h-10 w-10 rounded-xl flex items-center justify-center mb-2">
                    <Cpu className="h-5 w-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter">Remote AI Fallback</CardTitle>
                  <CardDescription>Resilience layer for when local browser AI is disabled.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest ml-1">Preferred Provider</Label>
                      <div className="flex gap-3">
                        <Button
                          variant={localStorage.getItem('portfolio_remote_ai_provider') === 'groq' ? 'default' : 'outline'}
                          className="flex-1 rounded-xl h-14 font-bold active:scale-[0.98] transition-transform"
                          onClick={() => {
                            localStorage.setItem('portfolio_remote_ai_provider', 'groq');
                            toast({ title: 'Remote Provider set to Groq' });
                            checkOnDeviceAIStatus().then(setOnDeviceStatus);
                          }}
                        >Groq LPU</Button>
                        <Button
                          variant={localStorage.getItem('portfolio_remote_ai_provider') === 'cerebras' ? 'default' : 'outline'}
                          className="flex-1 rounded-xl h-14 font-bold active:scale-[0.98] transition-transform"
                          onClick={() => {
                            localStorage.setItem('portfolio_remote_ai_provider', 'cerebras');
                            toast({ title: 'Remote Provider set to Cerebras' });
                            checkOnDeviceAIStatus().then(setOnDeviceStatus);
                          }}
                        >Cerebras AI</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest ml-1">Personal API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="gsk_..."
                          defaultValue={localStorage.getItem('portfolio_remote_ai_key') || ''}
                          onChange={(e) => localStorage.setItem('portfolio_remote_ai_key', e.target.value)}
                          className="rounded-xl h-12 bg-secondary/30 border-transparent focus:bg-background transition-all"
                        />
                        <Button variant="secondary" className="rounded-xl px-6" onClick={() => {
                          checkOnDeviceAIStatus().then(status => {
                            setOnDeviceStatus(status);
                            if (status.available) toast({ title: 'API Connection Verified', variant: 'default' });
                            else toast({ title: 'Connection Failed', description: 'Invalid key or provider offline.', variant: 'destructive' });
                          });
                        }}>Verify</Button>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">Keys are stored locally in your browser storage only.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-8">
                <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden p-8 flex flex-col justify-center items-center text-center">
                  <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                    <Circle className={`h-10 w-10 ${onDeviceStatus?.available ? 'fill-green-500 text-green-500 animate-pulse' : 'fill-red-500 text-red-500'}`} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">System Pulse</h3>
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase text-primary tracking-widest">
                      {onDeviceStatus?.provider === 'browser' ? 'Edge/Chrome AI' : onDeviceStatus?.provider === 'remote' ? 'Remote Inference Active' : 'Native Model Engine'}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
                      Status: {onDeviceStatus?.available ? 'Nominal / Active' : 'Degraded / Standby'}
                    </p>
                  </div>
                  <div className="w-full h-px bg-border my-8" />
                  <div className="grid grid-cols-2 gap-8 w-full">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Inference Engine</p>
                      <p className="text-sm font-mono tracking-tighter">{onDeviceStatus?.available ? 'Integrated' : 'Disconnected'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Latency Layer</p>
                      <p className="text-sm font-mono tracking-tighter text-green-500">~24ms</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
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
    <Card className="border-border/60 rounded-3xl overflow-hidden bg-card/40">
      <CardHeader className="bg-secondary/20 p-8 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter">{lab.id ? 'Refine Deployment' : 'New Lab Specification'}</CardTitle>
            <CardDescription className="text-xs uppercase font-bold tracking-widest text-primary/60 mt-1">Configure technical deep-dive parameters</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onSave(form)} size="lg" className="rounded-xl h-12 shadow-lg shadow-primary/20"><Save className="h-4 w-4 mr-2" />Commit Changes</Button>
            <Button variant="outline" onClick={onCancel} size="lg" className="rounded-xl h-12 border-border/60">Abort</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-10">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1">Lab Architecture Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-12 rounded-xl bg-secondary/30" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1">High-Level Executive Summary</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="rounded-2xl bg-secondary/30 resize-none" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1">Project Classification (Tags)</Label>
              <Input value={form.tags.join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} placeholder="e.g. VMware, NSX-T, Automation" className="h-12 rounded-xl bg-secondary/30" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1">Technical Objective</Label>
              <Input value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} className="h-12 rounded-xl bg-secondary/30" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1">Environment Stack</Label>
              <Input value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })} className="h-12 rounded-xl bg-secondary/30" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1">Source Repository (HTTPS URL)</Label>
              <Input value={form.repoUrl || ''} onChange={e => setForm({ ...form, repoUrl: e.target.value })} className="h-12 rounded-xl bg-secondary/30" placeholder="https://github.com/..." />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 border-t border-border/40 pt-10">
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                <Label className="text-xs font-bold uppercase tracking-widest">Logic Flow / Steps</Label>
              </div>
              <Button variant="outline" size="sm" onClick={() => setForm({ ...form, steps: [...form.steps, ''] })} className="h-8 rounded-lg px-3 text-[10px] font-black uppercase"><Plus className="h-3 w-3 mr-1" />Add Instance</Button>
            </div>
            <div className="space-y-3">
              {form.steps.map((step, i) => (
                <div key={i} className="flex gap-2 group">
                  <div className="h-12 w-12 bg-secondary/50 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                  <Input value={step} onChange={e => updateStep(i, e.target.value)} placeholder={`Operational Step ${i + 1}`} className="h-12 rounded-xl bg-secondary/20" />
                  <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-red-500" onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <div className="space-y-3 mt-8">
                <Label className="text-xs font-bold uppercase tracking-widest ml-1">Verified Outcome</Label>
                <Textarea value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} rows={4} className="rounded-2xl bg-secondary/30 resize-none font-italic" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Rocket className="h-5 w-5" />
                <Label className="text-xs font-bold uppercase tracking-widest">Media Verification Suite</Label>
              </div>
              <Button variant="outline" size="sm" onClick={addMedia} className="h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest border-primary/20"><Plus className="h-4 w-4 mr-2" />Add Asset</Button>
            </div>

            <div className="grid gap-4">
              {(form.media || []).map((m, i) => (
                <div key={i} className="group relative p-6 bg-secondary/10 border border-border/40 hover:bg-secondary/20 transition-all rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 space-y-4 w-full">
                      <div className="relative">
                        <Input value={m.url} onChange={e => updateMedia(i, 'url', e.target.value)} placeholder="MP4, GIF, or Image URL" className="h-12 rounded-xl bg-background pr-10" />
                        <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <select
                          value={m.type}
                          onChange={e => updateMedia(i, 'type', e.target.value)}
                          className="h-12 bg-background border border-input rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-widest text-foreground"
                          title="Select media type"
                        >
                          <option value="video">V: MP4 VIDEO</option>
                          <option value="gif">G: ANIMATED GIF</option>
                          <option value="image">I: STATIC IMAGE</option>
                        </select>
                        <Input value={m.caption || ''} onChange={e => updateMedia(i, 'caption', e.target.value)} placeholder="Asset Caption (UI context)" className="h-12 rounded-xl bg-background" />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => removeMedia(i)}><Trash2 className="h-5 w-5" /></Button>
                  </div>

                  {/* Per-asset AI narration portal */}
                  <div className="pt-4 border-t border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {m.narration ? (
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        ) : (
                          <Circle className="h-3 w-3 opacity-20" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Intelligence Layer</span>
                      </div>
                      <Button variant="secondary" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase px-4" onClick={() => handleGenerateNarration([i])} disabled={narrating}>
                        {narrating ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                        Sync Intelligence
                      </Button>
                    </div>
                    <Textarea
                      value={m.narration || ''}
                      onChange={e => updateMedia(i, 'narration' as any, e.target.value)}
                      rows={3}
                      placeholder="AI will generate insights here after sinking verification media..."
                      className="text-xs bg-background/50 border-transparent rounded-xl resize-none italic"
                    />
                  </div>
                </div>
              ))}

              {form.media?.length === 0 && (
                <div className="p-16 text-center bg-background/20 rounded-3xl border border-dashed border-border/40">
                  <Layout className="h-12 w-12 text-muted-foreground/10 mx-auto mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 italic">No verification media linked</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI ENGINE CONTROL PANEL */}
        {(form.media?.length ?? 0) > 0 && (
          <div className="pt-8 border-t-2 border-primary/20">
            <div className="p-8 bg-primary/5 border border-primary/20 rounded-3xl space-y-6 relative overflow-hidden group">
              <Sparkles className="absolute top-0 right-0 h-48 w-48 text-primary/5 -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:text-primary/10 transition-colors" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Cpu className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black uppercase tracking-tighter">Narration Engine</h4>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${onDeviceStatus?.available ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Status: {onDeviceStatus?.available ? 'Inference Logic Connected' : 'Intelligence Layer Offline'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={engine}
                    onChange={e => setEngine(e.target.value as NarrationEngine)}
                    className="h-12 bg-background border border-primary/20 rounded-xl px-5 text-xs font-black uppercase tracking-widest text-foreground shadow-sm"
                    title="Select narration engine"
                  >
                    <option value="auto">A: AUTO SELECTION</option>
                    <option value="foundry">O: ON-DEVICE LOGIC</option>
                    <option value="cloud">C: CLOUD INTERFACE</option>
                  </select>
                  <Button
                    size="lg"
                    className="h-12 rounded-xl px-8 font-black uppercase tracking-widest"
                    onClick={() => handleGenerateNarration()}
                    disabled={narrating}
                  >
                    {narrating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-3" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-3" />
                        Run Intelligence
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {narrating && progress && (
                <div className="space-y-3 pt-4 relative z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary/60">
                    <span>{progress.message}</span>
                    <span>{progressPercent}% Complete</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5 bg-primary/10 border border-primary/5 overflow-hidden" />
                </div>
              )}

              {/* Core lab summary narration results */}
              {form.aiNarration && (
                <div className="pt-8 space-y-4 relative z-10 animate-in fade-in duration-500">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs font-black uppercase tracking-[0.3em] text-primary">Lab Executive Summary (Auto-Generated)</Label>
                    {form.narrationSource && (
                      <Badge className="bg-primary/20 text-primary border-primary/40 text-[9px] h-5 rounded-md px-2">
                        SOURCE: {sourceConfig[form.narrationSource]?.label || form.narrationSource}
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    value={form.aiNarration}
                    onChange={e => setForm({ ...form, aiNarration: e.target.value })}
                    rows={8}
                    className="text-sm bg-background/80 border-primary/20 rounded-2xl font-light leading-relaxed tracking-tight"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Post form sub-component
const PostForm = ({ post, onSave, onCancel }: { post: BlogPost; onSave: (p: BlogPost) => void; onCancel: () => void }) => {
  const [form, setForm] = useState<BlogPost>({ ...post });

  return (
    <Card className="border-border/60 rounded-3xl overflow-hidden bg-card/40">
      <CardHeader className="bg-secondary/20 p-8 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter">{post.id ? 'Refine Article' : 'Draft New Thought'}</CardTitle>
            <CardDescription className="text-xs uppercase font-bold tracking-widest text-primary/60 mt-1">Cloud & Infrastructure Reflections</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onSave(form)} size="lg" className="rounded-xl h-12 shadow-lg shadow-primary/20"><Save className="h-4 w-4 mr-2" />Post Insight</Button>
            <Button variant="outline" onClick={onCancel} size="lg" className="rounded-xl h-12 border-border/60">Discard</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2 space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest ml-1">Article Headline</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-14 rounded-xl text-xl font-bold bg-secondary/30" placeholder="Insight Title..." />
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest ml-1">Publication Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="h-14 rounded-xl bg-secondary/30 font-mono" />
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-widest ml-1">Knowledge Content (Rich Text / Markdown)</Label>
          <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={15} className="bg-secondary/20 border-border/40 rounded-3xl p-6 text-lg font-light leading-relaxed resize-none focus:bg-background transition-all" placeholder="Share your technical journey..." />
        </div>
      </CardContent>
    </Card>
  );
};

export default Admin;
