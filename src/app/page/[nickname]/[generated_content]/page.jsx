'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DynamicContent from '@/components/DynamicContent';
import Sidebar from '@/components/Sidebar';
import EditChatbox from '@/components/EditChatbox';
import { Menu } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function DynamicPage({ params }) {
  const { nickname, generated_content } = params;
  const [content, setContent] = useState({ html: '', javascript: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('FREE_MODEL');
  const [userRole, setUserRole] = useState('free');
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    async function fetchContentAndCheckUser() {
      try {
        setIsLoading(true);
        console.log('Params:', params);
        console.log('Fetching content for:', nickname, generated_content);
        if (!nickname || !generated_content) {
          throw new Error('Missing nickname or page name');
        }

        // Fetch page content
        const contentResponse = await fetch(`/api/content?nickname=${nickname}&pageName=${generated_content}`);
        if (!contentResponse.ok) {
          throw new Error(`HTTP error! status: ${contentResponse.status}`);
        }
        const contentData = await contentResponse.json();
        console.log('Page data:', contentData);
        setContent(contentData);
        setSelectedModel(contentData.model || 'FREE_MODEL');

        // Check if the current user is the creator
        if (user) {
          setIsCreator(user.nickname === nickname);
          
          // Fetch user role
          const roleResponse = await fetch('/api/getUserRole');
          const roleData = await roleResponse.json();
          setUserRole(roleData.role);
        }
      } catch (error) {
        console.error('Error fetching content or user data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContentAndCheckUser();
  }, [nickname, generated_content, user]);

  const handleEditSubmit = async (newHtml, newJavascript) => {
    try {
      const updateResponse = await fetch('/api/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: generated_content,
          html: newHtml,
          javascript: newJavascript,
          auth0Id: user ? user.sub : null,
          model: selectedModel,
          originalPrompt: null,
          enhancedPrompt: null,
          updatedAt: new Date().toISOString()
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update content');
      }

      setContent({ html: newHtml, javascript: newJavascript });
      console.log('Content updated successfully');
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const canUseModel = (model) => {
    if (model === 'FREE_MODEL') return true;
    return userRole === 'admin' || userRole === 'paid';
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
      <div className="w-[97.5%] h-[90%] mt-[1.5%] mb-[0%] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative">
        <div className="w-full h-full overflow-auto">
          <DynamicContent
            html={content.html}
            javascript={content.javascript}
          />
        </div>
        {isCreator && (
          <>
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 bg-primary text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
              <Menu size={24} />
            </button>
            <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-text-light-primary dark:text-text-dark-primary">Select Model</h3>
                <div className="flex flex-col gap-2">
                  {['FREE_MODEL', 'PRO_MODEL', 'ADVANCED_MODEL'].map((model) => (
                    <label key={model} className={`flex items-center ${!canUseModel(model) ? 'opacity-50' : ''}`}>
                      <input
                        type="radio"
                        name="model"
                        value={model}
                        checked={selectedModel === model}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={!canUseModel(model)}
                        className="mr-2"
                      />
                      <span className="text-text-light-secondary dark:text-text-dark-secondary">
                        {model.split('_')[0].toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <EditChatbox
                isVisible={true}
                onSubmit={handleEditSubmit}
                currentHtml={content.html}
                currentJavascript={content.javascript}
                selectedModel={selectedModel}
                pageName={generated_content}
                auth0Id={user ? user.sub : null}
                userNickname={nickname}
              />
            </Sidebar>
          </>
        )}
      </div>
    </div>
  );
}