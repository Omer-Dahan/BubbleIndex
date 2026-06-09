'use client';
import React from 'react';
import InteractiveBubbles from './InteractiveBubbles';
import { useLanguage } from '@/lib/LanguageContext';

interface Props {
  children: React.ReactNode;
}

export default function LayoutWithBubbles({ children }: Props) {
  const { isRtl } = useLanguage();

  return (
    <>
      <div className="bi-split-layout">
        {/* Content Column */}
        <div className="bi-split-content">
          {children}
        </div>

        {/* Interactive Bubbles Panel */}
        <div className="bi-split-sidebar">
          <InteractiveBubbles />
        </div>
      </div>

      <style jsx>{`
        .bi-split-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--gap-grid);
          width: 100%;
          align-items: start;
        }

        .bi-split-content {
          display: flex;
          flex-direction: column;
          gap: var(--gap-grid);
          width: 100%;
        }

        .bi-split-sidebar {
          display: none;
        }

        @media (min-width: 1025px) {
          .bi-split-layout {
            grid-template-columns: ${isRtl ? 'minmax(0, 0.4fr) minmax(0, 0.6fr)' : 'minmax(0, 0.6fr) minmax(0, 0.4fr)'};
            gap: calc(var(--gap-grid) * 2);
          }
          
          .bi-split-sidebar {
            display: flex;
            flex-direction: column;
            position: sticky;
            top: calc(var(--pad-screen) + 80px);
            height: calc(100vh - 180px);
            min-height: 480px;
            overflow: hidden;
          }
          
          .bi-split-content {
            order: ${isRtl ? 2 : 1};
          }
          
          .bi-split-sidebar {
            order: ${isRtl ? 1 : 2};
          }
        }
      `}</style>
    </>
  );
}
