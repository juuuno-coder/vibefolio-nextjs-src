"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Image from 'next/image';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  fill = false,
  width,
  height,
  priority = false,
  fallbackSrc = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  // Sync state with src prop (fix for infinite scroll/stale images)
  useEffect(() => {
    setImgSrc(src);
    setError(false);
  }, [src]);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setError(true);
    }
  };

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  // Check if external URL (not our Supabase)
  const isExternal = imgSrc.startsWith('http') && !imgSrc.includes('supabase.co');

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={className}
        onError={handleError}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
        unoptimized={isExternal}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      onError={handleError}
      priority={priority}
    />
  );
}
