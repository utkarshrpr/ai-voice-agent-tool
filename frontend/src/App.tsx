import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Settings, History, Phone } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AgentConfiguration from './pages/AgentConfiguration';
import CallHistory from './pages/CallHistory';

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/agents', icon: Settings, label: 'Agent Config' },
    { path: '/history', icon: History, label: 'Call History' },
  ];

  return (
    <aside className="w-64 min-h-screen bg-dark-card/30 backdrop-blur-xl border-r border-dark-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center shadow-glow">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Voice Agent</h1>
            <p className="text-xs text-gray-400">AI Call Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 text-white shadow-glow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-gradient-to-b from-accent-primary to-accent-secondary rounded-r-full"
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <div className="glass-card p-3 text-xs text-gray-400">
          <p className="font-semibold text-white mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-success rounded-full animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agents" element={<AgentConfiguration />} />
              <Route path="/history" element={<CallHistory />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
