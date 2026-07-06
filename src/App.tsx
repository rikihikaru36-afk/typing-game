import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  History,
  Trash2,
  Info,
  Award,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RaceStatus, AvatarType, TyperacerQuote, Competitor, GameStats, ScoreRecord } from "./types";
import { AVATARS, QUOTES, BOT_NAMES } from "./data";

// Self-contained sound engine using Web Audio API
const playTone = (freq: number, type: OscillatorType = "sine", duration: number = 0.1, muted: boolean = false) => {
  if (muted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio context may be blocked by user gesture
  }
};

const playFanfare = (muted: boolean) => {
  if (muted) return;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, "triangle", 0.35, false);
    }, idx * 150);
  });
};

const playFailureTone = (muted: boolean) => {
  if (muted) return;
  playTone(150, "sawtooth", 0.2, false);
};

export default function App() {
  // Option preferences
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>("car");
  const [language, setLanguage] = useState<"mn" | "en">("mn");
  const [difficulty, setDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [botLevel, setBotLevel] = useState<"Slow" | "Medium" | "Sonic">("Medium");
  const [isMuted, setIsMuted] = useState(false);

  // Game core state
  const [status, setStatus] = useState<RaceStatus>("idle");
  const [activeQuote, setActiveQuote] = useState<TyperacerQuote>(QUOTES[0]);
  const [inputText, setInputText] = useState("");
  const [errorsThisRun, setErrorsThisRun] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  // Statistics
  const [realtimeWpm, setRealtimeWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Competitors
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  // High score records (Persisted in localStorage)
  const [history, setHistory] = useState<ScoreRecord[]>([]);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const competitorsIntervalRef = useRef<any>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("typeracer_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Filter quotes based on selection
  const availableQuotes = useMemo(() => {
    return QUOTES.filter((q) => {
      const matchLang = q.language === language;
      const matchDiff = difficulty === "All" || q.difficulty === difficulty;
      return matchLang && matchDiff;
    });
  }, [language, difficulty]);

  // Select a random quote from filtered list
  const chooseNewQuote = () => {
    if (availableQuotes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    setActiveQuote(availableQuotes[randomIndex]);
  };

  // Sync selected quote when language or difficulty filter changes in idle state
  useEffect(() => {
    if (status === "idle") {
      chooseNewQuote();
    }
  }, [language, difficulty, status]);

  // Generate bot competitors based on selections
  const generateCompetitors = () => {
    // Choose speed ranges (WPM) based on Bot Level
    let minWpm = 25;
    let maxWpm = 45;
    if (botLevel === "Slow") {
      minWpm = 15;
      maxWpm = 30;
    } else if (botLevel === "Sonic") {
      minWpm = 55;
      maxWpm = 85;
    }

    const availableBots = BOT_NAMES.sort(() => 0.5 - Math.random());
    const botAvatars: AvatarType[] = ["car", "rocket", "horse"];

    const list: Competitor[] = [
      {
        id: "bot-1",
        name: availableBots[0],
        avatar: botAvatars[Math.floor(Math.random() * 3)],
        emoji: AVATARS.find((a) => a.type === botAvatars[Math.floor(Math.random() * 3)])?.emoji || "🏎️",
        color: "from-blue-500 to-cyan-400",
        speedWPM: Math.floor(Math.random() * (maxWpm - minWpm + 1)) + minWpm,
        progress: 0,
        isFinished: false
      },
      {
        id: "bot-2",
        name: availableBots[1],
        avatar: botAvatars[Math.floor(Math.random() * 3)],
        emoji: AVATARS.find((a) => a.type === botAvatars[Math.floor(Math.random() * 3)])?.emoji || "🚀",
        color: "from-pink-500 to-rose-400",
        speedWPM: Math.floor(Math.random() * (maxWpm - minWpm + 1)) + minWpm - 5,
        progress: 0,
        isFinished: false
      }
    ];
    setCompetitors(list);
  };

  // Start Countdown Sequence
  const handleStartRace = () => {
    chooseNewQuote();
    generateCompetitors();
    setInputText("");
    setErrorsThisRun(0);
    setRealtimeWpm(0);
    setAccuracy(100);
    setElapsedSeconds(0);
    setStartTime(null);
    setEndTime(null);
    setStatus("countdown");
    setCountdown(3);

    // Audio beep for countdown 3
    playTone(400, "sine", 0.15, isMuted);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          startRacing();
          return 0;
        }
        // Beep for 2 and 1
        playTone(400, "sine", 0.15, isMuted);
        return prev - 1;
      });
    }, 1000);
  };

  // Transition to Actual Racing State
  const startRacing = () => {
    setStatus("racing");
    setStartTime(Date.now());
    playTone(800, "triangle", 0.3, isMuted);

    // Focus input field instantly
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    // Start timer interval for player stats
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Start competitor bot engine simulation interval
    if (competitorsIntervalRef.current) clearInterval(competitorsIntervalRef.current);
    competitorsIntervalRef.current = setInterval(() => {
      setCompetitors((prevBots) => {
        return prevBots.map((bot) => {
          if (bot.isFinished) return bot;

          // Estimate words in this quote to scale progression
          const quoteWords = activeQuote.text.split(" ").length;
          // Progress increment per interval (simulated based on bot WPM)
          // bot WPM = words written per minute.
          // words written per second = botWPM / 60.
          // percentage increase per second = (words written per second / total words) * 100
          const percentPerSecond = ((bot.speedWPM / 60) / quoteWords) * 100;
          // We update every 0.25 seconds so divide percentPerSecond by 4
          const randomFactor = 0.8 + Math.random() * 0.4; // subtle randomness in speed
          const nextProgress = Math.min(bot.progress + (percentPerSecond / 4) * randomFactor, 100);

          const justFinished = nextProgress >= 100;

          return {
            ...bot,
            progress: nextProgress,
            isFinished: justFinished,
            finishTime: justFinished ? Date.now() : bot.finishTime
          };
        });
      });
    }, 250);
  };

  // Cancel any active timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (competitorsIntervalRef.current) clearInterval(competitorsIntervalRef.current);
    };
  }, []);

  // Compute characters status
  // We compare `inputText` with `activeQuote.text`
  const textCharacters = activeQuote.text.split("");
  
  // Find the exact correct matched length from start of input
  let correctLength = 0;
  for (let i = 0; i < inputText.length; i++) {
    if (inputText[i] === activeQuote.text[i]) {
      correctLength++;
    } else {
      break;
    }
  }

  // Is there any error currently in input field?
  const hasError = correctLength < inputText.length;

  // Calculate real-time statistics
  useEffect(() => {
    if (status !== "racing" || !startTime) return;

    const timeDiffMinutes = (Date.now() - startTime) / 60000;
    
    // WPM = (correct characters / 5) / minutes
    const computedWpm = Math.round((correctLength / 5) / (timeDiffMinutes || 0.001));
    setRealtimeWpm(computedWpm > 0 ? computedWpm : 0);

    // Accuracy = (total keystrokes - errors) / total keystrokes
    const totalTyped = inputText.length + errorsThisRun;
    const computedAcc = totalTyped > 0 
      ? Math.round(((totalTyped - errorsThisRun) / totalTyped) * 100) 
      : 100;
    setAccuracy(computedAcc < 0 ? 0 : computedAcc);

    // Check if player has finished typing the entire quote!
    if (correctLength === activeQuote.text.length && !hasError) {
      handleFinishRace();
    }
  }, [inputText, correctLength, hasError, startTime, status, errorsThisRun]);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Prevent typing more characters than the quote length
    if (value.length > activeQuote.text.length) return;

    // Detect if this keystroke introduced a new error
    if (value.length > inputText.length) {
      const addedCharIndex = value.length - 1;
      const addedChar = value[addedCharIndex];
      const targetChar = activeQuote.text[addedCharIndex];

      if (addedChar !== targetChar) {
        setErrorsThisRun((prev) => prev + 1);
        playFailureTone(isMuted);
      } else {
        // High soft beep for correct typing satisfying feedback
        playTone(950, "sine", 0.04, isMuted);
      }
    }

    setInputText(value);
  };

  // Complete the Race
  const handleFinishRace = () => {
    const finishedTime = Date.now();
    setEndTime(finishedTime);
    setStatus("finished");

    if (timerRef.current) clearInterval(timerRef.current);
    if (competitorsIntervalRef.current) clearInterval(competitorsIntervalRef.current);

    // Stop and compile final stats
    const totalTimeMinutes = (finishedTime - (startTime || Date.now())) / 60000;
    const finalWpm = Math.round((activeQuote.text.length / 5) / totalTimeMinutes);
    const finalWpmValue = finalWpm > 0 ? finalWpm : 1;

    // Victory fanfare audio
    playFanfare(isMuted);

    // Save score to local records
    const newRecord: ScoreRecord = {
      id: `score-${Date.now()}`,
      date: new Date().toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      wpm: finalWpmValue,
      accuracy,
      errorCount: errorsThisRun,
      avatar: selectedAvatar,
      textTitle: activeQuote.source,
      language
    };

    setHistory((prev) => {
      const updated = [newRecord, ...prev].slice(0, 30); // keep top 30 records
      localStorage.setItem("typeracer_history", JSON.stringify(updated));
      return updated;
    });
  };

  // Reset to Lobby State
  const handleResetToLobby = () => {
    setStatus("idle");
    setInputText("");
    setErrorsThisRun(0);
    setRealtimeWpm(0);
    setAccuracy(100);
    setElapsedSeconds(0);
    setStartTime(null);
    setEndTime(null);
    chooseNewQuote();
  };

  // Clean Score History
  const handleClearHistory = () => {
    if (confirm(language === "mn" ? "Бүх амжилтын түүхийг устгах уу?" : "Are you sure you want to clear all high scores?")) {
      setHistory([]);
      localStorage.removeItem("typeracer_history");
    }
  };

  // Calculate Player Progress Percentage
  const playerProgress = Math.round((correctLength / activeQuote.text.length) * 100) || 0;

  // Find standings / rank at completion
  const standings = useMemo(() => {
    if (status !== "finished") return [];
    // Combine player and bots
    const allFinishers = [
      { name: language === "mn" ? "Та (Бичээч) 👤" : "You (Typist) 👤", isPlayer: true, time: endTime || Date.now() },
      ...competitors.map((b) => ({
        name: b.name,
        isPlayer: false,
        time: b.finishTime || (Date.now() + 99999) // if didn't finish, set large time
      }))
    ];
    // Sort by finish time ascending
    return allFinishers.sort((a, b) => a.time - b.time);
  }, [status, competitors, endTime, language]);

  const playerRank = standings.findIndex((s) => s.isPlayer) + 1;

  // Selected avatar object
  const currentAvatarInfo = AVATARS.find((a) => a.type === selectedAvatar) || AVATARS[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400" id="typeracer-app-container">
      
      {/* 1. VISUALLY PREMIUM NAVIGATION HEADER */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between" id="app-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/20">
            <Flame className="h-5.5 w-5.5 text-zinc-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-sans font-extrabold text-xl tracking-tight text-white uppercase">Luminaq</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-widest">
                Typeracer
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              {language === "mn" 
                ? "Бичих хурдаа уралдаж хэмжих сонирхолтой тоглоом" 
                : "Race your fingers and analyze real-time typing diagnostics"}
            </p>
          </div>
        </div>

        {/* Audio Mute Controller & Lang Switcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title={isMuted ? "дууг нээх" : "дууг хаах"}
            id="mute-toggle-btn"
          >
            {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5 text-emerald-400" />}
          </button>

          {/* Language Fast Switcher */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                setLanguage("mn");
                if (status === "idle") handleResetToLobby();
              }}
              disabled={status === "racing"}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                language === "mn"
                  ? "bg-zinc-800 text-white shadow-sm font-semibold"
                  : "text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
              }`}
              id="lang-mn-btn"
            >
              Монгол 🇲🇳
            </button>
            <button
              onClick={() => {
                setLanguage("en");
                if (status === "idle") handleResetToLobby();
              }}
              disabled={status === "racing"}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                language === "en"
                  ? "bg-zinc-800 text-white shadow-sm font-semibold"
                  : "text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
              }`}
              id="lang-en-btn"
            >
              English 🇺🇸
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ================= STAGE 1: LOBBY & PRE-GAME OPTIONS ================= */}
        {status === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            id="lobby-view"
          >
            {/* Welcoming Banner card */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/20 border border-zinc-800/80 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-3 max-w-lg text-center md:text-left">
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{language === "mn" ? "Хурууны Хурдаа Шалгах уу?" : "Ready to test your fingers?"}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white leading-tight">
                  {language === "mn" 
                    ? "Уралдааны замд тавтай морилно уу!" 
                    : "Welcome to the Race Track!"}
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                  {language === "mn"
                    ? "Доорх тохиргооноос өөрийн унааг (морь, машин, пуужин) сонгоод, өрсөлдөгчдийн түвшинг тохируулж уралдаанд оролцоорой."
                    : "Choose your favorite racing avatar, adjust your opponent bot difficulty, and type away with zero errors to secure the champion title."}
                </p>
              </div>

              {/* Huge beautiful play trigger button */}
              <button
                onClick={handleStartRace}
                className="w-full md:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-sans font-bold text-lg tracking-wide transition-all duration-300 shadow-[0_4px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_45px_rgba(16,185,129,0.5)] cursor-pointer flex items-center justify-center space-x-3.5 animate-pulse"
                id="start-race-lobby-btn"
              >
                <Play className="h-6 w-6 fill-zinc-950" />
                <span>{language === "mn" ? "УРАЛДАХ" : "START RACE"}</span>
              </button>
            </div>

            {/* Config & Customizer panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="game-options-grid">
              
              {/* Avatar options selection */}
              <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-zinc-800/60 pb-3">
                  <Award className="h-4.5 w-4.5 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {language === "mn" ? "Уралдах Хөлөг сонгох" : "Choose Racing Avatar"}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {AVATARS.map((avatar) => {
                    const isSelected = selectedAvatar === avatar.type;
                    return (
                      <button
                        key={avatar.type}
                        onClick={() => {
                          setSelectedAvatar(avatar.type);
                          playTone(600, "sine", 0.1, isMuted);
                        }}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-800 border-emerald-500/50 text-white shadow-md ring-1 ring-emerald-500/20"
                            : "bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                        }`}
                        id={`avatar-choice-${avatar.type}`}
                      >
                        <span className="text-3xl mb-2">{avatar.emoji}</span>
                        <span className="text-xs font-sans font-medium">{avatar.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter difficulties & Bot speeds option */}
              <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-zinc-800/60 pb-3">
                  <Zap className="h-4.5 w-4.5 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {language === "mn" ? "Өрсөлдөгч ба Сонголт" : "Opponents & Filters"}
                  </h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  {/* Bot Level Selector */}
                  <div className="space-y-2">
                    <span className="text-zinc-500 block">
                      {language === "mn" ? "Өрсөлдөгчийн түвшин:" : "Bot Opponent Difficulty:"}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Slow", "Medium", "Sonic"] as const).map((lvl) => {
                        const isSelected = botLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            onClick={() => setBotLevel(lvl)}
                            className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400 font-semibold"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-300"
                            }`}
                            id={`bot-lvl-${lvl}`}
                          >
                            {lvl === "Slow" ? "Мэлхий 🐢" : lvl === "Medium" ? "Дундаж 🤖" : "Соник 🚀"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulty level of text */}
                  <div className="space-y-2">
                    <span className="text-zinc-500 block">
                      {language === "mn" ? "Өгүүлбэрийн зэрэг:" : "Quote Difficulty:"}
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => {
                        const isSelected = difficulty === diff;
                        return (
                          <button
                            key={diff}
                            onClick={() => setDifficulty(diff)}
                            className={`py-2 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400 font-semibold"
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-300"
                            }`}
                            id={`quote-diff-${diff}`}
                          >
                            {diff === "All" ? "Бүгд" : diff === "Easy" ? "Амархан" : diff === "Medium" ? "Дундаж" : "Хэцүү"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Preview of the Selected Quote in idle state */}
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500 tracking-wider uppercase flex items-center">
                  <BookOpen className="h-3.5 w-3.5 mr-1.5 text-emerald-500/80" />
                  {language === "mn" ? "Жишээ өгүүлбэр" : "Selected Target Text Preview"}
                </span>
                <span className="bg-zinc-800 border border-zinc-800 px-2.5 py-0.5 rounded text-[10px] font-mono text-zinc-400">
                  {activeQuote.difficulty} • {activeQuote.text.length} {language === "mn" ? "үсэг" : "chars"}
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed font-sans italic pl-3 border-l-2 border-emerald-500/30">
                "{activeQuote.text}"
              </p>
              <p className="text-right text-xs text-zinc-500 font-sans">
                — {activeQuote.source}
              </p>
            </div>
          </motion.div>
        )}

        {/* ================= STAGE 2: COUNTDOWN SCREEN ================= */}
        {status === "countdown" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-6"
            id="countdown-view"
          >
            <div className="text-xs font-mono text-zinc-500 tracking-widest uppercase">
              {language === "mn" ? "БИЧИХЭД БЭЛДЭЭРЭЙ!" : "GET READY TO TYPE!"}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-8xl sm:text-9xl font-black font-mono select-none"
              >
                {countdown === 0 ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">GO!</span>
                ) : (
                  countdown
                )}
              </motion.div>
            </AnimatePresence>

            <p className="text-sm text-zinc-400 max-w-sm">
              {language === "mn"
                ? "Хурдан бөгөөд алдаагүй бичих нь уралдааны гол амжилт болно."
                : "Remember: speed is nothing without absolute accuracy. Stay focused."}
            </p>

            {/* Micro display of quote source to mentally prepare */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 px-4 py-2 rounded-xl text-xs font-mono text-zinc-500">
              {language === "mn" ? "Эх сурвалж" : "Source"}: {activeQuote.source}
            </div>
          </motion.div>
        )}

        {/* ================= STAGE 3: ACTIVE RACING SCREEN ================= */}
        {(status === "racing") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
            id="racing-view"
          >
            {/* REAL-TIME RACING TRACK BOARD */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 space-y-5" id="race-tracks-panel">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-2">
                <span className="font-mono text-xs text-zinc-500 tracking-wider uppercase flex items-center">
                  <Flame className="h-4 w-4 mr-1.5 text-orange-400 animate-pulse" />
                  {language === "mn" ? "УРАЛДААНЫ ЗАМ" : "RACE TRACK"}
                </span>
                
                {/* Timer Badge */}
                <span className="bg-zinc-950 text-zinc-300 font-mono text-xs px-3 py-1 rounded-full border border-zinc-800/80 flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                  <span>{elapsedSeconds}s</span>
                </span>
              </div>

              <div className="space-y-4">
                {/* 1. PLAYER RACING TRACK */}
                <div className="space-y-1" id="track-player">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-emerald-400 flex items-center">
                      <span>Та (Бичээч) 👤</span>
                    </span>
                    <span className="font-mono text-zinc-500">{playerProgress}%</span>
                  </div>

                  <div className="h-10 w-full bg-zinc-950 rounded-xl relative border border-zinc-900/80 flex items-center overflow-hidden">
                    {/* Grid line background markers */}
                    <div className="absolute inset-0 grid grid-cols-4 pointer-events-none opacity-20">
                      <div className="border-r border-dashed border-zinc-800" />
                      <div className="border-r border-dashed border-zinc-800" />
                      <div className="border-r border-dashed border-zinc-800" />
                    </div>

                    {/* Progress Track Color Highlight */}
                    <div
                      style={{ width: `${playerProgress}%` }}
                      className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${currentAvatarInfo.color} opacity-10 transition-all duration-300 ease-out`}
                    />

                    {/* Animated Avatar with Spring Positioning and Dynamic Racing Vibration */}
                    <motion.div
                      animate={{
                        left: `calc(${playerProgress}% - 28px)`,
                        y: status === "racing" && playerProgress > 0 && playerProgress < 100 ? [0, -3, 0] : 0,
                        rotate: status === "racing" && playerProgress > 0 && playerProgress < 100 ? [-3, 3, -3] : 0
                      }}
                      transition={{
                        left: { type: "spring", stiffness: 90, damping: 15, mass: 0.8 },
                        y: { repeat: Infinity, duration: 0.35, ease: "easeInOut" },
                        rotate: { repeat: Infinity, duration: 0.25, ease: "easeInOut" }
                      }}
                      className="absolute w-10 h-10 flex items-center justify-center text-2xl"
                    >
                      <span className="relative">
                        {currentAvatarInfo.emoji}
                        {/* Perfect small flame trail if typing fast */}
                        {realtimeWpm > 45 && (
                          <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-xs animate-bounce opacity-80">🔥</span>
                        )}
                      </span>
                    </motion.div>

                    {/* Finish Line Flag */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-sm opacity-60">
                      🏁
                    </div>
                  </div>
                </div>

                {/* 2. COMPETITOR BOTS TRACKS */}
                {competitors.map((bot) => {
                  return (
                    <div key={bot.id} className="space-y-1" id={`track-${bot.id}`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400 flex items-center">
                          <span>{bot.name}</span>
                          <span className="text-[10px] text-zinc-500 ml-1.5 bg-zinc-800 px-1.5 py-0.2 rounded">
                            {bot.speedWPM} WPM
                          </span>
                        </span>
                        <span className="font-mono text-zinc-500">{Math.round(bot.progress)}%</span>
                      </div>

                      <div className="h-8 w-full bg-zinc-950/60 rounded-xl relative border border-zinc-900/40 flex items-center overflow-hidden">
                        {/* Grid lines */}
                        <div className="absolute inset-0 grid grid-cols-4 pointer-events-none opacity-10">
                          <div className="border-r border-dashed border-zinc-800" />
                          <div className="border-r border-dashed border-zinc-800" />
                          <div className="border-r border-dashed border-zinc-800" />
                        </div>

                        {/* Progress Highlight */}
                        <div
                          style={{ width: `${bot.progress}%` }}
                          className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${bot.color} opacity-5 transition-all duration-300 ease-out`}
                        />

                        {/* Animated Competitor Avatar with Dynamic Racing Motion */}
                        <motion.div
                          animate={{
                            left: `calc(${bot.progress}% - 24px)`,
                            y: status === "racing" && !bot.isFinished && bot.progress > 0 ? [0, -2, 0] : 0,
                            rotate: status === "racing" && !bot.isFinished && bot.progress > 0 ? [-3, 3, -3] : 0
                          }}
                          transition={{
                            left: { type: "spring", stiffness: 75, damping: 14, mass: 0.9 },
                            y: { repeat: Infinity, duration: 0.4, ease: "easeInOut" },
                            rotate: { repeat: Infinity, duration: 0.3, ease: "easeInOut" }
                          }}
                          className="absolute w-8 h-8 flex items-center justify-center text-xl"
                        >
                          <span className="relative">
                            {bot.emoji}
                            {/* Wind drift effect for fast moving competitor bots */}
                            {bot.speedWPM >= 40 && status === "racing" && !bot.isFinished && bot.progress > 1 && (
                              <span className="absolute -left-2 top-1/2 -translate-y-1/2 text-[10px] opacity-75 animate-pulse">💨</span>
                            )}
                          </span>
                        </motion.div>

                        {/* Finish line */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-40">
                          🏁
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CLASSIC TYPERACER TEXT CHAR-BY-CHAR COMPILER */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center">
                  <BookOpen className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  {language === "mn" ? "Бичих өгүүлбэр" : "Typing Passage"}
                </span>

                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  {activeQuote.difficulty} • {activeQuote.source}
                </span>
              </div>

              {/* Dynamic rendering text frame */}
              <div 
                className="text-lg sm:text-xl font-sans leading-relaxed tracking-wide select-none p-2 bg-zinc-950/20 rounded-xl border border-zinc-900"
                id="target-text-characters-frame"
              >
                {textCharacters.map((char, index) => {
                  let charClass = "text-zinc-400"; // default untyped character
                  let bgClass = "";

                  if (index < correctLength) {
                    // Correctly typed
                    charClass = "text-emerald-400 font-semibold";
                    bgClass = "bg-emerald-500/10";
                  } else if (index >= correctLength && index < inputText.length) {
                    // Mistyped (currently red)
                    charClass = "text-red-500 font-bold underline decoration-red-600 decoration-2";
                    bgClass = "bg-red-500/15";
                  }

                  // Blink cursor caret on the EXACT target character
                  const isCurrentCaret = index === inputText.length;

                  return (
                    <span
                      key={index}
                      className={`relative px-0.2 py-0.5 rounded transition-colors ${charClass} ${bgClass}`}
                    >
                      {char}
                      {isCurrentCaret && (
                        <span 
                          className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" 
                          id="caret-cursor"
                        />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* REAL-TIME MINI DIAGNOSTIC HUD */}
              <div className="grid grid-cols-3 gap-4 font-mono text-center">
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">WPM (Хурд)</span>
                  <span className="text-xl font-bold text-white mt-0.5 block">{realtimeWpm}</span>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">Accuracy (Нарийвчлал)</span>
                  <span className={`text-xl font-bold mt-0.5 block ${accuracy < 90 ? "text-yellow-500" : "text-emerald-400"}`}>
                    {accuracy}%
                  </span>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">Errors (Алдаа)</span>
                  <span className={`text-xl font-bold mt-0.5 block ${errorsThisRun > 0 ? "text-red-400" : "text-zinc-400"}`}>
                    {errorsThisRun}
                  </span>
                </div>
              </div>

              {/* CORE INPUT FIELD BOX */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-500" htmlFor="typeracer-text-input">
                  {language === "mn" ? "Энд бичнэ үү (Алдаагаа засаж байж цааш явна):" : "Type here (Fix your errors to proceed):"}
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="typeracer-text-input"
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    disabled={status !== "racing"}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className={`w-full text-base sm:text-lg bg-zinc-950 rounded-xl py-4.5 px-5 border transition-all duration-300 focus:outline-none focus:ring-1 ${
                      hasError
                        ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)] bg-red-950/5"
                        : "border-zinc-800 focus:border-emerald-500/60 focus:ring-emerald-500/10"
                    }`}
                    placeholder={
                      language === "mn" 
                        ? "Бичиж эхэлмэгц уралдаан эхэлнэ..." 
                        : "Type the words exactly as shown above..."
                    }
                  />

                  {/* Red error signal badge on right hand inside input */}
                  {hasError && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-red-400 font-mono text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="hidden sm:inline">{language === "mn" ? "Алдаатай байна" : "Fix Error"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="flex justify-center">
              <button
                onClick={handleResetToLobby}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-white font-mono transition-all cursor-pointer flex items-center space-x-2"
                id="cancel-race-btn"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{language === "mn" ? "Уралдааныг Цуцлах" : "Cancel & Return to Lobby"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= STAGE 4: FINISHED RESULTS SCREEN ================= */}
        {status === "finished" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
            id="finished-results-view"
          >
            {/* Main Result Showcase Card */}
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 p-8 sm:p-10 space-y-8 shadow-2xl">
              
              {/* Leaderboard Position Medal Area */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
                <div className="flex items-center space-x-4 text-center sm:text-left flex-col sm:flex-row">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-3xl shadow-lg mb-3 sm:mb-0">
                    {playerRank === 1 ? "🏆" : playerRank === 2 ? "🥈" : "🥉"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-sans font-black text-white tracking-tight">
                      {language === "mn" ? `${playerRank}-р Байранд барианд орлоо!` : `You Finished Rank ${playerRank}!`}
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans mt-1">
                      {language === "mn" 
                        ? "Уралдааныг амжилттай дуусгалаа. Баяр хүргэе!" 
                        : "You typed the passage successfully. Here are your telemetry stats!"}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleStartRace}
                    className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-sans font-semibold text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.35)] cursor-pointer"
                    id="play-again-results-btn"
                  >
                    {language === "mn" ? "Дахин уралдах" : "Race Again"}
                  </button>
                  <button
                    onClick={handleResetToLobby}
                    className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-sans transition-all cursor-pointer"
                  >
                    {language === "mn" ? "Эхлэл рүү буцах" : "Back to Lobby"}
                  </button>
                </div>
              </div>

              {/* core diagnostics stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* WPM */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4.5 text-center relative overflow-hidden group">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-widest font-mono">Speed (Хурд)</span>
                  <span className="text-3xl font-black text-white mt-1 block font-mono">
                    {realtimeWpm} <span className="text-xs text-emerald-400">WPM</span>
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </div>

                {/* Accuracy */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4.5 text-center relative overflow-hidden">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-widest font-mono">Accuracy (Нарийвчлал)</span>
                  <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
                    {accuracy}%
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500" />
                </div>

                {/* Errors */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4.5 text-center relative overflow-hidden">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-widest font-mono">Errors (Алдааны тоо)</span>
                  <span className={`text-3xl font-black mt-1 block font-mono ${errorsThisRun > 0 ? "text-red-400" : "text-zinc-400"}`}>
                    {errorsThisRun}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
                </div>

                {/* Time Elapsed */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4.5 text-center relative overflow-hidden">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-widest font-mono">Time (Хугацаа)</span>
                  <span className="text-3xl font-black text-zinc-300 mt-1 block font-mono">
                    {elapsedSeconds}s
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
                </div>
              </div>

              {/* Complete leaderboard table for this race */}
              <div className="space-y-3 pt-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">
                  {language === "mn" ? "Энэ уралдааны дүн" : "Standings leaderboard"}
                </span>

                <div className="bg-zinc-950/50 border border-zinc-900 rounded-xl divide-y divide-zinc-900 overflow-hidden">
                  {standings.map((stand, index) => {
                    const isUser = stand.isPlayer;
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between px-5 py-3.5 text-sm ${
                          isUser ? "bg-emerald-500/5 text-emerald-400 font-semibold" : "text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-xs text-zinc-500">#{index + 1}</span>
                          <span>{stand.name}</span>
                          {isUser && (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.2 rounded font-mono uppercase">
                              YOU
                            </span>
                          )}
                        </div>

                        <span className="font-mono text-xs">
                          {stand.time === (endTime || Date.now()) 
                            ? `${elapsedSeconds}s (${realtimeWpm} WPM)`
                            : `Finished • Bot`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= HISTORY SCOREBOARD SECTION ================= */}
        <section className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-5" id="history-section">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center space-x-2">
              <History className="h-4.5 w-4.5 text-zinc-400" />
              <h3 className="font-sans font-semibold text-sm text-zinc-200">
                {language === "mn" ? "Таны амжилтууд (Сүүлийн тоглолтууд)" : "Your Scoreboard History"}
              </h3>
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-zinc-500 hover:text-red-400 font-mono text-xs flex items-center space-x-1 hover:underline transition-all cursor-pointer"
                id="clear-history-btn"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{language === "mn" ? "Түүх устгах" : "Clear History"}</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 font-mono text-xs">
              {language === "mn" 
                ? "Одоогоор ямар нэгэн амжилт хадгалагдаагүй байна. Эхний уралдаанаа хийж эхлүүлээрэй!" 
                : "No saved records in history. Start a race to capture your typing stats."}
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Graphic mini chart block showing WPM trend */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-2">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">
                  {language === "mn" ? "WPM ТРЭНД (Сүүлийн оролдлогууд)" : "WPM PROGRESS TREND"}
                </span>
                <div className="flex items-end justify-between h-14 pt-2 px-2 gap-1.5">
                  {history.slice(0, 10).reverse().map((record, index) => {
                    // Normalize height based on max 120 WPM
                    const heightPercent = Math.min((record.wpm / 120) * 100, 100);
                    return (
                      <div key={record.id} className="flex-1 flex flex-col items-center group relative">
                        {/* Tooltip */}
                        <span className="absolute bottom-full mb-1 bg-zinc-900 text-white border border-zinc-800 rounded px-1.5 py-0.5 text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                          {record.wpm} WPM ({record.accuracy}%)
                        </span>
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent || 10}%` }}
                          className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm group-hover:from-emerald-400 group-hover:to-teal-300 transition-all duration-300"
                        />
                        <span className="text-[8px] text-zinc-600 font-mono mt-1">{index + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Records table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-900">
                      <th className="pb-2 font-medium">{language === "mn" ? "Огноо" : "Date"}</th>
                      <th className="pb-2 font-medium">WPM</th>
                      <th className="pb-2 font-medium">{language === "mn" ? "Нарийвчлал" : "Accuracy"}</th>
                      <th className="pb-2 font-medium">{language === "mn" ? "Алдаа" : "Errors"}</th>
                      <th className="pb-2 font-medium">{language === "mn" ? "Сэдэв" : "Source Passage"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {history.map((record) => {
                      const recAvatarInfo = AVATARS.find(a => a.type === record.avatar) || AVATARS[0];
                      return (
                        <tr key={record.id} className="text-zinc-300 hover:text-white transition-colors">
                          <td className="py-2.5 text-zinc-500 text-[11px]">{record.date}</td>
                          <td className="py-2.5 font-bold text-emerald-400">
                            {recAvatarInfo.emoji} {record.wpm}
                          </td>
                          <td className="py-2.5">{record.accuracy}%</td>
                          <td className="py-2.5 text-red-400">{record.errorCount}</td>
                          <td className="py-2.5 text-zinc-400 truncate max-w-[150px]" title={record.textTitle}>
                            {record.textTitle}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* 3. DIAGNOSTICS & HELP FAQ PANEL */}
        <section className="bg-zinc-900/20 border border-zinc-900/60 rounded-3xl p-6" id="faq-diagnostic-tips">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="h-4 w-4 text-emerald-400" />
            <h4 className="font-sans font-bold text-sm text-zinc-300">
              {language === "mn" ? "Уралдах зөвлөгөө" : "Pro Racing Tips"}
            </h4>
          </div>
          <ul className="text-xs text-zinc-500 space-y-2 leading-relaxed list-disc list-inside font-sans">
            <li>{language === "mn" ? "Алдааг дараагийн үсэгт очихоос өмнө Backspace дарж заавал засах ёстой." : "Classic mode: You cannot proceed past a mistyped letter. Use Backspace immediately to resolve the red highlighting."}</li>
            <li>{language === "mn" ? "Зөвхөн хурд биш, алдаагүй бичих нь WPM болон оноог өндөр байлгана." : "Consistency over rush. Zero error runs scale your WPM progress exponentially because you never pause to backspace."}</li>
            <li>{language === "mn" ? "Эхлэхээс өмнө хэрэгтэй хөлгөө (Морь 🐎 / Пуужин 🚀 / Машин 🏎️) сонгон бэлдээрэй." : "Switch up your avatar types! Cars, rockets, and speed horses keep the racing path engaging."}</li>
          </ul>
        </section>
      </main>

      {/* 4. DESIGNED FOOTER */}
      <footer className="border-t border-zinc-900/60 bg-zinc-950 py-8 px-6 text-center text-xs text-zinc-600" id="app-footer">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-500 font-bold uppercase">Luminaq Typeracer Core</span>
            <span>•</span>
            <span>All stats processed in real-time</span>
          </div>
          <div className="font-mono text-[10px]">
            © {new Date().getFullYear()} Luminaq. Simple. Fast. Clean.
          </div>
        </div>
      </footer>
    </div>
  );
}
