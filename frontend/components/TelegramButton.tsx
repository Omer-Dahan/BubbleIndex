'use client';
import React from 'react';

interface TelegramButtonProps {
  label?: string;
}

/**
 * A reusable Telegram contact button with a subtle
 * soft-glow box-shadow on hover. Centered in its container.
 */
export default function TelegramButton({ label = '@YD_IL' }: TelegramButtonProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <a
          href="https://t.me/YD_IL"
          target="_blank"
          rel="noopener noreferrer"
          className="bi-telegram-btn"
        >
          {/* Telegram paper-plane SVG icon */}
          <svg
            className="bi-telegram-btn-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"
              fill="currentColor"
            />
          </svg>
          <span>{label}</span>
          <svg
            className="bi-telegram-btn-arrow"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 17L17 7M17 7H7M17 7V17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      <style jsx>{`
        .bi-telegram-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px 10px 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0088cc 0%, #0077b5 50%, #006699 100%);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-decoration: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition:
            transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.4s ease;
          box-shadow: 0 2px 8px rgba(0, 136, 204, 0.2);
        }

        /* Shiny highlight overlay */
        .bi-telegram-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 55%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .bi-telegram-btn:hover {
          transform: translateY(-1px) scale(1.03);
          box-shadow:
            0 0 12px rgba(0, 136, 204, 0.3),
            0 0 24px rgba(0, 170, 255, 0.12);
        }

        .bi-telegram-btn:hover::before {
          opacity: 1;
        }

        .bi-telegram-btn:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 1px 4px rgba(0, 136, 204, 0.15);
        }

        .bi-telegram-btn-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .bi-telegram-btn:hover .bi-telegram-btn-icon {
          transform: rotate(-8deg) scale(1.12);
        }

        .bi-telegram-btn-arrow {
          flex-shrink: 0;
          opacity: 0.7;
          transition:
            transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.3s ease;
        }

        .bi-telegram-btn:hover .bi-telegram-btn-arrow {
          transform: translate(2px, -2px);
          opacity: 1;
        }
      `}</style>
    </>
  );
}
