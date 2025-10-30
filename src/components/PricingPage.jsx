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
    <motion.div
      className="container mx-auto px-4 py-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1
        className="text-4xl font-bold text-center mb-4 text-text-dark"
        variants={itemVariants}
      >
        Pricing
      </motion.h1>
      <motion.p
        className="text-center text-text-light mb-10 max-w-2xl mx-auto"
        variants={itemVariants}
      >
        Paid plans are almost ready. The Free plan is available now while we put the finishing touches on the Pro
        and Advanced experiences.
      </motion.p>
      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={itemVariants}
      >
        {tiers.map((tier) => (
          <motion.div
            key={tier.name}
            className="relative rounded-2xl border border-primary/15 bg-background p-6 shadow-lg"
            variants={itemVariants}
          >
            {!tier.available && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-background/85 backdrop-blur-sm">
                <span className="text-lg font-semibold text-primary">Coming Soon</span>
                <span className="mt-2 text-sm text-text-light">We&apos;ll let you know as soon as it&apos;s live.</span>
              </div>
            )}
            <div className={tier.available ? "" : "pointer-events-none select-none blur-sm"}>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold text-text-dark">{tier.name}</h2>
                <p className="mt-2 text-3xl font-bold text-primary">{tier.price}</p>
                <p className="text-sm text-text-light">{tier.cadence}</p>
                <p className="mt-4 text-text-light">{tier.description}</p>
              </div>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={`${tier.name}-${feature.name}`} className="flex items-center gap-3 text-text-dark">
                    {typeof feature.value === "boolean" ? (
                      feature.value ? (
                        <CheckCircle className="text-primary" size={20} />
                      ) : (
                        <XCircle className="text-text-light" size={20} />
                      )
                    ) : (
                      <span className="font-semibold text-primary">{feature.value}</span>
                    )}
                    <span className="text-sm">{feature.name}</span>
                  </li>
                ))}
              </ul>
              {tier.available && tier.cta && (
                <div className="mt-8">
                  <button className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
                    {tier.cta}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default PricingPage;
