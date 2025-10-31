import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Edit, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ShareContentDialog } from "@/components/community/ShareContentDialog";

interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  description: string;
  total_cards: number;
  created_at: string;
}

export default function DeckDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeck();
    }
  }, [id]);

  const fetchDeck = async () => {
    try {
      const { data, error } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setDeck(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/flashcards");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!deck) return null;

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/flashcards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-heading font-bold">{deck.title}</h2>
            <p className="text-muted-foreground">{deck.subject}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deck Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deck.description && (
              <p className="text-muted-foreground">{deck.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{deck.total_cards}</p>
                <p className="text-sm text-muted-foreground">Total Cards</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-accent">0</p>
                <p className="text-sm text-muted-foreground">Mastered</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-secondary">{deck.total_cards}</p>
                <p className="text-sm text-muted-foreground">To Review</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button className="flex-1" size="lg" onClick={() => navigate(`/flashcards/${id}/study`)}>
                <Play className="mr-2 h-5 w-5" />
                Study Now
              </Button>
              <Button variant="outline" size="lg">
                <Edit className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Start studying to see your spaced repetition schedule
              </p>
              <Badge variant="secondary">Next review: Today</Badge>
            </div>
          </CardContent>
        </Card>

        <ShareContentDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          contentType="flashcard_deck"
          contentId={id!}
          contentTitle={deck.title}
        />
      </div>
    </MainLayout>
  );
}
