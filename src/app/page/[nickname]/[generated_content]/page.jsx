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

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/download?nickname=${nickname}&pageName=${generated_content}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${generated_content}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-var(--navbar-height))] bg-background-light dark:bg-background-dark">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500 mb-2">{error}</p>
          <p>The requested page could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-[calc(100vh-var(--navbar-height))] bg-background-light dark:bg-background-dark">
      <div className="w-[97.5%] h-[90%] mt-[1.5%] mb-[0%] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="w-full h-full overflow-auto">
          <DynamicContent
            html={content.html}
            javascript={content.javascript}
          />
        </div>
      </div>
      <button
        onClick={handleDownload}
        className="mt-4 mb-4 btn btn-primary"
      >
        Download Page
      </button>
    </div>
  );
}