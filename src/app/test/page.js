'use client';
import React, { useState } from 'react';
import DynamicContent from '../../components/DynamicContent';

export default function TestPage() {
  const [pageName, setPageName] = useState('dynamic-content');
  const [inputMethod, setInputMethod] = useState('generate');
  const [htmlContent, setHtmlContent] = useState("");
  const [jsContent, setJsContent] = useState("");
  const [combinedContent, setCombinedContent] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');  // Clear any previous messages
    
    try {
      let finalPrompt = promptContent;
      
      if (inputMethod === 'generate' && enhancePrompt) {
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

      let response;
      if (inputMethod === 'generate') {
        response = await fetch('/api/generate-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: finalPrompt, pageName }),
        });
        const data = await response.json();
        if (data.html && data.javascript) {
          setHtmlContent(data.html);
          setJsContent(data.javascript);
          setCombinedContent(data.html);
          setMessage(data.message || 'Content generated successfully');
        } else if (data.error) {
          throw new Error(data.error);
        }
      } else {
        response = await fetch('/api/update-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            inputMethod === 'separate'
              ? { page: pageName, html: htmlContent, javascript: jsContent }
              : { page: pageName, html: combinedContent }
          ),
        });
        const data = await response.json();
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(error.message || 'Error updating or generating content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Dynamic Content Test Page</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Create/Update Dynamic Content</h2>
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
            <label style={{ display: 'block', marginBottom: '5px' }}>Input Method:</label>
            <select
              value={inputMethod}
              onChange={(e) => setInputMethod(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="generate">Generate with LLM</option>
              <option value="separate">Separate HTML and JavaScript</option>
              <option value="combined">Combined HTML with script tags</option>
              
            </select>
          </div>
          {inputMethod === 'separate' && (
            <>
              <div>
                <label htmlFor="htmlContent" style={{ display: 'block', marginBottom: '5px' }}>HTML Content:</label>
                <textarea
                  id="htmlContent"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={10}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label htmlFor="jsContent" style={{ display: 'block', marginBottom: '5px' }}>JavaScript Content:</label>
                <textarea
                  id="jsContent"
                  value={jsContent}
                  onChange={(e) => setJsContent(e.target.value)}
                  rows={10}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </>
          )}
          {inputMethod === 'combined' && (
            <div>
              <label htmlFor="combinedContent" style={{ display: 'block', marginBottom: '5px' }}>Combined HTML and JavaScript:</label>
              <textarea
                id="combinedContent"
                value={combinedContent}
                onChange={(e) => setCombinedContent(e.target.value)}
                rows={20}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          )}
          {inputMethod === 'generate' && (
            <>
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
            </>
          )}
          
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
            {isLoading ? 'Processing...' : 'Create/Update Page'}
          </button>
        </form>
        {message && <p style={{ marginTop: '15px', color: '#00a86b' }}>{message}</p>}
      </div>
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Preview</h2>
        <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '20px', height: '30vh' }}>
          <DynamicContent 
            html={inputMethod === 'separate' ? htmlContent : combinedContent}
            javascript={inputMethod === 'separate' ? jsContent : undefined}
          />
        </div>
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
  );
}