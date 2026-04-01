import { Article, ThreatActor } from "./types";

export const articles: Article[] = [
  {
    id: "1",
    title: "Critical RCE Vulnerability in Cisco IOS XE Actively Exploited in the Wild",
    slug: "critical-rce-cisco-ios-xe-exploited",
    summary:
      "A critical remote code execution vulnerability (CVSS 10.0) in Cisco IOS XE is being actively exploited by threat actors to gain persistent access to enterprise network infrastructure. Over 40,000 devices confirmed compromised.",
    content:
      "Cisco has disclosed a critical zero-day vulnerability in IOS XE that allows unauthenticated remote attackers to create privileged accounts on affected systems. The vulnerability, tracked as CVE-2024-20198, carries the maximum CVSS score of 10.0. Threat intelligence indicates that a sophisticated threat actor has been exploiting this vulnerability since at least September 2024, deploying implants on compromised devices to maintain persistent access. Organizations using Cisco IOS XE should immediately check for indicators of compromise and apply the available patches. The Cybersecurity and Infrastructure Security Agency (CISA) has added this vulnerability to its Known Exploited Vulnerabilities catalog.",
    threatLevel: "critical",
    category: "zero-day",
    cves: ["CVE-2024-20198", "CVE-2024-20199"],
    affectedProducts: ["Cisco IOS XE", "Cisco Catalyst Switches", "Cisco ASR Routers"],
    threatActors: ["UNC-CISCO-1"],
    industries: ["telecommunications", "government", "finance", "technology"],
    attackVector: "Network / HTTP/HTTPS Web UI",
    source: "Cisco PSIRT",
    sourceUrl: "https://sec.cloudapps.cisco.com/security/center",
    publishedAt: "2024-10-16T14:00:00Z",
    updatedAt: "2024-10-17T09:30:00Z",
    discoveredAt: "2024-09-28T00:00:00Z",
    exploitedAt: "2024-09-28T00:00:00Z",
    patchedAt: "2024-10-22T00:00:00Z",
    verified: true,
    verifiedBy: ["CISA", "Cisco PSIRT"],
    tags: ["zero-day", "network-infrastructure", "active-exploitation"],
    region: "Global",
  },
  {
    id: "2",
    title: "LockBit 4.0 Ransomware Targets Healthcare Systems with New Encryption Engine",
    slug: "lockbit-4-ransomware-healthcare",
    summary:
      "LockBit ransomware group has deployed version 4.0 with an advanced encryption engine specifically targeting healthcare infrastructure. Multiple hospital systems in the US and EU have been impacted.",
    content:
      "The LockBit ransomware group has released version 4.0 of their ransomware-as-a-service platform, featuring a redesigned encryption engine that specifically targets healthcare management systems and electronic health record databases. At least 12 hospital networks across the United States and European Union have reported incidents in the past 72 hours. The new variant employs intermittent encryption combined with data exfiltration, significantly reducing encryption time while maximizing data theft. FBI and CISA have issued a joint advisory recommending healthcare organizations implement network segmentation and maintain offline backups.",
    threatLevel: "critical",
    category: "ransomware",
    cves: [],
    affectedProducts: ["Epic EHR", "Cerner Millennium", "Windows Server 2019/2022"],
    threatActors: ["LockBit"],
    industries: ["healthcare"],
    attackVector: "Phishing / RDP Exploitation",
    source: "FBI / CISA Joint Advisory",
    sourceUrl: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    publishedAt: "2024-10-15T18:00:00Z",
    updatedAt: "2024-10-16T12:00:00Z",
    discoveredAt: "2024-10-13T00:00:00Z",
    exploitedAt: "2024-10-13T00:00:00Z",
    verified: true,
    verifiedBy: ["FBI", "CISA", "HHS"],
    tags: ["ransomware", "healthcare", "data-exfiltration"],
    region: "North America / Europe",
  },
  {
    id: "3",
    title: "APT29 Deploys Novel Backdoor via Microsoft Teams Phishing Campaign",
    slug: "apt29-microsoft-teams-phishing-backdoor",
    summary:
      "Russian state-sponsored threat actor APT29 (Cozy Bear) has been observed using Microsoft Teams phishing messages to deploy a previously unseen backdoor targeting government and diplomatic organizations.",
    content:
      "Microsoft Threat Intelligence has identified a campaign by APT29 leveraging compromised Microsoft 365 tenants to send phishing messages through Microsoft Teams. The messages contain lures related to diplomatic communications and, when interacted with, deploy a novel backdoor dubbed 'TeamSpy' that uses Microsoft Graph API for command-and-control communications. The backdoor blends in with legitimate Teams traffic, making detection extremely difficult. Targeted organizations include foreign ministries, think tanks, and defense contractors across NATO member states.",
    threatLevel: "high",
    category: "apt",
    cves: [],
    affectedProducts: ["Microsoft Teams", "Microsoft 365", "Windows 10/11"],
    threatActors: ["APT29"],
    industries: ["government", "defense"],
    attackVector: "Phishing / Microsoft Teams",
    source: "Microsoft Threat Intelligence",
    sourceUrl: "https://www.microsoft.com/en-us/security/blog",
    publishedAt: "2024-10-14T10:00:00Z",
    updatedAt: "2024-10-15T08:00:00Z",
    discoveredAt: "2024-10-10T00:00:00Z",
    verified: true,
    verifiedBy: ["Microsoft", "CISA"],
    tags: ["apt", "state-sponsored", "phishing", "backdoor"],
    region: "Europe / NATO",
  },
  {
    id: "4",
    title: "Critical Authentication Bypass in FortiOS Allows Complete Network Takeover",
    slug: "fortios-authentication-bypass-critical",
    summary:
      "Fortinet has patched a critical authentication bypass vulnerability in FortiOS that allows remote attackers to gain super-admin access to affected firewalls. Exploitation in the wild confirmed.",
    content:
      "A critical authentication bypass vulnerability in Fortinet FortiOS (CVE-2024-47575) allows unauthenticated attackers to gain super-admin privileges on affected devices via crafted HTTP requests to the management interface. Fortinet has confirmed active exploitation and urges immediate patching. The vulnerability affects FortiOS versions 7.0 through 7.4 and FortiProxy versions 7.0 through 7.4. Mandiant has linked exploitation activity to a China-nexus threat actor tracked as UNC3886, which has historically targeted network edge devices.",
    threatLevel: "critical",
    category: "vulnerability",
    cves: ["CVE-2024-47575"],
    affectedProducts: ["FortiOS 7.0-7.4", "FortiProxy 7.0-7.4", "FortiGate Firewalls"],
    threatActors: ["UNC3886"],
    industries: ["government", "finance", "energy", "telecommunications"],
    attackVector: "Network / HTTP Management Interface",
    source: "Fortinet PSIRT",
    sourceUrl: "https://www.fortiguard.com/psirt",
    publishedAt: "2024-10-12T16:00:00Z",
    updatedAt: "2024-10-14T11:00:00Z",
    discoveredAt: "2024-10-05T00:00:00Z",
    exploitedAt: "2024-10-08T00:00:00Z",
    patchedAt: "2024-10-12T00:00:00Z",
    verified: true,
    verifiedBy: ["CISA", "Fortinet PSIRT", "Mandiant"],
    tags: ["firewall", "network-edge", "authentication-bypass"],
    region: "Global",
  },
  {
    id: "5",
    title: "Massive Supply Chain Attack Compromises npm Package with 12M Weekly Downloads",
    slug: "npm-supply-chain-attack-12m-downloads",
    summary:
      "A popular npm package with over 12 million weekly downloads was compromised via a hijacked maintainer account, injecting credential-stealing malware into builds for over 48 hours.",
    content:
      "Security researchers have identified a supply chain attack targeting a widely-used npm utility package. The attacker gained access to a maintainer account through credential reuse and published malicious versions that exfiltrated environment variables, API keys, and database credentials to an attacker-controlled server. The compromised versions were live for approximately 48 hours before detection. Organizations using the package are advised to rotate all credentials that may have been exposed and audit their dependency trees. npm has revoked the compromised versions.",
    threatLevel: "high",
    category: "supply-chain",
    cves: ["CVE-2024-48901"],
    affectedProducts: ["npm ecosystem", "Node.js applications"],
    threatActors: [],
    industries: ["technology"],
    attackVector: "Supply Chain / Package Repository",
    source: "GitHub Security Advisory",
    sourceUrl: "https://github.com/advisories",
    publishedAt: "2024-10-11T22:00:00Z",
    updatedAt: "2024-10-12T14:00:00Z",
    discoveredAt: "2024-10-11T18:00:00Z",
    verified: true,
    verifiedBy: ["GitHub", "npm Security"],
    tags: ["supply-chain", "npm", "credential-theft"],
    region: "Global",
  },
  {
    id: "6",
    title: "Chinese APT Group Volt Typhoon Targets US Water Infrastructure",
    slug: "volt-typhoon-us-water-infrastructure",
    summary:
      "Volt Typhoon has been observed targeting US water treatment facilities using living-off-the-land techniques, pre-positioning for potential disruption of critical infrastructure.",
    content:
      "A joint advisory from CISA, NSA, and FBI warns that Chinese state-sponsored threat actor Volt Typhoon has expanded its targeting to include US water and wastewater treatment facilities. The group uses living-off-the-land binaries (LOLBins) to maintain persistent access while evading detection. Intelligence suggests the activity is focused on pre-positioning for potential disruptive attacks rather than immediate espionage. Affected facilities have been notified and are working with federal agencies to remediate the intrusions.",
    threatLevel: "high",
    category: "apt",
    cves: [],
    affectedProducts: ["SCADA Systems", "Operational Technology Networks", "Windows Server"],
    threatActors: ["Volt Typhoon"],
    industries: ["energy", "government"],
    attackVector: "Living-off-the-Land / VPN Exploitation",
    source: "CISA / NSA / FBI Joint Advisory",
    sourceUrl: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    publishedAt: "2024-10-10T15:00:00Z",
    updatedAt: "2024-10-11T10:00:00Z",
    discoveredAt: "2024-09-15T00:00:00Z",
    verified: true,
    verifiedBy: ["CISA", "NSA", "FBI"],
    tags: ["critical-infrastructure", "state-sponsored", "pre-positioning"],
    region: "United States",
  },
  {
    id: "7",
    title: "Ivanti Connect Secure Zero-Day Chain Allows Unauthenticated RCE",
    slug: "ivanti-connect-secure-zero-day-chain",
    summary:
      "Two chained zero-day vulnerabilities in Ivanti Connect Secure VPN appliances enable unauthenticated remote code execution. Mass exploitation detected affecting thousands of organizations.",
    content:
      "Ivanti has disclosed two zero-day vulnerabilities in Connect Secure (formerly Pulse Secure) VPN appliances that, when chained together, allow unauthenticated attackers to execute arbitrary commands on affected devices. CVE-2024-21887 is a command injection vulnerability, and CVE-2024-21888 is an authentication bypass. Volexity and Mandiant have observed mass exploitation by multiple threat actors, including suspected Chinese state-sponsored groups. Ivanti has released mitigation guidance while permanent patches are being developed.",
    threatLevel: "critical",
    category: "zero-day",
    cves: ["CVE-2024-21887", "CVE-2024-21888"],
    affectedProducts: ["Ivanti Connect Secure", "Ivanti Policy Secure"],
    threatActors: ["UTA0178"],
    industries: ["government", "defense", "technology", "finance"],
    attackVector: "Network / VPN Appliance",
    source: "Mandiant / Volexity",
    sourceUrl: "https://www.mandiant.com/resources/blog",
    publishedAt: "2024-10-09T12:00:00Z",
    updatedAt: "2024-10-11T09:00:00Z",
    discoveredAt: "2024-10-01T00:00:00Z",
    exploitedAt: "2024-10-01T00:00:00Z",
    verified: true,
    verifiedBy: ["CISA", "Mandiant", "Volexity"],
    tags: ["zero-day", "vpn", "mass-exploitation"],
    region: "Global",
  },
  {
    id: "8",
    title: "Major US Financial Institution Discloses Breach Affecting 4.6M Customers",
    slug: "us-financial-institution-breach-4m",
    summary:
      "A top-10 US bank has disclosed a data breach impacting 4.6 million customers after attackers exploited a third-party file transfer vulnerability to exfiltrate sensitive financial data.",
    content:
      "A major US financial institution has disclosed that a data breach originating from the exploitation of a MOVEit Transfer vulnerability exposed personal and financial data of approximately 4.6 million customers. The compromised data includes names, Social Security numbers, account numbers, and transaction histories. The breach occurred in May 2024 but was only detected in August after law enforcement notification. The institution is offering credit monitoring services and has implemented additional security controls around file transfer operations.",
    threatLevel: "high",
    category: "data-breach",
    cves: ["CVE-2023-34362"],
    affectedProducts: ["MOVEit Transfer", "Progress Software"],
    threatActors: ["Cl0p"],
    industries: ["finance"],
    attackVector: "Web Application / File Transfer",
    source: "SEC Filing / Institution Disclosure",
    sourceUrl: "https://www.sec.gov/cgi-bin/browse-edgar",
    publishedAt: "2024-10-08T09:00:00Z",
    updatedAt: "2024-10-09T16:00:00Z",
    discoveredAt: "2024-08-15T00:00:00Z",
    exploitedAt: "2024-05-28T00:00:00Z",
    verified: true,
    verifiedBy: ["SEC", "FBI"],
    tags: ["data-breach", "financial", "moveit"],
    region: "United States",
  },
  {
    id: "9",
    title: "QakBot Malware Returns with Advanced Evasion After FBI Takedown",
    slug: "qakbot-malware-returns-advanced-evasion",
    summary:
      "QakBot malware has resurfaced with significantly enhanced anti-analysis and evasion capabilities, just months after the FBI-led takedown of its botnet infrastructure.",
    content:
      "Despite the FBI's successful takedown of the QakBot botnet infrastructure in August 2023, the malware has returned with a substantially redesigned codebase. The new variant features advanced sandbox detection, encrypted C2 communications using DNS-over-HTTPS, and a modular architecture that loads malicious components only in memory. Distribution is occurring through phishing campaigns leveraging hijacked email threads. The resurgence demonstrates the resilience of cybercriminal operations and the challenges of permanent disruption.",
    threatLevel: "medium",
    category: "malware",
    cves: [],
    affectedProducts: ["Windows 10/11", "Microsoft Office"],
    threatActors: [],
    industries: ["finance", "manufacturing", "technology"],
    attackVector: "Phishing / Email Thread Hijacking",
    source: "Zscaler ThreatLabz",
    sourceUrl: "https://www.zscaler.com/blogs/security-research",
    publishedAt: "2024-10-07T11:00:00Z",
    updatedAt: "2024-10-08T08:00:00Z",
    discoveredAt: "2024-10-03T00:00:00Z",
    verified: true,
    verifiedBy: ["Zscaler", "Microsoft"],
    tags: ["malware", "botnet", "evasion"],
    region: "Global",
  },
  {
    id: "10",
    title: "Google Chrome V8 Type Confusion Enables Sandbox Escape",
    slug: "chrome-v8-type-confusion-sandbox-escape",
    summary:
      "A type confusion vulnerability in Google Chrome's V8 JavaScript engine allows full sandbox escape and arbitrary code execution. Emergency update released.",
    content:
      "Google has released an emergency update for Chrome to address a critical type confusion vulnerability in the V8 JavaScript engine (CVE-2024-49123). The vulnerability allows an attacker to escape the Chrome sandbox and execute arbitrary code on the underlying system via a specially crafted web page. Google's Threat Analysis Group has confirmed the vulnerability is being exploited in targeted attacks against journalists and political dissidents. All Chromium-based browsers are affected and users should update immediately.",
    threatLevel: "high",
    category: "vulnerability",
    cves: ["CVE-2024-49123"],
    affectedProducts: ["Google Chrome", "Microsoft Edge", "Chromium-based browsers"],
    threatActors: [],
    industries: ["technology"],
    attackVector: "Web / Malicious Website",
    source: "Google Threat Analysis Group",
    sourceUrl: "https://blog.google/threat-analysis-group",
    publishedAt: "2024-10-06T20:00:00Z",
    updatedAt: "2024-10-07T10:00:00Z",
    discoveredAt: "2024-10-04T00:00:00Z",
    exploitedAt: "2024-10-04T00:00:00Z",
    patchedAt: "2024-10-06T00:00:00Z",
    verified: true,
    verifiedBy: ["Google TAG"],
    tags: ["browser", "sandbox-escape", "targeted-attacks"],
    region: "Global",
  },
  {
    id: "11",
    title: "BlackCat Ransomware Affiliates Pivot to New RaaS Platform 'Cicada3301'",
    slug: "blackcat-affiliates-cicada3301-raas",
    summary:
      "Former BlackCat/ALPHV ransomware affiliates have migrated to a new ransomware-as-a-service platform dubbed Cicada3301, featuring Rust-based payloads and advanced ESXi targeting.",
    content:
      "Following the exit scam by BlackCat/ALPHV operators in March 2024, former affiliates have regrouped under a new ransomware-as-a-service platform called Cicada3301. The platform features Rust-based ransomware payloads with specific modules for targeting VMware ESXi environments and Linux systems. Initial access is typically gained through exploitation of VPN appliances and phishing. At least 30 organizations across multiple sectors have been listed on the group's leak site in the past month.",
    threatLevel: "medium",
    category: "ransomware",
    cves: [],
    affectedProducts: ["VMware ESXi", "Linux Servers", "Windows Server"],
    threatActors: ["Cicada3301"],
    industries: ["manufacturing", "retail", "healthcare", "education"],
    attackVector: "VPN Exploitation / Phishing",
    source: "Group-IB Threat Intelligence",
    sourceUrl: "https://www.group-ib.com/blog",
    publishedAt: "2024-10-05T14:00:00Z",
    updatedAt: "2024-10-06T09:00:00Z",
    discoveredAt: "2024-09-20T00:00:00Z",
    verified: true,
    verifiedBy: ["Group-IB"],
    tags: ["ransomware", "raas", "esxi"],
    region: "Global",
  },
  {
    id: "12",
    title: "Critical SAP NetWeaver Flaw Exposes Enterprise Systems to Pre-Auth RCE",
    slug: "sap-netweaver-pre-auth-rce",
    summary:
      "A critical pre-authentication remote code execution vulnerability in SAP NetWeaver Application Server affects an estimated 50,000 enterprise systems worldwide.",
    content:
      "SAP has released an emergency patch for a critical vulnerability in NetWeaver Application Server (CVE-2024-50001) that allows unauthenticated attackers to execute arbitrary commands on affected systems. The vulnerability exists in the Internet Communication Manager (ICM) component and can be exploited via specially crafted HTTP requests. Given that SAP NetWeaver underpins critical business processes in many large enterprises, the potential impact is severe. SAP is urging customers to apply the patch immediately and recommends implementing additional network segmentation as a defense-in-depth measure.",
    threatLevel: "critical",
    category: "vulnerability",
    cves: ["CVE-2024-50001"],
    affectedProducts: ["SAP NetWeaver AS", "SAP S/4HANA", "SAP ERP"],
    threatActors: [],
    industries: ["manufacturing", "finance", "energy", "retail"],
    attackVector: "Network / HTTP",
    source: "SAP Security Response",
    sourceUrl: "https://support.sap.com/en/my-support/knowledge-base/security-notes-news.html",
    publishedAt: "2024-10-04T08:00:00Z",
    updatedAt: "2024-10-05T12:00:00Z",
    discoveredAt: "2024-09-25T00:00:00Z",
    patchedAt: "2024-10-04T00:00:00Z",
    verified: true,
    verifiedBy: ["SAP"],
    tags: ["enterprise", "pre-auth", "sap"],
    region: "Global",
  },
];

