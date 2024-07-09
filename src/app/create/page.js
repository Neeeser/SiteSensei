'use client';
import React, { useState, useEffect } from 'react';
import PreviewComponent from '../../components/PreviewComponent';

export default function TestPage() {
  const [pageName, setPageName] = useState('dynamic-content');
  const [htmlContent, setHtmlContent] = useState("");
  const [jsContent, setJsContent] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('FREE_MODEL');

  const handleResize = () => {
    setIsSmallScreen(window.innerWidth < 800);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      let finalPrompt = promptContent;
      
      if (enhancePrompt) {
        const enhanceResponse = await fetch('/api/enhancePrompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptContent }),
        });
        const enhanceData = await enhanceResponse.json();
        if (enhanceData.enhancedPrompt) {
          finalPrompt = enhanceData.enhancedPrompt;
          setPromptContent(finalPrompt);
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
              javascript: jsData.javascript
            }),
          });
          const storeData = await storeResponse.json();
          if (storeData.message) {
            setMessage(prevMessage => `${prevMessage}. ${storeData.message}`);
          }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={`max-w-6xl mx-auto ${isSmallScreen ? 'flex flex-col' : 'flex flex-row'} gap-8`}>
        <div className="flex-1">
          <h1 className="text-shadow">Dynamic Content Test Page</h1>
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2>Generate Dynamic Content</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pageName" className="block text-text-dark mb-2">Page Name:</label>
                <input
                  id="pageName"
                  type="text"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-text-dark mb-2">Select Model:</label>
                <div className="flex gap-4">
                  {['FREE_MODEL', 'PRO_MODEL', 'ADVANCED_MODEL'].map((model) => (
                    <label key={model} className="flex items-center">
                      <input
                        type="radio"
                        name="model"
                        value={model}
                        checked={selectedModel === model}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-text-light">{model.split('_')[0].toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="promptContent" className="block text-text-dark mb-2">Prompt for Content Generation:</label>
                <textarea
                  id="promptContent"
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  rows={5}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the content you want to generate..."
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
                <label htmlFor="enhancePrompt" className="text-text-light">Enhance prompt before generation</label>
              </div>
              
              <button 
                type="submit" 
                className={`btn btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Content'}
              </button>
            </form>
            {message && <p className="mt-4 text-green-600">{message}</p>}
          </div>
          <div>
            <h2>View Created Page</h2>
            <p className="text-text-light mb-2">
              To view your created page, go to: <code className="bg-gray-100 px-2 py-1 rounded">/[page-name]</code>
            </p>
            {pageName && (
              <p>
                Your page will be available at:{' '}
                <a href={`/${pageName}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-blue-800">
                  /{pageName}
                </a>
              </p>
            )}
          </div>
        </div>
        <div className="flex-1">
          <PreviewComponent 
            html={htmlContent}
            javascript={jsContent}
          />
        </div>
      </div>
    </div>
  );
}