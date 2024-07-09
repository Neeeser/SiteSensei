import React, { useRef, useEffect, useState } from 'react';

const PreviewComponent = ({ html, javascript, width, height }) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateIframeContent = () => {
      if (iframeRef.current) {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
              </style>
            </head>
            <body>
              ${html}
              <script>${javascript}</script>
            </body>
          </html>
        `);
        iframeDoc.close();
      }
    };
    updateIframeContent();
  }, [html, javascript]);

  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        setScale(Math.min(scaleX, scaleY));
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [width, height]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${width}px`,
        height: `${height}px`,
      }}>
        <iframe
          ref={iframeRef}
          title="Page Preview"
          className="w-full h-full border-none pointer-events-none"
        />
      </div>
    </div>
  );
};

export default PreviewComponent;