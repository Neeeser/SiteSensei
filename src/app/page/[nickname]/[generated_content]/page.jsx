// src/app/page/[nickname]/[generated_content]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

        const response = await fetch(`/api/content?nickname=${nickname}&pageName=${generated_content}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        console.log('Page data:', data);
        setContent(data);
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