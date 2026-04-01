const STORAGE_KEY = "cyberintel-saved";

export function getSavedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isSaved(slug: string): boolean {
  return getSavedSlugs().includes(slug);
}

export function toggleSaved(slug: string): boolean {
  const saved = getSavedSlugs();
  const index = saved.indexOf(slug);
  if (index >= 0) {
    saved.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return false;
  } else {
    saved.unshift(slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return true;
  }
}
