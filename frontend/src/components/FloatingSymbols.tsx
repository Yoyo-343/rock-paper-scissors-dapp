
import React from 'react';

const FloatingSymbols = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Rock symbol (✊) */}
      <div className="absolute animate-float-1 text-cyber-orange/10 text-4xl left-[10%] top-full">
        ✊
      </div>
      <div className="absolute animate-float-2 text-cyber-orange/10 text-3xl left-[80%] top-full">
        ✊
      </div>
      <div className="absolute animate-float-3 text-cyber-orange/10 text-5xl left-[50%] top-full">
        ✊
      </div>
      <div className="absolute animate-float-10 text-cyber-orange/10 text-4xl left-[25%] top-full">
        ✊
      </div>
      <div className="absolute animate-float-11 text-cyber-orange/10 text-3xl left-[75%] top-full">
        ✊
      </div>
      
      {/* Paper symbol (✋) */}
      <div className="absolute animate-float-4 text-cyber-gold/10 text-4xl left-[20%] top-full">
        ✋
      </div>
      <div className="absolute animate-float-5 text-cyber-gold/10 text-3xl left-[70%] top-full">
        ✋
      </div>
      <div className="absolute animate-float-6 text-cyber-gold/10 text-5xl left-[40%] top-full">
        ✋
      </div>
      <div className="absolute animate-float-12 text-cyber-gold/10 text-4xl left-[15%] top-full">
        ✋
      </div>
      <div className="absolute animate-float-13 text-cyber-gold/10 text-3xl left-[85%] top-full">
        ✋
      </div>
      
      {/* Victory/Scissors symbol (✌️) */}
      <div className="absolute animate-float-7 text-cyber-copper/10 text-4xl left-[60%] top-full">
        ✌️
      </div>
      <div className="absolute animate-float-8 text-cyber-copper/10 text-3xl left-[30%] top-full">
        ✌️
      </div>
      <div className="absolute animate-float-9 text-cyber-copper/10 text-5xl left-[90%] top-full">
        ✌️
      </div>
      <div className="absolute animate-float-14 text-cyber-copper/10 text-4xl left-[5%] top-full">
        ✌️
      </div>
      <div className="absolute animate-float-15 text-cyber-copper/10 text-3xl left-[65%] top-full">
        ✌️
      </div>
    </div>
  );
};

export default FloatingSymbols;
