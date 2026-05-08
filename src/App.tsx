import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthGate from "@/components/auth/AuthGate";
import AppLayout from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AuthGate>
          <AppProvider>
            <AppLayout />
          </AppProvider>
        </AuthGate>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
