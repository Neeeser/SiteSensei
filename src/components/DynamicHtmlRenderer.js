// src/components/DynamicHtmlRenderer.js
import React, { useEffect, useRef, useState } from 'react';
import PreviewComponent from './PreviewComponent';

const DynamicHtmlRenderer = ({
  html,
  javascript,
  width,
  height,
  isStreaming = false,
}) => {
  const [renderedHtml, setRenderedHtml] = useState('');
  const debounceRef = useRef(null);
  const latestHtmlRef = useRef('');

  useEffect(() => {
    const nextHtml = html || '';
    if (latestHtmlRef.current === nextHtml) {
      return;
    }

    latestHtmlRef.current = nextHtml;

    if (!isStreaming) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setRenderedHtml(nextHtml);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setRenderedHtml(latestHtmlRef.current);
      debounceRef.current = null;
    }, 120);
  }, [html, isStreaming]);

  useEffect(() => () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const hasContent = renderedHtml.trim().length > 0;

  return (
    <div className="relative h-full">
      <PreviewComponent
        html={renderedHtml}
        javascript={javascript}
        width={width}
        height={height}
        suppressErrors={isStreaming}
        executeJavaScript={!isStreaming}
      />

      {isStreaming && (
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-white shadow-lg dark:bg-slate-800/80">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Streaming…
        </div>
      )}

      {!hasContent && isStreaming && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            Preparing first chunks…
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicHtmlRenderer;
