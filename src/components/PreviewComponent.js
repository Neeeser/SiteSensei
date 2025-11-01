import React, { useEffect, useRef, useState } from 'react';
import { HTML_RENDER_MODE, REACT_RENDER_MODE } from '@/utils/render-modes';

const INITIAL_BUNDLE_STATE = {
  code: '',
  error: null,
  loading: false,
  source: ''
};

const escapeInlineScript = (code = '') => code.replace(/<\/script/gi, '<\\/script');

const PreviewComponent = ({
  html,
  javascript,
  jsx = '',
  width,
  height,
  suppressErrors = false,
  executeJavaScript = true,
  renderMode = HTML_RENDER_MODE
}) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const compiledSourceRef = useRef('');
  const abortControllerRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [customAlert, setCustomAlert] = useState(null);
  const [runtimeError, setRuntimeError] = useState(null);
  const [bundleState, setBundleState] = useState(INITIAL_BUNDLE_STATE);

  useEffect(() => {
    const isReactMode = renderMode === REACT_RENDER_MODE;

    if (!isReactMode) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      compiledSourceRef.current = '';
      setBundleState(INITIAL_BUNDLE_STATE);
      return;
    }

    const trimmedSource = (jsx || '').trim();

    if (!trimmedSource) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      compiledSourceRef.current = '';
      setBundleState(INITIAL_BUNDLE_STATE);
      return;
    }

    if (suppressErrors) {
      setBundleState({
        code: '',
        error: null,
        loading: true,
        source: trimmedSource
      });
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    if (compiledSourceRef.current === trimmedSource && bundleState.code) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setRuntimeError(null);
    setBundleState({
      code: '',
      error: null,
      loading: true,
      source: trimmedSource
    });

    (async () => {
      try {
        const response = await fetch('/api/compile-react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsx: trimmedSource }),
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

        const bundle = data.bundle || '';
        compiledSourceRef.current = trimmedSource;
        setBundleState({
          code: bundle,
          error: null,
          loading: false,
          source: trimmedSource
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        compiledSourceRef.current = '';
        setBundleState({
          code: '',
          error: error?.message || 'Failed to compile React component',
          loading: false,
          source: ''
        });
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
  }, [jsx, renderMode, suppressErrors]);

  useEffect(() => {
    const isReactMode = renderMode === REACT_RENDER_MODE;
    let iframeContent = '';

    if (isReactMode) {
      const shouldExecute = !suppressErrors && !bundleState.loading && Boolean(bundleState.code);
      const escapedBundle = escapeInlineScript(bundleState.code || '');

      iframeContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; width: 100%; min-height: 100vh; overflow: auto; background: #f9fafb; }
              :root { color-scheme: light dark; }
            </style>
            ${suppressErrors ? `
              <script>
                window.onerror = function() { return true; };
                console.error = console.warn = console.log = function() {};
              </script>
            ` : ''}
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
            ${shouldExecute ? `
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
    } else {
      const safeHtml = (html || '').replace(/<img/g, '<img onerror="handleImageError(this)"');
      iframeContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
            </style>
            ${suppressErrors ? `
              <script>
                window.onerror = function(message) {
                  console.log('Suppressed error:', message);
                  return true;
                };
                console.error = console.warn = console.log = function() {};
              </script>
            ` : ''}
            <script>
              function handleImageError(img) {
                img.onerror = null;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
              }
            </script>
          </head>
          <body>
            ${safeHtml}
            ${executeJavaScript ? `
              <script>
                window.alert = function(message) {
                  window.parent.postMessage({ type: 'alert', message: message }, '*');
                };
                window.confirm = function(message) {
                  window.parent.postMessage({ type: 'confirm', message: message }, '*');
                  return false;
                };
                ${javascript}
              </script>
            ` : ''}
          </body>
        </html>
      `;
    }

    if (iframeRef.current) {
      iframeRef.current.srcdoc = iframeContent;
    }

    const handleMessage = (event) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }
      if (event.data?.type === 'alert' || event.data?.type === 'confirm') {
        setCustomAlert(event.data);
      }
      if (event.data?.type === 'jsError') {
        setRuntimeError(event.data.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [html, javascript, suppressErrors, executeJavaScript, renderMode, bundleState.code, bundleState.loading]);

  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        setScale(Math.min(scaleX, scaleY));
      }
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [width, height]);

  useEffect(() => {
    if (!bundleState.error) {
      return;
    }
    setRuntimeError(bundleState.error);
  }, [bundleState.error]);

  const handleAlertClose = () => {
    setCustomAlert(null);
  };

  const isReactMode = renderMode === REACT_RENDER_MODE;
  const isCompilingReact = isReactMode && (bundleState.loading || suppressErrors);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`
        }}
      >
        <iframe
          ref={iframeRef}
          title="Page Preview"
          className="w-full h-full border-none pointer-events-none"
          sandbox={(renderMode === REACT_RENDER_MODE || executeJavaScript) ? 'allow-scripts' : ''}
        />

        {isCompilingReact && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 backdrop-blur-sm">
            <div className="rounded-full border border-slate-200/60 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300">
              Preparing React bundle…
            </div>
          </div>
        )}

        {runtimeError && (
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-rose-300/60 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-600 shadow-lg dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
            {runtimeError}
          </div>
        )}

        {customAlert && (
          <div className="absolute inset-0 bg-gray-600/60 flex items-center justify-center">
            <div className="bg-gray-800 text-gray-200 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {customAlert.type === 'alert' ? 'Alert' : 'Confirm'}
              </h3>
              <p className="mb-6">{customAlert.message}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleAlertClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  OK
                </button>
                {customAlert.type === 'confirm' && (
                  <button
                    onClick={handleAlertClose}
                    className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewComponent;
