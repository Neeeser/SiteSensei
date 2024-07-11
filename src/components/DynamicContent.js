'use client';
import React, { useEffect, useRef, useState } from 'react';

const DynamicContent = ({ html, javascript, onInteraction }) => {
  const containerRef = useRef(null);
  const [jsError, setJsError] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <base target="_parent">
            <style>
              html, body { height: 100%; margin: 0; padding: 0; }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `);
      iframeDoc.close();

      iframe.onload = () => {
        // Add event listeners for interactions
        iframeDoc.body.addEventListener('click', (e) => {
          if (e.target.tagName === 'A' || e.target.closest('a')) {
            e.preventDefault();
            onInteraction && onInteraction(e);
          }
        }, true);
        iframeDoc.body.addEventListener('submit', (e) => {
          e.preventDefault();
          onInteraction && onInteraction(e);
        }, true);

        // Execute JavaScript in a try-catch block
        if (javascript) {
          const script = iframeDoc.createElement('script');
          script.text = `
            try {
              (function() {
                ${javascript}
              })();
            } catch (error) {
              window.parent.postMessage({ type: 'jsError', message: error.message }, '*');
            }
          `;
          iframeDoc.body.appendChild(script);
        }
      };

      // Listen for error messages from the iframe
      const handleMessage = (event) => {
        if (event.data && event.data.type === 'jsError') {
          console.error('JavaScript Error:', event.data.message);
          setJsError(event.data.message);
        }
      };
      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [html, javascript, onInteraction]);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - var(--navbar-height))', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {jsError && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          background: 'rgba(255, 0, 0, 0.1)', 
          color: 'red', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          JavaScript Error: {jsError}
        </div>
      )}
    </div>
  );
};

export default DynamicContent;