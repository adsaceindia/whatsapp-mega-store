import React, { useState } from 'react';
import { motion } from 'motion/react';

interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function BlurImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  ...props
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Attempt WebP conversion and responsive sizing for external CDNs (like Unsplash)
  const getWebpSrcSet = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('images.unsplash.com')) {
        const baseUrl = new URL(url);
        baseUrl.searchParams.set('fm', 'webp');
        baseUrl.searchParams.set('q', '75');
        
        return `
          ${baseUrl.toString()}&w=400 400w,
          ${baseUrl.toString()}&w=800 800w,
          ${baseUrl.toString()}&w=1200 1200w
        `.trim();
      }
    } catch (e) {
      // ignore
    }
    return '';
  };

  const webpSrcSet = getWebpSrcSet(src);

  return (
    <div className={`relative overflow-hidden w-full h-full bg-neutral-100 dark:bg-slate-900 rounded-[inherit] flex items-center justify-center ${containerClassName}`} id={`blur-image-container-${Math.floor(Math.random() * 1000000)}`}>
      {/* Premium Shimmer Skeleton Background while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-100 dark:bg-slate-900 animate-pulse rounded-[inherit]">
          {/* Wave Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-200/50 dark:via-slate-800/50 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <span className="material-symbols-outlined text-neutral-300 dark:text-slate-800 text-3xl animate-pulse">image</span>
        </div>
      )}

      {/* Low-resolution style placeholder blur block */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 z-[5] blur-2xl scale-110 opacity-70 transition-opacity duration-700 bg-cover bg-center"
          style={{ backgroundImage: `url(${src})`, filter: 'blur(20px)' }}
        />
      )}

      <picture className="w-full h-full flex items-center justify-center">
        {webpSrcSet && (
          <source 
            type="image/webp" 
            srcSet={webpSrcSet} 
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        {/* High-Resolution Main Image */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`transition-all duration-700 ease-out h-full w-full ${className.includes("object-") ? "" : "object-cover"} ${
            isLoaded 
              ? 'opacity-100 blur-0 scale-100' 
              : 'opacity-0 blur-xl scale-105'
          } ${className}`}
          referrerPolicy="no-referrer"
          {...props}
        />
      </picture>
    </div>
  );
}
