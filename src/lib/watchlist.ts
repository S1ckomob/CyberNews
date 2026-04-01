const STORAGE_KEY = "cyberintel-watchlist";

export interface Watchlist {
  products: string[];
  actors: string[];
  cves: string[];
}

const DEFAULT_WATCHLIST: Watchlist = { products: [], actors: [], cves: [] };

export function getWatchlist(): Watchlist {
  if (typeof window === "undefined") return DEFAULT_WATCHLIST;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_WATCHLIST;
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

export function saveWatchlist(watchlist: Watchlist) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
}

export function addToWatchlist(type: keyof Watchlist, value: string) {
  const wl = getWatchlist();
  if (!wl[type].includes(value)) {
    wl[type].push(value);
    saveWatchlist(wl);
  }
  return wl;
}

export function removeFromWatchlist(type: keyof Watchlist, value: string) {
  const wl = getWatchlist();
  wl[type] = wl[type].filter((v) => v !== value);
  saveWatchlist(wl);
  return wl;
}
