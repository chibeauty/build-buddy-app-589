import { Moon, Sun, Sparkles, Brain, Palette, Leaf, Clock, Sunrise, Cloud, Zap } from "lucide-react";
import { useAdaptiveTheme } from "@/contexts/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeIcons = {
  light: Sun,
  dark: Moon,
  morning: Sunrise,
  afternoon: Cloud,
  evening: Sparkles,
  night: Moon,
  focus: Brain,
  creative: Palette,
  calm: Leaf,
  auto: Zap
};

export function DarkModeToggle() {
  const { adaptiveTheme, setAdaptiveTheme, autoTheme, setAutoTheme } = useAdaptiveTheme();
  const CurrentIcon = themeIcons[adaptiveTheme] || Zap;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CurrentIcon className="h-5 w-5 transition-all" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-theme" className="text-sm font-medium">Auto-Adaptive</Label>
            <Switch
              id="auto-theme"
              checked={autoTheme}
              onCheckedChange={setAutoTheme}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Changes based on time & context
          </p>
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Time-Based</p>
        </div>
        <DropdownMenuItem onClick={() => setAdaptiveTheme("morning")} className="cursor-pointer">
          <Sunrise className="mr-2 h-4 w-4" />
          <span>Morning</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAdaptiveTheme("afternoon")} className="cursor-pointer">
          <Cloud className="mr-2 h-4 w-4" />
          <span>Afternoon</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAdaptiveTheme("evening")} className="cursor-pointer">
          <Sparkles className="mr-2 h-4 w-4" />
          <span>Evening</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAdaptiveTheme("night")} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>Night</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Mood-Based</p>
        </div>
        <DropdownMenuItem onClick={() => setAdaptiveTheme("focus")} className="cursor-pointer">
          <Brain className="mr-2 h-4 w-4" />
          <span>Focus</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAdaptiveTheme("creative")} className="cursor-pointer">
          <Palette className="mr-2 h-4 w-4" />
          <span>Creative</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAdaptiveTheme("calm")} className="cursor-pointer">
          <Leaf className="mr-2 h-4 w-4" />
          <span>Calm</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setAdaptiveTheme("light")} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAdaptiveTheme("dark")} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
