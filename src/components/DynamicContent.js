'use client';
import React, { useEffect, useRef, useState } from 'react';

// DynamicContent component for rendering HTML and JavaScript in an isolated environment
const DynamicContent = ({ html, javascript, onInteraction }) => {
  const containerRef = useRef(null);
  const [jsError, setJsError] = useState(null);
  const [customAlert, setCustomAlert] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      // Create an iframe to isolate the rendered content
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframe);
     
      // Get the iframe's document and write the HTML content
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <base target="_parent">
            <style>
              html, body {
                height: auto;
                min-height: 100%;
                margin: 0;
                padding: 0;
                overflow: visible;
              }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `);
      iframeDoc.close();

      iframe.onload = () => {
        // Add event listeners for interactions (clicks on links and form submissions)
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

        // Override window.alert and window.confirm to use custom UI
        iframe.contentWindow.alert = (message) => {
          setCustomAlert({ type: 'alert', message });
        };
        iframe.contentWindow.confirm = (message) => {
          setCustomAlert({ type: 'confirm', message });
          return false; // Default to canceling the action
        };

        // Execute JavaScript in a try-catch block to catch and report errors
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

      // Clean up event listener on component unmount
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [html, javascript, onInteraction]);

  // Handler to close custom alert/confirm dialogs
  const handleAlertClose = () => {
    setCustomAlert(null);
  };

  return (
    <div className="w-full h-full relative">
      {/* Container for the iframe */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Display JavaScript errors if any */}
      {jsError && (
        <div className="pointer-events-none absolute bottom-4 right-4 rounded-2xl border border-rose-300/60 bg-rose-50/80 px-4 py-2 text-xs font-semibold text-rose-600 shadow-lg dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
          JavaScript error: {jsError}
        </div>
      )}
      
      {/* Custom alert/confirm dialog */}
      {customAlert && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {customAlert.type === 'alert' ? 'Alert' : 'Confirm'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{customAlert.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleAlertClose}
                className="btn btn-primary min-w-[96px] justify-center"
              >
                OK
              </button>
              {customAlert.type === 'confirm' && (
                <button
                  onClick={handleAlertClose}
                  className="btn-tonal min-w-[96px] justify-center"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicContent;
