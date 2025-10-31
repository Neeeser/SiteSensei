import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import PreviewComponent from './PreviewComponent';
import { Star, Trash2 } from 'lucide-react';
import { HTML_RENDER_MODE, REACT_RENDER_MODE, isReactSnippet, stripReactSentinel, REACT_PLACEHOLDER_HTML } from '@/utils/render-modes';

// Component for displaying a preview card of a page
const PagePreviewCard = ({ page, previewWidth = 1024, previewHeight = 576, userRole, onDelete, onFavorite }) => {
  // Function to get the image source for the user avatar
  const getImageSrc = (user) => {
    if (!user || !user.picture) return '/default_icon.png';
   
    const allowedDomains = [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      's.gravatar.com',
      'auth0.com'
    ];
   
    // Check if the user's picture URL is from an allowed domain
    if (allowedDomains.some(domain => user.picture.includes(domain))) {
      return user.picture;
    }
   
    return '/default_icon.png';
  };

  // Handler for delete button click
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(page.id, page.users ? page.users.nickname : 'anonymous');
  };
  
  // Handler for favorite button click
  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite(page.id, page.users ? page.users.nickname : 'anonymous', !page.is_favorited);
  };
  
  // Function to get model information based on the model type
  const getModelInfo = (model) => {
    switch (model) {
      case 'FREE_MODEL':
        return { name: 'Starter model', className: 'text-slate-400' };
      case 'PRO_MODEL':
        return { name: 'Pro model', className: 'text-indigo-500' };
      case 'ADVANCED_MODEL':
        return { name: 'Advanced model', className: 'text-purple-500' };
      default:
        return { name: 'Starter model', className: 'text-slate-400' };
    }
  };

  // Get model information for the current page
  const modelInfo = getModelInfo(page.model_used);

  // Determine the link href based on whether the page has a user or is anonymous
  const linkHref = page.users ? `/page/${page.users.nickname}/${page.name}` : `/page/anon/${page.name}`;
  const renderMode = page.render_mode || (isReactSnippet(page.javascript || '') ? REACT_RENDER_MODE : HTML_RENDER_MODE);
  const previewHtml = renderMode === REACT_RENDER_MODE ? REACT_PLACEHOLDER_HTML : (page.html || '');
  const previewJavascript = renderMode === REACT_RENDER_MODE ? '' : (page.javascript || '');
  const previewJsx = renderMode === REACT_RENDER_MODE ? stripReactSentinel(page.javascript || '') : '';
  const suppressPreviewErrors = renderMode === HTML_RENDER_MODE;

  return (
    <Link href={linkHref} className="no-underline text-inherit">
      <motion.div
        whileHover={{ y: -6 }}
        className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-lg backdrop-blur transition dark:border-slate-800/60 dark:bg-slate-900/70"
      >
        {/* Admin controls for delete and favorite */}
        {userRole === 'admin' && (
          <>
            <motion.div
              className="absolute left-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200/60 bg-rose-50/90 text-rose-500 shadow-sm backdrop-blur transition hover:scale-105 hover:shadow-md dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
            >
              <Trash2 size={18} />
            </motion.div>
            <motion.div
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/60 bg-amber-50/90 text-amber-500 shadow-sm backdrop-blur transition hover:scale-105 hover:shadow-md dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
            >
              <Star
                className={`${
                  page.is_favorited ? 'text-amber-500 fill-amber-400' : 'text-slate-400'
                }`}
                size={18}
              />
            </motion.div>
          </>
        )}
        {/* Preview component container */}
        <div className="relative w-full">
          <div
            className="relative overflow-hidden rounded-3xl border-b border-slate-200/60 bg-slate-900/5 shadow-inner dark:border-slate-800/60"
            style={{ paddingBottom: `${(previewHeight / previewWidth) * 100}%` }}
          >
            <div className="absolute inset-0">
              <PreviewComponent
                html={previewHtml}
                javascript={previewJavascript}
                jsx={previewJsx}
                width={previewWidth}
                height={previewHeight}
                suppressErrors={suppressPreviewErrors}
                executeJavaScript={false}
                renderMode={renderMode}
              />
            </div>
          </div>
        </div>
        {/* Page information */}
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-400">
              {new Date(page.created_at).toLocaleDateString()}
            </span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${modelInfo.className}`}>
              {modelInfo.name}
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800 transition group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300">
              {page.name || 'Untitled Page'}
            </h3>
            {page.description && (
              <p className="text-sm text-slate-500 line-clamp-2 dark:text-slate-400">{page.description}</p>
            )}
          </div>
        </div>
        {/* User avatar and nickname (if not anonymous) */}
        {!page.is_anonymous && page.users && (
          <div className="absolute bottom-5 right-5 z-10">
            <div className="relative">
              <div className="h-11 w-11 overflow-hidden rounded-full border border-white/80 bg-white shadow-md ring-2 ring-indigo-200/70 transition group-hover:ring-indigo-400/80 dark:border-white/10 dark:bg-slate-900 dark:ring-indigo-500/40">
                <Image
                  src={getImageSrc(page.users)}
                  alt={page.users.nickname || 'User'}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="pointer-events-none absolute bottom-full right-0 mb-3 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg opacity-0 transition duration-200 group-hover:opacity-100 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300">
                {page.users.nickname || 'Anonymous User'}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
};

export default PagePreviewCard;
