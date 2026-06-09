'use client';
import { useEffect, useRef } from 'react';

interface Bubble {
  screenX: number; // Viewport-relative X
  screenY: number; // Viewport-relative Y
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  colorIndex: number; // Stores index in palette
  alpha: number;
  targetAlpha: number;
}

interface Particle {
  screenX: number; // Viewport-relative X
  screenY: number; // Viewport-relative Y
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

export default function InteractiveBubbles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let bubbles: Bubble[] = [];
    let particles: Particle[] = [];
    const mouse = { x: 0, y: 0, active: false };

    // Set canvas size based on parent container size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = (rect?.width || 400) * window.devicePixelRatio;
      canvas.height = (rect?.height || 500) * window.devicePixelRatio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get current colors from CSS variables (retrieving the full spectrum of active palette)
    const getThemeColors = () => {
      if (typeof window === 'undefined') return ['#33ccff', '#ff3366', '#a855f7', '#10b981', '#f59e0b'];
      const style = getComputedStyle(document.documentElement);
      const keys = ['--t-1', '--t-3', '--t-5', '--t-7', '--t-9'];
      const colors = keys.map(k => style.getPropertyValue(k).trim()).filter(Boolean);
      return colors.length > 0 ? colors : ['#33ccff', '#ff3366', '#a855f7', '#10b981', '#f59e0b'];
    };

    // Initialize bubbles (random number between 6 and 8)
    const initBubbles = () => {
      const rect = canvas.getBoundingClientRect();
      const count = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8 bubbles
      bubbles = [];

      for (let i = 0; i < count; i++) {
        const radius = Math.random() * 18 + 10;
        bubbles.push({
          screenX: Math.random() * (rect.width - radius * 2) + rect.left + radius,
          screenY: Math.random() * (rect.height - radius * 2) + rect.top + radius,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius,
          baseRadius: radius,
          colorIndex: Math.floor(Math.random() * 5), // distribute across 5 active palette colors
          alpha: Math.random() * 0.15 + 0.05,
          targetAlpha: Math.random() * 0.15 + 0.05,
        });
      }
    };

    // Wait a brief tick for layout coordinates to settle before initializing
    setTimeout(initBubbles, 50);

