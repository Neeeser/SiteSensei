import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// EditChatbox component for editing page content
const EditChatbox = ({
  isVisible,
  onSubmit,
  className = '',
  animationProps = {},
  title = 'Edit Your Page',
  description = 'Want to make changes? Describe how to modify your page.',
  submitButtonText = 'Submit Changes',
  placeholder = 'Describe the changes you want to make...',
  currentHtml,
  currentJavascript,
  selectedModel,
  pageName,
  auth0Id,
  userNickname
}) => {
  // State for edit message, loading status, and error
  const [editMessage, setEditMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      // First, edit the content
      const editResponse = await fetch('/api/edit-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editPrompt: editMessage,
          currentHtml,
          currentJavascript,
          model: selectedModel
        }),
      });
      const editData = await editResponse.json();
     
      if (!editResponse.ok) {
        throw new Error(editData.error || 'Failed to edit content');
      }

      // Then, update the content in the database
      const updateResponse = await fetch('/api/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pageName,
          html: editData.html,
          javascript: editData.javascript,
          auth0Id: auth0Id,
          model: selectedModel,
          originalPrompt: editMessage,
          enhancedPrompt: null,
          createdAt: new Date().toISOString()
        }),
      });
      const updateData = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateData.error || 'Failed to update content in database');
      }

      // Call the onSubmit callback with updated content
      onSubmit(editData.html, editData.javascript);
      setEditMessage('');
    } catch (error) {
      console.error('Error editing and updating content:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the component
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, ...animationProps.initial }}
          animate={{ opacity: 1, y: 0, ...animationProps.animate }}
          exit={{ opacity: 0, y: 20, ...animationProps.exit }}
          transition={{ duration: 0.5, ...animationProps.transition }}
          className={`rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/70 ${className}`}
        >
          {/* Title */}
          <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
            {title}
          </h3>
          {/* Description */}
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
          {/* Textarea for edit message */}
          <textarea
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            placeholder={placeholder}
            className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30 mb-4"
            rows={4}
          />
          {/* Error message display */}
          {error && (
            <p className="text-sm font-medium text-rose-500 dark:text-rose-400 mb-4">{error}</p>
          )}
          {/* Submit button with animation */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Editing...' : submitButtonText}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditChatbox;
