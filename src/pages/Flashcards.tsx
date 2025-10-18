import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  total_cards: number;
}

export default function Flashcards() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const { data, error } = await supabase
        .from("flashcard_decks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDecks(data || []);
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

  return (
    <MainLayout>
      <div className="container max-w-screen-xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-heading font-bold">My Flashcard Decks</h2>
          <Button onClick={() => navigate("/flashcards/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Deck
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : decks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <CreditCard className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">No flashcard decks yet</h3>
                <p className="text-muted-foreground">Create your first deck to start memorizing</p>
              </div>
              <Button onClick={() => navigate("/flashcards/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Deck
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <Card key={deck.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/flashcards/${deck.id}`)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{deck.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{deck.subject}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cards</span>
                    <Badge variant="secondary">{deck.total_cards}</Badge>
                  </div>
                  <Button className="w-full" variant="outline">
                    Study Deck
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
