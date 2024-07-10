'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@auth0/nextjs-auth0/client';
import { supabase } from '../utils/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
import PreviewComponent from '../components/PreviewComponent';
import Link from 'next/link';
import Image from 'next/image';

const ProfilePage = () => {
  const { user, error, isLoading } = useUser();
  const [pages, setPages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPages, setIsLoading] = useState(false);
  const lastLoadedPage = useRef(0);
  const pageSize = 12;
  const loadedPageNames = useRef(new Set());
  const previewWidth = 1024;
  const previewHeight = 576; // 16:9 aspect ratio

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
    <div className="min-h-full bg-background text-text-light p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-7xl mx-auto"
      >
            <div className="h-full flex items-center justify-center p-4 bg-background">
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
          <h1 className="text-4xl md:text-5xl font-serif mb-4 text-text-dark text-shadow">{user.name}</h1>
          <p className="text-xl mb-8 text-text-light font-light">{user.email}</p>
        </motion.div>
      </motion.div>
    </div>
        <h1 className="text-4xl md:text-5xl font-serif mb-8 text-text-dark text-shadow">My Pages</h1>
        <InfiniteScroll
          dataLength={pages.length}
          next={fetchUserPages}
          hasMore={hasMore}
          loader={
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          }
          endMessage={<p className="text-center mt-4">No more pages to load.</p>}
          className="w-full"
          style={{ overflow: 'visible' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pages.map(page => (
              <Link href={`/${page.name}`} key={page.id} className="no-underline text-inherit">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 relative"
                >
                  <div className="relative w-full" style={{ paddingBottom: `${(previewHeight / previewWidth) * 100}%` }}>
                    <div className="absolute inset-0">
                      <PreviewComponent
                        html={page.html}
                        javascript={page.javascript}
                        width={previewWidth}
                        height={previewHeight}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-text-light mb-2">{new Date(page.created_at).toLocaleDateString()}</p>
                    <h3 className="text-xl font-semibold text-text-dark">{page.name || 'Untitled Page'}</h3>
                  </div>
                  {!page.is_anonymous && page.users && (
                    <div className="absolute bottom-2 right-2 group z-10">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white shadow-md">
                        <Image
                          src={user.picture}
                          alt={page.users.name || 'User'}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute bottom-full right-0 mb-2 p-2 bg-white rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-sm font-medium text-text-dark whitespace-nowrap">{page.users.name || 'Anonymous User'}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </InfiniteScroll>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
