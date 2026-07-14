import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, LayoutGrid, Rows4, Square, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

// --- Mock Data ---
const LAYOUTS = [
  { id: 'strip-4', name: '4-Cut Strip', icon: Rows4, desc: 'Classic 1x4 photobooth strip' },
  { id: 'grid-4', name: '2x2 Grid', icon: LayoutGrid, desc: 'Square 2x2 collage' },
  { id: 'single', name: 'Single Shot', icon: Square, desc: 'One big polaroid' },
  { id: 'strip-3', name: '3-Cut Strip', icon: Rows4, desc: 'Compact 1x3 strip' },
  { id: 'collage', name: 'Collage', icon: ImageIcon, desc: 'Freestyle layout' },
];

// --- Components ---

function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        // Silently handle the error as it's expected in environments without camera access
        setHasPermission(false);
      }
    }
    setupCamera();

    return () => {
      // Cleanup video stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-square md:aspect-[4/3] bg-pink-100/50 rounded-2xl overflow-hidden border-4 border-white shadow-xl flex flex-col items-center justify-center">
      {hasPermission === false ? (
        <div className="text-center p-6 text-pink-400 flex flex-col items-center">
          <Camera className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-medium">Camera access denied</p>
          <p className="text-sm opacity-70">Please allow camera access to use the photobooth.</p>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
      )}
      
      {/* Decorative frame overlay */}
      <div className="absolute inset-0 pointer-events-none border-[12px] border-white/20 rounded-2xl mix-blend-overlay"></div>
    </div>
  );
}

export default function App() {
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0].id);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendMessage, setBackendMessage] = useState<string>('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to connect');
        return res.json();
      })
      .then((data) => {
        setBackendStatus('connected');
        setBackendMessage(data.message || 'Connected');
      })
      .catch((err) => {
        console.error(err);
        setBackendStatus('disconnected');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="pt-8 pb-4 px-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2 text-pink-500"
        >
          <Sparkles className="w-6 h-6" />
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
            Sweet Booth
          </h1>
          <Sparkles className="w-6 h-6" />
        </motion.div>
        <p className="text-pink-400/80 font-medium mt-1">Capture your lovely moments</p>

        {/* Backend Connection Status */}
        <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full border border-pink-100 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${
            backendStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
            backendStatus === 'disconnected' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
            'bg-amber-500 animate-pulse'
          }`} />
          <span className="text-xs font-semibold text-pink-800">
            {backendStatus === 'connected' ? `Backend Connected: ${backendMessage}` :
             backendStatus === 'disconnected' ? 'Backend Disconnected' :
             'Checking Backend...'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center w-full max-w-4xl mx-auto px-4 pb-6 gap-8">
        
        {/* Camera / Photobooth Canvas Area */}
        <div className="w-full max-w-2xl mt-4 relative">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-[2rem] shadow-sm ring-1 ring-pink-100"
          >
            <CameraView />
            
            {/* Capture Action (Placeholder) */}
            <div className="mt-6 mb-2 flex justify-center">
              <button className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 hover:bg-pink-200 transition-colors">
                <div className="absolute inset-2 bg-pink-500 rounded-full group-hover:scale-95 transition-transform"></div>
                <div className="absolute inset-2 border-2 border-white rounded-full group-active:scale-90 transition-transform"></div>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Layout Selection Scrollbar */}
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-pink-800 font-semibold text-lg">Choose Layout</h2>
            <span className="text-sm font-medium text-pink-400 px-3 py-1 bg-pink-100/50 rounded-full">
              {LAYOUTS.find(l => l.id === selectedLayout)?.name}
            </span>
          </div>
          
          <div className="overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar flex gap-4 snap-x">
            {LAYOUTS.map((layout) => {
              const Icon = layout.icon;
              const isSelected = selectedLayout === layout.id;
              
              return (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id)}
                  className={`relative flex-none w-32 h-40 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all snap-center focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2
                    ${isSelected 
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-200 scale-105' 
                      : 'bg-white text-pink-600 shadow-sm hover:shadow-md hover:bg-pink-50 border border-pink-100'
                    }`}
                >
                  <Icon className={`w-10 h-10 ${isSelected ? 'text-white' : 'text-pink-400'}`} strokeWidth={1.5} />
                  <div className="text-center">
                    <div className="font-semibold text-sm leading-tight">{layout.name}</div>
                    <div className={`text-[10px] mt-1 ${isSelected ? 'text-pink-100' : 'text-pink-300'}`}>
                      {layout.desc}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div 
                      layoutId="layout-active-indicator"
                      className="absolute inset-0 rounded-2xl border-2 border-pink-400 pointer-events-none"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </main>

      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}
