import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

// Pages
import Auth from "@/pages/auth";
import Timeline from "@/pages/timeline";
import CreateMemorySimple from "@/pages/create-memory-simple";
import AudioRecording from "@/pages/audio-recording";
import MediaInspiration from "@/pages/media-inspiration";
import MemoryDetails from "@/pages/memory-details";
import EditMemory from "@/pages/edit-memory";
import Prompts from "@/pages/prompts";
import Profile from "@/pages/profile";
import Search from "@/pages/search";
import SharedMemory from "@/pages/shared-memory";
import SharedWithMe from "@/pages/shared-with-me";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (user) {
    return <Redirect to="/" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth">
        <PublicRoute>
          <Auth />
        </PublicRoute>
      </Route>
      
      <Route path="/shared/:token">
        <SharedMemory />
      </Route>
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <Timeline />
        </ProtectedRoute>
      </Route>
      
      <Route path="/create">
        <ProtectedRoute>
          <CreateMemorySimple />
        </ProtectedRoute>
      </Route>
      
      <Route path="/create/audio">
        <ProtectedRoute>
          <AudioRecording />
        </ProtectedRoute>
      </Route>
      
      <Route path="/create/media">
        <ProtectedRoute>
          <MediaInspiration />
        </ProtectedRoute>
      </Route>
      
      <Route path="/memory/:id">
        <ProtectedRoute>
          <MemoryDetails />
        </ProtectedRoute>
      </Route>
      
      <Route path="/edit-memory/:id">
        <ProtectedRoute>
          <EditMemory />
        </ProtectedRoute>
      </Route>
      
      <Route path="/prompts">
        <ProtectedRoute>
          <Prompts />
        </ProtectedRoute>
      </Route>
      
      <Route path="/search">
        <ProtectedRoute>
          <Search />
        </ProtectedRoute>
      </Route>
      
      <Route path="/shared-with-me">
        <ProtectedRoute>
          <SharedWithMe />
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
