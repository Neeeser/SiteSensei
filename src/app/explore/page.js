// src/app/explore/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import PagePreviewCard from '../../components/PagePreviewCard';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function ExplorePage() {
  const { user, isLoading: userLoading } = useUser();
  const [pages, setPages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('new');
  const [currentPage, setCurrentPage] = useState(0);
  const [userRole, setUserRole] = useState('free');
  const pageSize = 12;

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const response = await fetch('/api/getUserRole');
          const data = await response.json();
          setUserRole(data.role);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const fetchPages = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/explore?view=${activeView}&page=${currentPage}&pageSize=${pageSize}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }
      const data = await response.json();

      setPages(prevPages => deduplicatePages([...prevPages, ...data.pages]));
      setHasMore(data.hasMore);
      setCurrentPage(prevPage => prevPage + 1);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, activeView, currentPage]);
  
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleDelete = async (pageId, identifier) => {
    try {
      const response = await fetch(`/api/pages/${identifier}/${pageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete page');
      setPages(prevPages => prevPages.filter(page => page.id !== pageId));
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };
  
  const deduplicatePages = (pages) => {
    const uniquePages = {};
    return pages.filter(page => {
      if (!uniquePages[page.id]) {
        uniquePages[page.id] = true;
        return true;
      }
      return false;
    });
  };
  
  const handleFavorite = async (pageId, identifier, isFavorited) => {
    try {
      const response = await fetch(`/api/pages/${identifier}/${pageId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_favorited: isFavorited }),
      });
      if (!response.ok) throw new Error('Failed to update favorite status');
      setPages(prevPages =>
        prevPages.map(page =>
          page.id === pageId ? { ...page, is_favorited: isFavorited } : page
        )
      );
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const toggleView = (view) => {
    if (activeView !== view && !isLoading) {
      setActiveView(view);
      setCurrentPage(0);
      setPages([]);
      setHasMore(true);
      // Use setTimeout to ensure state updates before fetching new pages
      setTimeout(() => {
        fetchPages();
      }, 0);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-10 top-28 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute right-[-6rem] top-1/2 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/20" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="pill">Discover</span>
            <span className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-400">
              Curated by the community
            </span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-5xl">
              Explore the latest Site Sensei creations.
            </h1>
            <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              Browse freshly generated pages and featured standouts. Favorite designs you love or jump in to iterate on
              the ideas that inspire you.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { id: 'new', label: 'New Generations', description: 'Every fresh build from the community' },
              { id: 'featured', label: 'Featured', description: 'Curated highlights from the team' },
            ].map((view) => {
              const isActive = activeView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => toggleView(view.id)}
                  disabled={isLoading}
                  className={`group relative flex min-w-[220px] flex-col gap-1 rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? 'border-indigo-400/70 bg-indigo-50/70 shadow-lg dark:border-indigo-500/30 dark:bg-indigo-500/10'
                      : 'border-slate-200/80 bg-white/80 shadow-sm hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/60'
                  } ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {view.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {view.description}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        <section>
          <InfiniteScroll
            dataLength={pages.length}
            next={fetchPages}
            hasMore={hasMore}
            loader={
              <div className="loading-container py-12">
                <div className="loading-spinner" />
              </div>
            }
            endMessage={
              <p className="mt-12 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                You have reached the end of the showcase.
              </p>
            }
            className="w-full"
            style={{ overflow: 'visible' }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {pages.map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * (index % 8), duration: 0.4 }}
                >
                  <PagePreviewCard
                    page={page}
                    userRole={userRole}
                    onDelete={handleDelete}
                    onFavorite={handleFavorite}
                  />
                </motion.div>
              ))}
            </motion.div>
          </InfiniteScroll>
        </section>
      </div>
    </motion.main>
  );
}
