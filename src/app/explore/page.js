// src/app/explore/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../../utils/supabase';
import PreviewComponent from '../../components/PreviewComponent';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function ExplorePage() {
  const [pages, setPages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const lastLoadedPage = useRef(0);
  const pageSize = 12;
  const loadedPageNames = useRef(new Set());

  const fetchPages = async () => {
    const from = lastLoadedPage.current;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pages:', error);
      return;
    }

    console.log('Fetched data:', data); // Debugging: Log fetched data

    // Filter out duplicates based on page name
    const uniqueData = data.filter(page => {
      if (!loadedPageNames.current.has(page.name)) {
        loadedPageNames.current.add(page.name);
        return true;
      }
      return false;
    });

    console.log('Unique data:', uniqueData); // Debugging: Log unique data

    if (uniqueData.length < pageSize) {
      setHasMore(false);
    }

    setPages(prevPages => [...prevPages, ...uniqueData]);
    lastLoadedPage.current += data.length; // We still need to update this based on the original data length
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>Explore</h1>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <button style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px' }}>New Generations</button>
        <button style={{ padding: '5px 10px', backgroundColor: '#fff', color: '#000', border: '1px solid #000', borderRadius: '4px' }}>Featured</button>
      </div>
      <InfiniteScroll
        dataLength={pages.length}
        next={fetchPages}
        hasMore={hasMore}
        loader={<h4>Loading...</h4>}
        style={{ overflow: 'hidden' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {pages.map(page => (
            <Link href={`/${page.name}`} key={page.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.05)' } }}>
                <div style={{ height: '150px', overflow: 'hidden' }}>
                  <PreviewComponent
                    html={page.html}
                    javascript={page.javascript}
                    inputMethod="separate"
                  />
                </div>
                <div style={{ padding: '10px' }}>
                  <p style={{ fontSize: '14px', color: '#666' }}>{new Date(page.created_at).toLocaleString()}</p>
                  <h3 style={{ fontSize: '18px', marginTop: '5px' }}>{page.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}