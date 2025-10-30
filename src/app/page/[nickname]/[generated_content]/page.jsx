'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicContent from '@/components/DynamicContent';
import Sidebar from '@/components/Sidebar';
import EditChatbox from '@/components/EditChatbox';
import { Menu, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Tooltip from '@/components/Tooltip';

export default function DynamicPage({ params }) {
  const { nickname, generated_content } = params;
  const [content, setContent] = useState({ 
    html: '', 
    javascript: '', 
    original_prompt: '', 
    enhanced_prompt: '' 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revisionError, setRevisionError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('FREE_MODEL');
  const [userRole, setUserRole] = useState('free');
  const [revisions, setRevisions] = useState([]);
  const [currentRevisionIndex, setCurrentRevisionIndex] = useState(0);
  const [showEditHint, setShowEditHint] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    async function fetchContentAndCheckUser() {
      try {
        setIsLoading(true);
        setError(null);
        setRevisionError(null);

        if (!nickname || !generated_content) {
          throw new Error('Missing nickname or page name');
        }

        const contentResponse = await fetch(`/api/content?nickname=${nickname}&pageName=${generated_content}`);
        if (!contentResponse.ok) {
          throw new Error(`HTTP error! status: ${contentResponse.status}`);
        }
        const contentData = await contentResponse.json();

        setContent({
          html: contentData.html,
          javascript: contentData.javascript,
          original_prompt: contentData.original_prompt,
          enhanced_prompt: contentData.enhanced_prompt
        });
        setSelectedModel(contentData.model_used || 'FREE_MODEL');

        // Fetch revisions
        try {
          const revisionsResponse = await fetch(`/api/get-page-revisions?nickname=${nickname}&pageName=${generated_content}`);
          if (revisionsResponse.ok) {
            const revisionsData = await revisionsResponse.json();
            setRevisions([contentData, ...revisionsData]);
          } else {
            const errorData = await revisionsResponse.json();
            setRevisionError(errorData.error || 'Failed to fetch revisions');
          }
        } catch (revisionError) {
          console.error('Error fetching revisions:', revisionError);
          setRevisionError('Failed to fetch revisions');
        }

        // Check if the current user is the creator
        if (user) {
          setIsCreator(user.nickname === nickname);
          
          // Fetch user role
          try {
            const roleResponse = await fetch('/api/getUserRole');
            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              setUserRole(roleData.role);
            } else {
              console.error('Failed to fetch user role');
            }
          } catch (roleError) {
            console.error('Error fetching user role:', roleError);
          }
        }
      } catch (error) {
        console.error('Error fetching content or user data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContentAndCheckUser();
  }, [nickname, generated_content, user]);

  const tooltipContent = (
    <div>
      <p><strong>Original Prompt:</strong> {content.original_prompt}</p>
      {content.enhanced_prompt !== "Enhanced prompt not available" && (
        <p><strong>Enhanced Prompt:</strong> {content.enhanced_prompt}</p>
      )}
    </div>
  );

  const handleEditSubmit = async (newHtml, newJavascript) => {
    setContent({ html: newHtml, javascript: newJavascript });

    
    // Refresh revisions
    const revisionsResponse = await fetch(`/api/get-page-revisions?nickname=${nickname}&pageName=${generated_content}`);
    if (revisionsResponse.ok) {
      const revisionsData = await revisionsResponse.json();
      setRevisions([{ html: newHtml, javascript: newJavascript }, ...revisionsData]);
      setCurrentRevisionIndex(0);
    }
  };


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const canUseModel = (model) => {
    if (model === 'FREE_MODEL') return true;
    return userRole === 'admin' || userRole === 'paid';
  };

  const navigateRevision = (direction) => {
    const newIndex = currentRevisionIndex + direction;
    if (newIndex >= 0 && newIndex < revisions.length) {
      setCurrentRevisionIndex(newIndex);
      setContent(revisions[newIndex]);
    }
  };

  const handleDownload = () => {
    const baseUrl = '/api/download'; // Adjust if your endpoint base URL differs
    // Determine if a specific revision is being viewed
    const revisionId = currentRevisionIndex > 0 ? revisions[currentRevisionIndex].id : null;
    const queryParams = `?nickname=${encodeURIComponent(nickname)}&pageName=${encodeURIComponent(generated_content)}${revisionId ? `&revisionId=${revisionId}` : ''}`;
    const downloadUrl = `${baseUrl}${queryParams}`;
  
    // Create a temporary anchor tag to initiate download
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.setAttribute('download', ''); // You can specify a filename here if needed
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  useEffect(() => {
    if (isCreator && !isLoading) {
      setShowEditHint(true);
      const timer = setTimeout(() => {
        setShowEditHint(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCreator, isLoading]);

  if (isLoading) {
    return (
      <section className="flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center px-4 py-16">
        <div className="loading-spinner" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center px-4 py-16">
        <div className="glass-card max-w-md text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Page unavailable</h1>
          <p className="mt-2 text-sm font-semibold text-rose-500 dark:text-rose-300">{error}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            The requested page could not be found. It may have been removed or set to private.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[calc(100vh-var(--navbar-height))] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-10 top-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/25" />
        <div className="absolute right-[-6rem] top-1/2 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/25" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="glass-panel relative h-[65vh] sm:h-[70vh] lg:h-[75vh] overflow-hidden p-0">
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-inner dark:border-slate-800/60 dark:bg-slate-950/40">
            <div className="absolute inset-0">
              <DynamicContent html={content.html} javascript={content.javascript} />
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-40">
            <Tooltip content={tooltipContent}>
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-indigo-400/60 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                aria-label="View prompt details"
              >
                <Info size={20} />
              </button>
            </Tooltip>
          </div>

          {isCreator && (
            <div className="absolute right-6 top-6 z-40 flex items-center gap-3">
              <AnimatePresence>
                {showEditHint && (
                  <motion.span
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-200"
                  >
                    Click to edit
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-md transition hover:-translate-y-0.5 hover:text-indigo-500 dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:text-indigo-300"
                aria-label="Open editing sidebar"
              >
                <Menu size={22} />
              </button>
            </div>
          )}
        </div>

        {revisionError && (
          <div className="glass-card border-rose-300/60 bg-rose-50/80 text-sm font-semibold text-rose-500 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
            Error loading revisions: {revisionError}
          </div>
        )}

        {!revisionError && revisions.length > 1 && (
          <div className="glass-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Revision {currentRevisionIndex + 1} of {revisions.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateRevision(1)}
                disabled={currentRevisionIndex === revisions.length - 1}
                className="btn btn-tonal justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChevronLeft size={18} /> Older
              </button>
              <button
                type="button"
                onClick={() => navigateRevision(-1)}
                disabled={currentRevisionIndex === 0}
                className="btn btn-tonal justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Newer <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isCreator && (
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar}>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Preview model
              </h3>
              <div className="space-y-3">
                {[
                  {
                    id: 'FREE_MODEL',
                    title: 'Starter',
                    description: 'Community model for quick tweaks',
                  },
                  {
                    id: 'PRO_MODEL',
                    title: 'Pro',
                    description: 'Sharper layouts with structured output',
                  },
                  {
                    id: 'ADVANCED_MODEL',
                    title: 'Advanced',
                    description: 'Experiment with complex behavior',
                  },
                ].map((option) => {
                  const isActive = selectedModel === option.id;
                  const disabled = !canUseModel(option.id);
                  return (
                    <label
                      key={option.id}
                      className={`relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition ${
                        isActive
                          ? 'border-indigo-400/70 bg-indigo-50/70 shadow-lg dark:border-indigo-500/40 dark:bg-indigo-500/10'
                          : 'border-slate-200/70 bg-white/80 shadow-sm hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/70'
                      } ${disabled ? 'pointer-events-none opacity-40' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {option.title}
                        </span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isActive ? 'bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                      <input
                        type="radio"
                        name="model"
                        value={option.id}
                        checked={isActive}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={disabled}
                        className="sr-only"
                      />
                      {disabled && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-500 dark:text-amber-300">
                          Upgrade required
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <EditChatbox
              isVisible={true}
              onSubmit={handleEditSubmit}
              currentHtml={content.html}
              currentJavascript={content.javascript}
              selectedModel={selectedModel}
              pageName={generated_content}
              auth0Id={user ? user.sub : null}
              userNickname={nickname}
            />

            <motion.button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary w-full justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Download
            </motion.button>
          </div>
        </Sidebar>
      )}
    </section>
  );
}
