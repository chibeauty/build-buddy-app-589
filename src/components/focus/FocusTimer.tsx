import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Settings2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BreathingGuide } from "./BreathingGuide";
import { toast } from "@/hooks/use-toast";

type TimerMode = "focus" | "shortBreak" | "longBreak";

interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

const AMBIENT_SOUNDS = [
  { id: "none", name: "None", url: "" },
  { id: "rain", name: "Rain", url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112e489.mp3" },
  { id: "forest", name: "Forest", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf2f6b5.mp3" },
  { id: "ocean", name: "Ocean Waves", url: "https://cdn.pixabay.com/audio/2022/06/07/audio_13a5169c4f.mp3" },
  { id: "fireplace", name: "Fireplace", url: "https://cdn.pixabay.com/audio/2022/03/12/audio_c2e6fe2e64.mp3" },
];

export function FocusTimer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [ambientSound, setAmbientSound] = useState("none");
  const [ambientVolume, setAmbientVolume] = useState(50);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);

  const totalTime = mode === "focus" 
    ? settings.focusDuration * 60 
    : mode === "shortBreak" 
    ? settings.shortBreakDuration * 60 
    : settings.longBreakDuration * 60;

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = ambientVolume / 100;
      if (ambientSound !== "none" && isRunning) {
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [ambientSound, ambientVolume, isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (settings.soundEnabled && notificationSoundRef.current) {
      notificationSoundRef.current.play().catch(() => {});
    }

    if (settings.notificationsEnabled && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Focus Timer", {
            body: mode === "focus" ? "Time for a break!" : "Ready to focus again?",
            icon: "/pwa-192x192.png",
          });
        }
      });
    }

    if (mode === "focus") {
      setSessions((s) => s + 1);
      const nextBreakMode = (sessionsCompleted + 1) % settings.sessionsUntilLongBreak === 0 
        ? "longBreak" 
        : "shortBreak";
      setMode(nextBreakMode);
      setTimeLeft(nextBreakMode === "longBreak" ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60);
      
      toast({
        title: "Focus session complete!",
        description: "Time for a well-deserved break.",
      });

      if (settings.autoStartBreaks) {
        setIsRunning(true);
      }
      
      setShowBreathingGuide(true);
    } else {
      setMode("focus");
      setTimeLeft(settings.focusDuration * 60);
      
      toast({
        title: "Break's over!",
        description: "Ready to focus again?",
      });

      if (settings.autoStartFocus) {
        setIsRunning(true);
      }
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    const duration = newMode === "focus" 
      ? settings.focusDuration 
      : newMode === "shortBreak" 
      ? settings.shortBreakDuration 
      : settings.longBreakDuration;
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const updateSettings = (key: keyof TimerSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (showBreathingGuide && mode !== "focus") {
    return (
      <BreathingGuide 
        duration={mode === "shortBreak" ? settings.shortBreakDuration : settings.longBreakDuration}
        onClose={() => setShowBreathingGuide(false)}
        onSkip={() => {
          setShowBreathingGuide(false);
          setMode("focus");
          setTimeLeft(settings.focusDuration * 60);
        }}
      />
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Focus Timer</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {showSettings ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Focus Duration (minutes)</Label>
              <Slider
                value={[settings.focusDuration]}
                onValueChange={([value]) => updateSettings("focusDuration", value)}
                min={1}
                max={60}
                step={1}
              />
              <p className="text-sm text-muted-foreground">{settings.focusDuration} minutes</p>
            </div>
            
            <div className="space-y-2">
              <Label>Short Break (minutes)</Label>
              <Slider
                value={[settings.shortBreakDuration]}
                onValueChange={([value]) => updateSettings("shortBreakDuration", value)}
                min={1}
                max={30}
                step={1}
              />
              <p className="text-sm text-muted-foreground">{settings.shortBreakDuration} minutes</p>
            </div>

            <div className="space-y-2">
              <Label>Long Break (minutes)</Label>
              <Slider
                value={[settings.longBreakDuration]}
                onValueChange={([value]) => updateSettings("longBreakDuration", value)}
                min={5}
                max={60}
                step={1}
              />
              <p className="text-sm text-muted-foreground">{settings.longBreakDuration} minutes</p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-breaks">Auto-start breaks</Label>
              <Switch
                id="auto-breaks"
                checked={settings.autoStartBreaks}
                onCheckedChange={(checked) => updateSettings("autoStartBreaks", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-focus">Auto-start focus</Label>
              <Switch
                id="auto-focus"
                checked={settings.autoStartFocus}
                onCheckedChange={(checked) => updateSettings("autoStartFocus", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable notifications</Label>
              <Switch
                id="notifications"
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => updateSettings("notificationsEnabled", checked)}
              />
            </div>

            <Button onClick={() => setShowSettings(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <>
            <Tabs value={mode} onValueChange={(value) => switchMode(value as TimerMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="focus">Focus</TabsTrigger>
                <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
                <TabsTrigger value="longBreak">Long Break</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-center space-y-4">
              <div className="text-6xl font-bold font-mono">{formatTime(timeLeft)}</div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Sessions completed: {sessionsCompleted}
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={toggleTimer} size="lg" className="gap-2">
                {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {isRunning ? "Pause" : "Start"}
              </Button>
              <Button onClick={resetTimer} size="lg" variant="outline" className="gap-2">
                <RotateCcw className="h-5 w-5" />
                Reset
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {ambientSound !== "none" && isRunning ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  Ambient Sound
                </Label>
                <Select value={ambientSound} onValueChange={setAmbientSound}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AMBIENT_SOUNDS.map((sound) => (
                      <SelectItem key={sound.id} value={sound.id}>
                        {sound.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {ambientSound !== "none" && (
                <div className="space-y-2">
                  <Label>Volume</Label>
                  <Slider
                    value={[ambientVolume]}
                    onValueChange={([value]) => setAmbientVolume(value)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <audio
          ref={audioRef}
          src={AMBIENT_SOUNDS.find((s) => s.id === ambientSound)?.url}
          loop
        />
        <audio
          ref={notificationSoundRef}
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSBY="
        />
      </CardContent>
    </Card>
  );
}