export const threatActors: ThreatActor[] = [
  {
    id: "apt29",
    name: "APT29",
    aliases: ["Cozy Bear", "The Dukes", "Midnight Blizzard"],
    origin: "Russia",
    description:
      "Russian state-sponsored threat actor associated with the SVR (Foreign Intelligence Service). Known for sophisticated phishing campaigns and supply chain attacks targeting government and diplomatic entities.",
    targetIndustries: ["government", "defense", "technology", "energy"],
    firstSeen: "2008",
    lastActive: "2024-10-14",
    ttps: [
      "Spear Phishing",
      "Supply Chain Compromise",
      "Cloud Service Exploitation",
      "Custom Backdoors",
      "Token Theft",
    ],
  },
  {
    id: "lockbit",
    name: "LockBit",
    aliases: ["LockBit Black", "LockBit 3.0", "LockBit 4.0"],
    origin: "Russia / Eastern Europe",
    description:
      "Prolific ransomware-as-a-service operation responsible for the highest volume of ransomware attacks globally. Known for rapid encryption, double extortion, and affiliate program.",
    targetIndustries: ["healthcare", "finance", "manufacturing", "government", "education"],
    firstSeen: "2019",
    lastActive: "2024-10-15",
    ttps: [
      "Ransomware-as-a-Service",
      "Double Extortion",
      "RDP Exploitation",
      "Phishing",
      "Intermittent Encryption",
    ],
  },
  {
    id: "volt-typhoon",
    name: "Volt Typhoon",
    aliases: ["BRONZE SILHOUETTE", "Vanguard Panda", "DEV-0391"],
    origin: "China",
    description:
      "Chinese state-sponsored threat actor focused on pre-positioning within US critical infrastructure. Notable for exclusive use of living-off-the-land techniques to avoid detection.",
    targetIndustries: ["energy", "telecommunications", "government", "manufacturing"],
    firstSeen: "2021",
    lastActive: "2024-10-10",
    ttps: [
      "Living-off-the-Land",
      "VPN Exploitation",
      "SOHO Router Compromise",
      "Credential Harvesting",
      "Long-term Persistence",
    ],
  },
  {
    id: "cl0p",
    name: "Cl0p",
    aliases: ["TA505", "FIN11"],
    origin: "Russia / Ukraine",
    description:
      "Financially motivated threat group known for large-scale data theft operations, particularly through exploitation of file transfer appliances (MOVEit, GoAnywhere, Accellion).",
    targetIndustries: ["finance", "healthcare", "government", "retail"],
    firstSeen: "2019",
    lastActive: "2024-10-08",
    ttps: [
      "Zero-Day Exploitation",
      "Mass Data Exfiltration",
      "File Transfer Appliance Targeting",
      "Extortion without Encryption",
    ],
  },
  {
    id: "unc3886",
    name: "UNC3886",
    aliases: [],
    origin: "China",
    description:
      "China-nexus espionage actor specializing in targeting network edge devices and virtualization platforms. Known for exploiting zero-days in Fortinet, VMware, and other network appliances.",
    targetIndustries: ["government", "defense", "telecommunications", "technology"],
    firstSeen: "2022",
    lastActive: "2024-10-12",
    ttps: [
      "Network Edge Exploitation",
      "Zero-Day Usage",
      "Firmware-level Persistence",
      "Hypervisor Targeting",
      "Custom Rootkits",
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByThreatLevel(level: string): Article[] {
  return articles.filter((a) => a.threatLevel === level);
}

export function getArticlesByIndustry(industry: string): Article[] {
  return articles.filter((a) => a.industries.includes(industry as Article["industries"][number]));
}

export function getThreatActorById(id: string): ThreatActor | undefined {
  return threatActors.find((a) => a.id === id);
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.cves.some((c) => c.toLowerCase().includes(q)) ||
      a.affectedProducts.some((p) => p.toLowerCase().includes(q)) ||
      a.threatActors.some((t) => t.toLowerCase().includes(q)) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  );
}
