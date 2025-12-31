
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
    const newEntry = { name: playerName || "Jugador", score: finalScore, date: new Date().toISOString().split('T')[0] };
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
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleAnswer = (correct: boolean) => {
    setShowQuestion(false);
    if (correct) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
      setProgress(prev => ({ ...prev, totalScore: prev.totalScore + 100 }));
      
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
          setProgress(prev => ({ ...prev, unlockedLevels: Array.from(new Set([...prev.unlockedLevels, nextLevelId])) }));
          setGameState('WIN');
          if (nextLevelId > 8) saveScore(progress.totalScore + 1000);
        }, 1000);
      }
    } else {
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) setGameState('GAMEOVER');
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
      <div className="bg-white p-8 md:p-12 rounded-[3rem] border-8 border-yellow-400 text-center shadow-2xl max-w-2xl w-full">
        <h1 className="text-3xl md:text-5xl text-blue-600 mb-4 drop-shadow-[3px_3px_0px_white]">SUPER MATXIC</h1>
        <p className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest">Aventura de 5è de Primària</p>
        
        <div className="mb-8 bg-blue-50 p-6 rounded-3xl border-4 border-blue-200">
           <h3 className="text-xs text-blue-600 mb-4">🏆 MILLORS PUNTUACIONS 🏆</h3>
           <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex justify-between text-[10px] text-blue-800 font-bold bg-white p-2 rounded-lg border-b-2 border-blue-100">
                  <span>{i+1}. {entry.name}</span>
                  <span>{entry.score} PTS</span>
                </div>
              ))}
           </div>
        </div>

        <input 
          type="text" 
          placeholder="EL TEU NOM..."
          className="w-full mb-6 p-4 rounded-2xl border-4 border-gray-100 text-xs text-center focus:border-blue-400 outline-none"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <button 
          onClick={() => setGameState('CHARACTER_SELECT')}
          className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl text-xl border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all font-bold w-full"
        >
          JUGA ARA! 🚩
        </button>
      </div>
    </div>
  );

  const renderCharacterSelect = () => (
    <div className="h-screen w-screen bg-[#5c94fc] flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl text-white mb-12 drop-shadow-md">TRIA EL TEU MESTRE!</h2>
      <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
         <button onClick={() => selectCharacter('GEMMA')} className="flex-1 bg-white p-8 rounded-[3rem] border-8 border-pink-400 hover:scale-105 transition-all group flex flex-col items-center gap-6 shadow-xl">
            <Character type="GEMMA" isMoving={false} isJumping={false} className="scale-150 mb-4" />
            <div className="text-center">
               <h3 className="text-xl text-pink-600 font-bold mb-2">GEMMA</h3>
               <p className="text-[10px] text-gray-500 uppercase tracking-tighter italic">"Mestra experta en Geometria!"</p>
            </div>
         </button>

         <button onClick={() => selectCharacter('OSCAR')} className="flex-1 bg-white p-8 rounded-[3rem] border-8 border-green-400 hover:scale-105 transition-all group flex flex-col items-center gap-6 shadow-xl">
            <Character type="OSCAR" isMoving={false} isJumping={false} className="scale-150 mb-4" />
            <div className="text-center">
               <h3 className="text-xl text-green-600 font-bold mb-2">OSCAR</h3>
               <p className="text-[10px] text-gray-500 uppercase tracking-tighter italic">"Mestre expert en Càlcul!"</p>
            </div>
         </button>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="h-screen w-screen bg-[#5c94fc] p-8 flex flex-col items-center overflow-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl text-white mb-2">MAPA DE CATALUNYA</h2>
        <div className="bg-white/20 px-6 py-2 rounded-full text-white text-[10px] font-bold">Punts: {progress.totalScore}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full pb-10">
        {LEVELS.map(level => {
          const unlocked = progress.unlockedLevels.includes(level.id);
          return (
            <button
              key={level.id}
              disabled={!unlocked || isLoading}
              onClick={() => startLevel(level)}
              className={`relative p-6 rounded-[2rem] border-4 flex flex-col items-center gap-4 h-48 justify-center transition-all
                ${unlocked ? `${level.color} border-white text-white hover:scale-105 shadow-lg` : 'bg-gray-400 border-gray-500 text-gray-200'}`}
            >
              <div className="text-5xl">{unlocked ? level.bgEmoji : '🔒'}</div>
              <div className="text-center">
                 <div className="text-[8px] opacity-70">NIVELL {level.id}</div>
                 <div className="text-[10px] font-bold uppercase">{level.name}</div>
              </div>
              {isLoading && activeLevel?.id === level.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-[1.8rem]">
                   <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderPlaying = () => {
    if (!activeLevel || !progress.character) return null;
    const progressPercent = (currentQuestionIdx / TOTAL_QUESTIONS_PER_LEVEL) * 100;

    return (
      <div className={`h-screen w-screen ${activeLevel.color} flex flex-col relative overflow-hidden`}>
        {/* HUD */}
        <div className="h-20 bg-black/20 flex justify-between items-center px-6 text-white z-10 border-b-4 border-black/10">
           <div className="text-xs font-bold">{activeLevel.name}</div>
           <div className="bg-yellow-400 text-black px-4 py-1 rounded-xl text-sm font-bold shadow-md">
             {progress.totalScore}
           </div>
           <div className="flex gap-1 text-xl">
             {Array.from({length: 3}).map((_, i) => <span key={i} className={i < lives ? "" : "grayscale opacity-20"}>❤️</span>)}
           </div>
        </div>

        {/* Action Area */}
        <div className="flex-1 relative">
           <div className="absolute bottom-12 left-1/4 transition-all duration-1000" style={{ left: isMoving ? '70%' : '20%' }}>
             <Character type={progress.character} isMoving={isMoving} isJumping={isJumping} />
           </div>
           
           {/* Power-ups Panel */}
           <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <button 
                onClick={handleBasto}
                disabled={progress.powerUps.basto <= 0 || lives >= 3}
                className="bg-orange-500 text-white p-3 rounded-2xl border-b-4 border-orange-800 disabled:opacity-30 active:translate-y-1"
              >
                🪄 {progress.powerUps.basto}
              </button>
           </div>
        </div>

        {/* Footer */}
        <div className="h-24 bg-[#744831] border-t-8 border-[#3cb043] flex items-center justify-center px-8">
           <div className="w-full max-w-md bg-black/40 h-4 rounded-full overflow-hidden border-2 border-white/20">
              <div className="bg-yellow-400 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
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

  return (
    <div className="antialiased font-['Press_Start_2P']">
      {gameState === 'START' && renderStart()}
      {gameState === 'CHARACTER_SELECT' && renderCharacterSelect()}
      {gameState === 'MAP' && renderMap()}
      {gameState === 'PLAYING' && renderPlaying()}
      {gameState === 'WIN' && (
        <div className="h-screen w-screen bg-yellow-400 flex flex-col items-center justify-center p-8 text-center">
           <h2 className="text-4xl text-white mb-6">MOLT BÉ!</h2>
           <button onClick={() => setGameState('MAP')} className="bg-blue-600 text-white px-10 py-5 rounded-2xl border-b-8 border-blue-900 active:translate-y-2 transition-all">SEGÜENT NIVELL</button>
        </div>
      )}
      {gameState === 'GAMEOVER' && (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white">
           <h2 className="text-4xl mb-8">GAME OVER</h2>
           <button onClick={() => setGameState('MAP')} className="bg-white text-black px-10 py-5 rounded-2xl">TORNA A PROVAR</button>
        </div>
      )}
    </div>
  );
};

export default App;
