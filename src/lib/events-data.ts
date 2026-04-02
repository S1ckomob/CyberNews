export interface CyberEvent {
  id: string;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  country: string;
  website: string;
  description: string;
  type: "conference" | "training" | "ctf" | "summit";
  tags: string[];
  featured: boolean;
}

export const EVENTS: CyberEvent[] = [
  {
    id: "blackhat-usa-2026",
    name: "Black Hat USA 2026",
    shortName: "Black Hat USA",
    startDate: "2026-08-01",
    endDate: "2026-08-06",
    location: "Mandalay Bay, Las Vegas, NV",
    city: "Las Vegas",
    country: "United States",
    website: "https://www.blackhat.com/us-26/",
    description: "The world's leading information security event. Features briefings, trainings, Arsenal demos, and the Business Hall. Research disclosures from Black Hat often coincide with major vulnerability releases.",
    type: "conference",
    tags: ["research", "briefings", "training", "arsenal", "enterprise"],
    featured: true,
  },
  {
    id: "defcon-34",
    name: "DEF CON 34",
    shortName: "DEF CON",
    startDate: "2026-08-06",
    endDate: "2026-08-09",
    location: "Las Vegas Convention Center, Las Vegas, NV",
    city: "Las Vegas",
    country: "United States",
    website: "https://defcon.org/",
    description: "The world's largest hacker conference. Villages for hardware, IoT, car hacking, social engineering, and more. CTF competitions, demo labs, and community-driven talks.",
    type: "conference",
    tags: ["hacking", "ctf", "villages", "community", "research"],
    featured: true,
  },
  {
    id: "rsa-2026",
    name: "RSA Conference 2026",
    shortName: "RSA",
    startDate: "2026-04-21",
    endDate: "2026-04-24",
    location: "Moscone Center, San Francisco, CA",
    city: "San Francisco",
    country: "United States",
    website: "https://www.rsaconference.com/",
    description: "Premier cybersecurity conference focused on enterprise security, risk management, and compliance. Keynotes, expo, innovation sandbox, and CISO-track sessions.",
    type: "conference",
    tags: ["enterprise", "ciso", "compliance", "vendors", "innovation"],
    featured: true,
  },
  {
    id: "blackhat-europe-2026",
    name: "Black Hat Europe 2026",
    shortName: "Black Hat EU",
    startDate: "2026-12-01",
    endDate: "2026-12-04",
    location: "ExCeL London, United Kingdom",
    city: "London",
    country: "United Kingdom",
    website: "https://www.blackhat.com/eu-26/",
    description: "European edition of Black Hat with technical briefings, trainings, and vendor exhibitions. Key event for the EMEA security community.",
    type: "conference",
    tags: ["research", "briefings", "training", "europe"],
    featured: false,
  },
  {
    id: "blackhat-asia-2026",
    name: "Black Hat Asia 2026",
    shortName: "Black Hat Asia",
    startDate: "2026-04-14",
    endDate: "2026-04-17",
    location: "Marina Bay Sands, Singapore",
    city: "Singapore",
    country: "Singapore",
    website: "https://www.blackhat.com/asia-26/",
    description: "Asia-Pacific edition of Black Hat featuring regional and international security research, trainings, and business hall.",
    type: "conference",
    tags: ["research", "asia-pacific", "briefings", "training"],
    featured: false,
  },
  {
    id: "sans-2026",
    name: "SANS Cyber Security Training",
    shortName: "SANS",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    location: "Multiple Locations / Online",
    city: "Various",
    country: "Global",
    website: "https://www.sans.org/",
    description: "Year-round cybersecurity training courses, certifications (GIAC), and summits. The gold standard for hands-on security training. Events held globally and online.",
    type: "training",
    tags: ["training", "certification", "giac", "hands-on", "continuous"],
    featured: false,
  },
  {
    id: "cyberwarcon-2026",
    name: "CYBERWARCON 2026",
    shortName: "CYBERWARCON",
    startDate: "2026-11-19",
    endDate: "2026-11-20",
    location: "Arlington, VA",
    city: "Arlington",
    country: "United States",
    website: "https://www.cyberwarcon.com/",
    description: "Focused on cyber threats from nation-states. Features intelligence community speakers, threat actor tracking research, and geopolitical cyber analysis.",
    type: "summit",
    tags: ["nation-state", "intelligence", "geopolitics", "apt", "research"],
    featured: true,
  },
  {
    id: "mandiant-summit-2026",
    name: "mWISE 2026 (Mandiant)",
    shortName: "mWISE",
    startDate: "2026-09-15",
    endDate: "2026-09-17",
    location: "Washington, DC",
    city: "Washington DC",
    country: "United States",
    website: "https://www.mandiant.com/mwise",
    description: "Mandiant's annual threat intelligence summit. Deep-dive sessions on APT campaigns, incident response case studies, and threat hunting techniques.",
    type: "summit",
    tags: ["threat-intel", "incident-response", "mandiant", "apt"],
    featured: false,
  },
  {
    id: "s4-2026",
    name: "S4 Conference 2026",
    shortName: "S4",
    startDate: "2026-02-24",
    endDate: "2026-02-26",
    location: "Miami Beach, FL",
    city: "Miami",
    country: "United States",
    website: "https://s4xevents.com/",
    description: "The premier ICS/OT security conference. Focuses on critical infrastructure, SCADA, and industrial cybersecurity. Pwn2Own ICS competition.",
    type: "conference",
    tags: ["ics", "ot", "scada", "critical-infrastructure", "industrial"],
    featured: false,
  },
  {
    id: "cisa-summit-2026",
    name: "CISA Cybersecurity Summit 2026",
    shortName: "CISA Summit",
    startDate: "2026-10-06",
    endDate: "2026-10-08",
    location: "Washington, DC",
    city: "Washington DC",
    country: "United States",
    website: "https://www.cisa.gov/",
    description: "CISA's annual gathering for government and private sector cybersecurity leaders. Policy discussions, threat briefings, and public-private collaboration.",
    type: "summit",
    tags: ["government", "policy", "cisa", "public-private", "federal"],
    featured: false,
  },
  {
    id: "hack-lu-2026",
    name: "Hack.lu 2026",
    shortName: "Hack.lu",
    startDate: "2026-10-20",
    endDate: "2026-10-23",
    location: "Luxembourg",
    city: "Luxembourg",
    country: "Luxembourg",
    website: "https://hack.lu/",
    description: "European open-source security conference with CTF, workshops, and research presentations. Community-driven with a strong malware analysis track.",
    type: "conference",
    tags: ["europe", "open-source", "malware", "ctf", "community"],
    featured: false,
  },
  {
    id: "pwn2own-vancouver-2026",
    name: "Pwn2Own Vancouver 2026",
    shortName: "Pwn2Own",
    startDate: "2026-03-18",
    endDate: "2026-03-20",
    location: "Vancouver, BC, Canada",
    city: "Vancouver",
    country: "Canada",
    website: "https://www.zerodayinitiative.com/blog",
    description: "Premier exploit competition run by ZDI. Researchers demonstrate zero-day exploits against browsers, OS, enterprise apps, and automotive targets for cash prizes.",
    type: "ctf",
    tags: ["exploit", "zero-day", "competition", "zdi", "browser", "research"],
    featured: true,
  },
  {
    id: "recon-2026",
    name: "REcon Montreal 2026",
    shortName: "REcon",
    startDate: "2026-06-26",
    endDate: "2026-06-28",
    location: "Montreal, QC, Canada",
    city: "Montreal",
    country: "Canada",
    website: "https://recon.cx/",
    description: "Advanced reverse engineering and security research conference. Deep technical talks on binary analysis, exploitation, and hardware security.",
    type: "conference",
    tags: ["reverse-engineering", "binary", "exploitation", "hardware", "research"],
    featured: false,
  },
  {
    id: "frsecure-2026",
    name: "Wild West Hackin' Fest 2026",
    shortName: "WWHF",
    startDate: "2026-10-14",
    endDate: "2026-10-16",
    location: "Deadwood, SD",
    city: "Deadwood",
    country: "United States",
    website: "https://wildwesthackinfest.com/",
    description: "Community-focused security conference with hands-on labs, red/blue team exercises, OSINT challenges, and networking. Beginner-friendly track available.",
    type: "conference",
    tags: ["community", "hands-on", "red-team", "blue-team", "osint"],
    featured: false,
  },
];

export function getEventStatus(event: CyberEvent): "upcoming" | "live" | "past" {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate + "T23:59:59");

  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";
  return "past";
}

export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
