'use client';
import React, { useState, useEffect, useRef } from 'react';
import PreviewComponent from '../../components/PreviewComponent';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function TestPage() {
  const { user, isLoading: userLoading } = useUser();
  const [pageName, setPageName] = useState('');
  const [htmlContent, setHtmlContent] = useState("");
  const [jsContent, setJsContent] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('FREE_MODEL');
  const [userRole, setUserRole] = useState('free');
  const [isPageGenerated, setIsPageGenerated] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 500, height: 500 });
  const previewContainerRef = useRef(null);
  const [placeholderText, setPlaceholderText] = useState('Describe the content you want to generate...');
  const [initialLoad, setInitialLoad] = useState(true);
  const [initialDelayPassed, setInitialDelayPassed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [enhancedPromptContent, setEnhancedPromptContent] = useState("");


  const placeholderExamples = [
    'Generate a compound interest calculator',
    'Create a resume website',
    'Design a shopping page for dog food',
    'Build a weather dashboard',
    'Develop a recipe finder app',
    'Create an interactive quiz game',
    'Design a fitness tracking app',
    'Build a personal budget planner',
    'Generate a portfolio showcase',
    'Create a virtual plant care assistant'
  ];

  const getRandomTypingSpeed = () => {
    return Math.floor(Math.random() * (180 - 80 + 1) + 80); // Random speed between 80ms and 180ms
  };


  useEffect(() => {
    let timer;
    console.log("Current state:", { initialLoad, initialDelayPassed, isTyping, placeholderText, currentExampleIndex });
  
    if (initialLoad) {
      timer = setTimeout(() => {
        setInitialLoad(false);
        setInitialDelayPassed(true);
        setIsTyping(false); // Start by deleting the initial placeholder
        console.log("Initial delay passed, starting to delete initial placeholder");
      }, 5000);
    } else if (initialDelayPassed) {
      const currentExample = placeholderExamples[currentExampleIndex];
  
      if (isTyping) {
        if (placeholderText !== currentExample) {
          timer = setTimeout(() => {
            setPlaceholderText(currentExample.slice(0, placeholderText.length + 1));
          }, getRandomTypingSpeed());
        } else {
          timer = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      } else {
        if (placeholderText.length > 0) {
          timer = setTimeout(() => {
            setPlaceholderText(placeholderText.slice(0, -1));
          }, 50);
        } else {
          console.log("Moving to next example");
          setCurrentExampleIndex((prevIndex) => (prevIndex + 1) % placeholderExamples.length);
          setIsTyping(true);
        }
      }
    }
  
    return () => clearTimeout(timer);
  }, [placeholderText, currentExampleIndex, isTyping, initialLoad, initialDelayPassed]);

  useEffect(() => {
    const updatePreviewSize = () => {
      if (previewContainerRef.current) {
        const { width, height } = previewContainerRef.current.getBoundingClientRect();
        setPreviewSize({ width, height });
      }
    };

    updatePreviewSize();
    window.addEventListener('resize', updatePreviewSize);
    return () => window.removeEventListener('resize', updatePreviewSize);
  }, []);


  // New state to track form validity
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const response = await fetch('/api/getUserRole');
          const data = await response.json();
          setUserRole(data.role);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    // Check if both pageName and promptContent are filled
    setIsFormValid(pageName.trim() !== '' && promptContent.trim() !== '');
  }, [pageName, promptContent]);

  const handleResize = () => {
    setIsSmallScreen(window.innerWidth < 800);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePageNameChange = (e) => {
    const value = e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    setPageName(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    setMessage('');
    setIsPageGenerated(false);

    try {
      let finalPrompt = promptContent;
      let enhancedPrompt = null;
      
      if (enhancePrompt) {
        const enhanceResponse = await fetch('/api/enhancePrompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptContent }),
        });
        const enhanceData = await enhanceResponse.json();
        if (enhanceData.enhancedPrompt) {
          finalPrompt = enhanceData.enhancedPrompt;
          enhancedPrompt = enhanceData.enhancedPrompt;
          setEnhancedPromptContent(finalPrompt);
          setPromptContent(finalPrompt); // Update the prompt in the text box
        }
      }
  
      const htmlResponse = await fetch('/api/generate/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, model: selectedModel }),
      });
      const htmlData = await htmlResponse.json();
      
      if (htmlData.html) {
        setHtmlContent(htmlData.html);

        const jsResponse = await fetch('/api/generate/javascript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: finalPrompt, html: htmlData.html, model: selectedModel }),
        });
        const jsData = await jsResponse.json();

        if (jsData.javascript) {
          setJsContent(jsData.javascript);
          setMessage('Content generated successfully');
          
          const storeResponse = await fetch('/api/update-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page: pageName,
              html: htmlData.html,
              javascript: jsData.javascript,
              auth0Id: user ? user.sub : null,
              model: selectedModel,
              originalPrompt: promptContent,
              enhancedPrompt: enhancedPrompt,
              createdAt: new Date().toISOString()
            }),
          });
          const storeData = await storeResponse.json();
          if (storeData.message) {
            setMessage(prevMessage => `${prevMessage}. ${storeData.message}`);
          }
          setIsPageGenerated(true);
        } else if (jsData.error) {
          throw new Error(jsData.error);
        }
      } else if (htmlData.error) {
        throw new Error(htmlData.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(error.message || 'Error generating content');
    } finally {
      setIsLoading(false);
    }
  };

  const canUseModel = (model) => {
    if (model === 'FREE_MODEL') return true;
    return userRole === 'admin' || userRole === 'paid';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={`max-w-6xl mx-auto ${isSmallScreen ? 'flex flex-col' : 'flex flex-row'} gap-8`}>
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary">Dynamic Content Generator</h1>
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-text-light-primary dark:text-text-dark-primary">Generate a Webpage with AI</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pageName" className="block text-text-light-primary dark:text-text-dark-primary mb-2">Page Name:</label>
                <input
                  id="pageName"
                  type="text"
                  value={pageName}
                  onChange={handlePageNameChange}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary"
                  placeholder="Enter URL-compliant page name (a-z, 0-9, -)"
                  pattern="^[a-z0-9-]+$"
                  title="Only lowercase letters, numbers, and hyphens are allowed"
                />
              </div>
              <div>
                <label className="block text-text-light-primary dark:text-text-dark-primary mb-2">Select Model:</label>
                <div className="flex gap-4">
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
                      <span className="text-text-light-secondary dark:text-text-dark-secondary">{model.split('_')[0].toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="promptContent" className="block text-text-light-primary dark:text-text-dark-primary mb-2">Prompt for Content Generation:</label>
                <textarea
  id="promptContent"
  value={promptContent}
  onChange={(e) => setPromptContent(e.target.value)}
  rows={5}
  required
  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-text-light-primary dark:text-text-dark-primary"
  placeholder={initialLoad || !initialDelayPassed ? "Describe the content you want to generate..." : placeholderText}
/>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enhancePrompt"
                  checked={enhancePrompt}
                  onChange={(e) => setEnhancePrompt(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enhancePrompt" className="text-text-light-secondary dark:text-text-dark-secondary">Enhance prompt before generation</label>
              </div>
              
              <button 
                type="submit" 
                className={`btn btn-primary w-full ${(!isFormValid || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Content'}
              </button>
            </form>
            {message && <p className="mt-4 text-green-600 dark:text-green-400">{message}</p>}
          </div>
          {isPageGenerated && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-text-light-primary dark:text-text-dark-primary">View Created Page</h2>
              <p className="text-text-light-secondary dark:text-text-dark-secondary mb-2">
                To view your created page, go to: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/[page-name]</code>
              </p>
              <p className="text-text-light-primary dark:text-text-dark-primary">
                Your page is now available at:{' '}
                <a href={`/${pageName}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  /{pageName}
                </a>
              </p>
            </div>
          )}
        </div>
        <div className="w-full lg:w-1/2">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6" style={{ height: '600px' }}>
            <h2 className="text-xl font-semibold mb-4 text-text-light-primary dark:text-text-dark-primary">Preview</h2>
            <div ref={previewContainerRef} style={{ height: 'calc(100% - 2rem)' }}>
              <PreviewComponent 
                html={htmlContent}
                javascript={jsContent}
                width={previewSize.width}
                height={previewSize.height}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}