import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- HELPER UNTUK SUARA & VIBRATE ---
const playSound = (src) => {
  const audio = new Audio(src);
  audio.volume = 0.5;
  audio.play().catch(e => console.log("Audio play blocked", e));
};

const vibrate = (pattern) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

function App() {
  const [stage, setStage] = useState(1);
  const [error, setError] = useState(false);
  const [internalStep, setInternalStep] = useState(0); // Untuk handle pop-up di dalam stage

  // States untuk tiap input
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState(["", "", "", ""]);
  
  // States untuk Sensor
  const [shakeCount, setShakeCount] = useState(0);
  const [heading, setHeading] = useState(null);
  const [sensorGranted, setSensorGranted] = useState(false);
  const lastVibrate = useRef(0);

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
    // Stage 3: Shake
    if (stage === 3 && sensorGranted && internalStep === 0) {
      const handleShake = (e) => {
        const { x, y, z } = e.accelerationIncludingGravity || e.acceleration || {x:0, y:0, z:0};
        const acceleration = Math.sqrt(x*x + y*y + z*z);
        if (acceleration > 15) {
          setShakeCount(prev => prev + 1);
          // Suara gesekan kaca saat digoyangkan
          if (shakeCount % 5 === 0) playSound('/sounds/rub.mp3');
        }
      };
      window.addEventListener('devicemotion', handleShake);
      return () => window.removeEventListener('devicemotion', handleShake);
    }
    
    // Stage 4: Compass & Vibrate
    if (stage === 4 && sensorGranted && internalStep === 1) {
      const handleOrientation = (e) => {
        let dir = e.webkitCompassHeading || Math.abs(e.alpha - 360);
        setHeading(dir);

        // Logika Getar (semakin dekat utara, semakin kuat/sering)
        const now = Date.now();
        const isNear = (dir < 30 || dir > 330);
        const isSpotOn = (dir < 10 || dir > 350);

        if (isSpotOn && now - lastVibrate.current > 200) {
          vibrate([100]); // Getar kuat terus menerus
          lastVibrate.current = now;
        } else if (isNear && now - lastVibrate.current > 500) {
          vibrate([50]); // Getar pelan berjeda
          lastVibrate.current = now;
        }
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [stage, sensorGranted, internalStep, shakeCount]);

  // Efek Suara Angin Hilang di Stage 3
  useEffect(() => {
    if (stage === 3 && shakeCount >= 20) {
      playSound('/sounds/wind_fade.mp3');
    }
  }, [stage, shakeCount]);

  // --- EFEK STROBE FINAL ---
  useEffect(() => {
    if (stage === 6 && internalStep === 1) {
      const interval = setInterval(() => setStrobe(s => !s), 80);
      setTimeout(() => clearInterval(interval), 3000); 
      return () => clearInterval(interval);
    }
  }, [stage, internalStep]);

  // --- CEK JAWABAN & WRONG INPUT HANDLING ---
  const showError = () => {
    setError(true);
    vibrate([100, 50, 100]); // Getar tanda salah
    setTimeout(() => setError(false), 1000); // Kedip 1 detik
  };

  const checkStage1 = () => val1.toLowerCase().trim() === "elohim" ? setStage(2) : showError();
  
  const checkStage2 = () => {
    const pin = val2.join("");
    if (pin === "2857") setStage(3);
    else showError();
  };

  const checkStage5 = () => {
    if (slot1.toLowerCase().trim() === "iman" && slot2.toLowerCase().trim() === "melihat") {
      // Suara Heavy Lock Unlocking & Transisi
      playSound('/sounds/lock_open.mp3');
      vibrate([500]);
      setStage(6);
      setTimeout(() => setInternalStep(1), 2000); // Blackout sebentar sebelum congrats
    } else {
      showError();
    }
  };

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exitDown: { y: '100vh', opacity: 0, transition: { duration: 0.8, ease: 'backIn' } }
  };

  const typeInVariants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 50, delay: 0.2 } }
  };

  const flyInTopVariants = {
    hidden: { y: '-100vh', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', duration: 1, delay: 0.5 } }
  };

  return (
    <div className={`min-h-screen font-mono p-6 flex flex-col items-center justify-center transition-colors duration-75 ${stage === 6 ? (strobe ? 'bg-white text-black' : 'bg-black text-white') : 'bg-black text-terminal-green'}`}>
      
      {/* Efek Garis Terminal CRT */}
      {stage < 6 && <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50"></div>}

      <AnimatePresence mode="wait">
        
        {/* WRONG INPUT OVERLAY */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-red-900/90 z-[100] flex items-center justify-center border-4 border-red-500">
            <h1 className="text-5xl font-bold text-white animate-pulse">WRONG INPUT</h1>
          </motion.div>
        )}

        {/* ----- MAIN ROUTER STAGES ----- */}
        <motion.div 
          key={`${stage}-${internalStep}`}
          variants={containerVariants}
          initial="hidden"
          animate={stage === 4 && internalStep === 2 ? "exitDown" : "visible"}
          exit="hidden"
          className={`w-full max-w-md ${stage < 6 && internalStep === 0 ? 'border border-terminal-green p-8 bg-black/80 shadow-[0_0_15px_rgba(0,255,65,0.2)]' : 'p-2'}`}
        >
          
          {/* TAHAP 1: IDENTITY */}
          {stage === 1 && (
            <>
              <h1 className="text-xl mb-4 border-b border-terminal-green/30 pb-2 text-white">EVIDENCE #1</h1>
              <p className="mb-6 opacity-80 text-sm">Masukkan password yang ditemukan pada video pertama...</p>
              <input 
                className="w-full bg-transparent border-b-2 outline-none p-2 border-terminal-green text-white focus:border-white transition-colors"
                value={val1} onChange={(e) => setVal1(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkStage1()} placeholder="> _" autoFocus spellCheck="false" autoComplete="off"
              />
            </>
          )}

          {/* TAHAP 2: COORDINATES */}
          {stage === 2 && (
            <>
              <h1 className="text-xl mb-4 border-b border-terminal-green/30 pb-2 text-white">EVIDENCE #2</h1>
              <p className="mb-2 opacity-80 text-sm">Dekripsi Lokasi Berkas...</p>
              <div className="flex gap-4 justify-center my-8">
                {[0, 1, 2, 3].map((i) => (
                  <input key={i} id={`pin-${i}`}
                    className="w-12 h-16 text-center text-3xl bg-transparent border-2 outline-none border-terminal-green text-white focus:border-white focus:bg-terminal-green/10"
                    maxLength={1} type="tel" value={val2[i]}
                    onChange={(e) => {
                      const newArr = [...val2];
                      newArr[i] = e.target.value.replace(/[^0-9]/g, '');
                      setVal2(newArr);
                      if(e.target.value && i < 3) document.getElementById(`pin-${i+1}`).focus();
                    }}
                  />
                ))}
              </div>
              <div className="text-xs opacity-70 italic mb-6 space-y-2 text-center bg-terminal-green/5 p-4 border border-terminal-green/20">
                <p>Kebenaran tidak bertebaran tanpa makna. Ia memiliki koordinat yang presisi.</p>
                <p>Gunakan petunjuk yang sudah kami sebar di instagram untuk menemukan jalan ini.</p>
                <p className="font-bold text-terminal-green">(NT - Kitab - Pasal - Ayat)</p>
              </div>
              <button onClick={checkStage2} className="w-full border border-terminal-green py-3 text-sm font-bold hover:bg-terminal-green hover:text-black transition-colors">VERIFY COORDINATES</button>
            </>
          )}

          {/* TAHAP 3: THE MIRROR (SHAKE) */}
          {stage === 3 && internalStep === 0 && (
            <div className="text-center">
              <h1 className="text-xl mb-4 border-b border-terminal-green/30 pb-2 text-white">EVIDENCE #3</h1>
              {!sensorGranted ? (
                <button onClick={requestSensorAccess} className="w-full bg-terminal-green text-black py-4 font-bold my-8 animate-pulse text-lg">
                  AKTIFKAN SENSOR HP
                </button>
              ) : (
                <>
                  <p className="mb-6 text-sm opacity-90 leading-relaxed px-2 text-justify">Terkadang dunia menjadi begitu bising dan buram, menutupi apa yang seharusnya nyata. Jangan biarkan pandanganmu tertipu oleh kabut. Guncangkan keraguanmu, bersihkan sisa-sisanya, dan temukan apa yang tersisa saat semuanya runtuh. <span className="text-terminal-green font-bold">(Goyangkan perangkatmu)</span></p>
                  <div className="h-32 border border-terminal-green flex items-center justify-center relative overflow-hidden mb-8 bg-black">
                    {/* Layer Debu yang menghilang (Dibikin lebih lama: butuh 20 shake) */}
                    <motion.div animate={{ opacity: Math.max(1 - (shakeCount * 0.05), 0) }} className="absolute inset-0 bg-gray-950 backdrop-blur-sm z-10 flex items-center justify-center p-4">
                      <span className="text-gray-600 text-xs tracking-widest animate-pulse">CLEARING THE FOG... ({Math.min(shakeCount*5, 100)}%)</span>
                    </motion.div>
                    <span className="text-4xl font-bold tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">BELIEVE</span>
                  </div>
                  <button onClick={() => setInternalStep(1)} disabled={shakeCount < 20} className={`w-full py-3 border font-bold ${shakeCount >= 20 ? 'border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black' : 'border-gray-800 text-gray-800'}`}>
                    NEXT STAGE
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAHAP 3 INTERNAL POPUP: BELIEVE */}
          {stage === 3 && internalStep === 1 && (
            <motion.div initial="hidden" animate="visible" variants={typeInVariants} className="text-center p-6 border-2 border-white bg-black text-white">
              <p className="text-xl mb-8 leading-relaxed">Satu kata yang tetap teguh saat dunia berguncang: <br/> <span className="text-3xl font-bold tracking-wider text-terminal-green drop-shadow-[0_0_5px_rgba(0,255,65,0.5)]">BELIEVE</span></p>
              <button onClick={() => { setStage(4); setInternalStep(0); }} className="bg-white text-black py-2 px-10 font-bold hover:bg-terminal-green transition-colors">OKE</button>
            </motion.div>
          )}

          {/* TAHAP 4 INTERNAL POPUP: NARASI MATA JASMAANI */}
          {stage === 4 && internalStep === 0 && (
            <motion.div initial="hidden" animate="visible" variants={typeInVariants} className="p-6 border-2 border-terminal-green bg-black text-terminal-green text-justify space-y-4 shadow-[0_0_15px_rgba(0,255,65,0.3)]">
              <p className="text-sm leading-relaxed">Mata jasmanimu memiliki batas cakrawala, tapi langkahmu tidak boleh berhenti di sana. Di tengah badai yang membingungkan, ada arah yang tak pernah berubah.</p>
              <p className="text-sm leading-relaxed">Arahkan hatimu pada satu titik yang tak terlihat, karena di sanalah kebenaran berdiam.</p>
              <div className="text-center pt-4">
                <button onClick={() => setInternalStep(1)} className="border border-terminal-green text-terminal-green py-2 px-10 font-bold hover:bg-terminal-green hover:text-black">MENGERTI</button>
              </div>
            </motion.div>
          )}

          {/* TAHAP 4: THE NAVIGATION (COMPASS) */}
          {stage === 4 && internalStep === 1 && (
            <div className="text-center relative">
              <h1 className="text-xl mb-4 border-b border-terminal-green/30 pb-2 text-white">EVIDENCE #4</h1>
              <p className="text-sm mb-6 opacity-90 px-4 text-terminal-green font-bold">Cari arah Utara jiwamu. Temukan titik nol di mana penglihatanmu berakhir dan keyakinanmu dimulai.</p>
              
              <div className="relative h-48 w-48 mx-auto mb-8 border-2 rounded-full border-terminal-green flex items-center justify-center shadow-[0_0_10px_rgba(0,255,65,0.2)]">
                <div className="absolute w-1 h-24 bg-red-500 top-0 origin-bottom transition-transform duration-100" style={{ transform: `rotate(${-heading || 0}deg)` }}></div>
                <div className="absolute font-bold text-xs text-terminal-green top-1">N</div>
                
                {/* Kata IMAN yang nge-blur. */}
                <span className={`text-4xl font-bold transition-all duration-300 ${heading < 15 || heading > 345 ? 'blur-none text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'blur-md text-terminal-green/20'}`}>
                  IMAN
                </span>
              </div>
              
              <button onClick={() => setInternalStep(2)} disabled={!(heading < 15 || heading > 345)} className={`w-full py-3 border font-bold ${(heading < 15 || heading > 345) ? 'border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black' : 'border-gray-800 text-gray-800'}`}>
                KUNCI ARAH
              </button>
            </div>
          )}

          {/* TAHAP 4 INTERNAL POPUP: IMAN FLY IN */}
          {stage === 4 && internalStep === 2 && (
             <motion.div initial="hidden" animate="visible" variants={flyInTopVariants} onAnimationComplete={() => setTimeout(()=>setStage(5), 2500)} className="text-center p-6 border-2 border-white bg-black text-white shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <p className="text-lg mb-4 leading-relaxed opacity-80">Satu-satunya alat navigasi yang kau butuhkan adalah</p>
              <h1 className="text-5xl font-bold tracking-widest text-terminal-green drop-shadow-[0_0_10px_rgba(0,255,65,0.7)]">IMAN</h1>
            </motion.div>
          )}

          {/* TAHAP 5 INTERNAL POPUP: SEBELUM SOAL */}
          {stage === 5 && internalStep === 0 && (
            <motion.div initial="hidden" animate="visible" variants={typeInVariants} className="p-6 border-2 border-terminal-green bg-black text-terminal-green shadow-[0_0_15px_rgba(0,255,65,0.3)] text-center space-y-4">
              <p className="text-sm leading-relaxed px-2">Berkas perkara hampir selesai. Semua bukti telah terkumpul.</p>
              <p className="text-sm leading-relaxed font-bold bg-terminal-green/10 p-3 border border-terminal-green/30">Sekarang, lengkapi pernyataan terakhir ini untuk membuka pintu kebenaran yang sejati. Ini bukan soal apa yang kau lihat, tapi soal siapa yang kau percaya.</p>
              <div className="text-center pt-2">
                <button onClick={() => setInternalStep(1)} className="border border-terminal-green text-terminal-green py-2 px-10 font-bold hover:bg-terminal-green hover:text-black">SAYA SIAP</button>
              </div>
            </motion.div>
          )}

          {/* TAHAP 5: THE SYNTHESIS */}
          {stage === 5 && internalStep === 1 && (
            <div className="text-center px-2">
              <h1 className="text-xl mb-8 border-b border-terminal-green/30 pb-2 text-white">FINAL SYNTHESIS</h1>
              <div className="text-xl leading-loose mb-12 text-white font-medium">
                "Sebab kami hidup oleh <input className={`bg-transparent border-b-2 border-terminal-green w-28 text-center text-terminal-green font-bold outline-none mx-1 focus:border-white focus:text-white transition-colors ${error && 'border-red-500 text-red-500'}`} value={slot1} onChange={(e)=>setSlot1(e.target.value)} placeholder="..." spellCheck="false" autoComplete="off" /> <br/>
                bukan karena <input className={`bg-transparent border-b-2 border-terminal-green w-28 text-center text-terminal-green font-bold outline-none mx-1 focus:border-white focus:text-white transition-colors ${error && 'border-red-500 text-red-500'}`} value={slot2} onChange={(e)=>setSlot2(e.target.value)} placeholder="..." spellCheck="false" autoComplete="off" />."
              </div>
              <button onClick={checkStage5} className="w-full bg-terminal-green text-black py-4 font-extrabold hover:bg-white transition-colors text-lg shadow-[0_0_15px_rgba(0,255,65,0.4)]">SUBMIT VERDICT</button>
            </div>
          )}

          {/* FINAL REVEAL (STAGE 6) */}
          {stage === 6 && (
            <div className="text-center h-[90vh] flex flex-col justify-center items-center">
              {/* Internal Step 0: Blackout & Slamming Door sound played in checkStage5 */}
              
              {/* Internal Step 1: Congrats & Ayat */}
              {internalStep === 1 && !strobe && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 1, type:'spring' }}>
                  <p className="text-terminal-green mb-8 tracking-widest text-sm font-bold bg-terminal-green/10 py-2 px-4 border border-terminal-green/30 inline-block">CONGRATULATIONS! YOU FOUND THE TRUTH.</p>
                  <h2 className="text-6xl font-extrabold mb-8 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] tracking-tighter">2 KORINTUS 5:7</h2>
                  <p className="italic text-2xl mb-20 text-gray-200 px-6 font-medium leading-normal shadow-black text-shadow-lg">"Sebab hidup kami ini adalah hidup karena percaya, <br/>bukan karena melihat."</p>
                  
                  <button onClick={()=>vibrate([200,100,200,100,500])} className="bg-red-600 text-white py-5 px-10 rounded-full font-black text-xl animate-bounce shadow-[0_0_30px_rgba(255,0,0,0.8)] border-4 border-red-300 tracking-tight transform hover:scale-110 transition-transform">
                    [ SILAHKAN MAJU KE DEPAN SEKARANG! ]
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