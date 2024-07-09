'use client';
import React, { useEffect, useRef } from 'react';

const DynamicContent = ({ html, javascript }) => {
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
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for the iframe content to load before executing scripts
      iframe.onload = () => {
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
  }, [html, javascript]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default DynamicContent;
