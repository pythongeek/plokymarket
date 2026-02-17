import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/views/Home';
import { Markets } from '@/views/Markets';
import { MarketDetail } from '@/views/MarketDetail';
import { Login } from '@/views/Login';
import { Register } from '@/views/Register';
import { Portfolio } from '@/views/Portfolio';
import { Wallet } from '@/views/Wallet';
import { Admin } from '@/views/Admin';
import { WorkflowDashboard } from '@/components/workflows/WorkflowDashboard';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { LoadingProvider } from '@/components/loading/LoadingProvider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="markets" element={<Markets />} />
                <Route path="markets/:slug" element={<MarketDetail />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="admin" element={<Admin />} />
                <Route path="admin/workflows" element={<WorkflowDashboard />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </LoadingProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
