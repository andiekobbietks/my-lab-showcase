import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Github, Linkedin, Mail, Send, RefreshCw, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { defaultProfile } from '@/lib/data';
import { useSafeQuery } from '@/hooks/use-safe-query';

const ContactSection = () => {
  const convexProfile = useSafeQuery(api.queries.getProfile);
  // Contact form submits via mailto for now (no saveContact mutation exists)
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  if (convexProfile === undefined) {
    return (
      <section id="contact" className="py-20">
        <div className="container flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const profile = convexProfile || defaultProfile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Open mailto link as fallback
      const subject = encodeURIComponent(`Contact from ${form.name}`);
      const body = encodeURIComponent(`From: ${form.name} (${form.email})\n\n${form.message}`);
      window.open(`mailto:${profile.email}?subject=${subject}&body=${body}`, '_blank');
      toast({ title: 'Message prepared!', description: 'Your email client should open shortly.' });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast({ title: 'Error sending message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-secondary/20">
      <div className="container px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8 bg-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Inquiry & Collaboration</span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Let's Connect</h2>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-md">
                Whether you have a question about my labs, a networking challenge, or just want to chat about SDDC — my inbox is always open.
              </p>

              <div className="space-y-6">
                {profile.email && (
                  <div className="group flex items-center gap-4 p-4 bg-background border border-border/50 rounded-2xl hover:border-primary/40 transition-all">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Mail className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Me</p>
                      <a href={`mailto:${profile.email}`} className="text-foreground font-medium hover:text-primary transition-colors">{profile.email}</a>
                    </div>
                  </div>
                )}
                {profile.linkedinUrl && (
                  <div className="group flex items-center gap-4 p-4 bg-background border border-border/50 rounded-2xl hover:border-primary/40 transition-all">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Linkedin className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Network</p>
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium hover:text-primary transition-colors">LinkedIn Profile</a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-[1.2]">
              <Card className="bg-background border-border/60 shadow-xl rounded-3xl overflow-hidden p-2">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-8 text-primary">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-bold tracking-tight">Send a Direct Message</span>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest ml-1">Full Name</Label>
                        <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-12 bg-secondary/30 border-transparent focus:bg-background focus:border-primary rounded-xl" placeholder="John Doe" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1">Email Address</Label>
                        <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-12 bg-secondary/30 border-transparent focus:bg-background focus:border-primary rounded-xl" placeholder="john@example.com" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest ml-1">Your Message</Label>
                      <Textarea id="message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} className="bg-secondary/30 border-transparent focus:bg-background focus:border-primary rounded-xl resize-none" placeholder="How can I help you?" required />
                    </div>
                    <Button type="submit" disabled={sending} className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      {sending ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                      {sending ? 'Sending...' : 'Transmit Message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
