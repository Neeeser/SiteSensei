import { NextResponse } from 'next/server';
import { bundleReactComponent, UNSUPPORTED_IMPORT_ERROR_CODE } from '@/utils/react-bundler';
import { stripReactSentinel, isReactSnippet } from '@/utils/render-modes';

export async function POST(request) {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    const rawBody = await request.text();
    if (!rawBody || !rawBody.trim()) {
      return NextResponse.json(
        { error: 'Missing request body' },
        { status: 400 }
      );
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    const { jsx = '', javascript = '' } = payload || {};

    let source = '';
    if (typeof jsx === 'string' && jsx.trim()) {
      source = jsx;
    } else if (typeof javascript === 'string' && javascript.trim()) {
      source = isReactSnippet(javascript) ? stripReactSentinel(javascript) : javascript;
    }

    if (!source.trim()) {
      return NextResponse.json(
        { error: 'Missing React component source to compile' },
        { status: 400 }
      );
    }

    const bundle = await bundleReactComponent(source);
    return NextResponse.json({ bundle }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('React bundling failed:', error);
    const isUnsupportedImport = error?.code === UNSUPPORTED_IMPORT_ERROR_CODE;
    const responseBody = {
      error: isUnsupportedImport
        ? (error?.message || 'This type of site isn\'t supported yet.')
        : 'Failed to compile React component'
    };

    if (isUnsupportedImport && Array.isArray(error?.unsupportedModules) && error.unsupportedModules.length) {
      responseBody.details = `Unsupported imports: ${error.unsupportedModules.join(', ')}`;
    } else if (!isUnsupportedImport && error?.message && error?.message !== responseBody.error) {
      responseBody.details = error.message;
    }

    return NextResponse.json(responseBody, { status: 400 });
  }
}
