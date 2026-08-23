import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import Dataset from "@/pages/dataset";
import Upload from "@/pages/upload";
import Query from "@/pages/query";
import Results from "@/pages/results";
import History from "@/pages/history";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function HomeRoute() { return <ProtectedRoute component={Home} />; }
function DatasetRoute() { return <ProtectedRoute component={Dataset} />; }
function UploadRoute() { return <ProtectedRoute component={Upload} />; }
function QueryRoute() { return <ProtectedRoute component={Query} />; }
function ResultsRoute() { return <ProtectedRoute component={Results} />; }
function HistoryRoute() { return <ProtectedRoute component={History} />; }
function AdminRoute() { return <ProtectedRoute component={Admin} adminOnly />; }

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={HomeRoute} />
      <Route path="/dataset" component={DatasetRoute} />
      <Route path="/upload" component={UploadRoute} />
      <Route path="/query" component={QueryRoute} />
      <Route path="/results" component={ResultsRoute} />
      <Route path="/history" component={HistoryRoute} />
      <Route path="/admin" component={AdminRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
