import type { ImgHTMLAttributes } from 'react';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
  alt: string;
}

export function ImageWithFallback({ fallbackSrc, alt, ...imgProps }: ImageWithFallbackProps) {
  return (
    <img
      {...imgProps}
      alt={alt}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = fallbackSrc;
      }}
    />
  );
}
