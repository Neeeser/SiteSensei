import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import PreviewComponent from './PreviewComponent';

const PagePreviewCard = ({ page, previewWidth = 1024, previewHeight = 576 }) => {
  const getImageSrc = (user) => {
    if (!user || !user.picture) return '/default_icon.png';
    
    const allowedDomains = [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      's.gravatar.com',
      'auth0.com'
    ];
    
    if (allowedDomains.some(domain => user.picture.includes(domain))) {
      return user.picture;
    }
    
    return '/default_icon.png';
  };

  return (
    <Link href={`/${page.name}`} className="no-underline text-inherit">
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 relative"
      >
        <div className="relative w-full" style={{ paddingBottom: `${(previewHeight / previewWidth) * 100}%` }}>
          <div className="absolute inset-0">
            <PreviewComponent
              html={page.html}
              javascript={page.javascript}
              width={previewWidth}
              height={previewHeight}
            />
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
            {new Date(page.created_at).toLocaleDateString()}
          </p>
          <h3 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {page.name || 'Untitled Page'}
          </h3>
        </div>
        {!page.is_anonymous && page.users && (
          <div className="absolute bottom-2 right-2 group z-10">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
              <Image
                src={getImageSrc(page.users)}
                alt={page.users.name || 'User'}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap">
                {page.users.name || 'Anonymous User'}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
};

export default PagePreviewCard;