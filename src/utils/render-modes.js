export const HTML_RENDER_MODE = 'html';
export const REACT_RENDER_MODE = 'react';

export const REACT_SENTINEL = '// @site-sensei renderMode=react\n';
export const REACT_PLACEHOLDER_HTML = '<div data-site-sensei-react-root="true"></div>';

export function isReactSnippet(javascript = '') {
  return javascript.startsWith(REACT_SENTINEL);
}

export function stripReactSentinel(javascript = '') {
  return isReactSnippet(javascript) ? javascript.slice(REACT_SENTINEL.length) : javascript;
}
