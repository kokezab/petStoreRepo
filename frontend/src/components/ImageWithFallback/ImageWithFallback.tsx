import type { ImgHTMLAttributes } from 'react';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
}

export function ImageWithFallback({ fallbackSrc, ...imgProps }: ImageWithFallbackProps) {
  return (
    <img
      {...imgProps}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = fallbackSrc;
      }}
    />
  );
}
