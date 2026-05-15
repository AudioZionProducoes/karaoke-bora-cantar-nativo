import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LocalMusicProvider } from "@/contexts/local-music-context";
import { QueueProvider } from "@/contexts/queue-context";
import { SessionProvider } from "@/contexts/session-context";
import { AuthProvider } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Player from "@/pages/player";
import Admin from "@/pages/admin";
import TVPage from "@/pages/tv";
import RemotePage from "@/pages/remote";
import LoginPage from "@/pages/login";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/player/:id" component={Player} />
      <Route path="/admin" component={Admin} />
      <Route path="/tv/:sessionId" component={TVPage} />
      <Route path="/remote/:sessionId" component={RemotePage} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="karaoke-ct-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LocalMusicProvider>
            <QueueProvider>
              <SessionProvider>
                <AuthProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <Router />
                  </WouterRouter>
                  <Toaster />
                </AuthProvider>
              </SessionProvider>
            </QueueProvider>
          </LocalMusicProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
