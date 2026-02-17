import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const links = [
  { label: 'About', href: '#about' },
  { label: 'Labs', href: '#labs' },
  { label: 'GitHub', href: '#github' },
  { label: 'Blog', href: '#blog' },
  { label: 'CV', href: '#cv' },
  { label: 'Contact', href: '#contact' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-lg font-bold text-foreground">
          Portfolio
        </a>
        <div className="hidden md:flex gap-1">
          {links.map(l => (
            <Button key={l.href} variant="ghost" size="sm" onClick={() => scrollTo(l.href)}>
              {l.label}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-2">
          {links.map(l => (
            <Button key={l.href} variant="ghost" className="justify-start" onClick={() => scrollTo(l.href)}>
              {l.label}
            </Button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
