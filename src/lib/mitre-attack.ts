export const MITRE_TACTICS = [
  { id: "TA0043", name: "Reconnaissance", short: "Recon" },
  { id: "TA0042", name: "Resource Development", short: "Res Dev" },
  { id: "TA0001", name: "Initial Access", short: "Init Access" },
  { id: "TA0002", name: "Execution", short: "Execution" },
  { id: "TA0003", name: "Persistence", short: "Persistence" },
  { id: "TA0004", name: "Privilege Escalation", short: "Priv Esc" },
  { id: "TA0005", name: "Defense Evasion", short: "Def Evasion" },
  { id: "TA0006", name: "Credential Access", short: "Cred Access" },
  { id: "TA0007", name: "Discovery", short: "Discovery" },
  { id: "TA0008", name: "Lateral Movement", short: "Lat Move" },
  { id: "TA0009", name: "Collection", short: "Collection" },
  { id: "TA0011", name: "Command and Control", short: "C2" },
  { id: "TA0010", name: "Exfiltration", short: "Exfil" },
  { id: "TA0040", name: "Impact", short: "Impact" },
] as const;

const TTP_TO_TACTICS: Record<string, string[]> = {
  // Reconnaissance
  "reconnaissance": ["TA0043"],
  "scanning": ["TA0043"],
  "target reconnaissance": ["TA0043"],
  // Resource Development
  "ai-generated lures": ["TA0042"],
  "ai-assisted targeting": ["TA0042"],
  // Initial Access
  "spear phishing": ["TA0001"],
  "phishing": ["TA0001"],
  "supply chain compromise": ["TA0001"],
  "supply chain": ["TA0001"],
  "vpn exploitation": ["TA0001"],
  "rdp exploitation": ["TA0001"],
  "social engineering": ["TA0001"],
  "sim swapping": ["TA0001"],
  "mfa fatigue": ["TA0001"],
  "help desk manipulation": ["TA0001"],
  "oauth consent phishing": ["TA0001"],
  "oauth abuse": ["TA0001"],
  "password spray": ["TA0001"],
  "zero-day exploitation": ["TA0001"],
  "zero-day usage": ["TA0001"],
  "network edge exploitation": ["TA0001"],
  "telecom infrastructure exploitation": ["TA0001"],
  "iot exploitation": ["TA0001"],
  "soho router compromise": ["TA0001"],
  "soho device exploitation": ["TA0001"],
  "watering hole": ["TA0001"],
  "watering hole attacks": ["TA0001"],
  // Execution
  "custom malware": ["TA0002"],
  "ransomware": ["TA0002", "TA0040"],
  "ransomware-as-a-service": ["TA0002", "TA0040"],
  "automated lateral movement": ["TA0002", "TA0008"],
  "wiper deployment": ["TA0002", "TA0040"],
  "destructive malware": ["TA0002", "TA0040"],
  // Persistence
  "custom backdoors": ["TA0003"],
  "firmware persistence": ["TA0003"],
  "firmware-level persistence": ["TA0003"],
  "long-term persistence": ["TA0003"],
  "custom rootkits": ["TA0003"],
  "kernel-level rootkits": ["TA0003"],
  "router implants": ["TA0003"],
  "web shell deployment": ["TA0003"],
  // Privilege Escalation
  "identity provider abuse": ["TA0004"],
  // Defense Evasion
  "living-off-the-land": ["TA0005"],
  "intermittent encryption": ["TA0005"],
  "esxi encryption": ["TA0005"],
  // Credential Access
  "credential harvesting": ["TA0006"],
  "token theft": ["TA0006"],
  "lawful intercept abuse": ["TA0006"],
  // Discovery
  "automated exploitation": ["TA0007"],
  // Lateral Movement
  "cloud service exploitation": ["TA0008"],
  "cloud exploitation": ["TA0008"],
  "ot network pivoting": ["TA0008"],
  "msp targeting": ["TA0008"],
  // Collection
  "mass data exfiltration": ["TA0009", "TA0010"],
  "data exfiltration": ["TA0009", "TA0010"],
  // C2
  "proxy networks": ["TA0011"],
  "iot botnet operations": ["TA0011"],
  "hypervisor targeting": ["TA0011"],
  // Exfiltration
  "file transfer appliance targeting": ["TA0010"],
  "file transfer targeting": ["TA0010"],
  "extortion without encryption": ["TA0010", "TA0040"],
  // Impact
  "double extortion": ["TA0040"],
  "triple extortion": ["TA0040"],
  "ics/scada attacks": ["TA0040"],
  "defi exploitation": ["TA0040"],
  "cryptocurrency theft": ["TA0040"],
  "sec reporting abuse": ["TA0040"],
};

export function mapTtpsToTactics(ttps: string[]): Set<string> {
  const tactics = new Set<string>();
  for (const ttp of ttps) {
    const key = ttp.toLowerCase();
    // Exact match
    if (TTP_TO_TACTICS[key]) {
      TTP_TO_TACTICS[key].forEach((t) => tactics.add(t));
      continue;
    }
    // Partial match
    for (const [pattern, tacticIds] of Object.entries(TTP_TO_TACTICS)) {
      if (key.includes(pattern) || pattern.includes(key)) {
        tacticIds.forEach((t) => tactics.add(t));
      }
    }
  }
  return tactics;
}
