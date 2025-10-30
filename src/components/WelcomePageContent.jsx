'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';

const WelcomePageContent = () => {
  const { user, isLoading } = useUser();

  return (
    <section className="relative isolate flex min-h-full items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-300 via-purple-300 to-rose-300 blur-3xl opacity-60 dark:opacity-30" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-gradient-to-br from-violet-500/50 to-indigo-500/40 blur-3xl opacity-40 dark:opacity-20" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/40 bg-white/80 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/80"
          >
            <Image
              src="/logo.png"
              alt="Site Sensei Logo"
              width={64}
              height={64}
              className="h-10 w-10 object-contain"
            />
          </motion.div>
          <div className="space-y-4">
            <span className="pill">Site Sensei</span>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-5xl">
              Build polished web experiences in minutes.
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              Our AI-powered studio turns your ideas into responsive, production-ready pages. Describe the flow you
              need and iterate instantly with live previews and guided edits.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="glass-card max-w-xl space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Start designing with balance and flow
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Generate custom layouts, refine the details, and share your creations — all without leaving the canvas.
            </p>
          </div>
          {!isLoading && (
            <Link href={user ? '/create' : '/api/auth/login'} passHref legacyBehavior>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary w-full justify-center"
              >
                {user ? 'Go to Builder' : 'Sign in to get started'}
              </motion.a>
            </Link>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-slate-800/60 dark:bg-slate-900/40">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live preview updates
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-slate-800/60 dark:bg-slate-900/40">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              Cross-device responsive
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-slate-800/60 dark:bg-slate-900/40">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Edit with natural language
            </span>
          </div>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500"
        >
          © {new Date().getFullYear()} Site Sensei. Crafted for modern builders.
        </motion.footer>
      </motion.div>
    </section>
  );
};

export default WelcomePageContent;
