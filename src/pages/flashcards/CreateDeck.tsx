import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Upload, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FlashcardInput {
  front: string;
  back: string;
}

export default function CreateDeck() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [deckData, setDeckData] = useState({
    title: "",
    subject: "",
    description: "",
  });

  const [cards, setCards] = useState<FlashcardInput[]>([
    { front: "", back: "" },
    { front: "", back: "" },
  ]);

  const [aiContent, setAiContent] = useState("");

  const addCard = () => {
    setCards([...cards, { front: "", back: "" }]);
  };

  const removeCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index));
    }
  };

  const updateCard = (index: number, field: "front" | "back", value: string) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate that at least one card has both front and back filled
    const validCards = cards.filter((card) => card.front.trim() && card.back.trim());
    if (validCards.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one complete flashcard",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the deck
      const { data: deck, error: deckError } = await supabase
        .from("flashcard_decks")
        .insert({
          user_id: user.id,
          title: deckData.title,
          subject: deckData.subject,
          description: deckData.description,
          total_cards: validCards.length,
        })
        .select()
        .single();

      if (deckError) throw deckError;

      // Create the flashcards
      const flashcardsData = validCards.map((card) => ({
        deck_id: deck.id,
        front_text: card.front,
        back_text: card.back,
      }));

      const { error: cardsError } = await supabase.from("flashcards").insert(flashcardsData);

      if (cardsError) throw cardsError;

      toast({
        title: "Success",
        description: "Flashcard deck created successfully!",
      });
      navigate(`/flashcards/${deck.id}`);
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
      <div className="container max-w-4xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/flashcards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-3xl font-heading font-bold">Create Flashcard Deck</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deck Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Deck Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Spanish Vocabulary - Chapter 1"
                    value={deckData.title}
                    onChange={(e) => setDeckData({ ...deckData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Spanish"
                    value={deckData.subject}
                    onChange={(e) => setDeckData({ ...deckData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What topics does this deck cover?"
                    value={deckData.description}
                    onChange={(e) => setDeckData({ ...deckData, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create Flashcards</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="manual">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="ai">AI Generate</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="manual" className="space-y-4 mt-4">
                    {cards.map((card, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-base">Card {index + 1}</Label>
                            {cards.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCard(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`front-${index}`}>Front</Label>
                            <Textarea
                              id={`front-${index}`}
                              placeholder="Question or term"
                              value={card.front}
                              onChange={(e) => updateCard(index, "front", e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`back-${index}`}>Back</Label>
                            <Textarea
                              id={`back-${index}`}
                              placeholder="Answer or definition"
                              value={card.back}
                              onChange={(e) => updateCard(index, "back", e.target.value)}
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button type="button" variant="outline" onClick={addCard} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Card
                    </Button>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Paste Content for AI Generation</Label>
                      <Textarea
                        placeholder="Paste your study material here. AI will generate flashcards based on this content..."
                        value={aiContent}
                        onChange={(e) => setAiContent(e.target.value)}
                        rows={10}
                        className="resize-none"
                      />
                    </div>
                    <Button type="button" className="w-full" disabled>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Flashcards (Coming Soon)
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      AI-powered flashcard generation will be available in a future update
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/flashcards")} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Deck"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
