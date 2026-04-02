/**
 * Comprehensive list of known threat actors for article tagging and user suggestions.
 * Grouped by attribution/origin for display purposes.
 * Names must match exactly how they appear in threat intelligence reporting.
 */

export const THREAT_ACTOR_GROUPS = [
  {
    label: "Russia",
    actors: [
      "APT28", "APT29", "Sandworm", "Turla", "Gamaredon",
      "Star Blizzard", "Midnight Blizzard", "Ember Bear",
      "Nobelium", "Seashell Blizzard", "Cadet Blizzard",
      "UNC2589", "UNC3886", "EvilCorp", "Conti",
    ],
  },
  {
    label: "China",
    actors: [
      "Volt Typhoon", "Salt Typhoon", "Flax Typhoon", "Brass Typhoon",
      "APT1", "APT3", "APT10", "APT27", "APT31", "APT40", "APT41",
      "Mustang Panda", "Winnti", "Hafnium", "Storm-0558",
      "BackdoorDiplomacy", "Gallium", "Chromium",
      "Earth Lusca", "RedHotel", "Charcoal Typhoon",
    ],
  },
  {
    label: "North Korea",
    actors: [
      "Lazarus", "Lazarus Group", "Kimsuky", "Andariel",
      "BlueNoroff", "ScarCruft", "APT37", "APT38", "APT43",
      "Diamond Sleet", "Jade Sleet", "Citrine Sleet",
      "TraderTraitor", "UNC4899",
    ],
  },
  {
    label: "Iran",
    actors: [
      "Charming Kitten", "MuddyWater", "APT33", "APT34", "APT35", "APT42",
      "Mint Sandstorm", "Peach Sandstorm", "Cotton Sandstorm",
      "OilRig", "Lyceum", "Moses Staff", "Agrius",
      "Imperial Kitten", "Scarred Manticore",
    ],
  },
  {
    label: "Ransomware",
    actors: [
      "LockBit", "BlackCat", "ALPHV", "Cl0p", "Black Basta",
      "Rhysida", "Medusa", "Play", "RansomHub", "Akira",
      "Royal", "Vice Society", "BianLian", "8Base",
      "Hunters International", "INC Ransom", "Cactus",
      "BlackSuit", "Qilin", "DragonForce", "RagnarLocker",
      "Hive", "Cuba", "Trigona", "NoEscape", "Snatch",
      "Mallox", "Phobos", "BlackByte",
    ],
  },
  {
    label: "Cybercrime / Access Brokers",
    actors: [
      "Scattered Spider", "FIN7", "FIN11", "FIN12",
      "Lapsus$", "Octo Tempest", "Storm-0501", "Storm-1567",
      "UNC5537", "ShinyHunters", "IntelBroker",
      "Exotic Lily", "DEV-0569",
    ],
  },
  {
    label: "Hacktivism",
    actors: [
      "NoName057", "KillNet", "Anonymous Sudan",
      "Cyber Army of Russia", "IT Army of Ukraine",
      "GhostSec", "SiegedSec", "CyberVolk",
    ],
  },
] as const;

/** Flat list of all actor names for text matching */
export const ALL_THREAT_ACTORS: string[] = THREAT_ACTOR_GROUPS.flatMap((g) =>
  g.actors.map((a) => a)
);

/** Top suggested actors for UI (most active / commonly tracked) */
export const SUGGESTED_ACTORS = [
  // State-sponsored
  "APT29", "APT28", "Lazarus Group", "Volt Typhoon", "Salt Typhoon",
  "Sandworm", "Kimsuky", "APT41", "Charming Kitten", "MuddyWater",
  "Turla", "Mustang Panda", "APT42", "Flax Typhoon",
  // Ransomware
  "LockBit", "Cl0p", "BlackCat", "Black Basta", "RansomHub",
  "Akira", "Rhysida", "Medusa", "Play", "Hunters International",
  // Cybercrime
  "Scattered Spider", "FIN7", "IntelBroker", "ShinyHunters",
  // Hacktivism
  "NoName057", "Anonymous Sudan",
];
