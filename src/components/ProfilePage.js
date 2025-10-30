'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@auth0/nextjs-auth0/client';
import InfiniteScroll from 'react-infinite-scroll-component';
import PagePreviewCard from './PagePreviewCard';
import Image from 'next/image';

const ProfilePage = ({ nickname }) => {
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [pages, setPages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageSize = 12;

  const fetchProfileData = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile/${nickname}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setProfileData(null);
        } else {
          throw new Error(data.error || 'Failed to fetch profile data');
        }
      } else {
        setProfileData(data);
        setPages(data.pages.slice(0, pageSize));
        setHasMore(data.pages.length > pageSize);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [nickname]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const fetchMorePages = useCallback(() => {
    if (profileData && profileData.pages) {
      const nextPages = profileData.pages.slice(pages.length, pages.length + pageSize);
      setPages(prevPages => [...prevPages, ...nextPages]);
      setHasMore(pages.length + nextPages.length < profileData.pages.length);
    }
  }, [profileData, pages]);

  if (isLoading || isUserLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="loading-spinner" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="glass-card max-w-md text-center">
          <h1 className="text-2xl font-semibold text-rose-500">Something went wrong</h1>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{error}</p>
        </div>
      </section>
    );
  }

  if (!profileData) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card max-w-lg text-center"
        >
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">User not found</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            We looked everywhere, but @{nickname} hasn&apos;t joined Site Sensei yet.
          </p>
        </motion.div>
      </section>
    );
  }

  const isOwnProfile = currentUser && currentUser.nickname === nickname;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-10 top-32 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute right-[-5rem] top-1/2 h-[22rem] w-[22rem] rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/20" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <section className="glass-card flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-3xl border border-white/80 shadow-xl ring-4 ring-indigo-200/60 transition dark:border-white/10 dark:ring-indigo-500/40">
              <Image
                src={profileData.picture}
                alt="Profile avatar"
                width={128}
                height={128}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-2">
              <span className="pill">{isOwnProfile ? 'Your space' : 'Creator profile'}</span>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
                {profileData.name}
              </h1>
              <p className="text-base font-medium text-slate-500 dark:text-slate-300">@{profileData.nickname}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                {profileData.pages.length} published designs
              </span>
              {isOwnProfile && (
                <span className="rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-500 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                  Visible to the community
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {isOwnProfile ? 'My published pages' : `${profileData.name.split(' ')[0]}'s pages`}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Scroll to explore every generated project from this profile.
              </p>
            </div>
          </div>

          <InfiniteScroll
            dataLength={pages.length}
            next={fetchMorePages}
            hasMore={hasMore}
            loader={
              <div className="loading-container py-12">
                <div className="loading-spinner" />
              </div>
            }
            endMessage={
              <p className="mt-12 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Nothing more to load — time to create another page.
              </p>
            }
            className="w-full"
            style={{ overflow: 'visible' }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {pages.map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * (index % 6), duration: 0.4 }}
                >
                  <PagePreviewCard page={page} />
                </motion.div>
              ))}
            </motion.div>
          </InfiniteScroll>
        </section>
      </div>
    </motion.main>
  );
};

export default ProfilePage;
