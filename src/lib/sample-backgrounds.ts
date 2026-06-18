/** Royalty-free aircraft photos (Unsplash License — free for commercial use). */
export interface SampleBackground {
  id: string;
  label: string;
  /** Unsplash photo path, e.g. photo-1734750358398-917f1da67c1f */
  photoPath: string;
  credit: string;
  description?: string;
}

/** Default hero — Gulfstream on the ramp at Aspen/Pitkin County Airport. */
export const DEFAULT_SAMPLE_ID = "executive-jet-ramp";

const HD_PARAMS = "auto=format&fit=crop&w=2560&q=90";

export function buildBackgroundUrl(photoPath: string): string {
  return `https://images.unsplash.com/${photoPath}?${HD_PARAMS}`;
}

export const SAMPLE_BACKGROUNDS: SampleBackground[] = [
  {
    id: DEFAULT_SAMPLE_ID,
    label: "Executive jet on ramp",
    photoPath: "photo-1734750358398-917f1da67c1f",
    credit: "Unsplash",
    description: "Gulfstream private jet, Aspen/Pitkin County Airport",
  },
  {
    id: "g600-aspen-ramp",
    label: "Gulfstream G600 on ramp",
    photoPath: "photo-1767491629887-6fbe6eadf47f",
    credit: "Unsplash",
    description: "Gulfstream G600, Aspen, CO",
  },
  {
    id: "fbo-ramp-line",
    label: "Private jets at FBO",
    photoPath: "photo-1767491629923-009ffdc395d8",
    credit: "Unsplash",
    description: "Private jets on tarmac, Aspen",
  },
  {
    id: "runway-golden-hour",
    label: "Golden-hour runway",
    photoPath: "photo-1436491865332-7a61a109cc05",
    credit: "Unsplash",
  },
  {
    id: "hangar-interior",
    label: "Hangar interior",
    photoPath: "photo-1540962351504-03099e0a754b",
    credit: "Unsplash",
  },
  {
    id: "wing-clouds",
    label: "Wing above clouds",
    photoPath: "photo-1439542098884-9b7595b5b1d1",
    credit: "Unsplash",
  },
];

export function getSampleBackgroundUrl(id: string | null): string | null {
  if (!id) return null;
  const sample = SAMPLE_BACKGROUNDS.find((bg) => bg.id === id);
  if (!sample) return null;
  return buildBackgroundUrl(sample.photoPath);
}

export const DEFAULT_HERO_BACKGROUND_URL = buildBackgroundUrl(
  SAMPLE_BACKGROUNDS.find((bg) => bg.id === DEFAULT_SAMPLE_ID)!.photoPath
);
