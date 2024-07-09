'use client';

import React, { useEffect, useRef } from 'react';

const DynamicContent = ({ html, javascript, onInteraction }) => {
  const containerRef = useRef(null);

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
          </head>
          <body>${html}</body>
        </html>
      `);
      iframeDoc.close();

      // Wait for the iframe content to load before executing scripts and adding event listeners
      iframe.onload = () => {
        // Prevent default behavior for all links and forms
        iframeDoc.body.addEventListener('click', (e) => {
          if (e.target.tagName === 'A' || e.target.closest('a')) {
            e.preventDefault();
            onInteraction(e);
          }
        }, true);

        iframeDoc.body.addEventListener('submit', (e) => {
          e.preventDefault();
          onInteraction(e);
        }, true);

        if (javascript) {
          const script = iframeDoc.createElement('script');
          script.text = `
            (function() {
              ${javascript}
            })();
          `;
          iframeDoc.body.appendChild(script);
        }
      };
    }
  }, [html, javascript, onInteraction]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default DynamicContent;