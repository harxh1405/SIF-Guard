import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '48px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, var(--skeleton-start) 25%, var(--skeleton-middle) 50%, var(--skeleton-start) 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading-pulse 1.5s infinite ease-in-out',
          }}
        />
      ))}
    </div>
  );
};
