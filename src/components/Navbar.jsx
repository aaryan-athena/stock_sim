import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/simulator", label: "Simulator" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-white/10 to-green-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              S
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              StockSim
              <span className="text-orange-400 ml-0.5">India</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.to)
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-gray-800 rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {link.to === "/admin" && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-orange-500/20 text-orange-400 rounded font-mono uppercase tracking-wide">
                    Admin
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Auth section */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 max-w-[120px] truncate">
                    {user.email}
                  </span>
                  <span className="text-gray-500 text-xs">▾</span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
                    >
                      {isAdmin && (
                        <div className="px-3 py-2 border-b border-gray-700">
                          <span className="text-[10px] text-orange-400 font-mono uppercase tracking-widest">
                            Admin Access
                          </span>
                        </div>
                      )}
                      <button
                        onClick={async () => { await signOut(); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </motion.nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
