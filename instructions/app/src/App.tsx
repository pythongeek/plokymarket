import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Markets } from '@/pages/Markets';
import { MarketDetail } from '@/pages/MarketDetail';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Portfolio } from '@/pages/Portfolio';
import { Wallet } from '@/pages/Wallet';
import { Admin } from '@/pages/Admin';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="markets" element={<Markets />} />
          <Route path="markets/:id" element={<MarketDetail />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
