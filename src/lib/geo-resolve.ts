import type { Article } from "./types";

// Precise coordinates: longitude, latitude → projected to 0-1000 x 0-500 equirectangular
// x = (lon + 180) * (1000/360), y = (90 - lat) * (500/180)
interface MapPoint {
  x: number;
  y: number;
  label: string;
  id: string;
}

// Major cities/capitals as anchor points
const GEO_POINTS: Record<string, MapPoint> = {
  // North America
  "washington":   { x: 283, y: 164, label: "Washington DC", id: "washington" },
  "new-york":     { x: 290, y: 159, label: "New York", id: "new-york" },
  "san-francisco":{ x: 228, y: 163, label: "San Francisco", id: "san-francisco" },
  "toronto":      { x: 280, y: 152, label: "Toronto", id: "toronto" },
  // Europe
  "london":       { x: 500, y: 143, label: "London", id: "london" },
  "brussels":     { x: 510, y: 140, label: "Brussels", id: "brussels" },
  "berlin":       { x: 519, y: 137, label: "Berlin", id: "berlin" },
  "paris":        { x: 506, y: 143, label: "Paris", id: "paris" },
  "kyiv":         { x: 585, y: 139, label: "Kyiv", id: "kyiv" },
  "tallinn":      { x: 574, y: 126, label: "Tallinn", id: "tallinn" },
  "warsaw":       { x: 553, y: 137, label: "Warsaw", id: "warsaw" },
  // Asia
  "beijing":      { x: 821, y: 162, label: "Beijing", id: "beijing" },
  "tokyo":        { x: 889, y: 164, label: "Tokyo", id: "tokyo" },
  "seoul":        { x: 852, y: 163, label: "Seoul", id: "seoul" },
  "taipei":       { x: 838, y: 182, label: "Taipei", id: "taipei" },
  "mumbai":       { x: 700, y: 219, label: "Mumbai", id: "mumbai" },
  "singapore":    { x: 799, y: 247, label: "Singapore", id: "singapore" },
  // Middle East
  "tel-aviv":     { x: 597, y: 196, label: "Tel Aviv", id: "tel-aviv" },
  "riyadh":       { x: 624, y: 210, label: "Riyadh", id: "riyadh" },
  "tehran":       { x: 643, y: 185, label: "Tehran", id: "tehran" },
  // Other
  "moscow":       { x: 604, y: 130, label: "Moscow", id: "moscow" },
  "canberra":     { x: 917, y: 364, label: "Canberra", id: "canberra" },
  "sao-paulo":    { x: 370, y: 318, label: "São Paulo", id: "sao-paulo" },
  "lagos":        { x: 508, y: 243, label: "Lagos", id: "lagos" },
  "johannesburg": { x: 545, y: 340, label: "Johannesburg", id: "johannesburg" },
};

// Map vague regions to specific points
const REGION_MAPPING: Record<string, string[]> = {
  "Global": ["washington", "london", "beijing", "tokyo", "mumbai", "sao-paulo"],
  "United States": ["washington"],
  "North America": ["washington", "toronto"],
  "North America / Europe": ["washington", "london", "berlin"],
  "Europe": ["london", "berlin", "paris"],
  "Europe / NATO": ["brussels", "london", "berlin", "warsaw"],
  "Europe / Global": ["london", "berlin", "washington", "tokyo"],
  "United Kingdom": ["london"],
  "Ukraine": ["kyiv"],
  "Spain / United States": ["washington", "paris"],
  "Russia": ["moscow"],
  "China": ["beijing"],
  "Australia": ["canberra"],
  "Middle East": ["tel-aviv", "riyadh"],
  "Asia": ["beijing", "tokyo", "singapore"],
  "South America": ["sao-paulo"],
  "Africa": ["lagos", "johannesburg"],
  "Allied Nations": ["washington", "london", "tokyo", "canberra"],
  "United States / Allied Nations": ["washington", "london", "tokyo"],
};

// Keyword-based resolution for "Global" articles
const PRODUCT_GEO_HINTS: Record<string, string[]> = {
  "fortinet": ["washington", "london", "tokyo"],
  "fortigate": ["washington", "london", "tokyo"],
  "cisco": ["san-francisco", "london", "tokyo"],
  "palo alto": ["san-francisco", "london"],
  "microsoft": ["washington", "london", "berlin", "tokyo"],
  "windows": ["washington", "london", "tokyo"],
  "chrome": ["san-francisco", "london", "tokyo", "mumbai"],
  "linux": ["san-francisco", "berlin", "tokyo"],
  "vmware": ["san-francisco", "london", "tokyo"],
  "sonicwall": ["washington", "london"],
  "ivanti": ["washington", "london"],
  "juniper": ["san-francisco", "london", "tokyo"],
  "sap": ["berlin", "washington"],
  "wordpress": ["san-francisco", "london", "sao-paulo"],
  "jenkins": ["san-francisco", "london"],
  "github": ["san-francisco"],
  "pypi": ["san-francisco", "london", "berlin"],
  "npm": ["san-francisco", "london"],
  "apple": ["san-francisco", "london", "tokyo"],
};

export interface ResolvedThreat {
  point: MapPoint;
  article: Article;
}

export function resolveArticleLocations(articles: Article[]): ResolvedThreat[] {
  const results: ResolvedThreat[] = [];

  for (const article of articles) {
    const region = article.region || "Global";
    let pointIds: string[] = [];

    // First try direct region mapping
    if (region !== "Global" && REGION_MAPPING[region]) {
      pointIds = REGION_MAPPING[region];
    } else {
      // For "Global" articles, try to infer from products/title
      const text = `${article.title} ${article.affectedProducts.join(" ")}`.toLowerCase();
      for (const [keyword, geos] of Object.entries(PRODUCT_GEO_HINTS)) {
        if (text.includes(keyword)) {
          pointIds = [...new Set([...pointIds, ...geos])];
        }
      }

      // Fallback: use the default Global spread
      if (pointIds.length === 0) {
        pointIds = REGION_MAPPING["Global"];
      }
    }

    // Create a threat entry for each resolved point
    for (const pointId of pointIds) {
      const point = GEO_POINTS[pointId];
      if (point) {
        results.push({ point, article });
      }
    }
  }

  return results;
}

// Aggregate threats by point for rendering
export interface AggregatedPoint {
  point: MapPoint;
  count: number;
  maxLevel: string;
  articles: Article[];
}

export function aggregateByPoint(threats: ResolvedThreat[]): AggregatedPoint[] {
  const map = new Map<string, AggregatedPoint>();
  const levels = ["critical", "high", "medium", "low"];

  for (const t of threats) {
    const existing = map.get(t.point.id);
    if (existing) {
      existing.count++;
      existing.articles.push(t.article);
      if (levels.indexOf(t.article.threatLevel) < levels.indexOf(existing.maxLevel)) {
        existing.maxLevel = t.article.threatLevel;
      }
    } else {
      map.set(t.point.id, {
        point: t.point,
        count: 1,
        maxLevel: t.article.threatLevel,
        articles: [t.article],
      });
    }
  }

  return Array.from(map.values());
}
