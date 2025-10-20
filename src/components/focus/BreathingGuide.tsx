import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, SkipForward } from "lucide-react";

interface BreathingGuideProps {
  duration: number; // minutes
  onClose: () => void;
  onSkip: () => void;
}

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

const BREATHING_PATTERN = {
  inhale: 4,
  hold: 4,
  exhale: 6,
  rest: 2,
};

export function BreathingGuide({ duration, onClose, onSkip }: BreathingGuideProps) {
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [phaseTime, setPhaseTime] = useState(BREATHING_PATTERN.inhale);
  const [cyclesCompleted, setCycles] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          onClose();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseTime((t) => {
        if (t <= 1) {
          moveToNextPhase();
          return getNextPhaseDuration();
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const moveToNextPhase = () => {
    const nextPhase: Record<BreathingPhase, BreathingPhase> = {
      inhale: "hold",
      hold: "exhale",
      exhale: "rest",
      rest: "inhale",
    };
    
    const next = nextPhase[phase];
    setPhase(next);
    
    if (next === "inhale") {
      setCycles((c) => c + 1);
    }
  };

  const getNextPhaseDuration = () => {
    const nextPhase: Record<BreathingPhase, BreathingPhase> = {
      inhale: "hold",
      hold: "exhale",
      exhale: "rest",
      rest: "inhale",
    };
    return BREATHING_PATTERN[nextPhase[phase]];
  };

  const getPhaseText = () => {
    switch (phase) {
      case "inhale":
        return "Breathe In";
      case "hold":
        return "Hold";
      case "exhale":
        return "Breathe Out";
      case "rest":
        return "Rest";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "inhale":
        return "from-primary to-primary-glow";
      case "hold":
        return "from-accent to-success";
      case "exhale":
        return "from-primary-glow to-primary";
      case "rest":
        return "from-muted to-muted-foreground";
    }
  };

  const getScale = () => {
    const elapsed = BREATHING_PATTERN[phase] - phaseTime;
    const progress = elapsed / BREATHING_PATTERN[phase];
    
    switch (phase) {
      case "inhale":
        return 1 + progress * 0.5; // Scale from 1 to 1.5
      case "hold":
        return 1.5;
      case "exhale":
        return 1.5 - progress * 0.5; // Scale from 1.5 to 1
      case "rest":
        return 1;
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Breathing Exercise</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onSkip}>
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${getPhaseColor()} opacity-30 blur-xl transition-all duration-1000 ease-in-out`}
            style={{
              transform: `scale(${getScale()})`,
            }}
          />
          <div
            className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${getPhaseColor()} flex items-center justify-center transition-all duration-1000 ease-in-out shadow-elegant`}
            style={{
              transform: `scale(${getScale()})`,
            }}
          >
            <div className="text-center text-white">
              <div className="text-3xl font-bold">{getPhaseText()}</div>
              <div className="text-6xl font-bold mt-4">{phaseTime}</div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg text-muted-foreground">
            Cycles completed: {cyclesCompleted}
          </p>
          <p className="text-sm text-muted-foreground">
            Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </p>
        </div>

        <div className="text-center text-sm text-muted-foreground max-w-md">
          <p>Follow the breathing pattern to relax and reset your mind.</p>
          <p className="mt-2">
            4 seconds in • 4 seconds hold • 6 seconds out • 2 seconds rest
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
