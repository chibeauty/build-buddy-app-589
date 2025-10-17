import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Welcome to <span className="text-primary">ExHub</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered companion for personalized learning and growth
        </p>
        <Button size="lg" className="mt-8" onClick={() => navigate('/auth')}>
          Get Started <ArrowRight className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
