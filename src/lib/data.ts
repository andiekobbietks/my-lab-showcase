// Local data layer — all localStorage, easy to swap for API later

export interface Lab {
  id: string;
  title: string;
  description: string;
  tags: string[];
  objective: string;
  environment: string;
  steps: string[];
  outcome: string;
  repoUrl?: string;
  thumbnail?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  githubUsername: string;
  linkedinUrl: string;
  email: string;
  skills: Skill[];
  certifications: Certification[];
  cvUrl?: string;
}

export interface Skill {
  name: string;
  level: number; // 0-100
  category: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

const KEYS = {
  labs: 'portfolio_labs',
  blog: 'portfolio_blog',
  profile: 'portfolio_profile',
  contacts: 'portfolio_contacts',
};

const defaultProfile: Profile = {
  name: 'Your Name',
  title: 'Cloud & SDDC Infrastructure Engineer',
  tagline: 'Building software-defined data centres — from home lab to production.',
  bio: 'Infrastructure engineer with CCNA certification, AWS re/Start graduate, and a passion for VMware SDDC, cloud platforms, and automation. Currently building hands-on lab environments that mirror real-world enterprise deployments.',
  githubUsername: '',
  linkedinUrl: '',
  email: '',
  skills: [
    { name: 'VMware vSphere', level: 70, category: 'Virtualisation' },
    { name: 'vSAN', level: 60, category: 'Virtualisation' },
    { name: 'NSX-T', level: 55, category: 'Networking' },
    { name: 'Networking (CCNA)', level: 80, category: 'Networking' },
    { name: 'AWS', level: 65, category: 'Cloud' },
    { name: 'Linux', level: 70, category: 'Systems' },
    { name: 'PowerCLI', level: 50, category: 'Automation' },
    { name: 'Terraform', level: 45, category: 'Automation' },
  ],
  certifications: [
    { name: 'CCNA', issuer: 'Cisco', year: '2024' },
    { name: 'AWS re/Start Graduate', issuer: 'Amazon Web Services', year: '2024' },
  ],
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Labs
export const getLabs = (): Lab[] => get(KEYS.labs, []);
export const saveLab = (lab: Lab) => {
  const labs = getLabs();
  const idx = labs.findIndex(l => l.id === lab.id);
  if (idx >= 0) labs[idx] = lab; else labs.push(lab);
  set(KEYS.labs, labs);
};
export const deleteLab = (id: string) => {
  set(KEYS.labs, getLabs().filter(l => l.id !== id));
};

// Blog
export const getBlogPosts = (): BlogPost[] => get(KEYS.blog, []);
export const saveBlogPost = (post: BlogPost) => {
  const posts = getBlogPosts();
  const idx = posts.findIndex(p => p.id === post.id);
  if (idx >= 0) posts[idx] = post; else posts.push(post);
  set(KEYS.blog, posts);
};
export const deleteBlogPost = (id: string) => {
  set(KEYS.blog, getBlogPosts().filter(p => p.id !== id));
};

// Profile
export const getProfile = (): Profile => get(KEYS.profile, defaultProfile);
export const saveProfile = (profile: Profile) => set(KEYS.profile, profile);

// Contact
export const getContacts = (): ContactMessage[] => get(KEYS.contacts, []);
export const saveContact = (msg: ContactMessage) => {
  const msgs = getContacts();
  msgs.push(msg);
  set(KEYS.contacts, msgs);
};

// Export / Import
export const exportAllData = () => JSON.stringify({
  labs: getLabs(),
  blog: getBlogPosts(),
  profile: getProfile(),
  contacts: getContacts(),
}, null, 2);

export const importAllData = (json: string) => {
  const data = JSON.parse(json);
  if (data.labs) set(KEYS.labs, data.labs);
  if (data.blog) set(KEYS.blog, data.blog);
  if (data.profile) set(KEYS.profile, data.profile);
  if (data.contacts) set(KEYS.contacts, data.contacts);
};
