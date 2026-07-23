import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Download, 
  Save, 
  ArrowLeft, 
  Sliders, 
  Palette, 
  Type, 
  Calendar, 
  Maximize2, 
  Eye, 
  Printer, 
  QrCode, 
  Smile, 
  Share2, 
  Check, 
  Image as ImageIcon, 
  Sticker, 
  X, 
  RotateCcw, 
  Camera, 
  Volume2, 
  VolumeX,
  Layers,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StickerItem } from '../utils/collageBuilder';

export interface PostPhotoSceneProps {
  capturedPhotos: string[];
  selectedLayout: string;
  capturedResult: string | null;
  saving: boolean;
  backendStatus: 'checking' | 'connected' | 'disconnected';
  filter: string;
  setFilter: (f: string) => void;
  frameColor: string;
  setFrameColor: (c: string) => void;
  frameText: string;
  setFrameText: (t: string) => void;
  showDate: boolean;
  setShowDate: (v: boolean) => void;
  borderSize: number;
  setBorderSize: (b: number) => void;
  cornerRadius: number;
  setCornerRadius: (r: number) => void;
  fontStyle: string;
  setFontStyle: (font: string) => void;
  stickers: StickerItem[];
  setStickers: React.Dispatch<React.SetStateAction<StickerItem[]>>;
  onDownload: () => void;
  onSaveToGallery: () => void;
  onRetakeAll: () => void;
  onReplaceSinglePose: (index: number, newPhotoDataUrl: string) => void;
  soundEnabled: boolean;
}

const FILTERS = [
  { id: 'none', name: 'Normal', desc: 'Natural colors' },
  { id: 'grayscale', name: 'Mono', desc: 'B&W classic' },
  { id: 'sepia', name: 'Vintage', desc: 'Warm sepia' },
  { id: 'warm', name: 'Warm', desc: 'Golden hour' },
  { id: 'cool', name: 'Cool', desc: 'Bright tone' },
  { id: 'pink-tint', name: 'Sweet Cherry', desc: 'Soft pink' },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Vibrant neon' },
  { id: 'retro-sunset', name: 'Sunset', desc: 'Retro glow' },
  { id: 'dramatic-bw', name: 'Dramatic', desc: 'High contrast B&W' },
];

const FRAME_COLORS = [
  { id: '#ffffff', name: 'White', hex: '#ffffff' },
  { id: '#18181b', name: 'Charcoal', hex: '#18181b' },
  { id: '#fce7f3', name: 'Pink Blush', hex: '#fce7f3' },
  { id: '#dbeafe', name: 'Soft Blue', hex: '#dbeafe' },
  { id: '#fef3c7', name: 'Cream', hex: '#fef3c7' },
  { id: '#f3e8ff', name: 'Lavender', hex: '#f3e8ff' },
  { id: '#d1fae5', name: 'Mint', hex: '#d1fae5' },
  { id: 'gradient:cotton-candy', name: 'Cotton Candy', hex: 'linear-gradient(135deg, #ffd1d1, #fbcfe8, #dbeafe)' },
  { id: 'gradient:sunset-glow', name: 'Sunset Glow', hex: 'linear-gradient(135deg, #ff9a9e, #fecfef, #a1c4fd)' },
  { id: 'gradient:dreamy-lavender', name: 'Lavender Sky', hex: 'linear-gradient(135deg, #c2e9fb, #e0c3fc)' },
  { id: 'gradient:aurora', name: 'Aurora', hex: 'linear-gradient(135deg, #84fab0, #8fd3f4)' },
];

const STICKER_PALETTE = ['❤️', '✨', '🎀', '👑', '🌸', '😎', '🐶', '🍕', '🍦', '🌟', '🧸', '🥳'];

const FONT_OPTIONS = [
  { id: 'sans', name: 'Modern Sans' },
  { id: 'cursive', name: 'Cute Handwriting' },
  { id: 'serif', name: 'Classic Serif' },
  { id: 'display', name: 'Bold Display' },
  { id: 'mono', name: 'Monospace' },
];

