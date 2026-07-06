/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Heart,
  Search,
  Grid,
  LayoutGrid,
  List,
  Eye,
  Info,
  Layers,
  Upload,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  Trash2,
  FolderHeart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CURATED_IMAGES } from "./data";
import { LuminaImage, DEFAULT_FILTERS } from "./types";
import ImagePreviewModal from "./components/ImagePreviewModal";
import SlideshowPlayer from "./components/SlideshowPlayer";
import UploadZone from "./components/UploadZone";

export default function App() {
  // Master image list, combining curated and user uploaded ones
  const [images, setImages] = useState<LuminaImage[]>(CURATED_IMAGES);
  
  // States
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [layoutMode, setLayoutMode] = useState<"grid" | "masonry" | "list">("masonry");
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  // Time state for visual workspace clock (Aesthetic utility)
  const [currentTime, setCurrentTime] = useState("");

  // Hydrate favorites and user uploads from localStorage on initial load
  useEffect(() => {
    // 1. Favorites
    const savedFavs = localStorage.getItem("luminaq_favorites");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    // 2. User uploaded images
    const savedUploads = localStorage.getItem("luminaq_user_uploads");
    if (savedUploads) {
      try {
        const parsedUploads = JSON.parse(savedUploads) as LuminaImage[];
        setImages((prev) => [...prev, ...parsedUploads]);
      } catch (e) {
        console.error("Failed to parse local uploads", e);
      }
    }

    // 3. Time trigger
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Favorite Toggling
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const isAlreadyFav = prev.includes(id);
      const updated = isAlreadyFav ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem("luminaq_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  // Handle New Uploads
  const handleNewUpload = (newImage: LuminaImage) => {
    setImages((prev) => {
      const updated = [...prev, newImage];
      // Save only user-uploaded items to localStorage
      const userUploadedOnly = updated.filter((img) => img.isUserUploaded);
      try {
        localStorage.setItem("luminaq_user_uploads", JSON.stringify(userUploadedOnly));
      } catch (err) {
        alert("Image uploaded successfully to session, but was too large to store in local browser storage securely. Keep size under 2MB for storage.");
      }
      return updated;
    });
    // Open preview instantly!
    setSelectedImageId(newImage.id);
  };

  // Handle Image Deletion (User uploads only)
  const handleDeleteImage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent modal opening
    if (confirm("Are you sure you want to remove this uploaded image?")) {
      setImages((prev) => {
        const updated = prev.filter((img) => img.id !== id);
        const userUploadedOnly = updated.filter((img) => img.isUserUploaded);
        localStorage.setItem("luminaq_user_uploads", JSON.stringify(userUploadedOnly));
        return updated;
      });
      // Clear favorite if favorited
      if (favorites.includes(id)) {
        setFavorites((prev) => {
          const updated = prev.filter((item) => item !== id);
          localStorage.setItem("luminaq_favorites", JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

  // Filter Categories list
  const categories = ["All", "Cyberpunk", "Architecture", "Nature", "Abstract", "My Uploads", "Favorites"];

  // Perform filtration based on category & search
  const filteredImages = images.filter((img) => {
    // 1. Category check
    if (activeCategory === "My Uploads") {
      if (!img.isUserUploaded) return false;
    } else if (activeCategory === "Favorites") {
      if (!favorites.includes(img.id)) return false;
    } else if (activeCategory !== "All") {
      if (img.category !== activeCategory) return false;
    }

    // 2. Search check
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle = img.title.toLowerCase().includes(q);
      const matchArtist = img.artist.toLowerCase().includes(q);
      const matchTags = img.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchTitle || matchArtist || matchTags;
    }

    return true;
  });

  // Hotkey Navigation Support inside Preview Modal
  const currentSelectedIndex = filteredImages.findIndex((img) => img.id === selectedImageId);
  const selectedImage = filteredImages[currentSelectedIndex];

  const handleNavigateImage = (direction: "prev" | "next") => {
    if (filteredImages.length <= 1) return;
    let nextIndex = currentSelectedIndex;
    if (direction === "prev") {
      nextIndex = currentSelectedIndex === 0 ? filteredImages.length - 1 : currentSelectedIndex - 1;
    } else {
      nextIndex = (currentSelectedIndex + 1) % filteredImages.length;
    }
    setSelectedImageId(filteredImages[nextIndex].id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImageId) return;
      if (e.key === "ArrowLeft") {
        handleNavigateImage("prev");
      } else if (e.key === "ArrowRight") {
        handleNavigateImage("next");
      } else if (e.key === "Escape") {
        setSelectedImageId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageId, currentSelectedIndex, filteredImages]);

  // Launch Cinematic Slideshow
  const startSlideshow = (index = 0) => {
    if (filteredImages.length === 0) return;
    setSlideshowIndex(index);
    setIsSlideshowActive(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-400" id="luminaq-app-root">
      
      {/* 1. TOP AESTHETIC METADATA HEADER */}
      <header className="border-b border-zinc-900 bg-zinc-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0" id="luminaq-navbar">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/20">
            <Sparkles className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-sans font-bold text-lg tracking-tight text-white">Luminaq</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold uppercase tracking-wider">
                Art Sandbox
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              Curate, edit, diagnostics analysis, and visual palette extractor
            </p>
          </div>
        </div>

        {/* Diagnostic Status Indicators */}
        <div className="flex items-center space-x-6">
          {/* Aesthetic Workspace Clock */}
          <div className="hidden lg:flex items-center space-x-2 font-mono text-xs text-zinc-500 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-900">
            <Clock className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-zinc-400 font-medium">{currentTime || "00:00:00"}</span>
            <span className="text-zinc-600">UTC</span>
          </div>

          {/* Core Analytics Metrics */}
          <div className="flex items-center space-x-4">
            <div className="text-center font-mono">
              <div className="text-xs text-zinc-500 uppercase tracking-widest text-[9px]">Aesthetic Feed</div>
              <div className="text-sm font-semibold text-zinc-200 mt-0.5">{images.filter(i => !i.isUserUploaded).length}</div>
            </div>
            <div className="h-6 w-px bg-zinc-900" />
            <div className="text-center font-mono">
              <div className="text-xs text-zinc-500 uppercase tracking-widest text-[9px]">My Uploads</div>
              <div className="text-sm font-semibold text-zinc-200 mt-0.5">{images.filter(i => i.isUserUploaded).length}</div>
            </div>
            <div className="h-6 w-px bg-zinc-900" />
            <div className="text-center font-mono">
              <div className="text-xs text-zinc-500 uppercase tracking-widest text-[9px]">Favorites</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">{favorites.length}</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. PRIMARY LAYOUT WORKSPACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Interactive Studio Drop Zone Panel */}
        <section className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4 sm:p-6" id="upload-studio-section">
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h2 className="font-sans font-semibold text-sm text-zinc-200 tracking-tight">
              Interactive Design Sandbox
            </h2>
          </div>
          <UploadZone onImageUploaded={handleNewUpload} />
        </section>

        {/* 3. CONTROL & SEARCH BAR */}
        <section className="bg-zinc-900/20 border border-zinc-900/60 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4" id="gallery-controls-bar">
          
          {/* Categories Tab Navigation */}
          <div className="w-full md:w-auto overflow-x-auto flex items-center space-x-1.5 pb-2 md:pb-0 scrollbar-none" id="categories-scroller">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              let count = 0;
              if (cat === "All") count = images.length;
              else if (cat === "My Uploads") count = images.filter(i => i.isUserUploaded).length;
              else if (cat === "Favorites") count = favorites.length;
              else count = images.filter(i => i.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-zinc-100 text-zinc-950 font-semibold shadow-lg"
                      : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                  id={`cat-tab-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {cat === "Favorites" && <Heart className={`h-3 w-3 ${isSelected ? "fill-zinc-950" : "fill-red-500/80 text-red-500"}`} />}
                  <span>{cat}</span>
                  <span className={`text-[9px] font-mono rounded-full px-1.5 py-0.2 ${
                    isSelected ? "bg-zinc-900/10 text-zinc-900 font-bold" : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Grid Toggles */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search tags, artists, concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl py-2 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 transition-all font-sans"
                id="gallery-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-[10px] font-mono"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Layout Mode Toggles & Action */}
            <div className="flex items-center space-x-1 w-full sm:w-auto justify-end">
              
              {/* Slideshow button */}
              {filteredImages.length > 0 && (
                <button
                  onClick={() => startSlideshow(0)}
                  className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer mr-1"
                  title="Launch cinematic full-screen presentation"
                  id="trigger-slideshow-btn"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline font-semibold">Theater Mode</span>
                </button>
              )}

              <div className="h-5 w-px bg-zinc-800 mr-1" />

              {/* Grid Toggle */}
              <button
                onClick={() => setLayoutMode("masonry")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  layoutMode === "masonry"
                    ? "bg-zinc-800 border-zinc-700 text-emerald-400"
                    : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
                title="Masonry Gallery Grid"
                id="toggle-masonry-layout"
              >
                <Grid className="h-4 w-4" />
              </button>

              <button
                onClick={() => setLayoutMode("grid")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  layoutMode === "grid"
                    ? "bg-zinc-800 border-zinc-700 text-emerald-400"
                    : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
                title="Aspect-Uniform Square Grid"
                id="toggle-uniform-layout"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>

              <button
                onClick={() => setLayoutMode("list")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  layoutMode === "list"
                    ? "bg-zinc-800 border-zinc-700 text-emerald-400"
                    : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
                title="Detailed Diagnostic List"
                id="toggle-list-layout"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 4. MAIN GALLERY CANVAS */}
        <section id="gallery-canvas-main">
          <AnimatePresence mode="popLayout">
            {filteredImages.length === 0 ? (
              // Empty State
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-24 bg-zinc-900/10 border border-dashed border-zinc-900 rounded-3xl p-8"
                id="gallery-empty-state"
              >
                <FolderHeart className="h-10 w-10 text-zinc-600 mx-auto stroke-1 mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300">No creative assets match criteria</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search criteria, selecting a different category tab, or drag-and-drop a new image onto the sandbox to begin curation.
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-1.5 rounded-lg bg-zinc-900 text-xs font-mono text-emerald-400 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                  >
                    Reset Filter Search
                  </button>
                )}
              </motion.div>
            ) : layoutMode === "masonry" ? (
              // MASONRY / DYNAMIC GRID
              <motion.div
                layout
                className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
                id="layout-masonry-grid"
              >
                {filteredImages.map((img) => {
                  const isFav = favorites.includes(img.id);
                  return (
                    <motion.div
                      layout
                      key={img.id}
                      onClick={() => setSelectedImageId(img.id)}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="break-inside-avoid relative rounded-2xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800/80 overflow-hidden group cursor-pointer transition-all duration-300 shadow-md"
                      id={`masonry-card-${img.id}`}
                    >
                      {/* Image Frame */}
                      <div className="relative overflow-hidden w-full bg-zinc-950">
                        <img
                          src={img.url}
                          alt={img.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                        />
                        {/* Hover Overlay Shade */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                          <p className="text-xs font-mono text-emerald-400 font-semibold tracking-wider">
                            {img.category}
                          </p>
                          <h4 className="text-sm font-sans font-semibold text-white truncate mt-0.5">
                            {img.title}
                          </h4>
                          <p className="text-[10px] text-zinc-300 font-sans mt-0.5">
                            by {img.artist}
                          </p>
                        </div>

                        {/* Top corner favorite indicator */}
                        <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5">
                          {img.isUserUploaded && (
                            <button
                              onClick={(e) => handleDeleteImage(e, img.id)}
                              className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md hover:bg-red-900 text-zinc-400 hover:text-white transition-colors"
                              title="Delete local image"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(img.id);
                            }}
                            className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                              isFav ? "bg-red-500/20 border border-red-500/40 text-red-400" : "bg-black/70 border border-transparent text-zinc-400 hover:text-white"
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Card Footer Metadata (Visible on list hover or default) */}
                      <div className="p-3 bg-zinc-900/20 border-t border-zinc-900/60 flex items-center justify-between text-xs">
                        <div className="truncate max-w-[70%]">
                          <p className="font-sans font-medium text-zinc-300 truncate">{img.title}</p>
                          <p className="text-[10px] text-zinc-500 font-sans truncate">by {img.artist}</p>
                        </div>
                        <span className="font-mono text-[9px] text-zinc-500 bg-zinc-950/60 px-1.5 py-0.5 rounded border border-zinc-900">
                          {img.aspectRatio}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : layoutMode === "grid" ? (
              // ASPECT UNIFORM SQUARE GRID (1:1)
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                id="layout-square-grid"
              >
                {filteredImages.map((img) => {
                  const isFav = favorites.includes(img.id);
                  return (
                    <motion.div
                      layout
                      key={img.id}
                      onClick={() => setSelectedImageId(img.id)}
                      whileHover={{ scale: 1.01 }}
                      className="relative aspect-square rounded-2xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800/80 overflow-hidden group cursor-pointer transition-all shadow-md"
                      id={`square-card-${img.id}`}
                    >
                      <img
                        src={img.url}
                        alt={img.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                      />
                      
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                        <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase">{img.category}</span>
                        <h4 className="text-sm font-sans font-semibold text-white truncate leading-tight mt-0.5">{img.title}</h4>
                        <p className="text-[10px] text-zinc-300 font-sans">{img.artist}</p>
                        <div className="flex items-center space-x-1.5 mt-2 pt-2 border-t border-zinc-800/60 text-[9px] font-mono text-zinc-400">
                          <span>{img.exif.camera}</span>
                        </div>
                      </div>

                      {/* Top Action Indicators */}
                      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1">
                        {img.isUserUploaded && (
                          <button
                            onClick={(e) => handleDeleteImage(e, img.id)}
                            className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md hover:bg-red-900 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(img.id);
                          }}
                          className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                            isFav ? "bg-red-500/20 border border-red-500/40 text-red-400" : "bg-black/70 border border-transparent text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500" : ""}`} />
                        </button>
                      </div>

                      {/* Top category label */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/60 backdrop-blur-md border border-zinc-800/40 text-[9px] font-mono text-zinc-300 px-2 py-0.5 rounded-md">
                          {img.aspectRatio}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              // MINIMAL DETAILED DIAGNOSTIC LIST
              <motion.div
                layout
                className="space-y-2"
                id="layout-details-list"
              >
                {filteredImages.map((img) => {
                  const isFav = favorites.includes(img.id);
                  return (
                    <motion.div
                      layout
                      key={img.id}
                      onClick={() => setSelectedImageId(img.id)}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-900/30 border border-zinc-900/60 rounded-xl hover:bg-zinc-900/50 hover:border-zinc-800 transition-all cursor-pointer gap-4"
                      id={`list-card-${img.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Mini Thumbnail */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                          <img
                            src={img.url}
                            alt={img.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-sans font-semibold text-white tracking-tight">{img.title}</h4>
                            <span className="bg-zinc-800/80 border border-zinc-700/40 text-zinc-400 text-[9px] font-mono px-2 py-0.5 rounded">
                              {img.category}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-sans mt-0.5">by {img.artist}</p>
                          <div className="text-[10px] text-zinc-500 font-mono flex items-center space-x-2 mt-1">
                            <span>Camera: {img.exif.camera}</span>
                            <span>•</span>
                            <span>Scale: {img.exif.dimensions}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Hand Metadata & Diagnostics */}
                      <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-900">
                        {/* Color swatches preview */}
                        <div className="flex -space-x-1.5">
                          {img.palette.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-3.5 h-3.5 rounded-full border border-zinc-950 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>

                        <div className="h-4 w-px bg-zinc-900 hidden sm:block" />

                        <div className="flex items-center space-x-2">
                          {img.isUserUploaded && (
                            <button
                              onClick={(e) => handleDeleteImage(e, img.id)}
                              className="p-2 rounded-lg bg-zinc-800/60 hover:bg-red-950/40 hover:border-red-500/20 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                              title="Delete local image"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(img.id);
                            }}
                            className={`p-2 rounded-lg border transition-all ${
                              isFav ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-zinc-800/60 border-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* 5. IMMERSIVE COMPONENT OVERLAYS */}
      
      {/* Cinematic Slide Show Theater Overlay */}
      <AnimatePresence>
        {isSlideshowActive && (
          <SlideshowPlayer
            images={filteredImages}
            initialIndex={slideshowIndex}
            onClose={() => setIsSlideshowActive(false)}
          />
        )}
      </AnimatePresence>

      {/* Professional Detailed Image Diagnostics & Filters Modal */}
      <AnimatePresence>
        {selectedImageId && selectedImage && (
          <ImagePreviewModal
            image={selectedImage}
            allImages={filteredImages}
            isFavorite={favorites.includes(selectedImage.id)}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={handleNavigateImage}
            onClose={() => setSelectedImageId(null)}
          />
        )}
      </AnimatePresence>

      {/* 6. GLORIOUS GRAPHIC DESIGN FOOTER */}
      <footer className="border-t border-zinc-900/60 bg-zinc-950 py-8 px-6 mt-12 text-center text-xs text-zinc-500" id="luminaq-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400 font-semibold">LUMINAQ CORE ACTIVE</span>
            <span>•</span>
            <span>All actions run client-side securely</span>
          </div>
          <div className="font-mono text-[10px] text-zinc-600">
            Powered by React, Tailwind CSS, & Motion layout triggers. Design with intention.
          </div>
        </div>
      </footer>
    </div>
  );
}
