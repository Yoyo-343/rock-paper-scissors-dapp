import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface PhaseIndicatorProps {
  currentPhase: 1 | 2 | 3;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase }) => {
  const phases = [
    { id: 1, label: "Checking Cartridge Controller session" },
    { id: 2, label: "Finding an opponent" },
    { id: 3, label: "Launching game" }
  ];

  const getPhaseStatus = (phaseId: number) => {
    if (phaseId < currentPhase) return 'completed';
    if (phaseId === currentPhase) return 'active';
    return 'pending';
  };

  const getPhaseClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'active':
        return 'bg-cyber-orange border-cyber-orange text-white';
      case 'pending':
        return 'bg-gray-700 border-gray-600 text-gray-400';
      default:
        return 'bg-gray-700 border-gray-600 text-gray-400';
    }
  };

  const getTextClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'active':
        return 'text-cyber-orange';
      case 'pending':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-4">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          const isLast = index === phases.length - 1;
          
          return (
            <div key={phase.id} className="relative">
              {/* Phase Item */}
              <div className="flex items-center space-x-4">
                {/* Phase Number/Icon */}
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300 ${getPhaseClasses(status)}
                `}>
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : status === 'active' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">{phase.id}</span>
                  )}
                </div>
                
                {/* Phase Label */}
                <div className={`
                  flex-1 text-sm font-medium transition-all duration-300
                  ${getTextClasses(status)}
                `}>
                  {phase.label}
                </div>
              </div>
              
              {/* Connector Line */}
              {!isLast && (
                <div className="ml-5 mt-2 mb-2">
                  <div className={`
                    w-0.5 h-6 transition-all duration-300
                    ${status === 'completed' ? 'bg-green-500' : 'bg-gray-600'}
                  `} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current Phase Status */}
      <div className="mt-6 text-center">
        <p className="text-cyber-orange font-medium">
          {phases[currentPhase - 1]?.label}
        </p>
      </div>
    </div>
  );
};

export default PhaseIndicator; 