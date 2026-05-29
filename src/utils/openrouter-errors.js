export function isOpenRouterAuthError(error) {
  return error?.status === 401 || error?.code === 401;
}

export function getOpenRouterErrorMessage(error, action = 'request') {
  if (isOpenRouterAuthError(error)) {
    return `${action} is unavailable because the OpenRouter API key was rejected.`;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return `${action} is unavailable because OPENROUTER_API_KEY is not configured.`;
  }

  return `Error completing OpenRouter ${action.toLowerCase()}`;
}

export function logOpenRouterError(context, error, metadata = {}) {
  const isAuthError = isOpenRouterAuthError(error);
  const logPayload = {
    context,
    diagnosis: isAuthError
      ? 'OpenRouter rejected the configured API key. Verify OPENROUTER_API_KEY in .env.local / Vercel env vars.'
      : 'OpenRouter request failed.',
    status: error?.status,
    code: error?.code,
    type: error?.type,
    message: error?.message,
    openRouterApiKeyConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    openRouterApiKeyLength: process.env.OPENROUTER_API_KEY?.length || 0,
    ...metadata
  };

  console.error('[OpenRouter]', logPayload);
}
