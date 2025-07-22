import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./lib/auth";

// Import actual page components
import Timeline from "./pages/timeline";
import CreateMemorySimple from "./pages/create-memory-simple";
import Auth from "./pages/auth";
import NotFound from "./pages/not-found";

function AuthenticatedApp() {
  return (
    <Switch>
      <Route path="/" component={Timeline} />
      <Route path="/create" component={CreateMemorySimple} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { user, isLoading } = useAuth();
  
  console.log('App render - user:', user, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        {user ? <AuthenticatedApp /> : <Auth />}
      </div>
    </QueryClientProvider>
  );
}

export default App;