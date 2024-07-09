'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';  // Adjust the import path as necessary
import DynamicContent from '../../components/DynamicContent';

export default function DynamicPage({ params }) {
  const { page } = params;
  const [content, setContent] = useState({ html: '', javascript: '' });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrGenerateContent() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('pages')
          .select('html, javascript')
          .eq('name', page)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Page not found, generate content
            const response = await fetch('/api/generate-content', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ prompt: `Create a page about ${page}`, pageName: page }),
            });

            if (!response.ok) {
              throw new Error('Failed to generate content');
            }

            const generatedContent = await response.json();
            setContent(generatedContent);

            // Save the generated content to the database
            await supabase
              .from('pages')
              .insert({ name: page, html: generatedContent.html, javascript: generatedContent.javascript });
          } else {
            throw error;
          }
        } else {
          setContent(data);
        }
      } catch (error) {
        console.error('Error fetching or generating content:', error);
        setContent({ html: '<p>Error loading content</p>', javascript: '' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrGenerateContent();
  }, [page]);

  const handleInteraction = (e) => {
    // Handle link clicks
    if (e.type === 'click' && e.target.tagName === 'A') {
      const href = e.target.getAttribute('href');
      if (href && href.startsWith('/')) {
        // Internal link, use Next.js routing
        router.push(href);
      } else if (href) {
        // External link, open in new tab
        window.open(href, '_blank');
      }
    }
    // Handle form submissions
    else if (e.type === 'submit') {
      const formData = new FormData(e.target);
      // Handle form data, e.g., send it to an API
      console.log('Form submitted', Object.fromEntries(formData));
    }
    // Add more interaction handling as needed
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <DynamicContent
        html={content.html}
        javascript={content.javascript}
        onInteraction={handleInteraction}
      />
    </div>
  );
}