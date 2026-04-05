import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [stage, setStage] = useState(1);
  const [error, setError] = useState(false);

  // States untuk tiap input
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState(["", "", "", ""]);
  
  // States untuk Sensor
  const [shakeCount, setShakeCount] = useState(0);
  const [heading, setHeading] = useState(null);
  const [sensorGranted, setSensorGranted] = useState(false);

  // States untuk Final
  const [slot1, setSlot1] = useState("");
  const [slot2, setSlot2] = useState("");
  const [strobe, setStrobe] = useState(false);

  // --- LOGIKA SENSOR ---
  const requestSensorAccess = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceMotionEvent.requestPermission();
        if (permissionState === 'granted') setSensorGranted(true);
      } catch (e) { console.error(e); }
    } else {
      setSensorGranted(true); // Untuk Android & Browser biasa
    }
  };

  useEffect(() => {
    if (stage === 3 && sensorGranted) {
      const handleShake = (e) => {
        const { x, y, z } = e.accelerationIncludingGravity || e.acceleration || {x:0, y:0, z:0};
        const acceleration = Math.sqrt(x*x + y*y + z*z);
        if (acceleration > 15) setShakeCount(prev => prev + 1);
      };
      window.addEventListener('devicemotion', handleShake);
      return () => window.removeEventListener('devicemotion', handleShake);
    }
    
    if (stage === 4 && sensorGranted) {
      const handleOrientation = (e) => {
        let dir = e.webkitCompassHeading || Math.abs(e.alpha - 360);
        setHeading(dir);
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [stage, sensorGranted]);

  // --- EFEK STROBE ---
  useEffect(() => {
    if (stage === 6) {
      const interval = setInterval(() => setStrobe(s => !s), 80); // Kedip sangat cepat
      setTimeout(() => clearInterval(interval), 4000); // Berhenti setelah 4 detik
      return () => clearInterval(interval);
    }
  }, [stage]);

  // --- CEK JAWABAN ---
  const showError = () => {
    setError(true);
    setTimeout(() => setError(false), 500);
  };

  const checkStage1 = () => val1.toLowerCase().trim() === "elohim" ? setStage(2) : showError();
  
  const checkStage2 = () => {
    const pin = val2.join("");
    if (pin === "2857") setStage(3);
    else showError();
  };

  const checkStage5 = () => {
    if (slot1.toLowerCase().trim() === "iman" && slot2.toLowerCase().trim() === "melihat") {
      setStage(6);
    } else {
      showError();
    }
  };

  // Render berdasarkan stage
  return (
    <div className={`min-h-screen font-mono p-6 flex flex-col items-center justify-center transition-colors duration-75 ${stage === 6 ? (strobe ? 'bg-white text-black' : 'bg-black text-white') : 'bg-black text-terminal-green'}`}>
      
      {/* Efek Garis Terminal CRT (Hilang di Stage Final) */}
      {stage < 6 && <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50"></div>}

      <AnimatePresence mode="wait">
        <motion.div 
          key={stage}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className={`w-full max-w-md ${stage < 6 ? 'border border-terminal-green p-8 bg-black/80 shadow-[0_0_15px_rgba(0,255,65,0.2)]' : 'p-4'}`}
        >
          
          {/* TAHAP 1: IDENTITY */}
          {stage === 1 && (
            <>
              <h1 className="text-xl mb-4 border-b border-terminal-green/30 pb-2">EVIDENCE #1: IDENTITY</h1>
              <p className="mb-6 opacity-80 text-sm">Masukkan Identitas Sistem...</p>
              <input 
                className={`w-full bg-transparent border-b-2 outline-none p-2 ${error ? 'border-red-500 text-red-500 animate-pulse' : 'border-terminal-green text-white'}`}
                value={val1} onChange={(e) => setVal1(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkStage1()} placeholder="> _" autoFocus
              />
            </>
          )}

          {/* TAHAP 2: COORDINATES */}
          {stage === 2 && (
            <>
              <h1 className="text-xl mb-4 border-b border-terminal-green/30 pb-2">EVIDENCE #2: COORDINATES</h1>
              <p className="mb-2 opacity-80 text-sm">Dekripsi Lokasi Berkas...</p>
              <div className="flex gap-4 justify-center my-8">
                {[0, 1, 2, 3].map((i) => (
                  <input key={i} id={`pin-${i}`}
                    className={`w-12 h-16 text-center text-2xl bg-transparent border-2 outline-none ${error ? 'border-red-500 text-red-500' : 'border-terminal-green text-white'}`}
                    maxLength={1} type="tel" value={val2[i]}
                    onChange={(e) => {
                      const newArr = [...val2];
                      newArr[i] = e.target.value;
                      setVal2(newArr);
                      if(e.target.value && i < 3) document.getElementById(`pin-${i+1}`).focus();
                    }}
                  />
                ))}
              </div>
              <p className="text-center text-xs opacity-60 italic mb-6">Hint: NT - Kitab - Pasal - Ayat</p>
              <button onClick={checkStage2} className="w-full border border-terminal-green py-2 hover:bg-terminal-green hover:text-black">VERIFY COORDINATES</button>
            </>
          )}

          {/* TAHAP 3: THE MIRROR (SHAKE) */}
          {stage === 3 && (
            <div className="text-center">
              <h1 className="text-xl mb-4 border-b border-terminal-green/30 pb-2">EVIDENCE #3: THE MIRROR</h1>
              {!sensorGranted ? (
                <button onClick={requestSensorAccess} className="w-full bg-terminal-green text-black py-4 font-bold my-8 animate-pulse">
                  AKTIFKAN SENSOR HP
                </button>
              ) : (
                <>
                  <p className="mb-4 text-sm opacity-80">Layar tertutup debu digital. Goyangkan perangkat untuk membersihkan.</p>
                  <div className="h-32 border border-terminal-green flex items-center justify-center relative overflow-hidden mb-6">
                    {/* Layer Debu yang menghilang perlahan */}
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-10 flex items-center justify-center" style={{ opacity: Math.max(1 - (shakeCount * 0.1), 0) }}>
                      <span className="text-gray-500 text-xs">SHAKE DEVICE</span>
                    </div>
                    <span className="text-4xl font-bold tracking-widest">BELIEVE</span>
                  </div>
                  {/* Bypass rahasia kalau sensor rusak: klik teks 3 kali */}
                  <button onClick={() => setStage(4)} disabled={shakeCount < 10} className={`w-full py-2 border ${shakeCount >= 10 ? 'border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black' : 'border-gray-800 text-gray-800'}`}>
                    NEXT STAGE
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAHAP 4: THE NAVIGATION (COMPASS) */}
          {stage === 4 && (
            <div className="text-center relative">
              <h1 className="text-xl mb-4 border-b border-terminal-green/30 pb-2" onClick={()=>setStage(5)}>EVIDENCE #4: NAVIGATION</h1>
              <p className="text-sm mb-6 opacity-80">"Iman adalah arah yang tetap di tengah dunia yang membingungkan."</p>
              
              <div className="relative h-48 w-48 mx-auto mb-8 border-2 rounded-full border-terminal-green flex items-center justify-center">
                <div className="absolute w-1 h-24 bg-red-500 top-0 origin-bottom transition-transform duration-100" style={{ transform: `rotate(${-heading || 0}deg)` }}></div>
                
                {/* Kata IMAN yang nge-blur. Akan jelas jika arah utara (0-20 atau 340-360) */}
                <span className={`text-4xl font-bold transition-all duration-500 ${heading < 20 || heading > 340 ? 'blur-none text-white' : 'blur-md text-terminal-green/30'}`}>
                  IMAN
                </span>
              </div>
              <p className="text-xs opacity-60 mb-6">Arahkan perangkatmu untuk menemukan titik fokus.</p>
              
              <button onClick={() => setStage(5)} disabled={!(heading < 20 || heading > 340)} className={`w-full py-2 border ${(heading < 20 || heading > 340) ? 'border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black' : 'border-gray-800 text-gray-800'}`}>
                KUNCI ARAH
              </button>
            </div>
          )}

          {/* TAHAP 5: THE SYNTHESIS */}
          {stage === 5 && (
            <>
              <h1 className="text-xl mb-6 border-b border-terminal-green/30 pb-2">FINAL SYNTHESIS</h1>
              <div className="text-lg leading-loose mb-8">
                "Sebab kami hidup oleh <input className={`bg-transparent border-b border-terminal-green w-24 text-center text-white outline-none mx-2 ${error && 'border-red-500'}`} value={slot1} onChange={(e)=>setSlot1(e.target.value)} placeholder="..." /> 
                bukan karena <input className={`bg-transparent border-b border-terminal-green w-24 text-center text-white outline-none mx-2 ${error && 'border-red-500'}`} value={slot2} onChange={(e)=>setSlot2(e.target.value)} placeholder="..." />."
              </div>
              <p className="text-xs opacity-50 mb-6 italic">Pilihan Data: Dunia | Logika | Iman | Melihat</p>
              <button onClick={checkStage5} className="w-full bg-terminal-green text-black py-3 font-bold hover:bg-white transition-colors">SUBMIT VERDICT</button>
            </>
          )}

          {/* FINAL REVEAL (STAGE 6) */}
          {stage === 6 && (
            <div className="text-center h-[80vh] flex flex-col justify-center items-center">
              {!strobe && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}>
                  <p className="text-terminal-green mb-8 tracking-widest text-sm">CONGRATULATIONS! YOU FOUND THE TRUTH.</p>
                  <h2 className="text-5xl font-bold mb-6 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">2 KORINTUS 5:7</h2>
                  <p className="italic text-xl mb-16 text-gray-300 px-4">"Sebab hidup kami ini adalah hidup karena percaya, bukan karena melihat."</p>
                  
                  <button className="bg-red-600 text-white py-4 px-8 rounded-full font-bold text-lg animate-bounce shadow-[0_0_20px_rgba(255,0,0,0.6)] border-2 border-red-400">
                    [ SILAHKAN MAJU KEDEPAN SEKARANG ]
                  </button>
                </motion.div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;