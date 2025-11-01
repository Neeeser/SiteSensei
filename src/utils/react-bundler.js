import path from 'path';
import * as esbuild from 'esbuild';

const SITE_SENSEI_UI_ALIAS = path.join(process.cwd(), 'src/runtime/site-sensei-ui.js');
const VIRTUAL_COMPONENT_MODULE = '__SITE_SENSEI_COMPONENT__';

const componentPlugin = (source) => ({
  name: 'site-sensei-virtual-component',
  setup(build) {
    build.onResolve({ filter: new RegExp(`^${VIRTUAL_COMPONENT_MODULE}$`) }, () => ({
      path: VIRTUAL_COMPONENT_MODULE,
      namespace: 'virtual'
    }));

    build.onLoad({ filter: /.*/, namespace: 'virtual' }, () => ({
      contents: source,
      loader: 'tsx',
      resolveDir: process.cwd()
    }));
  }
});

const aliasPlugin = {
  name: 'site-sensei-alias',
  setup(build) {
    build.onResolve({ filter: /^@site-sensei\/ui(?:\/index)?$/ }, () => ({
      path: SITE_SENSEI_UI_ALIAS,
      namespace: 'file'
    }));
  }
};

const entryTemplate = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import Component from '${VIRTUAL_COMPONENT_MODULE}';

const render = () => {
  const container = document.getElementById('site-sensei-root');
  if (!container) {
    throw new Error('Missing #site-sensei-root element.');
  }

  if (window.__SITE_SENSEI_ROOT__) {
    window.__SITE_SENSEI_ROOT__.unmount?.();
  }

  const root = createRoot(container);
  window.__SITE_SENSEI_ROOT__ = root;
  root.render(React.createElement(Component));
};

if (typeof window !== 'undefined') {
  const mount = () => {
    try {
      render();
    } catch (error) {
      window.parent?.postMessage?.({ type: 'jsError', message: error?.message || 'Runtime error' }, '*');
      throw error;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}
`;

export async function bundleReactComponent(source) {
  if (!source || !source.trim()) {
    throw new Error('React component source is empty');
  }

  const result = await esbuild.build({
    stdin: {
      contents: entryTemplate,
      resolveDir: process.cwd(),
      sourcefile: 'site-sensei-entry.tsx',
      loader: 'tsx'
    },
    absWorkingDir: process.cwd(),
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2018'],
    minify: true,
    metafile: false,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.json': 'json'
    },
    plugins: [componentPlugin(source), aliasPlugin],
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env': '{}',
      global: 'window'
    }
  });

  if (result.errors && result.errors.length) {
    console.error('esbuild errors:', result.errors);
    throw new Error(result.errors.map((err) => err.text || err.message || String(err)).join('\n'));
  }

  const outputFile = (result.outputFiles || []).find(
    (file) => file.path.endsWith('.js') || file.path === '<stdout>'
  ) || (result.outputFiles ? result.outputFiles[0] : null);
  if (!outputFile) {
    console.error('esbuild output files:', result.outputFiles?.map((file) => file.path));
    throw new Error('Failed to produce bundled output');
  }

  return outputFile.text;
}

export function escapeForInlineScript(code = '') {
  return code.replace(/<\/script/gi, '<\\/script');
}
