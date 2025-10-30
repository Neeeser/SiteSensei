'use client';
import React, { useState, useEffect, useRef } from 'react';
import DynamicHtmlRenderer from '../../components/DynamicHtmlRenderer';
import { useUser } from '@auth0/nextjs-auth0/client';
import { motion, AnimatePresence } from 'framer-motion';
import EditChatbox from '../../components/EditChatbox';

export default function CreatePage() {
  const { user, isLoading: userLoading } = useUser();
  const [pageName, setPageName] = useState('');
  const [htmlContent, setHtmlContent] = useState("");
  const [jsContent, setJsContent] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [selectedModel, setSelectedModel] = useState('FREE_MODEL');
  const [userRole, setUserRole] = useState('free');
  const [userNickname, setUserNickname] = useState(null);
  const [isPageGenerated, setIsPageGenerated] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 500, height: 500 });
  const previewContainerRef = useRef(null);
  const [placeholderText, setPlaceholderText] = useState('Describe the content you want to generate...');
  const [initialLoad, setInitialLoad] = useState(true);
  const [initialDelayPassed, setInitialDelayPassed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [enhancedPromptContent, setEnhancedPromptContent] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [streamingHtml, setStreamingHtml] = useState("");
  const [streamingJavascript, setStreamingJavascript] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  
  const placeholderExamples = [
    'Generate a compound interest calculator',
    'Create a resume website',
    'Design a shopping page for dog food',
    'Build a weather dashboard',
    'Develop a recipe finder app',
    'Create an interactive quiz game',
    'Design a fitness tracking app',
    'Build a personal budget planner',
    'Generate a portfolio showcase',
    'Create a virtual plant care assistant',
    'Plan a launch page for a new mobile app',
    'Design a product teaser microsite',
    'Build a conference agenda hub',
    'Create a SaaS onboarding checklist',
    'Design an AI chatbot landing page',
    'Build a travel inspiration gallery',
    'Generate a crowdfunding campaign page',
    'Craft a digital art portfolio',
    'Create a restaurant menu with ordering',
    'Design an indie game reveal site',
    'Build a startup hiring page',
    'Create a wellness retreat promo',
    'Design a VR experience trailer',
    'Craft a newsletter signup funnel',
    'Build a personal knowledge base',
    'Create a neighborhood events calendar',
    'Design a coworking space tour',
    'Build a podcast episode explorer',
    'Create a crypto trends dashboard',
    'Design a coffee shop loyalty program',
    'Build an online course outline',
    'Create an interior design moodboard',
    'Design a small business analytics hub',
    'Build a charity donation tracker',
    'Create a fashion lookbook landing page',
    'Design a sports team fan hub',
    'Build a hackathon project page',
    'Create a smart home controller UI',
    'Design a university department site',
    'Build a product comparison grid',
    'Create a language learning planner',
    'Design a digital garden homepage',
    'Build a wedding RSVP organizer',
    'Create a camp registration portal',
    'Design a skincare routine builder',
    'Build an esports tournament bracket',
    'Create a film festival showcase',
    'Design a photographer booking site',
    'Build a sustainability impact report',
    'Create a marketplace seller dashboard'
  ];

  const getRandomTypingSpeed = () => {
    return Math.floor(Math.random() * (180 - 80 + 1) + 80); // Random speed between 80ms and 180ms
  };


  useEffect(() => {
    let timer;

  
    if (initialLoad) {
      timer = setTimeout(() => {
        setInitialLoad(false);
        setInitialDelayPassed(true);
        setIsTyping(false); // Start by deleting the initial placeholder

      }, 5000);
    } else if (initialDelayPassed) {
      const currentExample = placeholderExamples[currentExampleIndex];
  
      if (isTyping) {
        if (placeholderText !== currentExample) {
          timer = setTimeout(() => {
            setPlaceholderText(currentExample.slice(0, placeholderText.length + 1));
          }, getRandomTypingSpeed());
        } else {
          timer = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      } else {
        if (placeholderText.length > 0) {
          timer = setTimeout(() => {
            setPlaceholderText(placeholderText.slice(0, -1));
          }, 50);
        } else {

          setCurrentExampleIndex((prevIndex) => (prevIndex + 1) % placeholderExamples.length);
          setIsTyping(true);
        }
      }
    }
  
    return () => clearTimeout(timer);
  }, [placeholderText, currentExampleIndex, isTyping, initialLoad, initialDelayPassed]);

  useEffect(() => {
    const updatePreviewSize = () => {
      if (previewContainerRef.current) {
        const { width, height } = previewContainerRef.current.getBoundingClientRect();
        setPreviewSize({ width, height });
      }
    };

    updatePreviewSize();
    window.addEventListener('resize', updatePreviewSize);
    return () => window.removeEventListener('resize', updatePreviewSize);
  }, []);


  // New state to track form validity
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const response = await fetch('/api/getUserRole');
          const data = await response.json();
          setUserRole(data.role);
          setUserNickname(data.nickname);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);


  const handleEditSubmit = (editedHtml, editedJavascript) => {
    setHtmlContent(editedHtml);
    setJsContent(editedJavascript);
    setMessage('Content updated successfully');
  };


  useEffect(() => {
    // Check if both pageName and promptContent are filled
    setIsFormValid(pageName.trim() !== '' && promptContent.trim() !== '');
  }, [pageName, promptContent]);

  const handlePageNameChange = (e) => {
    const value = e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    setPageName(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    setMessage('');
    setIsPageGenerated(false);
    setStreamingHtml('');
    setStreamingJavascript('');
    setIsStreaming(false);

    try {
      let finalPrompt = promptContent;
      let enhancedPrompt = null;
      
      if (enhancePrompt) {
        setIsEnhancing(true);
        const enhanceResponse = await fetch('/api/enhancePrompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptContent }),
        });
        const enhanceData = await enhanceResponse.json();
        if (enhanceData.enhancedPrompt) {
          finalPrompt = enhanceData.enhancedPrompt;
          enhancedPrompt = enhanceData.enhancedPrompt;
          setEnhancedPromptContent(finalPrompt);
        }
        setIsEnhancing(false);
      }
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, model: selectedModel }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to start generation';
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Error parsing generation error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('Streaming not supported in this environment');
      }

      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalPayload = null;
      let streamError = null;

      const handlePayload = (line) => {
        const payload = JSON.parse(line);
        switch (payload.type) {
          case 'partial':
            setStreamingHtml(payload.html || '');
            break;
          case 'complete':
            finalPayload = payload;
            setStreamingHtml(payload.html || '');
            setStreamingJavascript(payload.javascript || '');
            break;
          case 'error':
            throw new Error(payload.message || 'Error generating content');
          default:
            break;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          try {
            handlePayload(trimmed);
          } catch (err) {
            streamError = err;
            break;
          }
        }

        if (streamError) {
          break;
        }
      }

      if (!streamError) {
        buffer += decoder.decode();
        const trimmedBuffer = buffer.trim();
        if (trimmedBuffer) {
          try {
            handlePayload(trimmedBuffer);
          } catch (err) {
            streamError = err;
          }
        }
      }

      if (streamError) {
        throw streamError;
      }

      if (!finalPayload) {
        throw new Error('Generation ended unexpectedly');
      }

      const finalHtml = finalPayload.html || '';
      const finalJavascript = finalPayload.javascript || '';

      setStreamingHtml(finalHtml);
      setStreamingJavascript(finalJavascript);
      setIsStreaming(false);
      setHtmlContent(finalHtml);
      setJsContent(finalJavascript);
      setMessage('Content generated successfully');
      
      const storeResponse = await fetch('/api/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pageName,
          html: finalHtml,
          javascript: finalJavascript,
          auth0Id: user ? user.sub : null,
          model: selectedModel,
          originalPrompt: promptContent,
          enhancedPrompt: enhancedPrompt,
          createdAt: new Date().toISOString()
        }),
      });
      const storeData = await storeResponse.json();
      if (storeData.message) {
        setMessage(prevMessage => `${prevMessage}. ${storeData.message}`);
      }
      setIsPageGenerated(true);
    } catch (error) {
      console.error('Error:', error);
      setIsStreaming(false);
      setStreamingHtml('');
      setStreamingJavascript('');
      setMessage(error.message || 'Error generating content');
      setIsEnhancing(false);
    } finally {
      setIsEnhancing(false);
      setIsLoading(false);
    }
  };
  const canUseModel = (model) => {
    if (model === 'FREE_MODEL') return true;
    return userRole === 'admin' || userRole === 'paid';
  };

  const modelOptions = [
    {
      id: 'FREE_MODEL',
      title: 'Starter',
      description: 'Fast drafts with the community model',
    },
    {
      id: 'PRO_MODEL',
      title: 'Pro',
      description: 'Sharper layouts and better structure',
    },
    {
      id: 'ADVANCED_MODEL',
      title: 'Advanced',
      description: 'Experimental reasoning for complex flows',
    },
  ];

  const previewHtml = isStreaming ? streamingHtml : (streamingHtml || htmlContent);
  const previewJavascript = isStreaming ? '' : (streamingJavascript || jsContent);

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-7xl space-y-10">
        <div className="grid gap-10 xl:grid-cols-[1.05fr_minmax(0,0.95fr)]">
          <section className="space-y-10">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.8 }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                AI-Powered Builder
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-5xl">
                Create, refine, and launch webpages in minutes.
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                Describe your vision, pick the right model, and let our builder craft responsive experiences for every screen. Tweak results instantly with the live preview and edit chat.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/70"
            >
              <div className="mb-8 flex flex-col gap-2">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Generate with confidence</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Keep inputs focused — clear names and detailed prompts lead to the best results.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-2">
                  <label htmlFor="pageName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Page URL slug
                  </label>
                  <div className="relative">
                    <input
                      id="pageName"
                      type="text"
                      value={pageName}
                      onChange={handlePageNameChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      placeholder="my-new-landing-page"
                      pattern="^[a-z0-9-]+$"
                      title="Only lowercase letters, numbers, and hyphens are allowed"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      slug
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Model</span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {modelOptions.map((option) => {
                      const isSelected = selectedModel === option.id;
                      return (
                        <label
                          key={option.id}
                          className={`relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                            isSelected
                              ? 'border-indigo-500/80 bg-indigo-50/80 shadow-lg ring-2 ring-indigo-500/30 dark:border-indigo-400/70 dark:bg-indigo-950/40'
                              : 'border-slate-200 bg-white/70 shadow-sm dark:border-slate-700 dark:bg-slate-900/70'
                          } ${!canUseModel(option.id) ? 'pointer-events-none opacity-40' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-slate-900 dark:text-white">
                              {option.title}
                            </span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isSelected ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            />
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {option.description}
                          </p>
                          <input
                            type="radio"
                            name="model"
                            value={option.id}
                            checked={selectedModel === option.id}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={!canUseModel(option.id)}
                            className="sr-only"
                          />
                          {!canUseModel(option.id) && (
                            <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-300">
                              Upgrade required
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="promptContent" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    What should we build?
                  </label>
                  <textarea
                    id="promptContent"
                    value={promptContent}
                    onChange={(e) => setPromptContent(e.target.value)}
                    rows={6}
                    required
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                    placeholder={initialLoad || !initialDelayPassed ? "Describe the content you want to generate..." : placeholderText}
                  />
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enhancePrompt"
                      checked={enhancePrompt}
                      onChange={(e) => setEnhancePrompt(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Enhance prompt before generation
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        We&apos;ll enrich your prompt with additional context for higher-quality output.
                      </span>
                    </div>
                  </label>
                  {isEnhancing && (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="h-2 w-2 rounded-full bg-indigo-500"
                      />
                      Enhancing
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {enhancePrompt && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <label htmlFor="enhancedPrompt" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Enhanced prompt
                      </label>
                      <motion.div
                        animate={isEnhancing ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                        transition={isEnhancing ? { duration: 1, repeat: Infinity } : {}}
                        className="rounded-2xl border border-indigo-200/70 bg-white/80 p-4 shadow-inner dark:border-indigo-500/30 dark:bg-slate-900/80"
                      >
                        <textarea
                          id="enhancedPrompt"
                          value={enhancedPromptContent}
                          readOnly
                          rows={5}
                          className="w-full resize-y border-0 bg-transparent text-sm text-slate-800 outline-none dark:text-slate-100"
                          placeholder={isEnhancing ? "Enhancing prompt..." : "Enhanced prompt will appear here"}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:from-slate-400 disabled:via-slate-400 disabled:to-slate-500"
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate content'}
                </motion.button>
              </form>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm font-medium text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                >
                  {message}
                </motion.div>
              )}
            </motion.div>

            {isPageGenerated && (
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/70"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your page is live</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Share this link and explore it in the preview to continue iterating:
                </p>
                <motion.a
                  href={`page/${userNickname || 'anon'}/${pageName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                  whileHover={{ x: 4 }}
                >
                  page/{userNickname || 'anon'}/{pageName}
                </motion.a>
              </motion.div>
            )}
          </section>

          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.9 }}
            className="flex flex-col gap-6"
          >
            <div
              className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70"
              style={{ minHeight: '620px' }}
            >
              <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/60">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Live preview</h2>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Responsive
                </span>
              </div>
              <div ref={previewContainerRef} className="h-full w-full p-4">
                <DynamicHtmlRenderer
                  html={previewHtml}
                  javascript={previewJavascript}
                  width={previewSize.width}
                  height={previewSize.height}
                  isStreaming={isStreaming}
                />
              </div>
            </div>

            {user && isPageGenerated && (
              <EditChatbox
                isVisible={true}
                onSubmit={handleEditSubmit}
                currentHtml={htmlContent}
                currentJavascript={jsContent}
                selectedModel={selectedModel}
                pageName={pageName}
                auth0Id={user.sub}
                userNickname={userNickname}
              />
            )}
          </motion.aside>
        </div>
      </div>
    </motion.main>
  );
}
