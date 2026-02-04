import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/views/Home';
import { Markets } from '@/views/Markets';
import { MarketDetail } from '@/views/MarketDetail';
import { Login } from '@/views/Login';
import { Register } from '@/views/Register';
import { Portfolio } from '@/views/Portfolio';
import { Wallet } from '@/views/Wallet';
import { Admin } from '@/views/Admin';
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
