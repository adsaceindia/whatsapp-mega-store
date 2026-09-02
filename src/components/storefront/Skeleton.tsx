import React from 'react';
import { InterestingLoader } from './InterestingLoader';

export { InterestingLoader };

// Shimmer background classes
const shimmerClass = "animate-pulse bg-neutral-200 rounded-2xl";

export function SkeletonProductCard() {
  return (
    <div className="group flex flex-col bg-white rounded-3xl border border-neutral-200/50 shadow-xs overflow-hidden h-[460px]">
      {/* Image container */}
      <div className="relative aspect-square w-full bg-neutral-100 flex items-center justify-center p-6 overflow-hidden">
        <div className="w-full h-full bg-neutral-200 animate-pulse rounded-2xl" />
        <div className="absolute top-4 right-4 w-9 h-9 bg-neutral-200/80 rounded-full animate-pulse" />
        <div className="absolute top-4 left-4 w-14 h-6 bg-neutral-200/80 rounded-full animate-pulse" />
        <div className="absolute bottom-3 left-4 w-20 h-5 bg-neutral-200/80 rounded-md animate-pulse" />
      </div>

      {/* Info Section */}
      <div className="p-5 flex flex-col h-full flex-grow text-left">
        {/* Title */}
        <div className="h-5 bg-neutral-200 animate-pulse rounded-md w-3/4 mb-2.5" />
        
        {/* Rating Display */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="w-3.5 h-3.5 bg-neutral-200 animate-pulse rounded-sm" />
            ))}
          </div>
          <div className="w-8 h-3.5 bg-neutral-200 animate-pulse rounded-sm" />
        </div>

        {/* Color/Size indicators placeholder */}
        <div className="min-h-[28px] mb-4 flex items-center gap-1.5">
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 bg-neutral-200 animate-pulse rounded-full" />
            <div className="w-3.5 h-3.5 bg-neutral-200 animate-pulse rounded-full" />
            <div className="w-3.5 h-3.5 bg-neutral-200 animate-pulse rounded-full" />
          </div>
          <div className="flex gap-1.5 ml-2">
            <div className="w-8 h-4.5 bg-neutral-200 animate-pulse rounded-sm" />
            <div className="w-8 h-4.5 bg-neutral-200 animate-pulse rounded-sm" />
          </div>
        </div>

        {/* Price container */}
        <div className="mt-auto">
          <div className="h-6 bg-neutral-200 animate-pulse rounded-md w-1/3 mb-4" />
          
          {/* Button row */}
          <div className="flex gap-2">
            <div className="flex-1 h-9.5 bg-neutral-200 animate-pulse rounded-xl" />
            <div className="flex-1 h-9.5 bg-neutral-200 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="relative rounded-3xl overflow-hidden min-h-[460px] md:min-h-[520px] bg-neutral-100 flex items-center p-8 md:p-16 border border-neutral-200/40 shadow-sm">
      <div className="max-w-xl space-y-4 text-left z-10 w-full">
        <div className="h-4.5 bg-neutral-200 animate-pulse rounded-md w-1/3" />
        <div className="h-12 bg-neutral-200 animate-pulse rounded-xl w-3/4" />
        <div className="h-12 bg-neutral-200 animate-pulse rounded-xl w-1/2" />
        <div className="h-6 bg-neutral-200 animate-pulse rounded-md w-5/6 pt-2" />
        <div className="pt-6 flex gap-4">
          <div className="w-36 h-12 bg-neutral-200 animate-pulse rounded-full" />
          <div className="w-36 h-12 bg-neutral-200/50 animate-pulse rounded-full" />
        </div>
      </div>
      <div className="absolute right-12 bottom-12 top-12 left-1/2 hidden md:block bg-neutral-200 animate-pulse rounded-3xl" />
    </div>
  );
}

