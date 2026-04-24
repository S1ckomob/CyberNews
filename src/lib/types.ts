export type ThreatLevel = "critical" | "high" | "medium" | "low";

export type Category =
  | "vulnerability"
  | "malware"
  | "ransomware"
  | "data-breach"
  | "apt"
  | "zero-day"
  | "supply-chain"
  | "phishing"
  | "insider-threat"
  | "ddos"
  | "ai";

export type Industry =
  | "healthcare"
  | "finance"
  | "government"
  | "energy"
  | "retail"
  | "technology"
  | "education"
  | "defense"
  | "telecommunications"
  | "manufacturing";

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  origin: string;
  description: string;
  targetIndustries: Industry[];
  firstSeen: string;
  lastActive: string;
  ttps: string[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  threatLevel: ThreatLevel;
  category: Category;
  cves: string[];
  affectedProducts: string[];
  threatActors: string[];
  industries: Industry[];
  attackVector: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  updatedAt: string;
  discoveredAt: string;
  exploitedAt?: string;
  patchedAt?: string;
  verified: boolean;
  verifiedBy: string[];
  tags: string[];
  region: string;
}

export interface FilterState {
  threatLevel: ThreatLevel[];
  category: Category[];
  industry: Industry[];
  search: string;
}
