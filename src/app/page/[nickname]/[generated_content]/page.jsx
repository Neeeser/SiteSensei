// src/app/page/[nicknmae]/[generated_content]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import DynamicContent from '@/components/DynamicContent';

export default function DynamicPage({ params }) {
  const { nickname, generated_content } = params;
  const [content, setContent] = useState({ html: '', javascript: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchContent() {
      try {
        setIsLoading(true);
        console.log('Params:', params);
        console.log('Fetching content for:', nickname, generated_content);

        if (!nickname || !generated_content) {
          throw new Error('Missing nickname or page name');
        }

        let pageQuery;

        if (nickname === 'anon') {
          // Fetch anonymous pages
          pageQuery = supabase
            .from('pages')
            .select('html, javascript')
            .eq('is_anonymous', true)
            .eq('name', generated_content)
            .single();
        } else {
          // First, get the user_id for the given nickname
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('nickname', nickname)
            .single();

          if (userError) {
            console.error('User fetch error:', userError);
            throw new Error('User not found');
          }

          console.log('User data:', userData);

          // Now fetch the page content using the user_id and generated_content name
          pageQuery = supabase
            .from('pages')
            .select('html, javascript')
            .eq('user_id', userData.id)
            .eq('name', generated_content)
            .single();
        }

        const { data, error } = await pageQuery;

        console.log('Page data:', data);

        if (error) {
          console.error('Page fetch error:', error);
          throw new Error('Page not found');
        } else {
          console.log('Existing content found:', data);
          setContent(data);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [nickname, generated_content]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error}</p>
        <p>The requested page could not be found.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <DynamicContent
        html={content.html}
        javascript={content.javascript}
      />
    </div>
  );
}
