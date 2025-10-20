import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RotateCw, X } from "lucide-react";

interface Flashcard {
  id: string;
  front_text: string;
  back_text: string;
  image_url: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
}

export default function StudyMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studiedCards, setStudiedCards] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCards();
    }
  }, [id]);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", id)
        .order("next_review_date");

      if (error) throw error;
      setCards(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNextReview = (quality: number, card: Flashcard) => {
    let { ease_factor, interval_days, repetitions } = card;

    if (quality >= 3) {
      if (repetitions === 0) {
        interval_days = 1;
      } else if (repetitions === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval_days = 1;
    }

    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    return {
      ease_factor,
      interval_days,
      repetitions,
      next_review_date: new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000).toISOString(),
    };
  };

  const handleDifficulty = async (quality: number) => {
    const currentCard = cards[currentIndex];
    const updates = calculateNextReview(quality, currentCard);

    try {
      const { error } = await supabase
        .from("flashcards")
        .update(updates)
        .eq("id", currentCard.id);

      if (error) throw error;

      setStudiedCards(studiedCards + 1);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        toast({
          title: "Study Session Complete!",
          description: `You've reviewed ${cards.length} cards.`,
        });
        navigate(`/flashcards/${id}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Loading flashcards...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container py-8 text-center">
        <p className="mb-4 text-muted-foreground">No flashcards in this deck yet.</p>
        <Button onClick={() => navigate(`/flashcards/${id}`)}>Back to Deck</Button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Session</h1>
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length} • {studiedCards} studied
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate(`/flashcards/${id}`)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Progress value={progress} className="mb-8" />

      <div
        className="perspective-1000 mb-8 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card
          className={`relative h-96 transition-transform duration-500 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          <CardContent className="flex h-full items-center justify-center p-8">
            <div
              className={`absolute inset-0 flex items-center justify-center p-8 ${
                isFlipped ? "hidden" : ""
              }`}
            >
              <div className="text-center">
                <p className="mb-2 text-xs text-muted-foreground">FRONT</p>
                <p className="text-2xl font-medium">{currentCard.front_text}</p>
              </div>
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center p-8 ${
                isFlipped ? "" : "hidden"
              }`}
            >
              <div className="text-center">
                <p className="mb-2 text-xs text-muted-foreground">BACK</p>
                <p className="text-2xl font-medium">{currentCard.back_text}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isFlipped ? (
        <div className="text-center">
          <Button onClick={() => setIsFlipped(true)} size="lg">
            <RotateCw className="mr-2 h-4 w-4" />
            Flip Card
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-3">
            <Button variant="outline" onClick={() => handleDifficulty(1)} className="flex-col h-auto py-4">
              <span className="mb-1 text-destructive">Again</span>
              <span className="text-xs text-muted-foreground">&lt;1min</span>
            </Button>
            <Button variant="outline" onClick={() => handleDifficulty(2)} className="flex-col h-auto py-4">
              <span className="mb-1 text-warning">Hard</span>
              <span className="text-xs text-muted-foreground">1 day</span>
            </Button>
            <Button variant="outline" onClick={() => handleDifficulty(3)} className="flex-col h-auto py-4">
              <span className="mb-1 text-success">Good</span>
              <span className="text-xs text-muted-foreground">
                {currentCard.repetitions === 0 ? "1 day" : currentCard.repetitions === 1 ? "6 days" : `${Math.round(currentCard.interval_days * currentCard.ease_factor)} days`}
              </span>
            </Button>
            <Button variant="outline" onClick={() => handleDifficulty(4)} className="flex-col h-auto py-4">
              <span className="mb-1 text-success">Easy</span>
              <span className="text-xs text-muted-foreground">
                {Math.round(currentCard.interval_days * currentCard.ease_factor * 1.3)} days
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
