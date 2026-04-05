import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [stage, setStage] = useState(1);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const checkLogic = () => {
    const val = input.toUpperCase().trim();
    
    if (stage === 1 && val === "ELOHIM") {
      setStage(2); setInput(""); setError(false);
    } else if (stage === 2 && val === "2857") {
      setStage(3); setInput(""); setError(false);
    } else if (stage === 3 && val === "PERCAYA") {
      setStage(4); setInput(""); setError(false);
    } else if (stage === 4 && val === "IMAN") {
      setStage(5);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500); 
    }
  };

  const getClueText = (s) => {
    if (s === 1) return "Masukkan Nama Subjek untuk Memulai...";
    if (s === 2) return "Dekripsi Lokasi Berkas... (Hint: 2-8-5-7)";
    if (s === 3) return "Konfirmasi Status Jiwa...";
    if (s === 4) return "TERMINAL BLACKOUT. MASUKKAN KUNCI TERAKHIR...";
  };

  return (
    <div className="min-h-screen bg-black text-terminal-green font-mono p-6 flex flex-col items-center justify-center">
      {/* Efek Garis Terminal CRT */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={stage}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md border border-terminal-green p-8 bg-black/80 shadow-[0_0_15px_rgba(0,255,65,0.2)] relative z-10"
        >
          {stage < 5 ? (
            <>
              <h1 className="text-2xl mb-6 border-b border-terminal-green/30 pb-2">EVIDENCE #{stage}</h1>
              <p className="mb-8 text-sm opacity-90">{getClueText(stage)}</p>
              
              <div className="flex items-center">
                <span className="mr-2">&gt;</span>
                <input 
                  className={`w-full bg-transparent border-b-2 outline-none p-2 transition-colors ${error ? 'border-red-500 text-red-500 animate-pulse' : 'border-terminal-green focus:border-white focus:text-white'}`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkLogic()}
                  autoFocus
                  spellCheck="false"
                  autoComplete="off"
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-2">AKSES DITOLAK. KODE TIDAK VALID.</p>}
            </>
          ) : (
            <div className="text-center bg-white text-black p-10 -m-8 flex flex-col justify-center min-h-[400px]">
              <h2 className="text-4xl font-bold mb-6">2 KORINTUS 5:7</h2>
              <p className="italic text-lg mb-10">"Sebab hidup kami ini adalah hidup karena percaya, bukan karena melihat."</p>
              <button className="bg-black text-white py-4 px-8 rounded-full font-bold animate-bounce shadow-xl">
                LARI & TEKAN BEL SEKARANG!
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;