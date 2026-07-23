import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  LayoutGrid, 
  Rows4, 
  Square, 
  Sparkles, 
  Download, 
  Save, 
  Trash2, 
  X, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Eye,
  Smile,
  Maximize2,
  Calendar,
  Sliders,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { buildCollage, CollageOptions, StickerItem } from './utils/collageBuilder';
import PostPhotoScene from './components/PostPhotoScene';

// --- Layout Definitions ---
const LAYOUTS = [
  { id: 'strip-4', name: '4-Cut Strip', icon: Rows4, desc: 'Classic 1x4 photobooth strip', count: 4 },
  { id: 'grid-4', name: '2x2 Grid', icon: LayoutGrid, desc: 'Square 2x2 collage', count: 4 },
  { id: 'single', name: 'Single Shot', icon: Square, desc: 'One big polaroid', count: 1 },
  { id: 'strip-3', name: '3-Cut Strip', icon: Rows4, desc: 'Compact 1x3 strip', count: 3 },
  { id: 'collage', name: 'Freestyle', icon: ImageIcon, desc: 'Tilted scrapbook collage', count: 4 },
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

const FILTERS = [
  { id: 'none', name: 'Normal', desc: 'No filter' },
  { id: 'grayscale', name: 'Mono', desc: 'Classic B&W' },
  { id: 'sepia', name: 'Vintage', desc: 'Warm sepia' },
  { id: 'warm', name: 'Warm', desc: 'Golden retro' },
  { id: 'cool', name: 'Cool', desc: 'Bright cool' },
  { id: 'contrast', name: 'Contrast', desc: 'Bold contrast' },
  { id: 'pink-tint', name: 'Sweet Cherry', desc: 'Lovely pink tint' },
];

interface GalleryPhoto {
  filename: string;
  url: string;
  created_at: number;
}

export default function App() {
  // --- State Variables ---
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0].id);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendMessage, setBackendMessage] = useState<string>('');
  
  // App States
  const [appState, setAppState] = useState<'idle' | 'capturing' | 'review'>('idle');
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<GalleryPhoto | null>(null);
  
  // Camera & Capture Session States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [mirrorPreview, setMirrorPreview] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Customization Options
  const [frameColor, setFrameColor] = useState('#ffffff');
  const [filter, setFilter] = useState('none');
  const [frameText, setFrameText] = useState('SWEET BOOTH');
  const [showDate, setShowDate] = useState(true);
  const [borderSize, setBorderSize] = useState(16);
  const [cornerRadius, setCornerRadius] = useState(8);
  const [fontStyle, setFontStyle] = useState('sans');
  const [stickers, setStickers] = useState<StickerItem[]>([]);

  const handleReplaceSinglePose = (index: number, newPhotoDataUrl: string) => {
    setCapturedPhotos((prev) => {
      const updated = [...prev];
      updated[index] = newPhotoDataUrl;
      return updated;
    });
    showToast(`Pose #${index + 1} updated successfully!`);
  };

  // Final Output
  const [capturedResult, setCapturedResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Custom Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Sound Effects Generators ---
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  const playShutterSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bufferSize = audioCtx.sampleRate * 0.2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filterNode = audioCtx.createBiquadFilter();
      filterNode.type = 'bandpass';
      filterNode.frequency.value = 1200;
      
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      
      noise.connect(filterNode);
      filterNode.connect(gain);
      gain.connect(audioCtx.destination);
      
      noise.start();
      noise.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  // --- Camera Controller ---
  useEffect(() => {
    let active = true;
    async function setupCamera() {
      if (stream) return;
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (active) {
          setStream(mediaStream);
          setHasPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } else {
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error('Camera setup error:', err);
        if (active) setHasPermission(false);
      }
    }

    if (appState !== 'review') {
      setupCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      active = false;
    };
  }, [appState, stream]);

  // Sync video source whenever stream changes and component is active
  useEffect(() => {
    if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, appState]);

  // --- Backend Sync Functions ---
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  const fetchGallery = () => {
    fetch(`${API_BASE}/api/v1/photos/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load gallery');
        return res.json();
      })
      .then((data) => {
        if (data && data.photos) {
          setGallery(data.photos);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    // Check backend connection
    fetch(`${API_BASE}/api`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to connect');
        return res.json();
      })
      .then((data) => {
        setBackendStatus('connected');
        setBackendMessage(data.message || 'Connected');
        fetchGallery();
      })
      .catch((err) => {
        console.error(err);
        setBackendStatus('disconnected');
      });
  }, []);

  // --- Frame Capture Logic ---
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (mirrorPreview) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL('image/png');
  };

  // Safe fallback mock photo generator
  const generateMockPhoto = (idx: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(0, 0, 640, 480);
      
      // Draw smiley face
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(320, 240, 100, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(280, 200, 15, 0, Math.PI * 2);
      ctx.arc(360, 200, 15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(320, 240, 60, 0, Math.PI);
      ctx.stroke();
      
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#db2777';
      ctx.textAlign = 'center';
      ctx.fillText(`Beautiful Capture #${idx + 1}!`, 320, 400);
    }
    return canvas.toDataURL('image/png');
  };

  // --- Capture Session State Machine ---
  const startCaptureSession = () => {
    const layout = LAYOUTS.find(l => l.id === selectedLayout);
    const totalShots = layout ? layout.count : 4;

    setCapturedPhotos([]);
    setStickers([]);
    setCurrentPhotoIndex(0);
    setAppState('capturing');
    setCapturedResult(null);

    // Start countdown for the first shot
    setTimeout(() => {
      runCountdown(0, totalShots);
    }, 500);
  };

  const runCountdown = (index: number, totalShots: number) => {
    setCountdown(timerSeconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev === 1) {
          clearInterval(interval);
          snapPhoto(index, totalShots);
          return null;
        }
        playBeep();
        return prev - 1;
      });
    }, 1000);
    playBeep();
  };

  const snapPhoto = (index: number, totalShots: number) => {
    // Screen flash
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    // Shutter sound
    playShutterSound();

    let frame = captureFrame();
    if (!frame) {
      frame = generateMockPhoto(index);
    }

    setCapturedPhotos((prev) => {
      const updated = [...prev, frame as string];
      
      if (updated.length < totalShots) {
        setCurrentPhotoIndex(updated.length);
        // Delay 2 seconds for user to pose for the next shot
        setTimeout(() => {
          runCountdown(updated.length, totalShots);
        }, 2200);
      } else {
        // Complete capturing
        setTimeout(() => {
          setAppState('review');
        }, 600);
      }
      return updated;
    });
  };

  // --- Real-time Collage Building ---
  useEffect(() => {
    if (appState === 'review' && capturedPhotos.length > 0) {
      const options: CollageOptions = {
        filter,
        frameColor,
        frameText,
        fontStyle,
        showDate,
        borderSize,
        cornerRadius,
        stickers,
      };

      buildCollage(capturedPhotos, selectedLayout, options)
        .then((dataUrl) => {
          setCapturedResult(dataUrl);
        })
        .catch((err) => {
          console.error(err);
          showToast('Failed to build collage preview', 'error');
        });
    }
  }, [appState, capturedPhotos, selectedLayout, filter, frameColor, frameText, fontStyle, showDate, borderSize, cornerRadius, stickers]);

  // --- Export Actions ---
  const downloadCollage = () => {
    if (!capturedResult) return;
    const link = document.createElement('a');
    link.download = `sweetbooth_${Date.now()}.png`;
    link.href = capturedResult;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded collage successfully!');
  };

  const saveToGallery = () => {
    if (!capturedResult) return;
    setSaving(true);

    fetch(`${API_BASE}/api/v1/photos/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: capturedResult })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      })
      .then((data) => {
        setSaving(false);
        showToast('Saved to booth gallery!');
        fetchGallery();
      })
      .catch((err) => {
        setSaving(false);
        console.error(err);
        showToast('Failed to save: ' + err.message, 'error');
      });
  };

  const deletePhoto = (filename: string) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;
    
    fetch(`${API_BASE}/api/v1/photos/${filename}`, {
      method: 'DELETE'
    })
      .then((res) => {
        if (!res.ok) throw new Error('Delete failed');
        return res.json();
      })
      .then(() => {
        showToast('Photo deleted successfully!');
        fetchGallery();
        if (viewingPhoto && viewingPhoto.filename === filename) {
          setViewingPhoto(null);
        }
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to delete: ' + err.message, 'error');
      });
  };

  const activeLayoutObj = LAYOUTS.find(l => l.id === selectedLayout);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-lg flex items-center gap-2 border text-sm font-semibold
              ${toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100' 
                : 'bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100'
              }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Photo Viewer Modal */}
      <AnimatePresence>
        {viewingPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full relative p-4 flex flex-col items-center gap-4"
            >
              <button 
                onClick={() => setViewingPhoto(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
              
              <div className="w-full overflow-y-auto max-h-[75vh] flex justify-center mt-6">
                <img 
                  src={viewingPhoto.url} 
                  alt="Captured photobooth" 
                  className="rounded-2xl shadow-md border max-h-[60vh] object-contain"
                />
              </div>

              <div className="w-full flex items-center justify-between mt-2 pt-3 border-t border-slate-100 px-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Captured on</span>
                  <span className="text-sm font-semibold text-slate-600">
                    {new Date(viewingPhoto.created_at * 1000).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={viewingPhoto.url}
                    download={`sweetbooth_${viewingPhoto.filename}`}
                    className="p-3 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-full transition-all flex items-center justify-center"
                    title="Download Photo"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => deletePhoto(viewingPhoto.filename)}
                    className="p-3 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-full transition-all flex items-center justify-center"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Header */}
      <header className="pt-6 pb-2 px-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2 text-pink-500"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400">
            Sweet Booth
          </h1>
          <Sparkles className="w-6 h-6 animate-pulse" />
        </motion.div>
        <p className="text-pink-400/80 font-semibold text-sm mt-1">Capture your lovely moments</p>

        {/* Backend Status Dot */}
        <div className="mt-2.5 flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full border border-pink-100 shadow-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${
            backendStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
            backendStatus === 'disconnected' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
            'bg-amber-500 animate-pulse'
          }`} />
          <span className="text-xs font-bold text-pink-900/80">
            {backendStatus === 'connected' ? `Connected` :
             backendStatus === 'disconnected' ? 'Disconnected' :
             'Checking...'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto px-4 pb-12 gap-8">
        
        {appState === 'idle' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 mt-4">
            {/* Live Camera View Column */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-pink-100/50 border border-pink-100/50 relative overflow-hidden flex flex-col items-center">
                
                {/* Visual Webcam Frame Area */}
                <div className="relative w-full aspect-[4/3] bg-pink-50 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner flex flex-col items-center justify-center">
                  {hasPermission === false ? (
                    <div className="text-center p-6 text-pink-400 flex flex-col items-center">
                      <Camera className="w-16 h-16 mb-4 opacity-40 text-pink-300" />
                      <p className="font-bold text-lg">Camera access denied</p>
                      <p className="text-sm opacity-80 max-w-xs mt-1">Please allow camera permissions in your browser to use the Sweet Booth.</p>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className={`absolute inset-0 w-full h-full object-cover ${mirrorPreview ? 'scale-x-[-1]' : ''}`}
                    />
                  )}
                  
                  {/* Grid overlays or frames inside viewfinder for guidance */}
                  <div className="absolute inset-0 pointer-events-none border-[12px] border-white/20 rounded-2xl mix-blend-overlay"></div>
                  
                  {/* Overlay branding overlay in viewfinder */}
                  <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1 shadow">
                    <Camera className="w-3 h-3 text-pink-300" />
                    Viewfinder
                  </div>
                </div>

                {/* Subtitle / Tip */}
                <div className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <Smile className="w-4 h-4 text-pink-400" />
                  <span>Choose a layout on the right and click Start Photobooth!</span>
                </div>
              </div>
            </div>

            {/* Layout and Settings Options Column */}
            <div className="md:col-span-5 flex flex-col gap-6">
              
              {/* Settings Panel */}
              <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-lg border border-pink-100/50 flex flex-col gap-4">
                <h3 className="text-slate-800 font-extrabold text-base flex items-center gap-2 border-b border-pink-50 pb-2">
                  <Sliders className="w-4 h-4 text-pink-400" />
                  Booth Settings
                </h3>
                
                {/* Countdown timer toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Countdown Timer</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-full border">
                    {[3, 5, 7].map((s) => (
                      <button
                        key={s}
                        onClick={() => setTimerSeconds(s)}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                          timerSeconds === s 
                            ? 'bg-pink-500 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {s}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mirror Preview Option */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Mirror Camera View</span>
                  <button
                    onClick={() => setMirrorPreview(!mirrorPreview)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                      mirrorPreview ? 'bg-pink-500' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                        mirrorPreview ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound effect option */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Sound Effects</span>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition-colors flex items-center justify-center"
                    title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Layout Choices */}
              <div className="flex flex-col gap-3">
                <h3 className="text-slate-800 font-extrabold text-base px-2">Choose Layout</h3>
                <div className="grid grid-cols-2 gap-3">
                  {LAYOUTS.map((layout) => {
                    const Icon = layout.icon;
                    const isSelected = selectedLayout === layout.id;
                    
                    return (
                      <button
                        key={layout.id}
                        onClick={() => setSelectedLayout(layout.id)}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all border text-left gap-2 focus:outline-none h-28
                          ${isSelected 
                            ? 'bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-100 scale-[1.02]' 
                            : 'bg-white border-slate-100 text-slate-700 hover:bg-pink-50/50 hover:border-pink-100'
                          }`}
                      >
                        <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-pink-400'}`} strokeWidth={1.5} />
                        <div className="text-center">
                          <div className="font-extrabold text-xs leading-tight">{layout.name}</div>
                          <div className={`text-[10px] mt-0.5 opacity-80 ${isSelected ? 'text-pink-100' : 'text-slate-400'}`}>
                            {layout.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start capture button */}
              <motion.button
                onClick={startCaptureSession}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-pink-200 border-b-4 border-rose-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Camera className="w-6 h-6 animate-bounce" />
                Start Photobooth
              </motion.button>

            </div>
          </div>
        )}

        {/* Capturing Screen */}
        {appState === 'capturing' && (
          <div className="w-full max-w-4xl bg-white p-6 rounded-[2.5rem] shadow-xl border border-pink-100/50 flex flex-col items-center gap-6 mt-4 relative overflow-hidden">
            
            {/* Flash Screen Transition */}
            <AnimatePresence>
              {flash && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 bg-white z-50 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Top Prompt Header */}
            <div className="w-full flex items-center justify-between border-b pb-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Photobooth Session</span>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
                  Pose <span className="text-pink-500">#{currentPhotoIndex + 1}</span> of {activeLayoutObj?.count}
                </h2>
              </div>
              <div className="flex items-center gap-1 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
                <Smile className="w-4 h-4 text-pink-500 animate-spin" />
                <span className="text-xs font-extrabold text-pink-600 uppercase">Say Cheese!</span>
              </div>
            </div>

            {/* Capturing Canvas Area Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Massive Viewfinder Display */}
              <div className="md:col-span-3 aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden relative shadow-inner border border-slate-800">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`absolute inset-0 w-full h-full object-cover ${mirrorPreview ? 'scale-x-[-1]' : ''}`}
                />
                
                {/* Big Countdown Overlay */}
                <AnimatePresence>
                  {countdown !== null && (
                    <motion.div
                      key={countdown}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: [0.9, 1.2, 1], opacity: 1 }}
                      exit={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 0.7 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px] z-20 pointer-events-none"
                    >
                      <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-200 drop-shadow-[0_4px_12px_rgba(236,72,153,0.5)] select-none">
                        {countdown}
                      </span>
                      <span className="text-xs font-bold text-pink-100 uppercase tracking-widest mt-4">
                        Posing time!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Overlay guides */}
                <div className="absolute inset-0 pointer-events-none border-[12px] border-white/10 mix-blend-overlay"></div>
              </div>

              {/* Right Strip Side preview */}
              <div className="flex flex-col gap-3 justify-center items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Captured Frames</span>
                <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[320px] w-full p-2 bg-slate-50 border rounded-2xl shadow-inner items-center justify-center">
                  {Array.from({ length: activeLayoutObj?.count || 4 }).map((_, i) => {
                    const pic = capturedPhotos[i];
                    return (
                      <div 
                        key={i} 
                        className={`relative aspect-[4/3] w-24 md:w-full border-2 rounded-xl overflow-hidden shadow bg-white flex items-center justify-center
                          ${currentPhotoIndex === i ? 'border-pink-500 ring-2 ring-pink-100 scale-105' : 'border-slate-200'}
                          transition-all duration-300`}
                      >
                        {pic ? (
                          <img src={pic} alt={`Capture ${i + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-slate-300 text-xs font-bold flex flex-col items-center gap-1">
                            <Camera className="w-5 h-5 opacity-40" />
                            <span>Pose {i + 1}</span>
                          </div>
                        )}
                        
                        {pic && (
                          <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Info bar */}
            <div className="w-full flex justify-between items-center bg-slate-50 border p-4 rounded-2xl mt-2 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
                <span>Keep smiling! Next photo takes automatically.</span>
              </div>
              <div>
                <span>Timer: <strong className="text-pink-600">{timerSeconds}s</strong> between shots</span>
              </div>
            </div>
          </div>
        )}

        {/* Review / Customization Screen (Post-Photo Scene) */}
        {appState === 'review' && (
          <PostPhotoScene
            capturedPhotos={capturedPhotos}
            selectedLayout={selectedLayout}
            capturedResult={capturedResult}
            saving={saving}
            backendStatus={backendStatus}
            filter={filter}
            setFilter={setFilter}
            frameColor={frameColor}
            setFrameColor={setFrameColor}
            frameText={frameText}
            setFrameText={setFrameText}
            showDate={showDate}
            setShowDate={setShowDate}
            borderSize={borderSize}
            setBorderSize={setBorderSize}
            cornerRadius={cornerRadius}
            setCornerRadius={setCornerRadius}
            fontStyle={fontStyle}
            setFontStyle={setFontStyle}
            stickers={stickers}
            setStickers={setStickers}
            onDownload={downloadCollage}
            onSaveToGallery={saveToGallery}
            onRetakeAll={() => {
              setAppState('idle');
              setCapturedResult(null);
            }}
            onReplaceSinglePose={handleReplaceSinglePose}
            soundEnabled={soundEnabled}
          />
        )}

        {/* Gallery Capture History */}
        {appState === 'idle' && (
          <div className="w-full mt-6 border-t border-pink-100 pt-8">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-500" />
                  Booth Gallery
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Browse past captures saved on your server</p>
              </div>
              <span className="text-xs font-extrabold text-pink-500 px-3 py-1.5 bg-pink-100/50 rounded-full border border-pink-100 shadow-sm">
                {gallery.length} Photos
              </span>
            </div>

            {gallery.length === 0 ? (
              <div className="w-full bg-white/50 backdrop-blur-sm rounded-3xl py-14 border border-pink-50 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
                <ImageIcon className="w-12 h-12 text-pink-200 animate-pulse" />
                <div className="font-bold text-base text-slate-600">No Captures Yet</div>
                <p className="text-xs text-slate-400 max-w-xs leading-normal px-4">Take some lovely photos using the booth above, customize it, and save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {gallery.map((photo) => (
                  <motion.div
                    key={photo.filename}
                    layoutId={`gallery-card-${photo.filename}`}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white p-2 rounded-2xl shadow border border-slate-100 hover:shadow-xl hover:border-pink-200 transition-all duration-300 relative group overflow-hidden cursor-pointer"
                    onClick={() => setViewingPhoto(photo)}
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 border relative">
                      <img 
                        src={photo.url} 
                        alt="Saved Capture" 
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-pink-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingPhoto(photo);
                          }}
                          className="bg-white/95 text-slate-800 p-2.5 rounded-full shadow hover:bg-pink-500 hover:text-white transition-all transform scale-90 group-hover:scale-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePhoto(photo.filename);
                          }}
                          className="bg-white/95 text-rose-600 p-2.5 rounded-full shadow hover:bg-rose-600 hover:text-white transition-all transform scale-90 group-hover:scale-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 px-1 pb-0.5 flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(photo.created_at * 1000).toLocaleDateString()}
                      </span>
                      <span className="text-[9px] font-medium text-slate-300 truncate">
                        {photo.filename}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
