import { useState } from 'react';
import { useStore } from '../../store/useStore';

interface SwipeableViewProps {
  children: React.ReactNode;
}

const SwipeableView: React.FC<SwipeableViewProps> = ({ children }) => {
  const { activeTab, setActiveTab, terminals, activeTerminalId, setActiveTerminal } = useStore();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const tabs = ['terminal', 'editor', 'preview', 'files'] as const;
  const currentTabIndex = tabs.indexOf(activeTab);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    setSwiping(true);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    
    setTouchEnd(currentTouch);
    
    // Calculate swipe offset for visual feedback
    const deltaX = currentTouch.x - touchStart.x;
    const deltaY = Math.abs(currentTouch.y - touchStart.y);
    
    // Only apply horizontal swipe if it's more horizontal than vertical
    if (Math.abs(deltaX) > deltaY) {
      setSwipeOffset(deltaX * 0.3); // Dampen the swipe for smoother feel
    }
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwiping(false);
      setSwipeOffset(0);
      return;
    }
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = Math.abs(touchEnd.y - touchStart.y);
    const isHorizontalSwipe = Math.abs(deltaX) > deltaY;
    
    if (isHorizontalSwipe && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && currentTabIndex > 0) {
        // Swipe right - go to previous tab
        setActiveTab(tabs[currentTabIndex - 1]);
      } else if (deltaX < 0 && currentTabIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        setActiveTab(tabs[currentTabIndex + 1]);
      }
    }
    
    // Handle terminal-specific swipes when on terminal tab
    if (activeTab === 'terminal' && terminals.length > 1) {
      const terminalIndex = terminals.findIndex(t => t.id === activeTerminalId);
      
      // Smaller swipe distance for terminal switching
      if (isHorizontalSwipe && Math.abs(deltaX) > 30) {
        if (deltaX > 0 && terminalIndex > 0) {
          setActiveTerminal(terminals[terminalIndex - 1].id);
        } else if (deltaX < 0 && terminalIndex < terminals.length - 1) {
          setActiveTerminal(terminals[terminalIndex + 1].id);
        }
      }
    }
    
    setSwiping(false);
    setSwipeOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  return (
    <div
      className="h-full w-full relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={`h-full w-full transition-transform ${swiping ? '' : 'duration-300'}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          opacity: swiping ? 0.9 : 1
        }}
      >
        {children}
      </div>
      
      {/* Swipe Indicators */}
      {swiping && Math.abs(swipeOffset) > 20 && (
        <>
          {swipeOffset > 0 && currentTabIndex > 0 && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-2 rounded-lg animate-pulse">
              ← {tabs[currentTabIndex - 1]}
            </div>
          )}
          {swipeOffset < 0 && currentTabIndex < tabs.length - 1 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-2 rounded-lg animate-pulse">
              {tabs[currentTabIndex + 1]} →
            </div>
          )}
        </>
      )}
      
      {/* Tab dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
        {tabs.map((tab, index) => (
          <div
            key={tab}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentTabIndex 
                ? 'bg-blue-400 w-6' 
                : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SwipeableView;