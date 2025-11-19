import React from 'react';

interface SplitFlapCharProps {
  char: string;
  nextChar: string;
  isAnimating: boolean;
  className?: string;
}

export const SplitFlapChar: React.FC<SplitFlapCharProps> = ({
  char,
  nextChar,
  isAnimating,
  className = "w-7 h-10 sm:w-8 sm:h-12 md:w-14 md:h-20"
}) => {
  // Common styles for the flap containers
  // Using slate-900 for the flap background (super dark blue)
  // Using slate-950 for the borders
  const flapContainerStyle = "absolute left-0 w-full h-1/2 overflow-hidden bg-slate-900 border-x border-slate-950";
  
  // Helper to render the text content centered in the full height
  const renderContent = (c: string, side: 'top' | 'bottom') => (
    <div 
      className={`absolute left-0 w-full h-[200%] flex items-center justify-center ${side === 'top' ? 'top-0' : 'bottom-0'}`}
    >
      {/* Using slate-50 for text to be slightly softer than pure white, or keep white for contrast */}
      <span className="text-xl md:text-5xl font-mono font-medium leading-none text-white">{c}</span>
    </div>
  );

  return (
    <div 
      className={`relative ${className} mx-0.5 md:mx-1 bg-slate-950 rounded perspective-1000`}
      style={{ perspective: '1000px' }}
    >
      {/* Static Back Layer - Top (Next Char) */}
      <div className={`${flapContainerStyle} top-0 rounded-t-md border-t border-slate-950 z-0`}>
        {renderContent(nextChar, 'top')}
        <div className="absolute inset-0 bg-slate-950/30"></div>
      </div>

      {/* Static Back Layer - Bottom (Current Char) */}
      <div className={`${flapContainerStyle} bottom-0 rounded-b-md border-b border-slate-950 z-0`}>
        {renderContent(char, 'bottom')}
        <div className="absolute inset-0 bg-slate-950/30"></div>
      </div>

      {/* Animated Front Layer - Top (Current Char) */}
      <div 
        key={`top-${char}`}
        className={`${flapContainerStyle} top-0 rounded-t-md border-t border-slate-950 z-10 origin-bottom backface-hidden ${isAnimating ? 'animate-flip-top' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {renderContent(char, 'top')}
        {/* Shadow for depth - using slate/blue tints */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-slate-950/30"></div>
      </div>

      {/* Animated Front Layer - Bottom (Next Char) */}
      <div 
        key={`bottom-${nextChar}`}
        className={`${flapContainerStyle} bottom-0 rounded-b-md border-b border-slate-950 z-10 origin-top backface-hidden ${isAnimating ? 'animate-flip-bottom' : ''}`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isAnimating ? undefined : 'rotateX(90deg)'
        }}
      >
        {renderContent(nextChar, 'bottom')}
        {/* Highlight for depth - using slate/blue tints */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-white/5"></div>
      </div>

      {/* Center Hinge Line */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-950 z-20 shadow-sm"></div>
    </div>
  );
};