export const PostPhotoScene: React.FC<PostPhotoSceneProps> = ({
  capturedPhotos,
  selectedLayout,
  capturedResult,
  saving,
  backendStatus,
  filter,
  setFilter,
  frameColor,
  setFrameColor,
  frameText,
  setFrameText,
  showDate,
  setShowDate,
  borderSize,
  setBorderSize,
  cornerRadius,
  setCornerRadius,
  fontStyle,
  setFontStyle,
  stickers,
  setStickers,
  onDownload,
  onSaveToGallery,
  onRetakeAll,
  onReplaceSinglePose,
  soundEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'poses' | 'print'>('studio');
  const [viewingPoseIndex, setViewingPoseIndex] = useState<number | null>(null);
  
  // Single pose retake state
  const [retakingIndex, setRetakingIndex] = useState<number | null>(null);
  const [singleCountdown, setSingleCountdown] = useState<number | null>(null);
  const singleVideoRef = useRef<HTMLVideoElement>(null);
  const [singleStream, setSingleStream] = useState<MediaStream | null>(null);

  // Print Machine simulation state
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [printed, setPrinted] = useState(false);

  // Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Celebration Particles
  const particles = Array.from({ length: 18 });

  // Handle single pose retake camera initialization
  useEffect(() => {
    if (retakingIndex !== null) {
      let active = true;
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
        .then((s) => {
          if (active) {
            setSingleStream(s);
            if (singleVideoRef.current) singleVideoRef.current.srcObject = s;
          } else {
            s.getTracks().forEach(t => t.stop());
          }
        })
        .catch((err) => console.error("Retake camera failed:", err));

      return () => {
        active = false;
        if (singleStream) {
          singleStream.getTracks().forEach(t => t.stop());
          setSingleStream(null);
        }
      };
    }
  }, [retakingIndex]);

  const snapSinglePose = (index: number) => {
    let frameData = '';
    if (singleVideoRef.current) {
      const video = singleVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frameData = canvas.toDataURL('image/png');
      }
    }

    if (singleStream) {
      singleStream.getTracks().forEach(t => t.stop());
      setSingleStream(null);
    }

    if (frameData) {
      onReplaceSinglePose(index, frameData);
    }
    setRetakingIndex(null);
    setSingleCountdown(null);
  };

  const startSingleCountdown = (index: number) => {
    setSingleCountdown(3);
    const timer = setInterval(() => {
      setSingleCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          snapSinglePose(index);
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
  };

  // Sticker interactions
  const addSticker = (emoji: string) => {
    const newSticker: StickerItem = {
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      emoji,
      x: 35 + Math.random() * 30, // center default area
      y: 20 + Math.random() * 50,
      scale: 1,
      rotation: (Math.random() - 0.5) * 30,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter(s => s.id !== id));
  };

  // Print simulation trigger
  const triggerPrintSimulation = () => {
    setIsPrinting(true);
    setPrintProgress(0);
    setPrinted(false);

    const interval = setInterval(() => {
      setPrintProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPrinting(false);
          setPrinted(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 relative">
      
      {/* Floating Celebration Confetti Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {particles.map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * (window.innerWidth || 800) - (window.innerWidth / 2 || 400),
              y: -50,
              scale: 0.5 + Math.random() * 0.8,
              rotate: 0,
              opacity: 0.8
            }}
            animate={{ 
              y: [0, 400 + Math.random() * 300],
              x: `+=${(Math.random() - 0.5) * 120}`,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              opacity: [0.8, 1, 0]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity, 
              delay: Math.random() * 2 
            }}
            className="absolute top-0 left-1/2 text-lg select-none"
          >
            {['✨', '💖', '⭐', '🌸', '🎉', '🌟'][i % 6]}
          </motion.div>
        ))}
      </div>

      {/* Hero Banner Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300 p-6 rounded-[2.5rem] shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-white/40 backdrop-blur-md relative overflow-hidden"
      >
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-3xl shadow-inner">
            📸
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest bg-white/30 px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                Session Complete!
              </span>
              <span className="text-xs font-bold opacity-90">
                {capturedPhotos.length} Shots Captured
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1 text-shadow-sm">
              Your Photobooth Scene
            </h2>
          </div>
        </div>

        {/* Scene Mode Selector Tabs */}
        <div className="flex bg-white/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/30 gap-1 z-10 w-full md:w-auto justify-center">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-white text-pink-600 shadow-md scale-[1.02]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Palette className="w-4 h-4" />
            Collage Studio
          </button>

          <button
            onClick={() => setActiveTab('poses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'poses'
                ? 'bg-white text-pink-600 shadow-md scale-[1.02]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Pose Breakdown
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'print'
                ? 'bg-white text-pink-600 shadow-md scale-[1.02]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Printer className="w-4 h-4" />
            Print & Share
          </button>
        </div>
      </motion.div>

      {/* Main Scene Body */}
      <div className="w-full">

        {/* TAB 1: COLLAGE STUDIO */}
        {activeTab === 'studio' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Canvas Preview Box */}
            <div className="lg:col-span-5 flex flex-col items-center justify-start gap-4">
              <div className="w-full flex items-center justify-between px-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-pink-500" />
                  Live Strip Render
                </span>
                <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                  {selectedLayout.toUpperCase()}
                </span>
              </div>

              {/* Interactive Frame Box with Drag/Drop Stickers */}
              <div className="relative p-4 bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-pink-100/60 flex flex-col items-center justify-center w-full max-w-sm group">
                {capturedResult ? (
                  <motion.div 
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full relative flex items-center justify-center p-1"
                  >
                    <img 
                      src={capturedResult} 
                      alt="Personalized photobooth collage" 
                      className="rounded-2xl shadow-lg border border-slate-200/80 w-full max-h-[62vh] object-contain transition-all"
                    />

                    {/* Interactive overlay elements / Sticker delete prompts */}
                    {stickers.map((st) => (
                      <div
                        key={st.id}
                        style={{
                          left: `${st.x}%`,
                          top: `${st.y}%`,
                          transform: `translate(-50%, -50%) rotate(${st.rotation}deg) scale(${st.scale})`,
                        }}
                        className="absolute cursor-pointer text-3xl hover:scale-125 transition-transform group/st select-none z-10"
                        title="Click to remove sticker"
                        onClick={() => removeSticker(st.id)}
                      >
                        {st.emoji}
                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 text-[8px] opacity-0 group-hover/st:opacity-100 transition-opacity">
                          <X className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-pink-400 gap-3">
                    <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold text-sm">Assembling frame...</span>
                  </div>
                )}

                {/* Quick Helper Tip */}
                <div className="mt-3 text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sticker className="w-3.5 h-3.5 text-pink-400" />
                  <span>Click stickers in the customizer to overlay on your collage!</span>
                </div>
              </div>
            </div>

            {/* Customization Options Bar */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-pink-100/50 flex flex-col gap-6">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-pink-500" />
                    <h3 className="text-xl font-black text-slate-800">Customizer Panel</h3>
                  </div>

                  <button 
                    onClick={() => {
                      if (confirm('Discard photos and retake photobooth session?')) {
                        onRetakeAll();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-all border border-slate-200/60 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retake All
                  </button>
                </div>

                <div className="flex flex-col gap-6 overflow-y-auto max-h-[54vh] pr-2">
                  
                  {/* Filter Choices */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                      Visual Filter
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer focus:outline-none ${
                            filter === f.id 
                              ? 'bg-pink-500 border-pink-400 text-white shadow-md scale-105' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-pink-50/50'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Color & Pattern */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-pink-400" />
                      Frame Color & Gradient
                    </span>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 pt-1">
                      {FRAME_COLORS.map((c) => {
                        const isSelected = frameColor === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setFrameColor(c.id)}
                            style={{ background: c.hex }}
                            className={`w-9 h-9 rounded-full border-2 transition-all relative shadow-sm cursor-pointer ${
                              isSelected ? 'border-pink-500 ring-2 ring-pink-200 scale-110' : 'border-slate-200 hover:scale-105'
                            }`}
                            title={c.name}
                          >
                            {isSelected && (
                              <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sticker Stamps Palette */}
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sticker className="w-3.5 h-3.5 text-pink-400" />
                        Sticker Stamps ({stickers.length} added)
                      </span>
                      {stickers.length > 0 && (
                        <button
                          onClick={() => setStickers([])}
                          className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Clear All Stickers
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {STICKER_PALETTE.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addSticker(emoji)}
                          className="w-10 h-10 bg-slate-50 hover:bg-pink-50 border border-slate-200 hover:border-pink-300 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm"
                          title={`Add ${emoji} sticker`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders: Border Size & Corner Radius */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-pink-400" />
                        Border Width ({borderSize}px)
                      </span>
                      <input 
                        type="range" 
                        min="8" 
                        max="32" 
                        value={borderSize} 
                        onChange={(e) => setBorderSize(Number(e.target.value))}
                        className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-pink-400" />
                        Photo Roundness ({cornerRadius}px)
                      </span>
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        value={cornerRadius} 
                        onChange={(e) => setCornerRadius(Number(e.target.value))}
                        className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  {/* Typography & Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Type className="w-3.5 h-3.5 text-pink-400" />
                        Footer Title Text
                      </span>
                      <input 
                        type="text" 
                        value={frameText} 
                        maxLength={24}
                        onChange={(e) => setFrameText(e.target.value)}
                        placeholder="SWEET BOOTH"
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400/50 bg-slate-50 focus:bg-white transition-all font-semibold"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-pink-400" />
                        Font Style
                      </span>
                      <select
                        value={fontStyle}
                        onChange={(e) => setFontStyle(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400/50 bg-slate-50 focus:bg-white transition-all font-semibold cursor-pointer"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font.id} value={font.id}>{font.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* Main Action Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <motion.button
                    onClick={onDownload}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!capturedResult}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-extrabold rounded-2xl shadow-lg border-b-4 border-slate-950 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG Strip
                  </motion.button>

                  <motion.button
                    onClick={onSaveToGallery}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={saving || !capturedResult || backendStatus !== 'connected'}
                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold rounded-2xl shadow-lg border-b-4 border-rose-700 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save to Booth Server
                  </motion.button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: POSE BREAKDOWN & SINGLE RETAKE */}
        {activeTab === 'poses' && (
          <div className="w-full flex flex-col gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-pink-100/50 flex flex-col gap-6">
              
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex flex-col text-left">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-pink-500" />
                    Individual Pose Gallery
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    View each individual photo taken. Click retake on any specific pose if you want to replace it!
                  </p>
                </div>

                <span className="text-xs font-extrabold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
                  {capturedPhotos.length} Poses Total
                </span>
              </div>

              {/* Grid of Individual Shots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {capturedPhotos.map((photoUrl, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4 }}
                    className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col gap-3 relative group shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 relative border border-slate-300/60">
                      <img 
                        src={photoUrl} 
                        alt={`Pose #${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                        Pose #{idx + 1}
                      </div>

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingPoseIndex(idx)}
                          className="bg-white text-slate-800 p-2.5 rounded-full shadow hover:bg-pink-500 hover:text-white transition-all cursor-pointer"
                          title="Zoom Photo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={photoUrl}
                          download={`pose_${idx + 1}.png`}
                          className="bg-white text-slate-800 p-2.5 rounded-full shadow hover:bg-pink-500 hover:text-white transition-all cursor-pointer"
                          title="Download Raw Photo"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-extrabold text-slate-600">
                        Frame Shot #{idx + 1}
                      </span>
                      <button
                        onClick={() => setRetakingIndex(idx)}
                        className="flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-lg transition-all border border-pink-100 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retake
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: PRINT & SHARE STUDIO */}
        {activeTab === 'print' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Photobooth Printer Slot Graphic Simulation */}
            <div className="md:col-span-6 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col items-center gap-6 relative overflow-hidden">
              <div className="flex items-center gap-2 text-pink-400">
                <Printer className="w-6 h-6 animate-pulse" />
                <h3 className="text-xl font-black tracking-tight text-white">Photobooth Printer Machine</h3>
              </div>
              <p className="text-xs text-slate-400 text-center max-w-xs">
                Simulate a physical glossy strip print output straight out of the booth printer slot!
              </p>

              {/* Printer Slot Hardware Illustration */}
              <div className="w-full max-w-xs bg-slate-800 border-2 border-slate-700 rounded-3xl p-4 flex flex-col items-center gap-4 relative shadow-inner">
                {/* Printer Slot Ejection mouth */}
                <div className="w-full h-4 bg-slate-950 rounded-full border border-slate-800 shadow-inner relative overflow-hidden flex items-center justify-center">
                  <div className="w-3/4 h-1 bg-pink-500/50 rounded-full animate-pulse"></div>
                </div>

                {/* Strip Ejection Slot Animation */}
                <div className="w-full h-80 overflow-hidden relative flex justify-center items-start pt-2">
                  <AnimatePresence>
                    {(isPrinting || printed) && capturedResult && (
                      <motion.div
                        initial={{ y: -300 }}
                        animate={{ y: printed ? 0 : -300 + (printProgress / 100) * 300 }}
                        transition={{ duration: 0.3 }}
                        className="w-44 bg-white p-2 rounded-xl shadow-2xl border-4 border-slate-100 flex flex-col items-center"
                      >
                        <img src={capturedResult} alt="Printed Strip" className="w-full rounded object-contain shadow-md" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isPrinting && !printed && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                      <Printer className="w-10 h-10 opacity-30" />
                      <span className="text-xs font-bold">Ready to Print</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {isPrinting && (
                  <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden border border-slate-600">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-rose-400 h-full transition-all duration-300" 
                      style={{ width: `${printProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Print Action Trigger */}
              <button
                onClick={triggerPrintSimulation}
                disabled={isPrinting || !capturedResult}
                className="w-full max-w-xs py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold rounded-2xl shadow-lg border-b-4 border-rose-700 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Printer className="w-5 h-5" />
                {isPrinting ? `Printing ${printProgress}%...` : printed ? 'Re-Print Strip' : 'Start Print Simulation'}
              </button>
            </div>

            {/* Mobile Share & QR Code Panel */}
            <div className="md:col-span-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-pink-100/50 flex flex-col items-center text-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>

              <div className="flex flex-col items-center">
                <h3 className="text-xl font-black text-slate-800">Scan QR or Share Link</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 max-w-xs">
                  Scan this QR code with your mobile camera to instantly view and save this photobooth memory!
                </p>
              </div>

              {/* QR Code Placeholder Graphic */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl shadow-inner flex flex-col items-center justify-center">
                <div className="w-44 h-44 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="white" />
                    <path d="M10 10h30v30H10zM60 10h30v30H60zM10 60h30v30H10z" fill="#1e293b" />
                    <path d="M18 18h14v14H18zM68 18h14v14H68zM18 68h14v14H18z" fill="white" />
                    <rect x="50" y="50" width="15" height="15" fill="#ec4899" />
                    <rect x="70" y="70" width="20" height="20" fill="#1e293b" />
                    <rect x="50" y="75" width="12" height="15" fill="#1e293b" />
                    <rect x="75" y="50" width="15" height="12" fill="#ec4899" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-pink-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                      BOOTH
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Share2 className="w-4 h-4 text-slate-500" />
                  {copiedLink ? 'Link Copied!' : 'Copy Share Link'}
                </button>

                <button
                  onClick={onDownload}
                  className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* FULLSCREEN INDIVIDUAL POSE ZOOM MODAL */}
      <AnimatePresence>
        {viewingPoseIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-5 max-w-lg w-full relative flex flex-col items-center gap-4 shadow-2xl"
            >
              <button 
                onClick={() => setViewingPoseIndex(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              <h4 className="text-lg font-black text-slate-800">Pose #{viewingPoseIndex + 1} High-Res View</h4>

              <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img 
                  src={capturedPhotos[viewingPoseIndex]} 
                  alt={`Pose ${viewingPoseIndex + 1}`} 
                  className="w-full h-auto object-contain max-h-[60vh]"
                />
              </div>

              <div className="w-full flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    const idx = viewingPoseIndex;
                    setViewingPoseIndex(null);
                    setRetakingIndex(idx);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-extrabold rounded-xl transition-all border border-pink-200 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake This Pose
                </button>

                <a
                  href={capturedPhotos[viewingPoseIndex]}
                  download={`sweetbooth_pose_${viewingPoseIndex + 1}.png`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-extrabold rounded-xl shadow transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Save Image
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SINGLE POSE LIVE WEBCAM RETAKE MODAL */}
      <AnimatePresence>
        {retakingIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full relative flex flex-col items-center gap-5 shadow-2xl"
            >
              <button 
                onClick={() => {
                  if (singleStream) singleStream.getTracks().forEach(t => t.stop());
                  setRetakingIndex(null);
                  setSingleCountdown(null);
                }}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-black text-pink-500 uppercase tracking-widest">Pose Replacement</span>
                <h3 className="text-xl font-black text-slate-800">Retaking Pose #{retakingIndex + 1}</h3>
              </div>

              {/* Viewfinder display */}
              <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner flex items-center justify-center">
                <video 
                  ref={singleVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />

                {singleCountdown !== null && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <span className="text-7xl font-black text-white drop-shadow">
                      {singleCountdown}
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    if (singleStream) singleStream.getTracks().forEach(t => t.stop());
                    setRetakingIndex(null);
                    setSingleCountdown(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={() => startSingleCountdown(retakingIndex)}
                  disabled={singleCountdown !== null}
                  className="flex items-center gap-2 px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {singleCountdown !== null ? 'Posing...' : 'Snap New Pose'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PostPhotoScene;