export function SkeletonCategoryCircles() {
  return (
    <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-none justify-start md:justify-center">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col items-center flex-shrink-0 space-y-2.5">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-neutral-200 animate-pulse rounded-full border border-neutral-200/40 shadow-xs" />
          <div className="w-14 h-3 bg-neutral-200 animate-pulse rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCategoryBento() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl bg-neutral-50 border border-neutral-100 shadow-sm aspect-square flex flex-col justify-end p-6">
          <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
          <div className="relative z-10 space-y-2">
            <div className="h-4 bg-neutral-300 animate-pulse rounded-md w-1/3" />
            <div className="h-6 bg-neutral-300 animate-pulse rounded-md w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProductDetail() {
  return (
    <div className="w-full py-16 flex items-center justify-center">
      <InterestingLoader message="Loading Product Details..." />
    </div>
  );
}

export function SkeletonQuizLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-lg mx-auto">
      {/* Curation scanning sphere */}
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
        <div className="absolute inset-2 bg-primary/20 rounded-full animate-pulse" />
        <div className="absolute inset-4 bg-primary/35 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin" style={{ animationDuration: '3s' }}>auto_awesome</span>
        </div>
      </div>

      <div className="space-y-3 w-full">
        {/* Pulsing Curation Headline */}
        <div className="h-6 bg-neutral-200 animate-pulse rounded-md w-3/4 mx-auto" />
        {/* Matching items indicators */}
        <div className="h-4 bg-neutral-200 animate-pulse rounded-md w-1/2 mx-auto" />
        
        {/* Tiny cards showing matching items being aligned */}
        <div className="grid grid-cols-3 gap-3 pt-6 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-50 border border-neutral-200/40 p-2.5 rounded-xl flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-neutral-200 animate-pulse rounded-lg" />
              <div className="w-12 h-2.5 bg-neutral-200 animate-pulse rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonPaymentProcessing({ loaderMessage }: { loaderMessage: string }) {
  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center space-y-6 text-center max-w-sm mx-auto">
      {/* Animated secure shield & pulsing wave */}
      <div className="relative w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
        <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
          <span className="material-symbols-outlined text-[28px] animate-pulse">lock</span>
        </div>
      </div>

      <div className="space-y-3 w-full">
        <h4 className="text-base font-bold text-neutral-900">Securing Transaction</h4>
        <p className="text-xs text-primary font-semibold font-mono tracking-wide animate-pulse">{loaderMessage}</p>
        
        {/* Simulated dynamic receipt line items representing payment gateway authentication */}
        <div className="w-full p-4 rounded-2xl bg-neutral-50/75 border border-neutral-200/50 text-left space-y-2.5 mt-4">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-neutral-200 animate-pulse rounded-sm w-1/3" />
            <div className="h-3.5 bg-neutral-200 animate-pulse rounded-sm w-1/4" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-neutral-200 animate-pulse rounded-sm w-1/4" />
            <div className="h-3.5 bg-neutral-200 animate-pulse rounded-sm w-1/5" />
          </div>
          <div className="border-t border-dashed border-neutral-200 pt-2.5 flex justify-between items-center">
            <div className="h-3 bg-neutral-300 animate-pulse rounded-sm w-1/2" />
            <div className="h-4 bg-neutral-300 animate-pulse rounded-sm w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonReviews() {
  return (
    <div className="bg-neutral-50 rounded-3xl p-6 md:p-12 mt-16 border border-outline-variant/15 overflow-hidden text-left relative">
      {/* Title block placeholders */}
      <div className="text-center mb-10 max-w-2xl mx-auto space-y-3 animate-pulse">
        <div className="h-3 bg-neutral-200 rounded-full w-28 mx-auto animate-pulse" />
        <div className="h-8 bg-neutral-200 rounded-md w-3/4 mx-auto animate-pulse" />
        <div className="h-3.5 bg-neutral-200 rounded-md w-1/2 mx-auto animate-pulse" />
      </div>

      {/* Grid of cards mirroring the actual cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between h-[300px]"
          >
            <div>
              {/* Star Rating placeholder */}
              <div className="flex gap-1.5 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="w-3.5 h-3.5 bg-neutral-200 animate-pulse rounded-full" />
                ))}
              </div>

              {/* Comment text lines */}
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-neutral-200 animate-pulse rounded-md w-full" />
                <div className="h-3 bg-neutral-200 animate-pulse rounded-md w-11/12" />
                <div className="h-3 bg-neutral-200 animate-pulse rounded-md w-4/5" />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-4">
              {/* Author info placeholder */}
              <div className="flex items-center justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-neutral-200 animate-pulse rounded-md w-1/3" />
                  <div className="h-2.5 bg-neutral-200 animate-pulse rounded-sm w-1/2" />
                </div>
                <div className="w-12 h-4 bg-neutral-200 animate-pulse rounded-sm" />
              </div>

              {/* Product preview strip placeholder */}
              <div className="flex items-center gap-2.5 bg-neutral-50/75 p-1.5 rounded-xl border border-neutral-200/40">
                <div className="w-8 h-8 bg-neutral-200 animate-pulse rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-2.5 bg-neutral-200 animate-pulse rounded-md w-2/3" />
                  <div className="h-2 bg-neutral-200 animate-pulse rounded-sm w-1/2" />
                </div>
                <div className="w-4 h-4 bg-neutral-100 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


