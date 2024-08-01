import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ content, children, delay = 400 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      setPosition({
        top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
        left: triggerRect.left - tooltipRect.width - 10, // 10px gap, positioned to the left
      });
    }
  }, [isVisible]);

  const showTooltip = () => {
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="bg-gray-800 text-white text-sm rounded py-2 px-3 whitespace-normal max-w-xs">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;