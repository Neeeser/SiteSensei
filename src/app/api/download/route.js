// api/download/route.js
import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import {
  HTML_RENDER_MODE,
  REACT_RENDER_MODE,
  isReactSnippet,
  stripReactSentinel
} from '@/utils/render-modes';

function ensureTrailingNewline(value = '') {
  return value.endsWith('\n') ? value : `${value}\n`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nickname = searchParams.get('nickname');
  const pageName = searchParams.get('pageName');
  const revisionId = searchParams.get('revisionId'); // Optional parameter for revision ID

  if (!nickname || !pageName) {
    return NextResponse.json({ error: 'Missing nickname or page name' }, { status: 400 });
  }

  try {
    let contentQuery;

    if (revisionId) {
      // Fetch specific revision content if revisionId is provided
      contentQuery = supabase
        .from('page_revisions')
        .select('html, javascript')
        .eq('id', revisionId)
        .single();
    } else {
      // Fetch the current page content if no revisionId is specified
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      contentQuery = supabase
        .from('pages')
        .select('html, javascript')
        .eq('user_id', userData.id)
        .eq('name', pageName)
        .single();
    }

    const { data, error } = await contentQuery;

    if (error) {
      throw new Error('Page not found');
    }

    const { html, javascript } = data;
    const renderMode = isReactSnippet(javascript || '') ? REACT_RENDER_MODE : HTML_RENDER_MODE;
    const safeTitle = pageName.replace(/[<>"]/g, '');

    if (renderMode === REACT_RENDER_MODE) {
      const componentSourceRaw = stripReactSentinel(javascript || '');
      if (!componentSourceRaw.trim()) {
        throw new Error('No React component available to export');
      }

      const componentSource = ensureTrailingNewline(
        componentSourceRaw
          .replace(/from ['"]@site-sensei\/ui['"]/g, "from './ui'")
          .replace(/from ["']@site-sensei\/ui\/index["']/g, "from './ui'")
      );

      const zip = new JSZip();
      const srcFolder = zip.folder('src');
      if (!srcFolder) {
        throw new Error('Failed to initialise archive structure');
      }

      const uiStub = ensureTrailingNewline(`import React, { forwardRef } from 'react';

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...props },
  ref
) {
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
    secondary: 'bg-slate-900 text-white hover:bg-slate-700',
    outline: 'border border-emerald-500 text-emerald-600 hover:bg-emerald-50',
    ghost: 'bg-transparent text-emerald-600 hover:bg-emerald-50',
  };

  return (
    <button
      ref={ref}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={classNames(
      'rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg',
      className
    )}
    {...props}
  />
);

export const CardHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={classNames('mb-4 flex flex-col gap-2', className)} {...props} />
);

export const CardContent: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={classNames('space-y-4', className)} {...props} />
);

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className, ...props }) => {
  const variants: Record<BadgeVariant, string> = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-sky-100 text-sky-700',
  };

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={classNames(
          'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200',
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={classNames(
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200',
        className
      )}
      {...props}
    />
  );
});

export const SectionTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h2
    className={classNames('text-lg font-semibold text-slate-900', className)}
    {...props}
  />
);
`);

      const mainTsx = ensureTrailingNewline(`import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

      const indexHtml = ensureTrailingNewline(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

      const packageJson = ensureTrailingNewline(
        JSON.stringify(
          {
            name: safeTitle || 'site-sensei-react-export',
            private: true,
            version: '1.0.0',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              '@emotion/react': '^11.11.4',
              '@emotion/styled': '^11.11.5',
              '@mui/material': '^5.15.13',
              '@mui/icons-material': '^5.15.13',
              react: '^18.3.1',
              'react-dom': '^18.3.1'
            },
            devDependencies: {
              '@types/react': '^18.3.1',
              '@types/react-dom': '^18.3.1',
              '@vitejs/plugin-react': '^4.0.0',
              typescript: '^5.4.0',
              vite: '^5.0.0'
            }
          },
          null,
          2
        )
      );

      const tsconfig = ensureTrailingNewline(
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ESNext',
              module: 'ESNext',
              jsx: 'react-jsx',
              moduleResolution: 'Bundler',
              esModuleInterop: true,
              strict: false,
              skipLibCheck: true
            },
            include: ['src']
          },
          null,
          2
        )
      );

      const viteConfig = ensureTrailingNewline(`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`);

      const readme = ensureTrailingNewline(`# ${safeTitle} – React Export

This archive contains everything you need to continue building the generated React page inside your own project.

## Quick start

1. Unzip the archive.
2. \`npm install\`
3. \`npm run dev\`

Everything lives in \`src/\`. The generated page is in \`App.tsx\` and the lightweight component helpers are in \`ui.tsx\`.
`);

      srcFolder.file('App.tsx', componentSource);
      srcFolder.file('ui.tsx', uiStub);
      srcFolder.file('main.tsx', mainTsx);
      zip.file('index.html', indexHtml);
      zip.file('package.json', packageJson);
      zip.file('tsconfig.json', tsconfig);
      zip.file('vite.config.ts', viteConfig);
      zip.file('README.md', readme);
      zip.file('.gitignore', ensureTrailingNewline('node_modules\n.dist\nbuild\n.vite\n'));

      const archive = await zip.generateAsync({ type: 'nodebuffer' });
      return new NextResponse(archive, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${safeTitle || 'site-sensei-react'}.zip"`
        }
      });
    }

    const sanitizedJs = (javascript || '').replace(/<\/script/gi, '<\\/script>');
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
</head>
<body>
${html}
<script>
try {
${sanitizedJs}
} catch (error) {
  console.error(error);
  alert('Runtime error: ' + error.message);
}
</script>
</body>
</html>`;

    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${pageName}.html"`
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
