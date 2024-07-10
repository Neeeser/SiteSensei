'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@auth0/nextjs-auth0/client';
import { supabase } from '../utils/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
import PagePreviewCard from '../components/PagePreviewCard';
import Image from 'next/image';

const ProfilePage = () => {
  const { user, error, isLoading } = useUser();
  const [pages, setPages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPages, setIsLoading] = useState(false);
  const lastLoadedPage = useRef(0);
  const pageSize = 12;
  const loadedPageNames = useRef(new Set());


  const fetchUserPages = useCallback(async () => {
    if (!user || isLoading) return;
    setIsLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth0_id', user.sub)
        .single();

      if (userError) throw userError;

      const uuid = userData.id;
      const { data, error, count } = await supabase
      .from('pages')
      .select(`
        id, name, created_at, html, javascript,
        users:user_id (name, picture)
      `, { count: 'exact' })
      .eq('user_id', uuid)
      .range(lastLoadedPage.current, lastLoadedPage.current + pageSize - 1)
      .order('created_at', { ascending: false });

      if (error) throw error;

      const uniqueData = data.filter(page => {
        return !loadedPageNames.current.has(page.id); // Assuming 'id' is a unique identifier
      });

      uniqueData.forEach(page => loadedPageNames.current.add(page.id));

      if (uniqueData.length > 0) {
        setPages(prevPages => [...prevPages, ...uniqueData]);
        lastLoadedPage.current += pageSize; // Ensure pagination consistency
      }

      setHasMore(lastLoadedPage.current < count);
    } catch (error) {
      console.error('Error fetching user pages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading]);

  useEffect(() => {
    fetchUserPages();
  }, [fetchUserPages]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-7xl mx-auto"
      >
        <div className="h-full flex items-center justify-center p-4 bg-background-light dark:bg-background-dark">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="w-16 h-16 mx-auto mb-6"
              >
                <Image
                  src={user.picture}
                  alt="Profile Picture"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain rounded-full"
                />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-serif mb-4 text-text-light-primary dark:text-text-dark-primary text-shadow">{user.name}</h1>
              <p className="text-xl mb-8 text-text-light-secondary dark:text-text-dark-secondary font-light">{user.email}</p>
            </motion.div>
          </motion.div>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif mb-8 text-text-light-primary dark:text-text-dark-primary text-shadow">My Pages</h1>
        <InfiniteScroll
          dataLength={pages.length}
          next={fetchUserPages}
          hasMore={hasMore}
          loader={
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          }
          endMessage={<p className="text-center mt-4 text-text-light-secondary dark:text-text-dark-secondary">No more pages to load.</p>}
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
};

export default ProfilePage;