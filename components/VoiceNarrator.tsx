import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface VoiceNarratorProps {
  text: string;
}

const VoiceNarrator = ({ text }: VoiceNarratorProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentWord("");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startSpeaking = useCallback(() => {
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    // Try to get a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes("Google") ||
        v.name.includes("Samantha") ||
        v.name.includes("Daniel") ||
        v.name.includes("Karen")
    );
    if (preferred) utterance.voice = preferred;

    utterance.onboundary = (e) => {
      if (e.name === "word") {
        const word = text.substring(e.charIndex, e.charIndex + e.charLength);
        setCurrentWord(word);
        setProgress((e.charIndex / text.length) * 100);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(100);
      setCurrentWord("");
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  }, [text, stopSpeaking]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card glow-border rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">AI Voice Narrator</p>
            <p className="text-[10px] text-muted-foreground">
              {isSpeaking ? (isPaused ? "Paused" : "Speaking...") : "Ready to explain"}
            </p>
          </div>
        </div>

        <div className="flex-1 mx-3">
          {isSpeaking && (
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentWord}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-primary/80 font-medium truncate"
                >
                  {currentWord && `"...${currentWord}..."`}
                </motion.p>
              </AnimatePresence>
            </div>
          )}

          {!isSpeaking && (
            <p className="text-xs text-muted-foreground">
              Click play to hear a detailed explanation of your data
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isSpeaking ? (
            <Button size="sm" onClick={startSpeaking} className="gap-1.5 h-8">
              <Play className="w-3.5 h-3.5" />
              <span className="text-xs">Explain</span>
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePause}
                className="h-8 w-8 p-0"
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={stopSpeaking}
                className="h-8 w-8 p-0"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Visualizer bars when speaking */}
      {isSpeaking && !isPaused && (
        <div className="flex items-end gap-0.5 mt-3 h-6 justify-center">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-primary/50"
              animate={{
                height: [4, Math.random() * 20 + 4, 4],
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default VoiceNarrator;
