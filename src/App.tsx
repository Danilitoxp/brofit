import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import StartWorkout from "./pages/StartWorkout";
import QuickWorkout from "./pages/QuickWorkout";
import Progress from "./pages/Progress";
import Ranking from "./pages/Ranking";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/start-workout" element={
              <ProtectedRoute>
                <StartWorkout />
              </ProtectedRoute>
            } />
            <Route path="/quick-workout" element={
              <ProtectedRoute>
                <QuickWorkout />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="progress" element={<Progress />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="friends" element={<Friends />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
