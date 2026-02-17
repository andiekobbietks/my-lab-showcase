import { getProfile } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

const CVSection = () => {
  const profile = getProfile();

  return (
    <section id="cv" className="py-20 bg-card/50">
      <div className="container">
        <h2 className="text-3xl font-bold text-foreground mb-2">CV / Resume</h2>
        <p className="text-muted-foreground mb-8">Download my latest CV or view key highlights below.</p>

        <Card className="max-w-xl">
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">{profile.name}</h3>
            <p className="text-muted-foreground mb-6">{profile.title}</p>
            {profile.cvUrl ? (
              <Button asChild>
                <a href={profile.cvUrl} download><Download className="h-4 w-4 mr-2" />Download CV</a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Upload your CV from the admin panel at <code className="text-primary">/admin</code>.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CVSection;
