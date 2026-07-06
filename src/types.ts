export interface EXIFData {
  camera: string;
  lens: string;
  settings: string;
  dimensions: string;
  location: string;
}

export interface LuminaImage {
  id: string;
  title: string;
  artist: string;
  url: string;
  category: string;
  aspectRatio: string;
  exif: EXIFData;
  palette: string[];
  tags: string[];
  isUserUploaded?: boolean;
}

export interface ImageFilters {
  brightness: number; // 0 to 200 (100 is default)
  contrast: number;   // 0 to 200 (100 is default)
  saturate: number;   // 0 to 200 (100 is default)
  grayscale: number;  // 0 to 100 (0 is default)
  sepia: number;      // 0 to 100 (0 is default)
  hueRotate: number;  // 0 to 360 (0 is default)
  blur: number;       // 0 to 20 (0 is default)
  invert: number;     // 0 to 100 (0 is default)
}

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  blur: 0,
  invert: 0,
};

export interface FilterPreset {
  name: string;
  id: string;
  filters: ImageFilters;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    name: "Original",
    id: "original",
    filters: DEFAULT_FILTERS,
  },
  {
    name: "Cyberpunk",
    id: "cyberpunk",
    filters: {
      brightness: 110,
      contrast: 130,
      saturate: 180,
      grayscale: 0,
      sepia: 0,
      hueRotate: 310,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: "Vintage Film",
    id: "vintage",
    filters: {
      brightness: 95,
      contrast: 90,
      saturate: 85,
      grayscale: 0,
      sepia: 35,
      hueRotate: 0,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: "Emerald Glow",
    id: "emerald",
    filters: {
      brightness: 105,
      contrast: 115,
      saturate: 120,
      grayscale: 0,
      sepia: 10,
      hueRotate: 120,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: "Noir Classic",
    id: "noir",
    filters: {
      brightness: 90,
      contrast: 140,
      saturate: 0,
      grayscale: 100,
      sepia: 0,
      hueRotate: 0,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: "Dreamy Gold",
    id: "gold",
    filters: {
      brightness: 115,
      contrast: 105,
      saturate: 140,
      grayscale: 0,
      sepia: 25,
      hueRotate: 35,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: "Futuristic Invert",
    id: "futuristic_invert",
    filters: {
      brightness: 120,
      contrast: 120,
      saturate: 150,
      grayscale: 0,
      sepia: 0,
      hueRotate: 180,
      blur: 0,
      invert: 100,
    },
  }
];
