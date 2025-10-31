// src/components/PreviewComponent.js
import React, { useRef, useEffect, useState } from 'react';
import { HTML_RENDER_MODE, REACT_RENDER_MODE } from '@/utils/render-modes';

const PreviewComponent = ({
  html,
  javascript,
  jsx = '',
  width,
  height,
  suppressErrors = false,
  executeJavaScript = true,
  renderMode = HTML_RENDER_MODE,
}) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [customAlert, setCustomAlert] = useState(null);
  const [runtimeError, setRuntimeError] = useState(null);

  useEffect(() => {
    const isReactMode = renderMode === REACT_RENDER_MODE;
    let iframeContent = '';
    setRuntimeError(null);

    if (isReactMode) {
      const shouldExecute = !suppressErrors && jsx && jsx.trim().length > 0;
      const jsxPayload = JSON.stringify(jsx || '');
      const reactScripts = `
        <script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin></script>
        <script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js" crossorigin></script>
        <script src="https://unpkg.com/@emotion/react@11.11.4/dist/emotion-react.umd.min.js" crossorigin></script>
        <script src="https://unpkg.com/@emotion/styled@11.11.5/dist/emotion-styled.umd.min.js" crossorigin></script>
        <script src="https://unpkg.com/@mui/material@5.15.13/umd/material-ui.production.min.js" crossorigin></script>
      `;

      const bootstrapScript = `
        <script>
          window.alert = function(message) {
            window.parent.postMessage({ type: 'alert', message: message }, '*');
          };
          window.confirm = function(message) {
            window.parent.postMessage({ type: 'confirm', message: message }, '*');
            return false;
          };
          const classNames = (...values) => values.filter(Boolean).join(' ');
          window.SiteSenseiUI = (function(React) {
            const { forwardRef } = React;

            const Button = forwardRef(function Button({ variant = 'primary', className = '', size = 'md', ...rest }, ref) {
              const sizes = {
                sm: 'px-3 py-1.5 text-xs',
                md: 'px-4 py-2 text-sm',
                lg: 'px-5 py-2.5 text-base'
              };
              const variants = {
                primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
                secondary: 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
                outline: 'border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-500/10',
                ghost: 'bg-transparent text-emerald-600 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-500/10'
              };
              return React.createElement(
                'button',
                {
                  ref,
                  className: classNames(
                    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
                    sizes[size] || sizes.md,
                    variants[variant] || variants.primary,
                    className
                  ),
                  ...rest
                }
              );
            });

            const Card = ({ className = '', ...props }) =>
              React.createElement('div', {
                className: classNames('rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/70', className),
                ...props
              });

            const CardHeader = ({ className = '', ...props }) =>
              React.createElement('div', {
                className: classNames('mb-4 flex flex-col gap-2', className),
                ...props
              });

            const CardContent = ({ className = '', ...props }) =>
              React.createElement('div', {
                className: classNames('space-y-4', className),
                ...props
              });

            const Badge = ({ className = '', variant = 'neutral', ...rest }) => {
              const variants = {
                neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
                success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
                warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                info: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200'
              };
              return React.createElement('span', {
                className: classNames('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', variants[variant] || variants.neutral, className),
                ...rest
              });
            };

            const Input = forwardRef(function Input({ className = '', ...rest }, ref) {
              return React.createElement('input', {
                ref,
                className: classNames('w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30', className),
                ...rest
              });
            });

            const Textarea = forwardRef(function Textarea({ className = '', rows = 4, ...rest }, ref) {
              return React.createElement('textarea', {
                ref,
                rows,
                className: classNames('w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30', className),
                ...rest
              });
            });

            const SectionTitle = ({ className = '', ...rest }) =>
              React.createElement('h2', {
                className: classNames('text-lg font-semibold text-slate-900 dark:text-white', className),
                ...rest
              });

            return {
              Button,
              Card,
              CardHeader,
              CardContent,
              Badge,
              Input,
              Textarea,
              SectionTitle
            };
          })(window.React);

          window.SiteSenseiCreateIcon = (function(React) {
            const cache = new Map();

            function titleCase(label) {
              return label
                .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                .replace(/[-_]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            }

            return function resolveIcon(iconName) {
              if (cache.has(iconName)) {
                return cache.get(iconName);
              }

              const displayName = titleCase(iconName || 'Icon') || 'Icon';
              const Icon = React.forwardRef(function SiteSenseiIcon(
                { fontSize = 'medium', htmlColor, sx = {}, ...rest },
                ref
              ) {
                const size =
                  fontSize === 'small'
                    ? 20
                    : fontSize === 'large'
                    ? 32
                    : fontSize === 'inherit'
                    ? '1em'
                    : 24;

                const numericSize = typeof size === 'number' ? size : null;

                const style = {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: numericSize !== null ? numericSize + 'px' : size,
                  height: numericSize !== null ? numericSize + 'px' : size,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: htmlColor || 'currentColor',
                  fontSize: numericSize !== null ? Math.max(10, numericSize * 0.55) + 'px' : '1em',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.25em',
                  ...sx
                };

                return React.createElement(
                  'span',
                  {
                    ref,
                    role: 'img',
                    'aria-label': displayName,
                    style,
                    ...rest
                  },
                  displayName.slice(0, 2)
                );
              });

              Icon.muiName = displayName.replace(/\s+/g, '') + 'Icon';
              cache.set(iconName, Icon);
              return Icon;
            };
          })(window.React);

          window.SiteSenseiIcons = new Proxy(
            {},
            {
              get: (_, prop) => window.SiteSenseiCreateIcon(String(prop))
            }
          );

          window.SiteSenseiModuleRegistry = {
            react: window.React,
            'react-dom': window.ReactDOM,
            'react-dom/client': window.ReactDOM,
            '@emotion/react': window.emotionReact,
            '@emotion/styled': window.emotionStyled,
            '@mui/material': window.MaterialUI,
            '@site-sensei/ui': window.SiteSenseiUI,
            '@mui/icons-material': window.SiteSenseiIcons
          };
        </script>
      `;

      const executionScript = shouldExecute ? `
        <script>
          (function() {
            const jsxSource = ${jsxPayload};
            if (!jsxSource.trim()) {
              return;
            }

            if (!window.React || !window.ReactDOM || !window.Babel) {
              throw new Error('React runtime failed to load.');
            }

            try {
              const transformed = window.Babel.transform(jsxSource, {
                filename: 'site-sensei-component.tsx',
                presets: [['react', { runtime: 'classic' }], 'typescript'],
                plugins: ['transform-modules-commonjs']
              }).code;

              const siteSenseiRequire = (name) => {
                if (name === '@mui/icons-material') {
                  return window.SiteSenseiIcons;
                }

                if (name?.startsWith('@mui/icons-material/')) {
                  const iconKey = name.replace('@mui/icons-material/', '');
                  return window.SiteSenseiCreateIcon(iconKey);
                }

                const mod = window.SiteSenseiModuleRegistry[name];
                if (mod) {
                  return mod;
                }
                throw new Error('Unsupported import: ' + name);
              };

              const module = { exports: {} };
              const exports = module.exports;
              const factory = new Function('require', 'module', 'exports', transformed);
              factory(siteSenseiRequire, module, exports);

              const Component = module.exports.default || module.exports;
              if (typeof Component !== 'function') {
                throw new Error('Default export must be a React component.');
              }

              const rootNode = document.getElementById('site-sensei-root');
              if (!rootNode) {
                throw new Error('Missing #site-sensei-root element.');
              }

              if (window.__SITE_SENSEI_ROOT__) {
                window.__SITE_SENSEI_ROOT__.unmount();
              }
              window.__SITE_SENSEI_ROOT__ = window.ReactDOM.createRoot(rootNode);
              window.__SITE_SENSEI_ROOT__.render(window.React.createElement(Component));
            } catch (error) {
              window.parent.postMessage({ type: 'jsError', message: error.message }, '*');
              console.error(error);
            }
          })();
        </script>
      ` : '';

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
            ${reactScripts}
            ${bootstrapScript}
            ${executionScript}
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
  }, [html, javascript, jsx, suppressErrors, executeJavaScript, renderMode]);

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

  const handleAlertClose = () => {
    setCustomAlert(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative">
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${width}px`,
        height: `${height}px`,
      }}>
        <iframe
          ref={iframeRef}
          title="Page Preview"
          className="w-full h-full border-none pointer-events-none"
          sandbox={(renderMode === REACT_RENDER_MODE || executeJavaScript) ? "allow-scripts" : ""}
        />
        {runtimeError && (
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-rose-300/60 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-600 shadow-lg dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
            {runtimeError}
          </div>
        )}
        {customAlert && (
          <div className="absolute inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
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
