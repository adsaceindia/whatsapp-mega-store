import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, ShoppingCart, CheckCircle2, Store, MessageSquare } from 'lucide-react';

interface InterestingLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function InterestingLoader({ message = "Curating Your Store Experience...", fullScreen = false }: InterestingLoaderProps) {
  const [progress, setProgress] = useState(15);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Connecting to store catalog...",
    "Optimizing WhatsApp direct checkout...",
    "Loading exclusive collections...",
    "Preparing your personalized view..."
  ];

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + Math.floor(Math.random() * 15) + 5));
    }, 250);

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 700);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto font-sans relative">
      {/* Background ambient glow */}
      <div className="absolute w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl animate-ping -z-10" style={{ animationDuration: '3s' }} />

      {/* Animated Icon Core */}
      <div className="relative mb-8">
        {/* Outer Rotating Glowing Ring */}
        <div className="w-24 h-24 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin flex items-center justify-center shadow-lg" style={{ animationDuration: '1.2s' }} />
        
        {/* Floating Shopping Bag Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce" style={{ animationDuration: '1.8s' }}>
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Floating Little Badges */}
        <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1.5 rounded-full shadow-md animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="absolute -bottom-1 -left-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md animate-bounce" style={{ animationDelay: '0.4s' }}>
          <MessageSquare className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Dynamic Title */}
      <h3 className="text-lg font-extrabold text-neutral-900 tracking-tight mb-2 flex items-center gap-2">
        <Store className="w-5 h-5 text-emerald-600 inline" />
        WhatsApp Store
      </h3>

      {/* Animated Step Text */}
      <p className="text-xs font-semibold text-emerald-700 h-5 mb-4 animate-fade-in transition-all">
        {steps[stepIndex]}
      </p>

      {/* Progress Bar Container */}
      <div className="w-full bg-neutral-200/80 rounded-full h-2 overflow-hidden mb-3 p-0.5 shadow-inner">
        <div 
          className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Percentage Badge */}
      <div className="flex items-center justify-between w-full text-[11px] font-bold text-neutral-500">
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="w-3 h-3" /> Live Store API
        </span>
        <span>{progress}%</span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] bg-white/95 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{content}</div>;
}
