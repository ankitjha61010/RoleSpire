export interface CompanyData {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  industry: string;
  headquarters: string;
  companySize: string;
  website: string;
  about: string;
  founded: number;
  specialties: string[];
  followersCount: number;
  rating: number;
  activeJobsCount: number;
  bannerUrl: string;
  cultureHighlights: { title: string; desc: string; icon: string }[];
  leadership: { name: string; role: string; avatar: string; headline: string }[];
  employees: { id: string; name: string; role: string; avatar: string; headline: string; isRecruiter?: boolean; isHiring?: boolean }[];
}

export const MOCK_COMPANIES: Record<string, CompanyData> = {
  razorpay: {
    id: 'razorpay',
    name: 'Razorpay',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
    tagline: 'The Financial Backbone for India’s Top Digital Businesses & Unicorns',
    industry: 'Financial Technology / Digital Payments',
    headquarters: 'Bangalore, Karnataka, India',
    companySize: '1,000 - 5,000 employees',
    website: 'https://razorpay.com',
    founded: 2014,
    rating: 4.6,
    followersCount: 384000,
    activeJobsCount: 14,
    about: 'Razorpay is India’s leading full-stack financial solutions company powering modern internet companies. We process billions in digital transactions across Payment Gateway, Neo-Banking (RazorpayX), Payroll, Corporate Cards, and Capital lending with 99.99% uptime.',
    specialties: ['FinTech', 'Real-time Payment Infrastructure', 'Distributed Microservices', 'React Native', 'TypeScript', 'Node.js', 'High-throughput APIs'],
    cultureHighlights: [
      { title: 'Engineer Autonomy', desc: 'Own architectural decisions with fast deployment pipelines and micro-teams.', icon: '⚡' },
      { title: 'Generous Benefits', desc: 'Comprehensive medical coverage, mental wellness support, and flexible remote stipends.', icon: '🛡️' },
      { title: 'ESOP Wealth Creation', desc: 'Industry-leading ESOP liquidity buyback programs for early and senior contributors.', icon: '📈' },
    ],
    leadership: [
      { name: 'Harshil Mathur', role: 'CEO & Co-Founder', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60', headline: 'Building India’s Financial Cloud' },
      { name: 'Shashank Kumar', role: 'MD & Co-Founder', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60', headline: 'Distributed Systems & Tech' },
    ],
    employees: [
      { id: 'usr_priya_rzp', name: 'Priya Sharma', role: 'Lead Tech Recruiter', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60', headline: 'Tech Recruiter @ Razorpay', isRecruiter: true, isHiring: true },
      { id: 'usr_rohit', name: 'Rohit Verma', role: 'Senior Mobile Engineer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60', headline: 'React Native Checkout Team' },
      { id: 'usr_ananya', name: 'Ananya Roy', role: 'Staff Frontend Architect', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60', headline: 'Design Systems & Performance' },
    ],
  },
  linear: {
    id: 'linear',
    name: 'Linear',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    tagline: 'The purpose-built tool for modern software teams to plan and build products',
    industry: 'Productivity & Developer Tools',
    headquarters: 'San Francisco, CA (Fully Distributed / Remote-First)',
    companySize: '50 - 200 employees',
    website: 'https://linear.app',
    founded: 2019,
    rating: 4.9,
    followersCount: 215000,
    activeJobsCount: 8,
    about: 'Linear is a high-performance issue tracker and project management platform built for modern product engineering teams. Known for buttery-smooth 60fps keyboard-driven UX, instant offline sync, and state-of-the-art developer ergonomics.',
    specialties: ['Product Engineering', 'React', 'TypeScript', 'CRDTs & Real-time Sync', 'Electron & WebAssembly', 'Distributed Systems'],
    cultureHighlights: [
      { title: 'Craftsmanship First', desc: 'Obsession with UI micro-details, keyboard ergonomics, and sub-100ms response latency.', icon: '✨' },
      { title: '100% Async Remote', desc: 'Work from anywhere across global timezones with high trust and minimal meetings.', icon: '🌍' },
      { title: 'Top 1% Compensation', desc: 'Silicon Valley compensation packages regardless of geographical location.', icon: '💎' },
    ],
    leadership: [
      { name: 'Karri Saarinen', role: 'CEO & Co-Founder', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60', headline: 'Designer & Founder @ Linear (Ex-Airbnb, Coinbase)' },
      { name: 'Tuomas Artman', role: 'CTO & Co-Founder', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60', headline: 'Frontend Architecture & Sync Engines' },
    ],
    employees: [
      { id: 'usr_arjun_linear', name: 'Arjun Mehta', role: 'Staff Product Engineer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60', headline: 'Staff Engineer @ Linear (Ex-Stripe)', isHiring: true },
      { id: 'usr_sarah_linear', name: 'Sarah Lin', role: 'Talent Lead', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60', headline: 'Global Engineering Recruiting', isRecruiter: true },
    ],
  },
  swiggy: {
    id: 'swiggy',
    name: 'Swiggy',
    logo: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=100&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
    tagline: 'Delivering Convenience Across Food, Instamart & Quick Commerce',
    industry: 'On-Demand Consumer Tech & Quick Commerce',
    headquarters: 'Bangalore, Karnataka, India',
    companySize: '5,000 - 10,000 employees',
    website: 'https://swiggy.com',
    founded: 2014,
    rating: 4.4,
    followersCount: 520000,
    activeJobsCount: 22,
    about: 'Swiggy is India’s leading on-demand convenience platform. With millions of orders processed daily, we connect consumers with restaurants, grocery stores (Instamart), dining out, and rapid parcel logistics across 500+ Indian cities.',
    specialties: ['Quick Commerce', 'Next.js & SSR', 'Micro-frontends', 'Real-time Geolocation', 'High-volume Order Engines'],
    cultureHighlights: [
      { title: 'Massive Scale', desc: 'Build systems handling 2.5M+ requests per minute with sub-second order fulfillment.', icon: '🚀' },
      { title: 'Fast-Paced Innovation', desc: 'Rapid experimentation in quick commerce, GenAI recommendations, and logistics.', icon: '💡' },
      { title: 'Hybrid Flexibility', desc: 'Bangalore campus with hybrid remote schedules and flexible team pods.', icon: '🏢' },
    ],
    leadership: [
      { name: 'Sriharsha Majety', role: 'Group CEO', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60', headline: 'Founder & CEO @ Swiggy' },
      { name: 'Rohit Kapoor', role: 'CEO - Food Marketplace', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60', headline: 'Consumer Tech Growth' },
    ],
    employees: [
      { id: 'usr_vikram_swiggy', name: 'Vikram Patel', role: 'Engineering Manager', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60', headline: 'Engineering Manager @ Swiggy', isHiring: true },
      { id: 'usr_divya_swiggy', name: 'Divya Nair', role: 'Lead Talent Partner', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60', headline: 'Tech Hiring Pod Lead', isRecruiter: true },
    ],
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    tagline: 'Financial Infrastructure for the Entire Internet Economy',
    industry: 'Global Payments & Financial Infrastructure',
    headquarters: 'San Francisco & Dublin (Remote Hubs Globally)',
    companySize: '5,000 - 10,000 employees',
    website: 'https://stripe.com',
    founded: 2010,
    rating: 4.8,
    followersCount: 890000,
    activeJobsCount: 19,
    about: 'Stripe is a financial infrastructure platform for businesses. Millions of companies—from the world’s largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.',
    specialties: ['Global Payments', 'API Design & Idempotency', 'Developer Tools', 'Banking-as-a-Service', 'Distributed Data Systems'],
    cultureHighlights: [
      { title: 'Rigorous Engineering', desc: 'Known for industry benchmark API design, exceptional documentation, and zero-defect mentality.', icon: '🏛️' },
      { title: 'Global Remote Teams', desc: 'Remote-first engineering hubs with transparent written communication and RFCs.', icon: '🌐' },
      { title: 'Massive Economic Impact', desc: 'Powering over 1% of entire global GDP through digital commerce APIs.', icon: '💳' },
    ],
    leadership: [
      { name: 'Patrick Collison', role: 'CEO & Co-Founder', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60', headline: 'Co-Founder @ Stripe' },
      { name: 'John Collison', role: 'President & Co-Founder', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60', headline: 'Co-Founder @ Stripe' },
    ],
    employees: [
      { id: 'usr_sarah_stripe', name: 'Sarah Jenkins', role: 'Senior Talent Partner', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60', headline: 'Senior Talent Partner @ Stripe', isRecruiter: true, isHiring: true },
      { id: 'usr_alex_stripe', name: 'Alex Rivera', role: 'Staff Backend Engineer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60', headline: 'Stripe Billing Core Team' },
    ],
  },
};
