'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Menu, X, User, Sun, Moon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/create', label: 'Create' },
  { href: '/explore', label: 'Explore' },
  { href: '/pricing', label: 'Pricing' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isLoading } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [nicknameOverride, setNicknameOverride] = useState(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setDbUser(null);
        setUserRole(null);
        setNicknameOverride(null);
        return;
      }

      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setDbUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      try {
        const roleResponse = await fetch('/api/getUserRole');
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          setUserRole(roleData.role);
          setNicknameOverride(roleData.nickname || null);
        } else {
          setUserRole(null);
          setNicknameOverride(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setNicknameOverride(null);
      }
    };

    fetchUserData();
  }, [user]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const toggleProfile = () => setIsProfileOpen((prev) => !prev);
  const toggleDarkMode = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const closeMenus = () => {
    setIsOpen(false);
    setIsProfileOpen(false);
  };

  useEffect(() => {
    const handler = () => closeMenus();
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (!mounted) return null;

  const resolvedUserNickname =
    nicknameOverride || dbUser?.nickname || dbUser?.name?.replace(/\s+/g, '-').toLowerCase();

  const resolvedLinks =
    userRole === 'admin' ? [...NAV_LINKS, { href: '/admin', label: 'Admin' }] : NAV_LINKS;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl transition dark:border-slate-800/60 dark:bg-slate-950/50">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-md backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
              <Image src="/logo.png" alt="Site Sensei Logo" width={22} height={22} />
            </span>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Site Sensei
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Modern web AI studio
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {resolvedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:bg-white/80 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-indigo-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="rounded-full border border-slate-200/80 bg-white/70 p-2 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {isLoading ? (
            <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/70" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={toggleProfile}
                className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold uppercase text-white">
                  {dbUser?.name?.[0] || user.nickname?.[0] || <User className="h-4 w-4" />}
                </span>
                <span>{dbUser?.name?.split(' ')[0] || user.nickname || 'Profile'}</span>
                <ChevronDown className={`h-4 w-4 transition ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200/70 bg-white/90 p-3 text-sm shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80"
                  >
                    <div className="mb-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-left shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {dbUser?.name || user.nickname}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href={`/profile/${resolvedUserNickname}`}
                        onClick={closeMenus}
                        className="block rounded-xl px-3 py-2 font-medium text-slate-600 transition hover:bg-indigo-50/80 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200"
                      >
                        Your profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={closeMenus}
                        className="block rounded-xl px-3 py-2 font-medium text-slate-600 transition hover:bg-indigo-50/80 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200"
                      >
                        Settings
                      </Link>
                      {userRole === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={closeMenus}
                          className="block rounded-xl px-3 py-2 font-medium text-slate-600 transition hover:bg-indigo-50/80 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200"
                        >
                          Admin dashboard
                        </Link>
                      )}
                      <Link
                        href="/api/auth/logout"
                        onClick={closeMenus}
                        className="block rounded-xl px-3 py-2 font-medium text-rose-500 transition hover:bg-rose-50/80 hover:text-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/15"
                      >
                        Log out
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/api/auth/login" className="btn btn-primary">
              Sign in
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggleDarkMode}
            className="rounded-full border border-slate-200/70 bg-white/70 p-2 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={toggleMenu}
            className="inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white/70 p-2 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden"
          >
            <div className="space-y-4 border-t border-slate-200/70 bg-white/90 px-4 py-5 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/70">
              <div className="flex flex-col gap-2">
                {resolvedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenus}
                    className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              {user ? (
                <div className="space-y-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-lg dark:border-slate-700/70 dark:bg-slate-900/70">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold uppercase text-white">
                      {dbUser?.name?.[0] || user.nickname?.[0] || <User className="h-4 w-4" />}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {dbUser?.name || user.nickname}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm font-semibold">
                    <Link
                      href={`/profile/${resolvedUserNickname}`}
                      onClick={closeMenus}
                      className="block rounded-xl px-3 py-2 text-slate-600 transition hover:bg-indigo-50/80 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200"
                    >
                      Your profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={closeMenus}
                      className="block rounded-xl px-3 py-2 text-slate-600 transition hover:bg-indigo-50/80 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200"
                    >
                      Settings
                    </Link>
                    {userRole === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={closeMenus}
                        className="block rounded-xl px-3 py-2 text-slate-600 transition hover:bg-indigo-50/80 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200"
                      >
                        Admin dashboard
                      </Link>
                    )}
                    <Link
                      href="/api/auth/logout"
                      onClick={closeMenus}
                      className="block rounded-xl px-3 py-2 text-rose-500 transition hover:bg-rose-50/80 hover:text-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/15"
                    >
                      Log out
                    </Link>
                  </div>
                </div>
              ) : (
                <Link href="/api/auth/login" className="btn btn-primary w-full justify-center">
                  Sign in to get started
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
