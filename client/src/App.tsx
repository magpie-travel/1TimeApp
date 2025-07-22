import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Import actual page components
import Timeline from "./pages/timeline";
import CreateMemorySimple from "./pages/create-memory-simple";
import NotFound from "./pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <Switch>
          <Route path="/" component={Timeline} />
          <Route path="/create" component={CreateMemorySimple} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
}

export default App;