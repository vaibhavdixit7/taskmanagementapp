import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Zap, Target, Star, Gamepad2, AlertCircle } from 'lucide-react';
import type { Profile, GameScore } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface GameViewProps {
  profile: Profile | null;
  onAwardPoints: (points: number, reason: string) => void;
}

interface FallingTask {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  isTask: boolean;
}

const taskWords = ['Task', 'Do it', 'Finish', 'Complete', 'Goal', 'Action', 'Plan', 'Focus', 'Study', 'Work', 'Exercise', 'Read', 'Write', 'Code', 'Review'];
const distractionWords = ['Nap', 'Scroll', 'Procrastinate', 'Delay', 'Skip', 'Ignore', 'Lazy', 'Snooze', 'Distract', 'Avoid'];

type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

export default function GameView({ profile, onAwardPoints }: GameViewProps) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [fallingTasks, setFallingTasks] = useState<FallingTask[]>([]);
  const [highScores, setHighScores] = useState<GameScore[]>([]);
  const [gameMessage, setGameMessage] = useState('');
  const [combo, setCombo] = useState(0);
  const nextIdRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastSpawnRef = useRef(0);

  const fetchHighScores = useCallback(async () => {
    const { data } = await supabase
      .from('game_scores')
      .select('*, profiles(*)')
      .order('score', { ascending: false })
      .limit(10);
    setHighScores((data ?? []) as GameScore[]);
  }, []);

  useEffect(() => {
    fetchHighScores();
  }, [fetchHighScores]);

  const spawnTask = useCallback(() => {
    const isTask = Math.random() > 0.35;
    const word = isTask
      ? taskWords[Math.floor(Math.random() * taskWords.length)]
      : distractionWords[Math.floor(Math.random() * distractionWords.length)];
    const newTask: FallingTask = {
      id: nextIdRef.current++,
      word,
      x: Math.random() * 80 + 5,
      y: -5,
      speed: 0.3 + level * 0.15,
      isTask,
    };
    setFallingTasks((prev) => [...prev, newTask]);
  }, [level]);

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const now = Date.now();
    const spawnInterval = Math.max(800, 2000 - level * 200);
    if (now - lastSpawnRef.current > spawnInterval) {
      spawnTask();
      lastSpawnRef.current = now;
    }

    setFallingTasks((prev) => {
      const updated = prev.map((t) => ({ ...t, y: t.y + t.speed }));

      const missed = updated.filter((t) => t.y > 95 && t.isTask);
      if (missed.length > 0) {
        setLives((l) => Math.max(0, l - missed.length));
        setCombo(0);
      }

      return updated.filter((t) => t.y <= 100);
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, level, spawnTask]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('gameover');
      handleGameOver();
    }
  }, [lives, gameState]);

  const handleGameOver = useCallback(async () => {
    if (score > 0) {
      await supabase.from('game_scores').insert({
        profile_id: profile?.id ?? null,
        score,
        level_reached: level,
      });
      const gamePoints = Math.floor(score / 10);
      if (gamePoints > 0) {
        onAwardPoints(gamePoints, `Played Task Catcher and scored ${score}!`);
      }
      fetchHighScores();
    }
  }, [score, level, profile, onAwardPoints, fetchHighScores]);

  const handleStart = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    setFallingTasks([]);
    setCombo(0);
    setGameMessage('');
    lastSpawnRef.current = Date.now();
    setGameState('playing');
  };

  const handlePause = () => setGameState('paused');
  const handleResume = () => setGameState('playing');

  const handleCatch = (task: FallingTask) => {
    if (gameState !== 'playing') return;
    setFallingTasks((prev) => prev.filter((t) => t.id !== task.id));

    if (task.isTask) {
      const newCombo = combo + 1;
      const comboBonus = Math.floor(newCombo / 3) * 5;
      const points = 10 + comboBonus;
      setScore((s) => s + points);
      setCombo(newCombo);
      if (newCombo >= 5) setGameMessage(`Combo x${newCombo}! +${points}`);
      else setGameMessage(`+${points}`);

      if (score > 0 && score % 100 === 0) {
        setLevel((l) => l + 1);
        setGameMessage(`Level Up! Level ${level + 1}`);
      }
    } else {
      setLives((l) => Math.max(0, l - 1));
      setCombo(0);
      setGameMessage('Oops! That was a distraction!');
    }
  };

  const gameAreaHeight = 400;

  return (
    <div className="space-y-6">
      {/* Game header */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
          <Gamepad2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Task Catcher</h3>
          <p className="text-sm text-slate-400">Tap tasks to catch them. Avoid distractions!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Game area */}
        <div className="lg:col-span-2">
          <div
            ref={gameAreaRef}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
            style={{ height: gameAreaHeight }}
          >
            {/* HUD */}
            {gameState === 'playing' || gameState === 'paused' ? (
              <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
                    <Star className="h-4 w-4 text-amber-500" /> {score}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
                    <Target className="h-4 w-4 text-blue-500" /> Lv {level}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full ${i < lives ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Combo message */}
            {gameMessage && gameState === 'playing' && (
              <div className="absolute left-1/2 top-14 z-10 -translate-x-1/2 animate-fade-in rounded-full bg-blue-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                {gameMessage}
              </div>
            )}

            {/* Falling tasks */}
            {(gameState === 'playing' || gameState === 'paused') &&
              fallingTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleCatch(task)}
                  disabled={gameState !== 'playing'}
                  className={`absolute flex items-center justify-center rounded-xl px-3 py-2 text-sm font-bold shadow-md transition-transform hover:scale-110 active:scale-95 ${
                    task.isTask
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-400 text-white'
                  }`}
                  style={{
                    left: `${task.x}%`,
                    top: `${task.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {task.word}
                </button>
              ))}

            {/* Idle screen */}
            {gameState === 'idle' && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Gamepad2 className="mb-4 h-16 w-16 text-slate-300 dark:text-slate-600" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Ready to Play?</h3>
                <p className="mt-2 max-w-xs text-sm text-slate-400">
                  Catch falling tasks by tapping them. Avoid distractions! Build combos for bonus points.
                </p>
                <button
                  onClick={handleStart}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 active:scale-95"
                >
                  <Play className="h-5 w-5" /> Start Game
                </button>
              </div>
            )}

            {/* Paused screen */}
            {gameState === 'paused' && (
              <div className="flex h-full flex-col items-center justify-center bg-black/30 text-center">
                <h3 className="text-xl font-bold text-white">Paused</h3>
                <div className="mt-4 flex gap-3">
                  <button onClick={handleResume} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                    <Play className="h-4 w-4" /> Resume
                  </button>
                  <button onClick={handleStart} className="flex items-center gap-2 rounded-xl bg-slate-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                    <RotateCcw className="h-4 w-4" /> Restart
                  </button>
                </div>
              </div>
            )}

            {/* Game over screen */}
            {gameState === 'gameover' && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Trophy className="mb-3 h-14 w-14 text-amber-500" />
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Game Over!</h3>
                <p className="mt-1 text-sm text-slate-400">You scored {score} points and reached level {level}</p>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Earned {Math.floor(score / 10)} game points!
                </p>
                <button
                  onClick={handleStart}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 active:scale-95"
                >
                  <RotateCcw className="h-5 w-5" /> Play Again
                </button>
              </div>
            )}
          </div>

          {/* Game controls */}
          {gameState === 'playing' && (
            <div className="mt-3 flex justify-center">
              <button onClick={handlePause} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <Pause className="h-4 w-4" /> Pause
              </button>
            </div>
          )}
        </div>

        {/* Side panel: instructions + high scores */}
        <div className="space-y-4">
          {/* How to play */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">How to Play</h4>
            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p>Tap green task words to catch them and earn points</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                </div>
                <p>Avoid red distractions — they cost a life!</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Star className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </div>
                <p>Catch 3+ in a row for combo bonuses</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <Target className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <p>Score 100 points to level up (faster tasks!)</p>
              </div>
            </div>
          </div>

          {/* High scores */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Trophy className="h-4 w-4 text-amber-500" /> High Scores
            </h4>
            {highScores.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No scores yet. Be the first!</p>
            ) : (
              <div className="space-y-1.5">
                {highScores.slice(0, 5).map((hs, idx) => (
                  <div key={hs.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                    <span className={`text-sm font-bold ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      #{idx + 1}
                    </span>
                    <span className="text-lg">{hs.profiles?.avatar_emoji ?? '👤'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {hs.profiles?.display_name ?? 'Anonymous'}
                      </p>
                      <p className="text-xs text-slate-400">Lv {hs.level_reached}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{hs.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
