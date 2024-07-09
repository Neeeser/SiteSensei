'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase } from '../../utils/supabase';
import PreviewComponent from '../../components/PreviewComponent';
import InfiniteScroll from 'react-infinite-scroll-component';

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
    console.log('Fetching pages, last loaded page:', lastLoadedPage.current);

    try {
      const from = lastLoadedPage.current;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('pages')
        .select(`
          *,
          users:user_id (
            name,
            picture
          )
        `, { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched data:', data);
      console.log('Total count:', count);

      const uniqueData = data.filter(page => {
        if (!loadedPageNames.current.has(page.name)) {
          loadedPageNames.current.add(page.name);
          return true;
        }
        return false;
      });

      console.log('Unique data length:', uniqueData.length);

      if (uniqueData.length > 0) {
        setPages(prevPages => [...prevPages, ...uniqueData]);
        lastLoadedPage.current += uniqueData.length;
      }

      setHasMore(lastLoadedPage.current < count);
      console.log('Has more:', lastLoadedPage.current < count);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const previewWidth = 1024;
  const previewHeight = 576; // 16:9 aspect ratio

  const getImageSrc = (user) => {
    if (!user || !user.picture) return '/default_icon.png';
    
    const allowedDomains = [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      's.gravatar.com',
      'auth0.com'
    ];
    
    if (allowedDomains.some(domain => user.picture.includes(domain))) {
      return user.picture;
    }
    
    return '/default_icon.png';
  };

  return (
    <div className="min-h-full bg-background text-text-light p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-7xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-serif mb-8 text-text-dark text-shadow">Explore</h1>
       
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
            className="btn bg-white text-text-dark border border-gray-300"
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
                    <h3 className="text-xl font-semibold text-text-dark">{page.name}</h3>
                  </div>
                  {!page.is_anonymous && page.users && (
                    <div className="absolute bottom-2 right-2 group z-10">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white shadow-md">
                        <Image
                          src={getImageSrc(page.users)}
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
}