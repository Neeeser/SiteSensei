import React, { forwardRef } from 'react';

const classNames = (...values) => values.filter(Boolean).join(' ');

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base'
};

const BUTTON_VARIANTS = {
  primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
  outline:
    'border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-500/10',
  ghost: 'bg-transparent text-emerald-600 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-500/10'
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        BUTTON_SIZES[size] || BUTTON_SIZES.md,
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
        className
      )}
      {...props}
    />
  );
});

export const Card = ({ className = '', ...props }) => (
  <div
    className={classNames(
      'rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/70',
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className = '', ...props }) => (
  <div className={classNames('mb-4 flex flex-col gap-2', className)} {...props} />
);

export const CardContent = ({ className = '', ...props }) => (
  <div className={classNames('space-y-4', className)} {...props} />
);

const BADGE_VARIANTS = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200'
};

export const Badge = ({ className = '', variant = 'neutral', ...props }) => (
  <span
    className={classNames(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
      BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral,
      className
    )}
    {...props}
  />
);

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={classNames(
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30',
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className = '', rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={classNames(
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30',
        className
      )}
      {...props}
    />
  );
});

export const SectionTitle = ({ className = '', ...props }) => (
  <h2 className={classNames('text-lg font-semibold text-slate-900 dark:text-white', className)} {...props} />
);

const SiteSenseiUi = {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Input,
  Textarea,
  SectionTitle
};

export default SiteSenseiUi;
