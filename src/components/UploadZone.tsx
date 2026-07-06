import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { LuminaImage } from "../types";

interface UploadZoneProps {
  onImageUploaded: (newImage: LuminaImage) => void;
}

export default function UploadZone({ onImageUploaded }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Create an image object to extract palette and dimensions
      const img = new Image();
      img.onload = () => {
        // Extract palette using canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let extractedColors: string[] = ["#1A1A1A", "#4A4A4A", "#8A8A8A", "#CCCCCC", "#FFFFFF"];

        if (ctx) {
          canvas.width = 10;
          canvas.height = 10;
          ctx.drawImage(img, 0, 0, 10, 10);
          const imgData = ctx.getImageData(0, 0, 10, 10).data;
          
          // Sample distinct colors from the 10x10 grid
          const samplePoints = [12, 38, 55, 77, 92]; // Indices in the pixel array
          const colors: string[] = [];
          
          samplePoints.forEach((point) => {
            const r = imgData[point * 4];
            const g = imgData[point * 4 + 1];
            const b = imgData[point * 4 + 2];
            
            // Convert to Hex
            const hex = "#" + [r, g, b].map(x => {
              const hexStr = x.toString(16);
              return hexStr.length === 1 ? "0" + hexStr : hexStr;
            }).join("").toUpperCase();
            
            if (!colors.includes(hex)) {
              colors.push(hex);
            }
          });

          // Pad with defaults if too few unique colors found
          while (colors.length < 5) {
            colors.push("#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase());
          }
          extractedColors = colors.slice(0, 5);
        }

        // Generate a fun mock metadata set based on actual image parameters
        const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const formatRatio = img.width > img.height ? "16:9" : img.width === img.height ? "1:1" : "3:4";
        
        const newLuminaImage: LuminaImage = {
          id: `user-uploaded-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "You (Local Upload)",
          url: dataUrl,
          category: "My Uploads",
          aspectRatio: formatRatio,
          exif: {
            camera: "Custom Lens / Device",
            lens: "Extracted from source payload",
            settings: `Uploaded on ${dateStr} • Local File`,
            dimensions: `${img.width} × ${img.height} px`,
            location: "Local Sandbox"
          },
          palette: extractedColors,
          tags: ["User Content", "Local Upload", "Sandbox"],
          isUserUploaded: true
        };

        onImageUploaded(newLuminaImage);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="luminaq-file-upload-input"
      />
      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.01, borderColor: "rgba(16, 185, 129, 0.5)" }}
        whileTap={{ scale: 0.99 }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          isDragActive
            ? "border-emerald-400 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60"
        }`}
        id="luminaq-upload-container"
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className={`rounded-full p-4 transition-colors duration-300 ${
            isDragActive ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
          }`}>
            <Upload className="h-6 w-6" id="upload-icon" />
          </div>
          <div>
            <p className="font-sans font-medium text-sm text-zinc-200">
              Drag & drop any creative image here, or <span className="text-emerald-400 font-semibold underline decoration-2 underline-offset-2">browse files</span>
            </p>
            <p className="mt-1 font-sans text-xs text-zinc-500">
              Supports PNG, JPG, WebP, GIF. Extracts colors & parameters in real-time.
            </p>
          </div>
          
          <div className="flex items-center space-y-1 sm:space-y-0 sm:space-x-4 pt-1 flex-col sm:flex-row text-[10px] font-mono text-zinc-500">
            <span className="flex items-center bg-zinc-800/60 px-2.5 py-1 rounded-full">
              <ImageIcon className="h-3 w-3 mr-1 text-emerald-400/80" /> Auto aspect recognition
            </span>
            <span className="flex items-center bg-zinc-800/60 px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3 mr-1 text-purple-400/80" /> Dynamic hex extractor
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
