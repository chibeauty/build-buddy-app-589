import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StudyPlans from "./pages/StudyPlans";
import Quizzes from "./pages/Quizzes";
import Flashcards from "./pages/Flashcards";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Offline from "./pages/Offline";
import NotFound from "./pages/NotFound";
import CreatePlan from "./pages/study-plans/CreatePlan";
import PlanDetails from "./pages/study-plans/PlanDetails";
import GenerateQuiz from "./pages/quizzes/GenerateQuiz";
import QuizDetails from "./pages/quizzes/QuizDetails";
import TakeQuiz from "./pages/quizzes/TakeQuiz";
import QuizResults from "./pages/quizzes/QuizResults";
import CreateDeck from "./pages/flashcards/CreateDeck";
import DeckDetails from "./pages/flashcards/DeckDetails";
import StudyMode from "./pages/flashcards/StudyMode";
import Welcome from "./pages/onboarding/Welcome";
import LearningStyle from "./pages/onboarding/LearningStyle";
import Goals from "./pages/onboarding/Goals";
import Notifications from "./pages/onboarding/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
            <Route path="/onboarding/learning-style" element={<ProtectedRoute><LearningStyle /></ProtectedRoute>} />
            <Route path="/onboarding/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/onboarding/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/study-plans" element={<ProtectedRoute><StudyPlans /></ProtectedRoute>} />
          <Route path="/study-plans/create" element={<ProtectedRoute><CreatePlan /></ProtectedRoute>} />
          <Route path="/study-plans/:id" element={<ProtectedRoute><PlanDetails /></ProtectedRoute>} />
          <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
          <Route path="/quizzes/generate" element={<ProtectedRoute><GenerateQuiz /></ProtectedRoute>} />
          <Route path="/quizzes/:id" element={<ProtectedRoute><QuizDetails /></ProtectedRoute>} />
          <Route path="/quizzes/:id/take" element={<ProtectedRoute><TakeQuiz /></ProtectedRoute>} />
          <Route path="/quizzes/:id/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
          <Route path="/flashcards/create" element={<ProtectedRoute><CreateDeck /></ProtectedRoute>} />
          <Route path="/flashcards/:id" element={<ProtectedRoute><DeckDetails /></ProtectedRoute>} />
          <Route path="/flashcards/:id/study" element={<ProtectedRoute><StudyMode /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/offline" element={<Offline />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
