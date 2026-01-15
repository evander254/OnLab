import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Pricing from './components/Pricing';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard'; // Keep for reference if needed, or remove later
import UserDashboard from './components/UserDashboard';
import MyOrders from './components/MyOrders';
import Wallet from './components/Wallet';
import Settings from './components/Settings';
import AdminLogin from './components/admin/adminlogin';
import AdminDB from './components/admin/adminDB';
import ProcessOrder from './components/admin/ProcessOrder';
import PlagiarismCheck from './components/PlagiarismCheck';
import DashboardLayout from './components/DashboardLayout';

// ... (previous imports)

// ... (previous imports)

// Public Layout Wrapper
const PublicLayout = ({ theme, toggleTheme }) => (
  <div className="app-wrapper">
    <Header theme={theme} toggleTheme={toggleTheme} />
    <Outlet />
    <Footer />
  </div>
);

const Home = () => (
  <main>
    <Hero />
    <Services />
    <Pricing />
    <CTA />
  </main>
);

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes with Header & Footer */}
        <Route element={<PublicLayout theme={theme} toggleTheme={toggleTheme} />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Dashboard Routes with Sidebar Layout */}
        <Route path="/dashboard" element={<DashboardLayout theme={theme} toggleTheme={toggleTheme} />}>
          <Route index element={<UserDashboard />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDB />} />
        <Route path="/admin/process-order" element={<ProcessOrder />} />
      </Routes>
    </Router>
  );
}

export default App
