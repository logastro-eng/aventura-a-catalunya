
import React, { useState, useEffect } from 'react';
import { GameState, UserProgress, LevelConfig, Question, CharacterType, LeaderboardEntry, PowerUps } from './types';
import { LEVELS, TOTAL_QUESTIONS_PER_LEVEL } from './constants';
import { generateQuestions } from './services/geminiService';
import Character from './components/Character';
import QuestionModal from './components/QuestionModal';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [progress, setProgress] = useState<UserProgress>({
    currentLevel: 1,
    unlockedLevels: [1],
    totalScore: 0,
    character: null,
    powerUps: { barretina: 3, basto: 1 }
  });
  const [activeLevel, setActiveLevel] = useState<LevelConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lives, setLives] = useState(3);
  const [isJumping, setIsJumping] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('matxic_leaderboard');
    if (saved) setLeaderboard(JSON.parse(saved));
    else {
      const defaults = [
        { name: "Andreu", score: 5000, date: "2024-03-20" },
        { name: "Laia", score: 4200, date: "2024-03-18" },
        { name: "Pol", score: 3800, date: "2024-03-15" }
      ];
      setLeaderboard(defaults);
      localStorage.setItem('matxic_leaderboard', JSON.stringify(defaults));
    }
  }, []);

  const saveScore = (finalScore: number) => {
    const nameToSave = playerName.trim() || "Jugador/a";
    const newEntry = { name: nameToSave, score: finalScore, date: new Date().toISOString().split('T')[0] };
    const newList = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 5);
    setLeaderboard(newList);
    localStorage.setItem('matxic_leaderboard', JSON.stringify(newList));
  };

  const selectCharacter = (type: CharacterType) => {
    setProgress(prev => ({ ...prev, character: type }));
    setGameState('MAP');
  };

  const startLevel = async (level: LevelConfig) => {
    setIsLoading(true);
    setActiveLevel(level);
    try {
      const generated = await generateQuestions(level.topic, TOTAL_QUESTIONS_PER_LEVEL);
      setQuestions(generated);
      setCurrentQuestionIdx(0);
      setLives(3);
      setGameState('PLAYING');
      setIsMoving(true);
      setTimeout(() => { setIsMoving(false); setShowQuestion(true); }, 1500);
    } catch (e) { 
      console.error(e); 
      setGameState('MAP');
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleAnswer = (correct: boolean) => {
    setShowQuestion(false);
    if (correct) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
      setProgress(prev => ({ ...prev, totalScore: prev.totalScore + 150 }));
      
      if (currentQuestionIdx + 1 < TOTAL_QUESTIONS_PER_LEVEL) {
        setIsMoving(true);
        setTimeout(() => {
          setIsMoving(false);
          setCurrentQuestionIdx(prev => prev + 1);
          setShowQuestion(true);
        }, 1200);
      } else {
        setTimeout(() => {
          const nextLevelId = (activeLevel?.id || 1) + 1;
          const newUnlocked = Array.from(new Set([...progress.unlockedLevels, nextLevelId]));
          setProgress(prev => ({ ...prev, unlockedLevels: newUnlocked }));
          setGameState('WIN');
          if (nextLevelId > 8) saveScore(progress.totalScore + 500);
        }, 1000);
      }
    } else {
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          saveScore(progress.totalScore);
          setGameState('GAMEOVER');
        } else {
          setTimeout(() => setShowQuestion(true), 500);
        }
        return next;
      });
    }
  };

  const usePowerUp = (type: keyof PowerUps) => {
    setProgress(prev => ({
      ...prev,
      powerUps: { ...prev.powerUps, [type]: prev.powerUps[type] - 1 }
    }));
  };

  const handleBasto = () => {
    if (progress.powerUps.basto > 0 && lives < 3) {
      usePowerUp('basto');
      setLives(l => l + 1);
    }
  };

  const renderStart = () => (
    <div className="h-screen w-screen bg-[#5c94fc] flex flex-col items-center justify-center p-4 overflow-auto">
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border-8 border-yellow-400 text-center shadow-2xl max-w-2xl w-full animate-bounce-in">
        <div className="bg-red-600 text-white py-2 px-6 inline-block mb-4 rounded-full text-[10px] font-bold shadow-lg transform -rotate-3">EDICIÓ CATALUNYA</div>
        <h1 className="text-3xl md:text-5xl text-blue-600 mb-6 drop-shadow-[4px_4px_0px_white] font-black italic">SUPER MATXIC</h1>
        
        {/* Classificació */}
        <div className="mb-8 bg-blue-50 p-6 rounded-[2rem] border-4 border-blue-100 shadow-inner">
           <h3 className="text-[10px] text-blue-600 mb-4 font-black tracking-widest uppercase flex items-center justify-center gap-2">
             🏆 HALL OF FAME 🏆
           </h3>
           <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex justify-between text-[11px] text-blue-900 font-bold bg-white p-3 rounded-xl border-b-4 border-blue-100 transition-all hover:scale-[1.02]">
                  <span className="flex gap-2">
                    <span className="text-blue-300">#{i+1}</span> {entry.name}
                  </span>
                  <span className="text-yellow-600">{entry.score} PTS</span>
                </div>
              ))}
           </div>
        </div>

        <input 
          type="text" 
          placeholder="ESCRIU EL TEU NOM..."
          maxLength={12}
          className="w-full mb-6 p-5 rounded-2xl border-4 border-gray-100 text-xs text-center focus:border-blue-400 outline-none font-bold transition-all shadow-sm"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <button 
          onClick={() => setGameState('CHARACTER_SELECT')}
          className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 rounded-[2rem] text-xl border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all font-black w-full shadow-xl"
        >
          COMENÇAR L'AVENTURA! 🚀
        </button>
      </div>
    </div>
  );

  const renderCharacterSelect = () => (
    <div className="h-screen w-screen bg-[#5c94fc] flex flex-col items-center justify-center p-6 overflow-auto">
      <h2 className="text-2xl md:text-3xl text-white mb-12 drop-shadow-lg font-black text-center">TRIA EL TEU MESTRE ACOMPANYANT!</h2>
      <div className="flex flex-col md:flex-row gap-10 max-w-5xl w-full">
         
         <button onClick={() => selectCharacter('GEMMA')} className="flex-1 bg-white p-10 rounded-[4rem] border-8 border-pink-400 hover:scale-105 transition-all group flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-pink-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Character type="GEMMA" isMoving={false} isJumping={false} className="scale-[1.8] mb-6 relative z-10" />
            <div className="text-center relative z-10">
               <h3 className="text-2xl text-pink-600 font-black mb-3">GEMMA</h3>
               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter leading-relaxed">
                 "Experta en Geometria <br/> i Pensament Lògic!"
               </p>
            </div>
            <div className="bg-pink-100 text-pink-600 py-3 px-6 rounded-full text-[10px] font-black z-10">TRIA LA GEMMA</div>
         </button>

         <button onClick={() => selectCharacter('OSCAR')} className="flex-1 bg-white p-10 rounded-[4rem] border-8 border-green-400 hover:scale-105 transition-all group flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Character type="OSCAR" isMoving={false} isJumping={false} className="scale-[1.8] mb-6 relative z-10" />
            <div className="text-center relative z-10">
               <h3 className="text-2xl text-green-600 font-black mb-3">OSCAR</h3>
               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter leading-relaxed">
                 "Mestre del Càlcul <br/> i els Grans Reptes!"
               </p>
            </div>
            <div className="bg-green-100 text-green-600 py-3 px-6 rounded-full text-[10px] font-black z-10">TRIA L'OSCAR</div>
         </button>

      </div>
      <button onClick={() => setGameState('START')} className="mt-12 text-white/70 hover:text-white underline text-[10px] font-bold">TORNA ENRERE</button>
    </div>
  );

  const renderMap = () => (
    <div className="h-screen w-screen bg-[#5c94fc] p-8 flex flex-col items-center overflow-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl text-white mb-3 font-black drop-shadow-md">MAPA DE CATALUNYA</h2>
        <div className="flex gap-4 items-center justify-center">
          <div className="bg-white/20 px-6 py-2 rounded-full text-white text-[10px] font-black border-2 border-white/30">PUNTS: {progress.totalScore}</div>
          <div className="bg-yellow-400 px-6 py-2 rounded-full text-black text-[10px] font-black shadow-lg">5è DE PRIMÀRIA</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl w-full pb-16 px-4">
        {LEVELS.map(level => {
          const unlocked = progress.unlockedLevels.includes(level.id);
          const completed = progress.unlockedLevels.includes(level.id + 1);
          
          return (
            <button
              key={level.id}
              disabled={!unlocked || isLoading}
              onClick={() => startLevel(level)}
              className={`relative p-8 rounded-[3rem] border-4 flex flex-col items-center gap-6 h-56 justify-center transition-all group
                ${unlocked ? `${level.color} border-white text-white hover:scale-105 hover:-translate-y-2 shadow-[0_12px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1` : 'bg-gray-400 border-gray-500 text-gray-200 opacity-80 cursor-not-allowed'}`}
            >
              <div className="text-6xl group-hover:scale-110 transition-transform">{unlocked ? level.bgEmoji : '🔒'}</div>
              <div className="text-center">
                 <div className="text-[8px] opacity-80 font-black mb-1">ZONA {level.id}</div>
                 <div className="text-[11px] font-black uppercase tracking-tight">{level.name}</div>
              </div>
              
              {completed && (
                <div className="absolute -top-4 -right-4 bg-yellow-400 p-3 rounded-full border-4 border-white text-xl animate-pulse shadow-lg">⭐</div>
              )}

              {isLoading && activeLevel?.id === level.id && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-[2.8rem] z-20">
                   <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
                   <div className="text-[8px] text-white font-bold animate-pulse">CREANT REPTES...</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <button onClick={() => setGameState('CHARACTER_SELECT')} className="mb-10 text-white/50 hover:text-white transition-colors text-[9px] font-bold uppercase underline underline-offset-4 decoration-dotted">Canvia de Mestre/a</button>
    </div>
  );

  const renderPlaying = () => {
    if (!activeLevel || !progress.character) return null;
    const progressPercent = (currentQuestionIdx / TOTAL_QUESTIONS_PER_LEVEL) * 100;

    return (
      <div className={`h-screen w-screen ${activeLevel.color} flex flex-col relative overflow-hidden font-['Press_Start_2P']`}>
        {/* HUD de Joc */}
        <div className="h-24 bg-black/30 backdrop-blur-md flex justify-between items-center px-8 text-white z-10 border-b-4 border-black/10">
           <div className="flex flex-col gap-1">
             <div className="text-[8px] opacity-70 font-bold uppercase tracking-widest">Localització</div>
             <div className="text-xs md:text-sm font-black">{activeLevel.name}</div>
           </div>
           
           <div className="flex flex-col items-center">
             <div className="text-[8px] opacity-70 font-bold uppercase mb-1">Punts</div>
             <div className="bg-yellow-400 text-black px-8 py-2 rounded-2xl text-lg font-black shadow-[0_4px_0_0_#ca8a04] border-2 border-yellow-200">
               {progress.totalScore}
             </div>
           </div>

           <div className="flex flex-col items-end">
             <div className="text-[8px] opacity-70 font-bold uppercase mb-2 tracking-widest">Vides</div>
             <div className="flex gap-2">
               {Array.from({length: 3}).map((_, i) => (
                 <div key={i} className={`text-3xl transition-all duration-300 transform ${i < lives ? "drop-shadow-[0_2px_0_white]" : "grayscale opacity-20 scale-75"}`}>
                   ❤️
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Àrea d'acció */}
        <div className="flex-1 relative bg-gradient-to-b from-transparent to-black/5">
           {/* Fons decoratiu (núvols/muntanyes subtils) */}
           <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-20 left-20 text-7xl">☁️</div>
              <div className="absolute top-40 right-40 text-8xl">☁️</div>
           </div>

           <div className="absolute bottom-12 transition-all duration-1000 ease-in-out" style={{ left: isMoving ? '70%' : '20%' }}>
             <Character type={progress.character} isMoving={isMoving} isJumping={isJumping} />
           </div>
           
           {/* Panell de Power-ups lateral */}
           <div className="absolute top-6 left-6 flex flex-col gap-4 z-20">
              <button 
                onClick={handleBasto}
                disabled={progress.powerUps.basto <= 0 || lives >= 3}
                className="group relative bg-orange-500 hover:bg-orange-600 text-white p-5 rounded-3xl border-b-8 border-orange-800 disabled:opacity-30 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
                title="Bastó de Tió: Recupera una vida!"
              >
                <span className="text-3xl">🪄</span>
                <span className="absolute -top-3 -right-3 bg-white text-orange-600 w-8 h-8 rounded-full flex items-center justify-center font-black border-4 border-orange-600 text-xs">
                  {progress.powerUps.basto}
                </span>
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-black/70 text-white text-[8px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                   RECUPERA VIDA
                </div>
              </button>
           </div>

           {/* Bandera de final de nivell */}
           <div className="absolute bottom-12 right-12 text-8xl animate-pulse">🚩</div>
        </div>

        {/* Peu de pàgina / Progrés */}
        <div className="h-28 bg-[#744831] border-t-8 border-[#3cb043] flex flex-col items-center justify-center px-12 relative overflow-hidden">
           <div className="absolute top-0 w-full h-4 flex gap-1 opacity-40">
              {Array.from({length: 40}).map((_, i) => <div key={i} className="w-6 h-4 bg-[#2e8b34] rounded-full transform -translate-y-2"></div>)}
           </div>

           <div className="w-full max-w-2xl relative z-10">
             <div className="flex justify-between text-[10px] text-white font-black mb-3 uppercase tracking-tighter">
               <span>Inici de la Zona</span>
               <span className="text-yellow-300">Repte {currentQuestionIdx + 1}/{TOTAL_QUESTIONS_PER_LEVEL}</span>
               <span>Meta</span>
             </div>
             <div className="w-full bg-black/50 h-6 rounded-full overflow-hidden border-4 border-white/20 shadow-inner">
               <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-full transition-all duration-1000 relative" style={{ width: `${progressPercent}%` }}>
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
               </div>
             </div>
           </div>
        </div>

        {showQuestion && questions[currentQuestionIdx] && (
          <QuestionModal 
            question={questions[currentQuestionIdx]} 
            onAnswer={handleAnswer} 
            levelColor={activeLevel.color}
            powerUps={progress.powerUps}
            usePowerUp={usePowerUp}
          />
        )}
      </div>
    );
  };

  const renderWin = () => (
    <div className="h-screen w-screen bg-yellow-400 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="bg-white p-12 md:p-20 rounded-[4rem] border-8 border-yellow-600 shadow-2xl max-w-3xl transform rotate-2 animate-bounce-in">
        <div className="text-[10rem] mb-10 animate-bounce">🏆</div>
        <h2 className="text-4xl md:text-6xl text-yellow-600 mb-6 font-black tracking-tighter">VICTÒRIA!</h2>
        <p className="text-yellow-900 text-xl md:text-2xl mb-12 font-bold italic leading-relaxed">
          "Ets una llegenda de les matemàtiques! Has superat tots els reptes d'aquesta zona!"
        </p>
        
        <div className="grid grid-cols-2 gap-6 mb-12">
           <div className="bg-yellow-50 p-6 rounded-3xl border-4 border-yellow-100">
              <div className="text-[10px] text-yellow-600 font-black uppercase mb-2">Puntuació Actual</div>
              <div className="text-4xl font-black text-yellow-800">{progress.totalScore}</div>
           </div>
           <div className="bg-green-50 p-6 rounded-3xl border-4 border-green-100">
              <div className="text-[10px] text-green-600 font-black uppercase mb-2">Respostes</div>
              <div className="text-4xl font-black text-green-800">10/10</div>
           </div>
        </div>

        <button 
          onClick={() => setGameState('MAP')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-14 py-8 rounded-[2.5rem] text-3xl border-b-[12px] border-blue-900 active:border-b-0 active:translate-y-3 transition-all font-black shadow-2xl w-full"
        >
          CONTINUA EL MAPA! 🗺️
        </button>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white animate-fade-in">
      <div className="max-w-xl">
        <h2 className="text-6xl md:text-8xl mb-10 font-black text-red-600 drop-shadow-[0_8px_0_white] italic transform -rotate-3">OH NO!</h2>
        <div className="text-9xl mb-12 animate-pulse grayscale filter contrast-125">🍄</div>
        <p className="mb-14 text-xl md:text-2xl text-gray-400 font-bold italic leading-relaxed">
          "Fins i tot els millors mestres han de repetir lliçons. Torna-ho a provar, no et rendeixis!"
        </p>
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => setGameState('MAP')} 
            className="bg-white text-black px-12 py-7 rounded-[2rem] text-2xl border-b-8 border-gray-400 active:border-b-0 active:translate-y-2 transition-all font-black hover:bg-gray-100"
          >
            INTENTA-HO DE NOU 💪
          </button>
          <button onClick={() => setGameState('START')} className="text-gray-600 hover:text-white text-[10px] uppercase font-bold tracking-widest underline decoration-dotted">Tornar a l'Inici</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="antialiased select-none touch-none">
      {gameState === 'START' && renderStart()}
      {gameState === 'CHARACTER_SELECT' && renderCharacterSelect()}
      {gameState === 'MAP' && renderMap()}
      {gameState === 'PLAYING' && renderPlaying()}
      {gameState === 'WIN' && renderWin()}
      {gameState === 'GAMEOVER' && renderGameOver()}
      
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.05) rotate(5deg); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
