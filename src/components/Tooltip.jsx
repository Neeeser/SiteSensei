// src/components/Tooltip.jsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ content, children, delay = 400, maxHeight = 200 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
     
      setPosition({
        top: triggerRect.top + (triggerRect.height - Math.min(tooltipRect.height, maxHeight)) / 2,
        left: triggerRect.left - tooltipRect.width - 30, // 10px gap, positioned to the left
      });
    }
  }, [isVisible, maxHeight]);

  const showTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 400); // Delay hiding to allow time for mouse to enter tooltip
  };

  const handleTooltipMouseEnter = () => {
    clearTimeout(timeoutRef.current);
  };

  const handleTooltipMouseLeave = () => {
    hideTooltip();
  };

  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className="fixed z-50"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="max-w-xs overflow-y-auto rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 shadow-lg backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
