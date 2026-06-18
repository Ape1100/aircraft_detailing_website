/** Royalty-free aircraft photos (Unsplash License — free for commercial use). */
export interface SampleBackground {
  id: string;
  label: string;
  url: string;
  credit: string;
}

export const SAMPLE_BACKGROUNDS: SampleBackground[] = [
  {
    id: "runway-golden-hour",
    label: "Golden-hour runway",
    url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80",
    credit: "Unsplash",
  },
  {
    id: "hangar-interior",
    label: "Hangar interior",
    url: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1920&q=80",
    credit: "Unsplash",
  },
  {
    id: "grass-field",
    label: "Grass field",
    url: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=1920&q=80",
    credit: "Unsplash",
  },
  {
    id: "wing-clouds",
    label: "Wing above clouds",
    url: "https://images.unsplash.com/photo-1439542098884-9b7595b5b1d1?auto=format&fit=crop&w=1920&q=80",
    credit: "Unsplash",
  },
];

export function getSampleBackgroundUrl(id: string | null): string | null {
  if (!id) return null;
  return SAMPLE_BACKGROUNDS.find((bg) => bg.id === id)?.url ?? null;
}
