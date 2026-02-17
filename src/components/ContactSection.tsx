import { useState } from 'react';
import { saveContact, getProfile } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Github, Linkedin, Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ContactSection = () => {
  const profile = getProfile();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveContact({ id: crypto.randomUUID(), ...form, date: new Date().toISOString() });
    toast({ title: 'Message sent!', description: 'Your message has been saved.' });
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" className="py-20">
      <div className="container">
        <h2 className="text-3xl font-bold text-foreground mb-2">Contact</h2>
        <p className="text-muted-foreground mb-8">Get in touch — I'd love to hear from you.</p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} required />
                </div>
                <Button type="submit" className="w-full"><Send className="h-4 w-4 mr-2" />Send Message</Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col justify-center gap-4">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />{profile.email}
              </a>
            )}
            {profile.githubUsername && (
              <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />github.com/{profile.githubUsername}
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />LinkedIn Profile
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