    // Spawn tiny particles in screen space
    const createExplosion = (screenX: number, screenY: number, color: string) => {
      const count = 15;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1;
        particles.push({
          screenX,
          screenY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2.5 + 1,
          color,
          alpha: 1,
          life: 1.0,
        });
      }
    };

    // Pop a bubble and respawn it elsewhere
    const popBubble = (b: Bubble, rect: DOMRect, bubbleColor: string) => {
      createExplosion(b.screenX, b.screenY, bubbleColor);

      // Respawn the bubble at a random location inside the canvas viewport bounds
      b.radius = Math.random() * 18 + 10;
      b.baseRadius = b.radius;
      b.screenX = Math.random() * (rect.width - b.baseRadius * 2) + rect.left + b.baseRadius;
      b.screenY = Math.random() * (rect.height - b.baseRadius * 2) + rect.top + b.baseRadius;
      b.vx = (Math.random() - 0.5) * 0.4;
      b.vy = (Math.random() - 0.5) * 0.4;
      b.colorIndex = Math.floor(Math.random() * 5); // new random color from palette
      b.alpha = Math.random() * 0.15 + 0.05;
      b.targetAlpha = b.alpha;
    };

    // Main animation loop
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = canvas.width / window.devicePixelRatio;
      const canvasHeight = canvas.height / window.devicePixelRatio;

      // Clear the canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const themeColors = getThemeColors();

      // Update and draw bubbles
      bubbles.forEach((b) => {
        // Resolve dynamic color from theme colors array
        const bubbleColor = themeColors[b.colorIndex % themeColors.length];

        // 1. Add gentle organic drift (random micro-accelerations)
        b.vx += (Math.random() - 0.5) * 0.012;
        b.vy += (Math.random() - 0.5) * 0.012;

        // 2. Cap drift speed when mouse is not active to prevent running off too fast
        const speed = Math.hypot(b.vx, b.vy);
        const maxDrift = 0.35;
        if (!mouse.active && speed > maxDrift) {
          b.vx = (b.vx / speed) * maxDrift;
          b.vy = (b.vy / speed) * maxDrift;
        }

        // Apply velocity to screen-space coordinates
        b.screenX += b.vx;
        b.screenY += b.vy;

        // 3. PUSH OUT / OUT-OF-BOUNDS POPPING:
        // If the bubble moves completely out of the viewport bounds of the canvas, pop it!
        if (
          b.screenX - b.radius < rect.left ||
          b.screenX + b.radius > rect.right ||
          b.screenY - b.radius < rect.top ||
          b.screenY + b.radius > rect.bottom
        ) {
          popBubble(b, rect, bubbleColor);
        }

        // Mouse interaction in screen space
        if (mouse.active) {
          const dx = b.screenX - mouse.x;
          const dy = b.screenY - mouse.y;
          const distance = Math.hypot(dx, dy);
          const forceRadius = 130;

          if (distance < forceRadius) {
            const force = (forceRadius - distance) / forceRadius;
            const angle = Math.atan2(dy, dx);
            // Push bubble away
            b.vx += Math.cos(angle) * force * 0.15;
            b.vy += Math.sin(angle) * force * 0.15;

            // Cap maximum speed under mouse pressure
            const currentSpeed = Math.hypot(b.vx, b.vy);
            if (currentSpeed > 2.0) {
              b.vx = (b.vx / currentSpeed) * 2.0;
              b.vy = (b.vy / currentSpeed) * 2.0;
            }

            // Hover scaling: grow radius
            b.radius = b.radius * 0.9 + (b.baseRadius * 1.5) * 0.1;
            b.targetAlpha = 0.3;
          } else {
            // Return to normal size & opacity
            b.radius = b.radius * 0.95 + b.baseRadius * 0.05;
            b.targetAlpha = b.alpha;
          }
        } else {
          b.radius = b.radius * 0.95 + b.baseRadius * 0.05;
          b.targetAlpha = b.alpha;
        }

        // Friction to slowly decay mouse pushes
        b.vx *= 0.97;
        b.vy *= 0.97;

        // Map viewport/screen coordinates to canvas rendering coordinates
        const renderX = b.screenX - rect.left;
        const renderY = b.screenY - rect.top;

        // Draw bubble
        ctx.beginPath();
        const grad = ctx.createRadialGradient(
          renderX - b.radius * 0.2,
          renderY - b.radius * 0.2,
          b.radius * 0.1,
          renderX,
          renderY,
          b.radius
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        grad.addColorStop(0.5, bubbleColor.replace(')', ' / 0.03)'));
        grad.addColorStop(1, bubbleColor.replace(')', ` / ${b.targetAlpha})`));

        ctx.fillStyle = grad;
        ctx.strokeStyle = bubbleColor.replace(')', ` / ${b.targetAlpha * 1.5})`);
        ctx.lineWidth = 1.2;
        ctx.arc(renderX, renderY, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Update and draw explosion particles
      particles = particles.filter((p) => {
        p.screenX += p.vx;
        p.screenY += p.vy;
        p.vy += 0.035; // gravity
        p.life -= 0.022;

        if (p.life <= 0) return false;

        // Check if particle is inside canvas before rendering
        if (
          p.screenX >= rect.left &&
          p.screenX <= rect.right &&
          p.screenY >= rect.top &&
          p.screenY <= rect.bottom
        ) {
          const renderX = p.screenX - rect.left;
          const renderY = p.screenY - rect.top;

          ctx.beginPath();
          ctx.fillStyle = p.color.replace(')', ` / ${p.life * 0.85})`);
          ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        return true;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Mouse handlers in screen space
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
      const rect = canvas.getBoundingClientRect();
      const themeColors = getThemeColors();

      bubbles.forEach((b) => {
        const dist = Math.hypot(b.screenX - clickX, b.screenY - clickY);
        // Pop bubble if click hits it
        if (dist < b.radius + 12) {
          const bubbleColor = themeColors[b.colorIndex % themeColors.length];
          popBubble(b, rect, bubbleColor);
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (canvas) {
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('click', handleClick);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
