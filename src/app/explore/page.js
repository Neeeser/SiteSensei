'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../utils/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
import PagePreviewCard from '../../components/PagePreviewCard';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function ExplorePage() {
  const { user, isLoading: userLoading } = useUser();
  const [pages, setPages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('new');
  const lastLoadedPage = useRef(0);
  const pageSize = 12;
  const loadedPageUUIDs = useRef(new Set());
  const [userRole, setUserRole] = useState('free');

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
      let query = supabase
        .from('pages')
        .select(`
          *,
          users:user_id (
            name,
            picture,
            nickname
          )
        `, { count: 'exact' })
        .range(lastLoadedPage.current, lastLoadedPage.current + pageSize - 1);

      if (activeView === 'new') {
        query = query.order('created_at', { ascending: false });
      } else if (activeView === 'featured') {
        query = query.eq('is_favorited', true).order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const uniqueData = data.filter(page => !loadedPageUUIDs.current.has(page.id));
      uniqueData.forEach(page => loadedPageUUIDs.current.add(page.id));

      if (uniqueData.length > 0) {
        setPages(prevPages => [...prevPages, ...uniqueData]);
        lastLoadedPage.current += uniqueData.length;
      }

      setHasMore(lastLoadedPage.current < count);

      if (lastLoadedPage.current >= count || uniqueData.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, activeView]);
  
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
      setIsLoading(true);
      setActiveView(view);
      lastLoadedPage.current = 0;
      loadedPageUUIDs.current.clear();
      setPages([]);
      setHasMore(true);
      // Use setTimeout to ensure state updates before fetching new pages
      setTimeout(() => {
        fetchPages().then(() => setIsLoading(false));
      }, 0);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-full bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary p-4"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="w-full max-w-7xl mx-auto"
      >
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl md:text-5xl font-serif mb-8 text-text-light-primary dark:text-text-dark-primary text-shadow"
        >
          Explore
        </motion.h1>
       
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex mb-8 space-x-4"
        >
          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            className={`btn ${activeView === 'new' ? 'btn-primary' : 'bg-white dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary border border-gray-300 dark:border-gray-600'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => toggleView('new')}
            disabled={isLoading}
          >
            New Generations
          </motion.button>
          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            className={`btn ${activeView === 'featured' ? 'btn-primary' : 'bg-white dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary border border-gray-300 dark:border-gray-600'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => toggleView('featured')}
            disabled={isLoading}
          >
            Featured
          </motion.button>
        </motion.div>
  
        <InfiniteScroll
          dataLength={pages.length}
          next={fetchPages}
          hasMore={hasMore}
          loader={<div className="loading-container"><div className="loading-spinner"></div></div>}
          endMessage={<p className="text-center mt-4">No more pages to load.</p>}
          className="w-full"
          style={{ overflow: 'visible' }}
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {pages.map((page, index) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index % 12), duration: 0.5 }}
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
      </motion.div>
    </motion.div>
  );
}
