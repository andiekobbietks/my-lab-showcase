import { getBlogPosts } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const BlogSection = () => {
  const posts = getBlogPosts();

  return (
    <section id="blog" className="py-20">
      <div className="container">
        <h2 className="text-3xl font-bold text-foreground mb-2">Blog & Reflections</h2>
        <p className="text-muted-foreground mb-8">Lessons learned, career reflections, and lab write-ups.</p>

        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No blog posts yet. Add your first post from the admin panel at <code className="text-primary">/admin</code>.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(post => (
              <Card key={post.id}>
                <CardHeader>
                  <CardDescription>{new Date(post.date).toLocaleDateString()}</CardDescription>
                  <CardTitle>{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
