import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Flashcards() {
  const navigate = useNavigate();

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
      </div>
    </MainLayout>
  );
}
