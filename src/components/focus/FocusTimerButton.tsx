import { useState } from "react";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FocusTimer } from "./FocusTimer";

export function FocusTimerButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-elegant z-40 bg-background hover:bg-accent"
          title="Focus Timer"
        >
          <Timer className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Focus Timer</SheetTitle>
          <SheetDescription>
            Use the Pomodoro technique to stay focused and productive
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <FocusTimer />
        </div>
      </SheetContent>
    </Sheet>
  );
}
