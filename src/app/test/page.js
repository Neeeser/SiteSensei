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
    setMessage('');  // Clear any previous messages
    
    try {
      let finalPrompt = promptContent;
      
      if (enhancePrompt) {
        const enhanceResponse = await fetch('/api/enhancePrompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: promptContent }),
        });
        const enhanceData = await enhanceResponse.json();
        if (enhanceData.enhancedPrompt) {
          finalPrompt = enhanceData.enhancedPrompt;
          setPromptContent(finalPrompt);
        }
      }
  
      // Generate HTML
      const htmlResponse = await fetch('/api/generate/html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt, model: selectedModel}),
      });
      const htmlData = await htmlResponse.json();
      
      if (htmlData.html) {
        setHtmlContent(htmlData.html);

        // Generate JavaScript based on the HTML
        const jsResponse = await fetch('/api/generate/javascript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: finalPrompt, html: htmlData.html, model: selectedModel }),
        });
        const jsData = await jsResponse.json();

        if (jsData.javascript) {
          setJsContent(jsData.javascript);
          setMessage('Content generated successfully');
          
          // Store the generated content in the database
          const storeResponse = await fetch('/api/update-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
    <div className="test-page-container">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: isSmallScreen ? 'column' : 'row', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Dynamic Content Test Page</h1>
          <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Generate Dynamic Content</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label htmlFor="pageName" style={{ display: 'block', marginBottom: '5px' }}>Page Name:</label>
                <input
                  id="pageName"
                  type="text"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Select Model:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['FREE_MODEL', 'PRO_MODEL', 'ADVANCED_MODEL'].map((model) => (
                    <label key={model} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="radio"
                        name="model"
                        value={model}
                        checked={selectedModel === model}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      />
                      {model.split('_')[0].toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="promptContent" style={{ display: 'block', marginBottom: '5px' }}>Prompt for Content Generation:</label>
                <textarea
                  id="promptContent"
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  rows={5}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="Describe the content you want to generate..."
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="enhancePrompt"
                  checked={enhancePrompt}
                  onChange={(e) => setEnhancePrompt(e.target.checked)}
                />
                <label htmlFor="enhancePrompt">Enhance prompt before generation</label>
              </div>
              
              <button 
                type="submit" 
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: '#0070f3', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Content'}
              </button>
            </form>
            {message && <p style={{ marginTop: '15px', color: '#00a86b' }}>{message}</p>}
          </div>
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>View Created Page</h2>
            <p>
              To view your created page, go to: <code style={{ backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '4px' }}>/[page-name]</code>
            </p>
            {pageName && (
              <p style={{ marginTop: '10px' }}>
                Your page will be available at:{' '}
                <a href={`/${pageName}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', textDecoration: 'underline' }}>
                  /{pageName}
                </a>
              </p>
            )}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <PreviewComponent 
            html={htmlContent}
            javascript={jsContent}
          />
        </div>
      </div>
    </div>
  );
}