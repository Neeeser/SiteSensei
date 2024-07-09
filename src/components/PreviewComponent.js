// components/PreviewComponent.js
import React from 'react';
import DynamicContent from './DynamicContent';

const PreviewComponent = ({ html, javascript, inputMethod }) => {
  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Preview</h2>
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        padding: '20px', 
        height: '30vh',
        overflow: 'hidden',
        pointerEvents: 'none'  // This prevents interaction with the preview
      }}>
        <DynamicContent 
          html={inputMethod === 'separate' ? html : html}
          javascript={inputMethod === 'separate' ? javascript : undefined}
        />
      </div>
    </div>
  );
};

export default PreviewComponent;