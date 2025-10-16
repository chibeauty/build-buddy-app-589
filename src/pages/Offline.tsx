import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Offline() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
            <WifiOff className="h-full w-full" />
          </div>
          <CardTitle>You're Offline</CardTitle>
          <CardDescription>
            It looks like you've lost your internet connection. Some features may be limited.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Available Offline:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Recently viewed study materials</li>
              <li>Downloaded flashcard decks</li>
              <li>Cached quiz attempts</li>
              <li>Your profile information</li>
            </ul>
          </div>
          <Button onClick={handleRetry} className="w-full">
            Try to Reconnect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
