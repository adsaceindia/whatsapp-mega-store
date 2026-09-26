import React from 'react';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface InterestingLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function InterestingLoader({ fullScreen = true }: InterestingLoaderProps) {
  const { storeSettings } = useStoreConfig();
  const storeName = storeSettings?.storeName || 'My Store';
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto font-sans relative select-none">
      
      {/* Organic Bloobs Liquid Morphing Container */}
      <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center mb-6">
        
        {/* Ambient Blurred Aura */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#DD8560]/30 via-rose-500/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />

        {/* Primary Liquid Bloob 1 */}
        <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_8s_linear_infinite] drop-shadow-xl">
          <defs>
            <linearGradient id="bloobGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DD8560" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="bloobGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#DD8560" />
            </linearGradient>
          </defs>

          {/* Morphing Liquid SVG Path */}
          <path 
            fill="url(#bloobGrad1)" 
            opacity="0.88"
            className="transition-all duration-1000 ease-in-out"
            d="M45.7,-58.3C58.4,-47.9,67.3,-32.1,70.9,-15.1C74.6,1.9,73,20.1,64.4,34.8C55.8,49.5,40.1,60.6,22.7,66.8C5.3,72.9,-13.9,74,-30.9,67.3C-48,60.6,-62.9,46,-69.8,28.2C-76.7,10.4,-75.6,-10.7,-67.4,-27.7C-59.3,-44.7,-44.1,-57.6,-28.4,-66.6C-12.8,-75.6,3.3,-80.7,18.8,-77.3C34.3,-73.9,33,-68.7,45.7,-58.3Z" 
            transform="translate(100 100)"
          >
            <animate 
              attributeName="d" 
              dur="6s" 
              repeatCount="indefinite"
              values="
                M45.7,-58.3C58.4,-47.9,67.3,-32.1,70.9,-15.1C74.6,1.9,73,20.1,64.4,34.8C55.8,49.5,40.1,60.6,22.7,66.8C5.3,72.9,-13.9,74,-30.9,67.3C-48,60.6,-62.9,46,-69.8,28.2C-76.7,10.4,-75.6,-10.7,-67.4,-27.7C-59.3,-44.7,-44.1,-57.6,-28.4,-66.6C-12.8,-75.6,3.3,-80.7,18.8,-77.3C34.3,-73.9,33,-68.7,45.7,-58.3Z;
                M52.3,-63.1C66.8,-51.2,77,-33.4,79.5,-14.2C82,5.1,76.8,25.8,65.8,41.7C54.7,57.5,37.8,68.4,19.2,72.9C0.6,77.4,-19.7,75.4,-36.8,66.8C-53.9,58.2,-67.8,42.9,-73.9,24.8C-79.9,6.7,-78.1,-14.2,-69.2,-31.1C-60.3,-48,-44.3,-60.9,-27.4,-67.5C-10.4,-74,7.7,-74.9,25.4,-70.5C43.1,-66.1,37.8,-75,52.3,-63.1Z;
                M38.8,-52.8C50.5,-41.8,60.3,-29.4,65.1,-14.7C69.9,0,69.7,17,62.8,31.2C55.9,45.4,42.3,56.8,26.8,62.9C11.3,69,-6.1,69.8,-22.8,64.8C-39.5,59.8,-55.5,49,-63.7,33.8C-71.9,18.6,-72.3,-1,-66.2,-17.8C-60.1,-34.6,-47.5,-48.6,-33.2,-58.5C-18.9,-68.4,-2.9,-74.2,11.8,-74.3C26.5,-74.4,27.1,-63.8,38.8,-52.8Z;
                M45.7,-58.3C58.4,-47.9,67.3,-32.1,70.9,-15.1C74.6,1.9,73,20.1,64.4,34.8C55.8,49.5,40.1,60.6,22.7,66.8C5.3,72.9,-13.9,74,-30.9,67.3C-48,60.6,-62.9,46,-69.8,28.2C-76.7,10.4,-75.6,-10.7,-67.4,-27.7C-59.3,-44.7,-44.1,-57.6,-28.4,-66.6C-12.8,-75.6,3.3,-80.7,18.8,-77.3C34.3,-73.9,33,-68.7,45.7,-58.3Z
              "
            />
          </path>
        </svg>

        {/* Secondary Fluid Counter-Morphing Layer */}
        <svg viewBox="0 0 200 200" className="absolute w-3/4 h-3/4 animate-[spin_5s_linear_infinite_reverse] opacity-75">
          <path 
            fill="url(#bloobGrad2)" 
            d="M34.2,-48.1C44.7,-38.3,53.8,-26.8,57.7,-13.3C61.6,0.2,60.3,15.7,53.2,28.7C46.1,41.7,33.2,52.2,18.4,56.8C3.6,61.4,-13.1,60.1,-27.6,53.8C-42.1,47.5,-54.4,36.2,-60.8,21.5C-67.2,6.8,-67.7,-11.3,-60.9,-25.9C-54.1,-40.5,-40.1,-51.6,-25.9,-59.2C-11.7,-66.8,2.7,-70.9,15.4,-67.2C28.1,-63.5,23.7,-57.9,34.2,-48.1Z" 
            transform="translate(100 100)"
          >
            <animate 
              attributeName="d" 
              dur="4.5s" 
              repeatCount="indefinite"
              values="
                M34.2,-48.1C44.7,-38.3,53.8,-26.8,57.7,-13.3C61.6,0.2,60.3,15.7,53.2,28.7C46.1,41.7,33.2,52.2,18.4,56.8C3.6,61.4,-13.1,60.1,-27.6,53.8C-42.1,47.5,-54.4,36.2,-60.8,21.5C-67.2,6.8,-67.7,-11.3,-60.9,-25.9C-54.1,-40.5,-40.1,-51.6,-25.9,-59.2C-11.7,-66.8,2.7,-70.9,15.4,-67.2C28.1,-63.5,23.7,-57.9,34.2,-48.1Z;
                M42.8,-54.3C55.4,-44.6,65.7,-31.2,68.9,-16C72.1,-0.8,68.2,16.2,59.5,30.3C50.8,44.4,37.3,55.6,21.7,60.4C6.1,65.2,-11.6,63.6,-27.7,56.9C-43.8,50.2,-58.3,38.4,-64.7,22.7C-71.1,7,-69.4,-12.6,-61.1,-28.3C-52.8,-44,-37.9,-55.8,-22.4,-62.3C-6.9,-68.8,9.2,-70,24.8,-66.2C40.4,-62.4,30.2,-64,42.8,-54.3Z;
                M34.2,-48.1C44.7,-38.3,53.8,-26.8,57.7,-13.3C61.6,0.2,60.3,15.7,53.2,28.7C46.1,41.7,33.2,52.2,18.4,56.8C3.6,61.4,-13.1,60.1,-27.6,53.8C-42.1,47.5,-54.4,36.2,-60.8,21.5C-67.2,6.8,-67.7,-11.3,-60.9,-25.9C-54.1,-40.5,-40.1,-51.6,-25.9,-59.2C-11.7,-66.8,2.7,-70.9,15.4,-67.2C28.1,-63.5,23.7,-57.9,34.2,-48.1Z
              "
            />
          </path>
        </svg>

        {/* Center Minimalist Diamond Brand Symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#DD8560] text-xl font-serif animate-pulse">◇</span>
        </div>
      </div>

      {/* Dynamic Store Name Display Only */}
      <h3 className="font-tenor uppercase tracking-luxury text-sm md:text-base font-extrabold text-neutral-900 dark:text-white">
        {storeName}
      </h3>

    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] bg-[#F7F4F0] dark:bg-slate-950 flex items-center justify-center transition-opacity duration-500">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{content}</div>;
}
