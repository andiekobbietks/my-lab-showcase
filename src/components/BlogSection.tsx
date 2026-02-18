import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, RefreshCw, Calendar, ArrowRight } from 'lucide-react';

const SAMPLE_POSTS = [
  {
    _id: "sample-1",
    title: "The Journey to CCNA: Lessons in Layer 2",
    date: "2024-03-15",
    content: "Diving deep into spanning-tree protocols and VLAN optimization. The core of networking is as much about troubleshooting as it is about configuration."
  },
  {
    _id: "sample-2",
    title: "Automating vSphere with PowerCLI",
    date: "2024-02-28",
    content: "Why manual configuration is the enemy of stability. Exploring how a few lines of PowerShell can ensure consistent environments across the whole lab."
  }
];

const BlogSection = () => {
  const convexPosts = useQuery(api.queries.getBlogPosts);

  if (convexPosts === undefined) {
    return (
      <section id="blog" className="py-20">
        <div className="container flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  // Use cloud posts or fallback to samples
  const posts = (convexPosts && convexPosts.length > 0) ? convexPosts : SAMPLE_POSTS;

  return (
    <section id="blog" className="py-24 bg-background">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Reflections & Insight</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground tracking-tight">Technical Blog</h2>
            <p className="text-muted-foreground mt-2 max-w-xl">Sharing knowledge on SDDC, networking, and the cloud journey.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {posts.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((post: any, idx: number) => (
            <Card key={post._id || idx} className="group bg-card/40 border-border/60 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-primary mb-3">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed line-clamp-4 mb-6 italic font-light">
                  "{post.content}"
                </p>
                <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent text-primary hover:gap-2 transition-all font-bold tracking-tighter uppercase text-[10px]">
                  Read More <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!convexPosts || convexPosts.length === 0) && (
          <p className="mt-12 text-center text-xs text-muted-foreground/30 italic">
            Showing sample reflections. Manage your blog posts via the <a href="/admin" className="underline hover:text-primary">Admin Panel</a>.
          </p>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
