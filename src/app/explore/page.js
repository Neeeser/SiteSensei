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
  const [activeView, setActiveView] = useState('new'); // 'new' or 'featured'
  const lastLoadedPage = useRef(0);
  const pageSize = 12;
  const loadedPageNames = useRef(new Set());
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
            picture
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
  
      const uniqueData = data.filter(page => !loadedPageNames.current.has(page.name));
      uniqueData.forEach(page => loadedPageNames.current.add(page.name));
  
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

  const handleDelete = async (pageId) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete page');
      setPages(prevPages => prevPages.filter(page => page.id !== pageId));
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  const handleFavorite = async (pageId, isFavorited) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/favorite`, {
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
    if (activeView !== view) {
      setActiveView(view);
      lastLoadedPage.current = 0;
      loadedPageNames.current.clear();
      setPages([]);
      setHasMore(true);
    }
  };

  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-7xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-serif mb-8 text-text-light-primary dark:text-text-dark-primary text-shadow">Explore</h1>
       
        <div className="flex mb-8 space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`btn ${activeView === 'new' ? 'btn-primary' : 'bg-white dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary border border-gray-300 dark:border-gray-600'}`}
            onClick={() => toggleView('new')}
          >
            New Generations
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`btn ${activeView === 'featured' ? 'btn-primary' : 'bg-white dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary border border-gray-300 dark:border-gray-600'}`}
            onClick={() => toggleView('featured')}
          >
            Featured
          </motion.button>
        </div>

        <InfiniteScroll
          dataLength={pages.length}
          next={fetchPages}
          hasMore={hasMore}
          loader={<div className="loading-container"><div className="loading-spinner"></div></div>}
          endMessage={<p className="text-center mt-4">No more pages to load.</p>}
          className="w-full"
          style={{ overflow: 'visible' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pages.map(page => (
              <PagePreviewCard
                key={page.id}
                page={page}
                userRole={userRole}
                onDelete={handleDelete}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        </InfiniteScroll>
      </motion.div>
    </div>
  );
}