'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  HTML_RENDER_MODE,
  REACT_RENDER_MODE,
  REACT_PLACEHOLDER_HTML,
  isReactSnippet,
  stripReactSentinel
} from '@/utils/render-modes';

const escapeInlineScript = (code = '') => code.replace(/<\/script/gi, '<\\/script');

// DynamicContent component for rendering HTML and JavaScript in an isolated environment
const DynamicContent = ({ html, javascript, onInteraction }) => {
  const containerRef = useRef(null);
  const [jsError, setJsError] = useState(null);
  const [customAlert, setCustomAlert] = useState(null);
  const [bundleState, setBundleState] = useState({
    code: '',
    error: null,
    loading: false,
    source: ''
  });
  const compiledSourceRef = useRef('');
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const isReactMode = isReactSnippet(javascript || '');
    const jsxSource = isReactMode ? stripReactSentinel(javascript || '').trim() : '';

    if (!isReactMode || !jsxSource) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      compiledSourceRef.current = '';
      setBundleState({
        code: '',
        error: null,
        loading: false,
        source: ''
      });
      return;
    }

    if (compiledSourceRef.current === jsxSource && bundleState.code) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setJsError(null);
    setBundleState({
      code: '',
      error: null,
      loading: true,
      source: jsxSource
    });

    (async () => {
      try {
        const response = await fetch('/api/compile-react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsx: jsxSource }),
          signal: controller.signal
        });

        const text = await response.text();
        if (controller.signal.aborted) {
          return;
        }

        let data = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = {};
          }
        }

        if (!response.ok) {
          const message = data.error || data.details || 'Failed to compile React component';
          throw new Error(message);
        }

        compiledSourceRef.current = jsxSource;
        setBundleState({
          code: data.bundle || '',
          error: null,
          loading: false,
          source: jsxSource
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        compiledSourceRef.current = '';
        const message = error?.message || 'Failed to compile React component';
        setBundleState({
          code: '',
          error: message,
          loading: false,
          source: ''
        });
        setJsError(message);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    })();

    return () => {
      controller.abort();
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    };
  }, [javascript]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    setCustomAlert(null);
    if (!bundleState.error) {
      setJsError(null);
    }

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts');

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);

    const isReactMode = isReactSnippet(javascript || '');
    const jsxSource = isReactMode ? stripReactSentinel(javascript || '') : '';
    const htmlMarkup = isReactMode ? REACT_PLACEHOLDER_HTML : (html || '');
    const sanitizedHtml = htmlMarkup.replace(/<img/g, '<img onerror="handleImageError(this)"');
    const sanitizedJs = (javascript || '').replace(/<\/script/gi, '<\\/script>');
    const escapedBundle = escapeInlineScript(bundleState.code || '');
    const shouldExecuteReact = isReactMode && !bundleState.loading && Boolean(bundleState.code);

    const reactDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_parent">
          <style>
            html, body { margin: 0; padding: 0; min-height: 100%; background: #f9fafb; }
            :root { color-scheme: light dark; }
          </style>
        </head>
        <body>
          <div id="site-sensei-root" style="min-height: 100vh;"></div>
          <script>
            window.alert = function(message) {
              window.parent.postMessage({ type: 'alert', message: message }, '*');
            };
            window.confirm = function(message) {
              window.parent.postMessage({ type: 'confirm', message: message }, '*');
              return false;
            };
          </script>
          ${shouldExecuteReact ? `
            <script>
              try {
                ${escapedBundle}
              } catch (error) {
                window.parent.postMessage({ type: 'jsError', message: error?.message || 'Runtime error' }, '*');
                console.error(error);
              }
            </script>
          ` : ''}
        </body>
      </html>
    `;

    const htmlDocument = `
      <!DOCTYPE html>
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
          <script>
            function handleImageError(img) {
              img.onerror = null;
              img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
            }
            window.alert = function(message) {
              window.parent.postMessage({ type: 'alert', message: message }, '*');
            };
            window.confirm = function(message) {
              window.parent.postMessage({ type: 'confirm', message: message }, '*');
              return false;
            };
          </script>
          </head>
          <body>
            ${sanitizedHtml}
            ${javascript ? `
              <script>
              try {
                (function() {
                  ${sanitizedJs}
                })();
              } catch (error) {
                window.parent.postMessage({ type: 'jsError', message: error.message }, '*');
                console.error(error);
              }
            </script>
            ` : ''}
          </body>
        </html>
    `;

    iframe.srcdoc = isReactMode ? reactDocument : htmlDocument;

    let clickHandler = null;
    let submitHandler = null;

    const handleMessage = (event) => {
      if (event.source !== iframe.contentWindow) {
        return;
      }
      if (event.data?.type === 'alert' || event.data?.type === 'confirm') {
        setCustomAlert(event.data);
      }
      if (event.data?.type === 'jsError') {
        setJsError(event.data.message);
      }
    };

    window.addEventListener('message', handleMessage);

    iframe.onload = () => {
      const doc = iframe.contentDocument;
      if (!doc) {
        return;
      }

      const body = doc.body;
      clickHandler = (e) => {
        const linkEl = e.target.closest('a');
        if (linkEl) {
          e.preventDefault();
          onInteraction && onInteraction(e);
        }
      };
      submitHandler = (e) => {
        e.preventDefault();
        onInteraction && onInteraction(e);
      };

      body.addEventListener('click', clickHandler, true);
      body.addEventListener('submit', submitHandler, true);
    };

    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframe.contentDocument && iframe.contentDocument.body) {
        if (clickHandler) {
          iframe.contentDocument.body.removeEventListener('click', clickHandler, true);
        }
        if (submitHandler) {
          iframe.contentDocument.body.removeEventListener('submit', submitHandler, true);
        }
      }
    };
  }, [html, javascript, onInteraction, bundleState.code, bundleState.loading, bundleState.error]);

  // Handler to close custom alert/confirm dialogs
  const handleAlertClose = () => {
    setCustomAlert(null);
  };

  const isReactMode = isReactSnippet(javascript || '');
  const isCompilingReact = isReactMode && bundleState.loading;

  return (
    <div className="w-full h-full relative">
      {/* Container for the iframe */}
      <div ref={containerRef} className="w-full h-full" />
      
      {isCompilingReact && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/5 backdrop-blur-sm">
          <div className="rounded-full border border-slate-200/60 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300">
            Preparing React bundle…
          </div>
        </div>
      )}
      
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
