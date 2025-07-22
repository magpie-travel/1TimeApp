import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Simple placeholder components to get the app running
function Timeline() {
  return <div className="p-4"><h1>Timeline - Coming Soon</h1></div>;
}

function CreateMemory() {
  return <div className="p-4"><h1>Create Memory - Coming Soon</h1></div>;
}

function NotFound() {
  return <div className="p-4"><h1>Page Not Found</h1></div>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <Switch>
          <Route path="/" component={Timeline} />
          <Route path="/create" component={CreateMemory} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
}

export default App;