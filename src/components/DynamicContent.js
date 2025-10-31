'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  HTML_RENDER_MODE,
  REACT_RENDER_MODE,
  REACT_PLACEHOLDER_HTML,
  isReactSnippet,
  stripReactSentinel
} from '@/utils/render-modes';

// DynamicContent component for rendering HTML and JavaScript in an isolated environment
const DynamicContent = ({ html, javascript, onInteraction }) => {
  const containerRef = useRef(null);
  const [jsError, setJsError] = useState(null);
  const [customAlert, setCustomAlert] = useState(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    setJsError(null);
    setCustomAlert(null);

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts');

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);

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
            const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
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

    const isReactMode = isReactSnippet(javascript || '');
    const jsxSource = isReactMode ? stripReactSentinel(javascript || '') : '';
    const htmlMarkup = isReactMode ? REACT_PLACEHOLDER_HTML : (html || '');
    const sanitizedHtml = htmlMarkup.replace(/<img/g, '<img onerror="handleImageError(this)"');
    const sanitizedJs = (javascript || '').replace(/<\/script/gi, '<\\/script>');

    const reactDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_parent">
          <style>
            html, body { margin: 0; padding: 0; min-height: 100%; background: #f9fafb; }
          </style>
        </head>
        <body>
          <div id="site-sensei-root" style="min-height: 100vh;"></div>
          ${reactScripts}
          ${bootstrapScript}
          <script>
            (function() {
              const jsxSource = ${JSON.stringify(jsxSource || '')};
              if (!jsxSource.trim()) {
                return;
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

                const root = window.ReactDOM.createRoot(rootNode);
                root.render(window.React.createElement(Component));
              } catch (error) {
                window.parent.postMessage({ type: 'jsError', message: error.message }, '*');
                console.error(error);
              }
            })();
          </script>
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
