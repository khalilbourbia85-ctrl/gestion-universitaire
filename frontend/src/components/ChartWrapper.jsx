import React, { useRef, useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

const ChartWrapper = ({ children, height = 300 }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Use ResizeObserver to get accurate dimensions after layout
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setDimensions({
            width: Math.floor(rect.width),
            height: Math.floor(rect.height)
          });
          setIsReady(true);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    // Trigger initial measurement
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height)
        });
        setIsReady(true);
      }
    }

    return () => resizeObserver.disconnect();
  }, [height]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        minHeight: `${height}px`,
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {isReady && dimensions.width > 0 ? (
        <ResponsiveContainer width={dimensions.width} height={dimensions.height}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          Chargement du graphique...
        </div>
      )}
    </div>
  );
};

export default ChartWrapper;
