import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Heart,
  Download,
  Sliders,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  RotateCcw,
  Palette,
  Camera,
  Layers,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LuminaImage, ImageFilters, DEFAULT_FILTERS, FILTER_PRESETS } from "../types";

interface ImagePreviewModalProps {
  image: LuminaImage;
  allImages: LuminaImage[];
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}

export default function ImagePreviewModal({
  image,
  allImages,
  isFavorite,
  onToggleFavorite,
  onClose,
  onNavigate
}: ImagePreviewModalProps) {
  // Filters state
  const [filters, setFilters] = useState<ImageFilters>({ ...DEFAULT_FILTERS });
  const [activePreset, setActivePreset] = useState<string>("original");

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Clipboard copy state
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Tab navigation for sidebar (Info vs Filters)
  const [activeTab, setActiveTab] = useState<"filters" | "info">("filters");

  // Reset filters when image changes
  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setActivePreset("original");
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [image.id]);

  const applyPreset = (presetId: string, presetFilters: ImageFilters) => {
    setFilters({ ...presetFilters });
    setActivePreset(presetId);
  };

  const handleFilterChange = (key: keyof ImageFilters, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setActivePreset("custom");
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setActivePreset("original");
  };

  // Build the CSS filter string
  const getFilterCSSString = () => {
    return `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturate}%)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
      hue-rotate(${filters.hueRotate}deg)
      blur(${filters.blur}px)
      invert(${filters.invert}%)
    `.trim().replace(/\s+/g, " ");
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) {
        setPan({ x: 0, y: 0 }); // reset pan when zoomed out
      }
      return next;
    });
  };

  // Panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    const nextX = e.clientX - dragStart.current.x;
    const nextY = e.clientY - dragStart.current.y;
    
    // Simple bounding box logic for pan based on zoom level
    const maxOffset = (zoom - 1) * 200;
    const boundedX = Math.max(Math.min(nextX, maxOffset), -maxOffset);
    const boundedY = Math.max(Math.min(nextY, maxOffset), -maxOffset);
    
    setPan({ x: boundedX, y: boundedY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Copy hex to clipboard
  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  // Export/Download styled image logic
  const handleDownloadImage = () => {
    // For local files we can just download the DataURL, or for Unsplash URLs we download directly
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `luminaq-${image.title.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic palette background to make sidebar colorful
  const primaryAccent = image.palette[1] || "#10B981";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-zinc-950/90 backdrop-blur-md overflow-hidden select-none" id="image-preview-modal-overlay">
      {/* Absolute Close Backdrop Area */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Container */}
      <div className="relative w-full h-full sm:max-w-6xl sm:h-[85vh] bg-zinc-900 border border-zinc-800/80 rounded-none sm:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_30px_70px_-10px_rgba(0,0,0,0.85)] z-10" id="preview-modal-container">
        
        {/* Navigation Arrows for rapid preview switching */}
        <button
          onClick={() => onNavigate("prev")}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer hidden md:flex"
          id="nav-arrow-prev"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => onNavigate("next")}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer hidden md:flex"
          id="nav-arrow-next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* 1. VISUAL CANVAS STAGE (LEFT SIDE) */}
        <div className="flex-1 bg-zinc-950 relative flex flex-col items-center justify-center min-h-[300px] md:min-h-0 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800/60" id="stage-left-panel">
          
          {/* Upper Action Overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <span className="bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-800/80 text-xs font-mono text-zinc-300 pointer-events-auto flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: primaryAccent }} />
              {image.category}
            </span>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 pointer-events-auto">
              {/* Zoom Out */}
              {zoom > 1 && (
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
              )}
              {/* Zoom Scale Badge */}
              <span className="bg-zinc-900/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800/80 text-[10px] font-mono text-zinc-400">
                {Math.round(zoom * 100)}%
              </span>
              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-all cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive Zoomable Image Viewport */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`w-full h-full flex items-center justify-center p-8 overflow-hidden select-none ${
              zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            }`}
            id="interactive-image-viewport"
          >
            <motion.div
              style={{
                x: pan.x,
                y: pan.y,
                scale: zoom,
              }}
              transition={isDragging ? { type: "just" } : { type: "spring", stiffness: 220, damping: 25 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={image.url}
                alt={image.title}
                referrerPolicy="no-referrer"
                style={{ filter: getFilterCSSString() }}
                className="max-w-full max-h-[50vh] md:max-h-[70vh] object-contain rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-zinc-800/40 pointer-events-none transition-all duration-100"
                id={`preview-canvas-${image.id}`}
              />
            </motion.div>
          </div>

          {/* Dynamic Floating Quick Navigation on mobile */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex md:hidden items-center justify-between pointer-events-none">
            <button
              onClick={() => onNavigate("prev")}
              className="p-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 pointer-events-auto"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono text-zinc-400">
              Swipe or tap arrows
            </span>
            <button
              onClick={() => onNavigate("next")}
              className="p-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 pointer-events-auto"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. SPECIFICATION & CONTROL PANEL (RIGHT SIDE) */}
        <div className="w-full md:w-[380px] bg-zinc-900 flex flex-col border-t md:border-t-0 border-zinc-800" id="stage-right-panel">
          
          {/* Header Metadata */}
          <div className="p-5 border-b border-zinc-800/60 flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Title & Artist</span>
              <h1 className="text-xl font-sans font-semibold tracking-tight text-white leading-tight mt-1 truncate max-w-[240px]">
                {image.title}
              </h1>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                by {image.artist}
              </p>
            </div>

            {/* Favorite & Close actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleFavorite(image.id)}
                className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isFavorite
                    ? "bg-red-950/30 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                    : "bg-zinc-800/50 border-zinc-700/60 text-zinc-400 hover:text-white"
                }`}
                title="Add to Favorites"
                id={`fav-btn-${image.id}`}
              >
                <Heart className={`h-4.5 w-4.5 ${isFavorite ? "fill-red-500" : ""}`} />
              </button>
              
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/60 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Close Panel"
                id="close-modal-top-right"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-zinc-800/60 text-xs font-mono font-medium">
            <button
              onClick={() => setActiveTab("filters")}
              className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === "filters"
                  ? "text-emerald-400 border-emerald-400 bg-emerald-950/5"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
              id="tab-filters"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Filters & Presets</span>
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === "info"
                  ? "text-emerald-400 border-emerald-400 bg-emerald-950/5"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
              id="tab-info"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Image Diagnostics</span>
            </button>
          </div>

          {/* Dynamic Tab Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
            {activeTab === "filters" ? (
              // FILTERS TAB
              <div className="space-y-6" id="filters-tab-body">
                
                {/* 1. Presets */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Aesthetic Presets</span>
                    {activePreset !== "original" && (
                      <button
                        onClick={resetFilters}
                        className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center space-x-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset All</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {FILTER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.id, preset.filters)}
                        className={`py-2 px-1.5 rounded-lg border text-left transition-all ${
                          activePreset === preset.id
                            ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-400 font-semibold"
                            : "bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                        }`}
                        id={`preset-btn-${preset.id}`}
                      >
                        <div className="text-[10px] font-mono truncate">{preset.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Interactive Sliders */}
                <div className="space-y-4 pt-2 border-t border-zinc-800/40">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Custom Sliders</span>

                  {/* Brightness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Brightness</span>
                      <span className="text-zinc-500">{filters.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={filters.brightness}
                      onChange={(e) => handleFilterChange("brightness", Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Contrast</span>
                      <span className="text-zinc-500">{filters.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={filters.contrast}
                      onChange={(e) => handleFilterChange("contrast", Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Saturation</span>
                      <span className="text-zinc-500">{filters.saturate}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.saturate}
                      onChange={(e) => handleFilterChange("saturate", Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Sepia */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Sepia Tone</span>
                      <span className="text-zinc-500">{filters.sepia}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.sepia}
                      onChange={(e) => handleFilterChange("sepia", Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Hue Rotate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Hue Rotation</span>
                      <span className="text-zinc-500">{filters.hueRotate}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={filters.hueRotate}
                      onChange={(e) => handleFilterChange("hueRotate", Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Blur Softness</span>
                      <span className="text-zinc-500">{filters.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={filters.blur}
                      onChange={(e) => handleFilterChange("blur", Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // IMAGE DIAGNOSTICS & COLOR PALETTE
              <div className="space-y-6" id="info-tab-body">
                
                {/* Palette Extractor */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block flex items-center">
                    <Palette className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Lumina Swatch Palette
                  </span>
                  
                  <div className="flex items-center space-x-2 pt-1">
                    {image.palette.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => copyHex(color)}
                        className="group relative flex-1 aspect-square rounded-xl border border-zinc-800/80 shadow transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
                        style={{ backgroundColor: color }}
                        title="Click to copy Hex Code"
                        id={`palette-color-${index}`}
                      >
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl transition-opacity">
                          {copiedColor === color ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-white" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-zinc-500 font-mono text-center pt-1">
                    {copiedColor ? (
                      <span className="text-emerald-400 font-semibold">Hex Code {copiedColor} copied to clipboard!</span>
                    ) : (
                      <span>Click any color tile to copy hex code</span>
                    )}
                  </p>
                </div>

                {/* Technical diagnostics (EXIF) */}
                <div className="space-y-3 pt-3 border-t border-zinc-800/40">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block flex items-center">
                    <Camera className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> EXIF Data Parameters
                  </span>

                  <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 space-y-3 font-mono text-xs">
                    {/* Camera */}
                    <div className="flex justify-between items-start">
                      <span className="text-zinc-500">Camera</span>
                      <span className="text-zinc-300 text-right font-sans font-medium">{image.exif.camera}</span>
                    </div>

                    {/* Lens */}
                    <div className="flex justify-between items-start">
                      <span className="text-zinc-500">Lens Type</span>
                      <span className="text-zinc-300 text-right font-sans">{image.exif.lens}</span>
                    </div>

                    {/* Exposure settings */}
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Parameters</span>
                      <span className="text-zinc-300 font-mono font-medium text-[11px]">{image.exif.settings}</span>
                    </div>

                    {/* File info */}
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Scale</span>
                      <span className="text-zinc-300 font-mono">{image.exif.dimensions}</span>
                    </div>

                    {/* Geography */}
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                      <span className="text-zinc-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-red-400" /> Origin
                      </span>
                      <span className="text-zinc-400 text-right truncate font-sans text-[11px]">{image.exif.location}</span>
                    </div>
                  </div>
                </div>

                {/* Tags section */}
                <div className="space-y-2 pt-3 border-t border-zinc-800/40">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">Visual Classification</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {image.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-zinc-800/60 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-default"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Core Footer Actions */}
          <div className="p-5 border-t border-zinc-800/60 bg-zinc-900/60 flex items-center justify-between space-x-3">
            {/* Quick Share Info */}
            <div className="text-[10px] text-zinc-500 font-mono leading-normal">
              Luminaq Engine v1.2<br />
              Secure Client Sandbox
            </div>

            {/* Export Image Button */}
            <button
              onClick={handleDownloadImage}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-sans font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.35)] cursor-pointer"
              title="Download image in high definition"
              id="export-image-action"
            >
              <Download className="h-4 w-4" />
              <span>Download Raw</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
