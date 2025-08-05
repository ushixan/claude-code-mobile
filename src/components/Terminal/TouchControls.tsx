import { useEffect, useRef } from 'react';

interface TouchControlsProps {
  onPinch?: (scale: number) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onTap?: () => void;
}

const TouchControls: React.FC<TouchControlsProps> = ({ onPinch, onSwipe, onTap }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let isPinching = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      } else if (e.touches.length === 2) {
        isPinching = true;
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastDistanceRef.current = distance;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2 && onPinch) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        
        if (lastDistanceRef.current) {
          const scale = distance / lastDistanceRef.current;
          if (Math.abs(scale - 1) > 0.01) {
            onPinch(scale);
            lastDistanceRef.current = distance;
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isPinching = false;
        lastDistanceRef.current = null;

        if (touchStartRef.current && e.changedTouches.length === 1) {
          const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now()
          };

          const deltaX = touchEnd.x - touchStartRef.current.x;
          const deltaY = touchEnd.y - touchStartRef.current.y;
          const deltaTime = touchEnd.time - touchStartRef.current.time;
          const distance = Math.hypot(deltaX, deltaY);

          // Tap detection
          if (distance < 10 && deltaTime < 200 && onTap) {
            onTap();
          }
          // Swipe detection
          else if (distance > 50 && deltaTime < 500 && onSwipe) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (absX > absY) {
              onSwipe(deltaX > 0 ? 'right' : 'left');
            } else {
              onSwipe(deltaY > 0 ? 'down' : 'up');
            }
          }

          touchStartRef.current = null;
        }
      }
    };

    overlay.addEventListener('touchstart', handleTouchStart, { passive: true });
    overlay.addEventListener('touchmove', handleTouchMove, { passive: true });
    overlay.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      overlay.removeEventListener('touchstart', handleTouchStart);
      overlay.removeEventListener('touchmove', handleTouchMove);
      overlay.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPinch, onSwipe, onTap]);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ touchAction: 'none' }}
    />
  );
};

export default TouchControls;