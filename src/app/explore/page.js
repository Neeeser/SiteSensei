'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../utils/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
import PagePreviewCard from '../../components/PagePreviewCard';


export default function ExplorePage() {
  const [pages, setPages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const lastLoadedPage = useRef(0);
  const pageSize = 12;
  const loadedPageNames = useRef(new Set());

  const fetchPages = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
  
    try {
      const { data, error, count } = await supabase
        .from('pages')
        .select(`
          *,
          users:user_id (
            name,
            picture
          )
        `, { count: 'exact' })
        .range(lastLoadedPage.current, lastLoadedPage.current + pageSize - 1)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
  
      const uniqueData = data.filter(page => {
        return !loadedPageNames.current.has(page.name);
      });
  
      uniqueData.forEach(page => loadedPageNames.current.add(page.name));
  
      if (uniqueData.length > 0) {
        setPages(prevPages => [...prevPages, ...uniqueData]);
        lastLoadedPage.current += pageSize; // We attempt to fetch pageSize items each time
      }
  
      setHasMore(lastLoadedPage.current < count);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);
  
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);



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
            className="btn btn-primary"
          >
            New Generations
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn bg-white dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary border border-gray-300 dark:border-gray-600"
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
              <PagePreviewCard key={page.id} page={page} />
            ))}
          </div>
        </InfiniteScroll>
      </motion.div>
    </div>
  );
}