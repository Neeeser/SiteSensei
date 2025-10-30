'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PricingPage = () => {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      cadence: "forever",
      description: "Start building with rate-limited access today.",
      available: true,
      features: [
        { name: "Generations per day", value: "20" },
        { name: "Access to basic models", value: true },
        { name: "Download code", value: true },
        { name: "Advanced model access", value: false },
      ],
      cta: "Start for free",
    },
    {
      name: "Pro",
      price: "$0.10",
      cadence: "per generation",
      description: "More generations, same simplicity.",
      available: false,
      features: [
        { name: "Generations per day", value: "Unlimited" },
        { name: "Access to basic models", value: true },
        { name: "Download code", value: true },
        { name: "Advanced model access", value: false },
      ],
    },
    {
      name: "Advanced",
      price: "$0.20",
      cadence: "per generation",
      description: "Unlock premium capabilities as soon as they're ready.",
      available: false,
      features: [
        { name: "Generations per day", value: "Unlimited" },
        { name: "Access to basic models", value: true },
        { name: "Download code", value: true },
        { name: "Advanced model access", value: true },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.main
      className="relative min-h-screen px-4 py-12 sm:px-6 lg:px-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8rem] top-24 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute right-[-6rem] top-1/2 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/20" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-5 text-center">
          <motion.div variants={itemVariants} className="flex justify-center">
            <span className="pill">Pricing</span>
          </motion.div>
          <motion.h1
            className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-5xl"
            variants={itemVariants}
          >
            Plans for every stage of your creative flow.
          </motion.h1>
          <motion.p
            className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg"
            variants={itemVariants}
          >
            Start free today while we finalize Pro and Advanced experiences. Expect flexible usage-based pricing,
            premium models, and workflow perks tailored to your team.
          </motion.p>
        </header>

        <motion.div
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          variants={itemVariants}
        >
          {tiers.map((tier) => {
            const tone =
              tier.name === 'Free'
                ? 'from-emerald-400/40 via-emerald-500/20 to-emerald-400/10'
                : tier.name === 'Pro'
                ? 'from-indigo-400/40 via-indigo-500/20 to-indigo-400/10'
                : 'from-purple-400/40 via-purple-500/20 to-purple-400/10';

            return (
              <motion.div
                key={tier.name}
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70"
              >
                <div
                  className={`pointer-events-none absolute inset-x-6 top-0 h-24 rounded-b-full bg-gradient-to-b ${tone} blur-3xl opacity-70`}
                />
                {!tier.available && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm dark:bg-slate-950/70">
                    <span className="text-sm font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                      Coming soon
                    </span>
                    <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      We&apos;ll notify you when this tier opens.
                    </span>
                  </div>
                )}
                <div className={tier.available ? 'relative z-10 space-y-6' : 'relative z-10 space-y-6 opacity-60'}>
                  <div className="space-y-3 text-center">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{tier.name}</h2>
                    <div className="flex items-baseline justify-center gap-2 text-slate-900 dark:text-white">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/{tier.cadence}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{tier.description}</p>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={`${tier.name}-${feature.name}`}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200"
                      >
                        {typeof feature.value === 'boolean' ? (
                          feature.value ? (
                            <CheckCircle className="text-emerald-500" size={18} />
                          ) : (
                            <XCircle className="text-slate-300 dark:text-slate-700" size={18} />
                          )
                        ) : (
                          <span className="text-indigo-500 dark:text-indigo-300">{feature.value}</span>
                        )}
                        <span className="flex-1">{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                  {tier.available && tier.cta && (
                    <div className="pt-2">
                      <button className="btn btn-primary w-full justify-center">{tier.cta}</button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.main>
  );
};

export default PricingPage;
