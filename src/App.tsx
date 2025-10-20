import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { UpgradeButton } from "@/components/UpgradeButton";
import { AdaptiveThemeWatcher } from "@/components/AdaptiveThemeWatcher";
import { FocusTimerButton } from "@/components/focus/FocusTimerButton";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const StudyPlans = lazy(() => import("./pages/StudyPlans"));
const Quizzes = lazy(() => import("./pages/Quizzes"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Community = lazy(() => import("./pages/Community"));
const Summarize = lazy(() => import("./pages/Summarize"));
const GroupDetails = lazy(() => import("./pages/community/GroupDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const Offline = lazy(() => import("./pages/Offline"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CreatePlan = lazy(() => import("./pages/study-plans/CreatePlan"));
const PlanDetails = lazy(() => import("./pages/study-plans/PlanDetails"));
const GenerateQuiz = lazy(() => import("./pages/quizzes/GenerateQuiz"));
const QuizDetails = lazy(() => import("./pages/quizzes/QuizDetails"));
const TakeQuiz = lazy(() => import("./pages/quizzes/TakeQuiz"));
const QuizResults = lazy(() => import("./pages/quizzes/QuizResults"));
const CreateDeck = lazy(() => import("./pages/flashcards/CreateDeck"));
const DeckDetails = lazy(() => import("./pages/flashcards/DeckDetails"));
const StudyMode = lazy(() => import("./pages/flashcards/StudyMode"));
const Achievements = lazy(() => import("./pages/profile/Achievements"));
const Welcome = lazy(() => import("./pages/onboarding/Welcome"));
const LearningStyle = lazy(() => import("./pages/onboarding/LearningStyle"));
const Goals = lazy(() => import("./pages/onboarding/Goals"));
const NotificationsOnboarding = lazy(() => import("./pages/onboarding/Notifications"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Billing = lazy(() => import("./pages/Billing"));
const Referrals = lazy(() => import("./pages/Referrals"));
const ManageSubscription = lazy(() => import("./pages/ManageSubscription"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AdaptiveThemeWatcher />
            <AuthProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
                <Route path="/onboarding/learning-style" element={<ProtectedRoute><LearningStyle /></ProtectedRoute>} />
                <Route path="/onboarding/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                <Route path="/onboarding/notifications" element={<ProtectedRoute><NotificationsOnboarding /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
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
                <Route path="/summarize" element={<ProtectedRoute><Summarize /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                <Route path="/community/groups/:id" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/subscription/manage" element={<ProtectedRoute><ManageSubscription /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/offline" element={<Offline />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <OfflineIndicator />
            <UpgradeButton />
            <FocusTimerButton />
          </AuthProvider>
        </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
