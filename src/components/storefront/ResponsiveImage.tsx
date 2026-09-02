import React, { useState } from 'react';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

export function ResponsiveImage({
  src,
  alt,
  className = '',
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, [src]);

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
    <picture className={`block w-full h-full ${className}`}>
      {webpSrcSet && (
        <source 
          type="image/webp" 
          srcSet={webpSrcSet} 
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-500 w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        referrerPolicy="no-referrer"
        {...props}
      />
    </picture>
  );
}
