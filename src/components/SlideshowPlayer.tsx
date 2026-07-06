import React, { useState, useEffect } from "react";
import { Play, Pause, X, ChevronRight, ChevronLeft, RefreshCw, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LuminaImage } from "../types";

interface SlideshowPlayerProps {
  images: LuminaImage[];
  initialIndex: number;
  onClose: () => void;
}

export default function SlideshowPlayer({ images, initialIndex, onClose }: SlideshowPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(4000); // ms per slide
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    let startTime = Date.now();
    let timerId: any;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / speed) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        startTime = Date.now();
        setProgress(0);
      }

      if (isPlaying) {
        timerId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      timerId = requestAnimationFrame(tick);
    } else {
      setProgress(0);
    }

    return () => {
      cancelAnimationFrame(timerId);
    };
  }, [isPlaying, currentIndex, speed, images.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setProgress(0);
  };

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white select-none" id="slideshow-player-overlay">
      {/* Top Bar Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] tracking-widest text-emerald-400 font-semibold flex items-center uppercase">
            <Eye className="h-3 w-3 mr-1.5 animate-pulse" /> Luminaq Theater Mode
          </span>
          <h2 className="text-lg font-sans font-medium text-zinc-100 tracking-tight leading-tight mt-0.5">
            {currentImage.title}
          </h2>
          <span className="text-xs text-zinc-400 font-sans">
            by {currentImage.artist} • {currentIndex + 1} of {images.length}
          </span>
        </div>

        {/* Mid Top Control Elements */}
        <div className="flex items-center space-x-2 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 hover:text-emerald-400 transition-colors text-zinc-300"
            title={isPlaying ? "Pause" : "Play"}
            id="slideshow-play-pause-btn"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-emerald-400 text-emerald-400" />}
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Speed Toggle */}
          <button
            onClick={() => setSpeed((prev) => (prev === 2000 ? 4000 : prev === 4000 ? 8000 : 2000))}
            className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono hover:text-emerald-400 text-zinc-400 transition-colors"
            title="Cycle slide speed"
            id="slideshow-speed-toggle-btn"
          >
            <RefreshCw className="h-3 w-3" />
            <span>{speed / 1000}s</span>
          </button>
        </div>

        {/* Exit Button */}
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-lg"
          title="Exit Presentation"
          id="slideshow-close-btn"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Cinematic Slide Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-6 z-40 p-3 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Previous slide"
          id="slideshow-prev-btn"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-6 z-40 p-3 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Next slide"
          id="slideshow-next-btn"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Animated Image Container */}
        <div className="relative w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Image with subtle Ken Burns effect if playing */}
              <motion.img
                src={currentImage.url}
                alt={currentImage.title}
                referrerPolicy="no-referrer"
                animate={
                  isPlaying
                    ? {
                        scale: [1, 1.05],
                        x: [0, -5],
                        y: [0, -3],
                      }
                    : { scale: 1, x: 0, y: 0 }
                }
                transition={{
                  duration: speed / 1000,
                  ease: "linear",
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="max-w-full max-h-full object-contain shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-xl border border-zinc-900"
                id={`slideshow-image-${currentImage.id}`}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Progress Bar (bottom-most indicator) */}
      <div className="h-1 w-full bg-zinc-900 relative">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Bottom info strip */}
      <div className="bg-zinc-950 px-6 py-4 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500 border-t border-zinc-900/60 font-mono">
        <div className="flex space-x-4 mb-2 md:mb-0">
          <span>Camera: {currentImage.exif.camera}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Settings: {currentImage.exif.settings}</span>
        </div>
        <div className="flex space-x-2">
          {currentImage.palette.map((color, idx) => (
            <div
              key={idx}
              className="w-4 h-4 rounded-full border border-zinc-800 shadow"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
