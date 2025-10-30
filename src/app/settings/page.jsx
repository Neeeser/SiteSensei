'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, isLoading } = useUser();
  const [userData, setUserData] = useState(null);
  const [originalNickname, setOriginalNickname] = useState('');
  const [errors, setErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      const { role, ...rest } = data;
      setUserData(rest);
      setOriginalNickname(data.nickname);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const validateField = async (name, value) => {
    switch (name) {
      case 'name':
        return value && value.trim().length < 2 ? 'Name must be at least 2 characters long' : '';
      case 'nickname':
        if (value === originalNickname) {
          return ''; // No need to validate if it's the original nickname
        }
        if (!value || !/^[a-zA-Z0-9_-]{2,20}$/.test(value)) {
          return 'Nickname must be 2-20 characters and can only contain letters, numbers, underscores, and hyphens';
        }
        try {
          const response = await fetch('/api/validate-nickname', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nickname: value }),
          });
          const data = await response.json();
          if (!response.ok) {
            return data.error || 'Error validating nickname';
          }
        } catch (error) {
          console.error('Error validating nickname:', error);
          return 'Error validating nickname';
        }
        return '';
      case 'phone_number':
        return value && !/^\+?[1-9]\d{1,14}$/.test(value) ? 'Please enter a valid phone number' : '';
      case 'birthdate':
        if (value) {
          const date = new Date(value);
          const now = new Date();
          return date > now ? 'Birthdate cannot be in the future' : '';
        }
        return '';
      case 'address':
        return value && value.trim().length < 5 ? 'Please enter a valid address' : '';
      default:
        return '';
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setUserData(prev => prev ? { ...prev, [name]: value } : null);
    const error = await validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userData) return;

    const newErrors = {};
    for (const [key, value] of Object.entries(userData)) {
      if (key !== 'id') {
        const error = await validateField(key, value);
        if (error) newErrors[key] = error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsUpdating(true);
    setMessage('');
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      setMessage('Profile updated successfully!');
      // Update the original nickname if it was changed
      setOriginalNickname(userData.nickname);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="loading-spinner" />
      </section>
    );
  }

  if (!user || !userData) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card max-w-md text-center"
        >
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Sign in required</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Log in to personalize your profile, manage nicknames, and keep your details current.
          </p>
        </motion.div>
      </section>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute right-[-6rem] top-1/2 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/20" />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="space-y-4">
          <span className="pill">Settings</span>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
            Tune your profile and account details.
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Update your display information, nickname, and contact details. Changes apply instantly across your shared
            pages.
          </p>
        </header>

        <motion.form
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          onSubmit={handleSubmit}
          className="glass-card space-y-8"
        >
          <div className="space-y-6">
            {userData &&
              Object.entries(userData).map(([key, value]) => {
                if (key === 'id' || key === 'role') return null;
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                const inputType =
                  key === 'birthdate' ? 'date' : key === 'phone_number' ? 'tel' : key === 'email' ? 'email' : 'text';

                return (
                  <div key={key} className="space-y-2">
                    <label htmlFor={key} className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {label}
                    </label>
                    <input
                      type={inputType}
                      id={key}
                      name={key}
                      value={value || ''}
                      onChange={handleInputChange}
                      className={`w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30 ${
                        errors[key] ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200 dark:focus:ring-rose-500/20' : 'border-slate-200'
                      }`}
                    />
                    {errors[key] && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-xs font-semibold text-rose-500 dark:text-rose-300"
                      >
                        {errors[key]}
                      </motion.p>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <motion.button
              type="submit"
              disabled={isUpdating || Object.keys(errors).some((key) => !!errors[key])}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary w-full justify-center sm:w-auto"
            >
              {isUpdating ? 'Saving changes…' : 'Save profile'}
            </motion.button>
            {message && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-sm font-semibold text-emerald-500 dark:text-emerald-300"
              >
                {message}
              </motion.span>
            )}
          </div>
        </motion.form>
      </div>
    </motion.main>
  );
}
