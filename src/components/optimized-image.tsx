import Image, { ImageProps } from 'next/image';

/**
 * OptimizedImage Component
 * Wrapper around Next.js Image with performance best practices
 * - Automatic lazy loading
 * - Proper sizing and responsive images
 * - Modern image formats (WebP/AVIF)
 * - Priority loading for above-the-fold images
 */

interface OptimizedImageProps extends Omit<ImageProps, 'loading'> {
  /**
   * Set to true for above-the-fold images (hero images, logos)
   * These will be loaded with high priority
   */
  priority?: boolean;
}

export function OptimizedImage({ 
  alt, 
  priority = false,
  quality = 85,
  ...props 
}: OptimizedImageProps) {
  return (
    <Image
      {...props}
      alt={alt}
      quality={quality}
      loading={priority ? undefined : 'lazy'}
      priority={priority}
      placeholder={props.placeholder || 'blur'}
      blurDataURL={
        props.blurDataURL || 
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=='
      }
      // Optimize image formats
      unoptimized={false}
    />
  );
}

/**
 * AvatarImage Component
 * Optimized for profile/avatar images
 */
export function AvatarImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      quality={75}
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
    />
  );
}

/**
 * HeroImage Component  
 * Optimized for large hero/banner images
 */
export function HeroImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority={true}
      quality={90}
      sizes="100vw"
    />
  );
}

/**
 * ThumbnailImage Component
 * Optimized for small thumbnail images
 */
export function ThumbnailImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      quality={75}
      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
    />
  );
}
