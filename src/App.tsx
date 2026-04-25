/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Smartphone, ShieldCheck, Zap, Download, Image as ImageIcon, ChevronLeft, CreditCard, Filter, Check, Search, X, Crown, Lock, Heart } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import confetti from 'canvas-confetti';
import Fuse from 'fuse.js';
import { WALLPAPERS, Wallpaper } from './data/wallpapers';

type Screen = 'home' | 'grid' | 'detail';

const ParallaxGridItem = ({ 
  wall, 
  index, 
  isPaid, 
  isFavorite, 
  onToggleFavorite, 
  onClick 
}: { 
  wall: Wallpaper, 
  index: number, 
  isPaid: boolean, 
  isFavorite: boolean, 
  onToggleFavorite: (e: React.MouseEvent) => void, 
  onClick: () => void 
}) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group shadow-lg border border-white/5 bg-border-dark"
    >
      <motion.img 
        src={wall.url} 
        alt={wall.title} 
        style={{ y, scale: 1.2 }}
        className={`w-full h-full object-cover transition-opacity duration-700 ${wall.premium && !isPaid ? 'blur-sm opacity-40' : 'opacity-70 group-hover:opacity-100'}`} 
      />
      
      {/* Favorite Button */}
      <button
        onClick={onToggleFavorite}
        className={`absolute top-2 left-2 p-1.5 rounded-full z-20 backdrop-blur-md transition-all border ${isFavorite 
          ? 'bg-neon-pink/10 border-neon-pink/50 text-neon-pink' 
          : 'bg-black/20 border-white/10 text-white/40 hover:text-white'}`}
      >
        <Heart className={`w-3 h-3 ${isFavorite ? 'fill-neon-pink' : ''}`} />
      </button>

      {wall.premium && (
        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full flex items-center gap-1 border shadow-lg z-20 ${isPaid ? 'bg-neon-pink/10 border-neon-pink/50 text-neon-pink' : 'bg-white/10 border-white/20 text-white/40'}`}>
          <Crown className="w-2.5 h-2.5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">PRO</span>
        </div>
      )}
      {wall.premium && !isPaid && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Lock className="w-6 h-6 text-white/20" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
        <p className="text-[10px] font-bold uppercase tracking-wider">{wall.title}</p>
        <p className="text-[8px] opacity-60 uppercase tracking-tighter">{wall.category}</p>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [selectedWall, setSelectedWall] = useState<Wallpaper | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSetting, setIsSetting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const paid = localStorage.getItem('NEON_WALLS_PAID') === 'true';
    setIsPaid(paid);
    
    const storedFavorites = localStorage.getItem('NEON_WALLS_FAVORITES');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(id) 
      ? favorites.filter(favId => favId !== id) 
      : [...favorites, id];
    
    setFavorites(newFavorites);
    localStorage.setItem('NEON_WALLS_FAVORITES', JSON.stringify(newFavorites));
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(WALLPAPERS.map(w => w.category)));
    const baseCats = ['All', ...cats];
    if (favorites.length > 0) {
      baseCats.splice(1, 0, 'Favorites');
    }
    return baseCats;
  }, [favorites]);

  const filteredWallpapers = useMemo(() => {
    let result = WALLPAPERS;
    
    if (selectedCategory === 'Favorites') {
      result = result.filter(w => favorites.includes(w.id));
    } else if (selectedCategory !== 'All') {
      result = result.filter(w => w.category === selectedCategory);
    }
    
    if (searchQuery.trim() !== '') {
      const fuse = new Fuse(result, {
        keys: ['title', 'category'],
        threshold: 0.3,
        distance: 100,
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }
    
    return result;
  }, [selectedCategory, searchQuery]);

  const handleSetWallpaper = () => {
    if (selectedWall?.premium && !isPaid) {
      alert("This is a Premium wallpaper. Please unlock access for ₹10.");
      setScreen('home');
      return;
    }

    setIsSetting(true);
    // Simulate setting wallpaper
    setTimeout(() => {
      setIsSetting(false);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FFFF', '#FF00FF', '#FFFFFF']
      });
      alert(`"Success: ${selectedWall?.title}" has been set as your wallpaper! (Simulated)`);
    }, 1500);
  };

  const handleDownload = async () => {
    if (!selectedWall) return;
    
    if (selectedWall.premium && !isPaid) {
      alert("Premium content requires a one-time payment of ₹10.");
      setScreen('home');
      return;
    }

    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const response = await fetch(selectedWall.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedWall.title.replace(/\s+/g, '_')}_NeonWalls.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Download failed', error);
      // Fallback: open in new tab
      window.open(selectedWall.url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePayment = () => {
    const upiUrl = `upi://pay?pa=show.5@superyes&pn=Wallpaper App&tn=Unlock Wallpapers&am=10&cu=INR`;
    
    // Open UPI intent
    window.location.href = upiUrl;
    
    // In AI Studio / Browser Preview, UPI might not open.
    // We simulate authentication/payment success for the user's convenience.
    alert("Opening UPI Intent. Processing simulated success in 3 seconds...");
    
    setTimeout(() => {
      localStorage.setItem('NEON_WALLS_PAID', 'true');
      setIsPaid(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FFFF', '#FF00FF']
      });
      alert("SUCCESS: Premium Access Unlocked!");
    }, 3000);
  };

  const handleUnlock = () => {
    // Manually setting paid for development/demo ease if user wants to skip
    localStorage.setItem('NEON_WALLS_PAID', 'true');
    setIsPaid(true);
    alert("Payment Simluated: Premium Unlocked!");
  };

  const handleReset = () => {
    localStorage.removeItem('NEON_WALLS_PAID');
    setIsPaid(false);
    alert("App state reset. Premium features are now locked.");
    setScreen('home');
  };

  const openGrid = () => {
    setScreen('grid');
    // Previously blocked free users, now we let them browse but lock premium walls
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans overflow-x-hidden grid-pattern">
      {/* Background Branding */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-blue rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-pink rounded-full blur-[120px]"></div>
      </div>

      <header className="mb-10 text-center relative z-10 scale-90 sm:scale-100">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase text-neon-blue neon-blue-shadow" style={{ textShadow: '0 0 20px rgba(0,255,255,0.3)' }}>
          NEON WALLS PRO
        </h1>
        <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase opacity-40 mt-3">
          Premium Wallpaper Architecture • UPI Integrated
        </p>
      </header>

      <main className="relative z-10 w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card-dark border-4 border-border-dark rounded-[40px] overflow-hidden shadow-2xl h-[600px] flex flex-col relative"
            >
              <StatusBar />
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-border-dark border border-neon-blue transition-all duration-500 group">
                    <Zap className="w-10 h-10 text-neon-blue animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-neon-blue/20 blur-2xl rounded-full -z-10"></div>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">Access Control</h2>
                  <p className="text-xs text-white/40 uppercase tracking-widest px-4">
                    Secure your digital aesthetic
                  </p>
                </div>

                <div className="w-full space-y-4">
                  {!isPaid ? (
                    <button
                      onClick={handlePayment}
                      className="w-full py-5 bg-border-dark text-neon-blue border border-neon-blue rounded-2xl font-bold uppercase tracking-[0.2em] text-sm hover:bg-neon-blue hover:text-black transition-all active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                    >
                      Unlock Premium ₹10
                    </button>
                  ) : (
                    <div className="w-full py-5 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Premium Unlocked
                    </div>
                  )}

                  <button
                    onClick={openGrid}
                    className={`w-full py-5 font-bold uppercase tracking-[0.2em] text-sm rounded-2xl border transition-all active:scale-95
                      bg-border-dark text-neon-pink border-neon-pink hover:bg-neon-pink hover:text-white shadow-[0_0_15px_rgba(255,0,255,0.1)]`}
                  >
                    Open Wallpapers
                  </button>
                  
                  {!isPaid && (
                    <div className="flex flex-col gap-2 w-full">
                      <button 
                        onClick={handleUnlock}
                        className="w-full text-[10px] text-white/20 uppercase tracking-[0.1em] hover:text-white/40 transition-colors"
                      >
                        (Simulator Only: Skip Payment)
                      </button>
                    </div>
                  )}
                  {isPaid && (
                    <button 
                      onClick={handleReset}
                      className="w-full text-[10px] text-white/20 uppercase tracking-[0.1em] hover:text-white/40 transition-colors"
                    >
                      (Reset Premium Status for Testing)
                    </button>
                  )}
                </div>

                <div className="absolute bottom-10 w-full text-center px-8">
                  <p className="text-[9px] uppercase tracking-widest opacity-30 leading-relaxed">
                    Secure UPI Payment Gateway<br />
                    show.5@superyes
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card-dark border-4 border-border-dark rounded-[40px] overflow-hidden shadow-2xl h-[600px] flex flex-col relative"
            >
              <StatusBar />
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setScreen('home')} className="p-2 -ml-2 text-white/40 hover:text-white">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <AnimatePresence mode="wait">
                    {!isSearchOpen ? (
                      <motion.span 
                        key="title"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40"
                      >
                        Collection
                      </motion.span>
                    ) : (
                      <motion.div 
                        key="search"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: '100%' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex-1 px-4"
                      >
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="SEARCH..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white/5 border-b border-neon-blue/50 text-[10px] uppercase tracking-widest text-white px-2 py-1 focus:outline-none placeholder:text-white/20"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen);
                      if (isSearchOpen) setSearchQuery('');
                    }} 
                    className={`p-2 text-white/40 hover:text-white transition-colors ${isSearchOpen ? 'text-neon-blue opacity-100' : ''}`}
                  >
                    {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border
                          ${selectedCategory === cat 
                            ? 'bg-neon-blue text-black border-neon-blue' 
                            : 'bg-border-dark text-white/40 border-white/10 hover:border-white/20'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {filteredWallpapers.map((wall, idx) => (
                      <ParallaxGridItem 
                        key={wall.id}
                        wall={wall}
                        index={idx}
                        isPaid={isPaid}
                        isFavorite={favorites.includes(wall.id)}
                        onToggleFavorite={(e) => toggleFavorite(e, wall.id)}
                        onClick={() => {
                          setSelectedWall(wall);
                          setScreen('detail');
                        }}
                      />
                    ))}
                  </div>
                  {filteredWallpapers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                      <ImageIcon className="w-12 h-12 mb-4" />
                      <p className="text-xs uppercase tracking-widest">No wallpapers found</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />
            </motion.div>
          )}

          {screen === 'detail' && selectedWall && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card-dark border-4 border-neon-blue rounded-[40px] overflow-hidden shadow-[0_0_40px_rgba(0,255,255,0.2)] h-[600px] flex flex-col relative"
            >
              <div className="absolute inset-0 z-0">
                <img src={selectedWall.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
              </div>
              
              <StatusBar isLight />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="p-6 flex items-center justify-between">
                  <button 
                    onClick={() => setScreen('grid')} 
                    className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={(e) => toggleFavorite(e, selectedWall.id)}
                    className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-all ${favorites.includes(selectedWall.id) 
                      ? 'bg-neon-pink/10 border-neon-pink/50 text-neon-pink shadow-lg shadow-neon-pink/20' 
                      : 'bg-black/20 border-white/10 text-white'}`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(selectedWall.id) ? 'fill-neon-pink' : ''}`} />
                  </button>
                </div>
                
                <div className="mt-auto p-6 space-y-4 pb-12">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-blue">{selectedWall.category}</span>
                      {selectedWall.premium && (
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-tighter uppercase flex items-center gap-1 border ${isPaid ? 'bg-neon-pink/10 border-neon-pink/20 text-neon-pink' : 'bg-white/10 border-white/20 text-white/40'}`}>
                          <Crown className="w-2 h-2" />
                          PRO Exclusive
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedWall.title}</h2>
                  </div>
                  
                  {selectedWall.premium && !isPaid ? (
                    <button 
                      onClick={handlePayment}
                      className="w-full py-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white/50 flex flex-col items-center justify-center gap-1 hover:bg-white/10 hover:text-white transition-all active:scale-95 group shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                    >
                      <Lock className="w-5 h-5 mb-1 group-hover:text-neon-pink transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">Unlock to Access</span>
                      <span className="text-[8px] opacity-40 uppercase tracking-widest font-medium">Secure UPI: ₹10</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 pt-4">
                      <button 
                        onClick={handleSetWallpaper}
                        disabled={isSetting}
                        className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-full bg-neon-blue/20 backdrop-blur-xl border border-neon-blue/50 text-neon-blue shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${isSetting ? 'animate-pulse' : ''}`}
                      >
                        {isSetting ? (
                          <Check className="w-4 h-4 animate-bounce" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                        {isSetting ? 'Applying...' : 'Set Wallpaper'}
                      </button>
                      <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 ${isDownloading ? 'animate-pulse' : ''} ${downloadSuccess ? 'border-neon-blue/50 text-neon-blue bg-neon-blue/5' : ''}`}
                      >
                        {isDownloading ? (
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : downloadSuccess ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        {isDownloading ? 'Downloading...' : downloadSuccess ? 'Download Complete' : 'Download HD'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full z-20" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-16 opacity-20 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] relative z-10 text-center">
        <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Encrypted Transaction</span>
        <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> High Fidelity Assets</span>
        <span className="flex items-center gap-2"><Smartphone className="w-3 h-3" /> v1.0.4-Build</span>
      </footer>
    </div>
  );
}

function StatusBar({ isLight = false }: { isLight?: boolean }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className={`h-8 w-full flex justify-between items-center px-8 relative z-50 ${isLight ? 'text-white' : 'text-white/40'} text-[10px] font-medium`}>
      <span>{timeString}</span>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-2 border border-current rounded-[1px] relative">
          <div className="absolute inset-[1px] bg-current w-[80%]" />
        </div>
        <span>100%</span>
      </div>
    </div>
  );
}
