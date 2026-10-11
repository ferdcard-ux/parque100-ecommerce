import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

const RESPONSIVE_IMAGE_WIDTHS = [320, 480, 640, 960, 1280]

function getResponsiveSrcSet(src: string | undefined): string | undefined {
  if (!src || !/^https:\/\/images\.(?:unsplash|pexels)\.com\/[^\s]*$/i.test(src)) return undefined

  const url = new URL(src)
  return RESPONSIVE_IMAGE_WIDTHS
    .map((width) => {
      const candidate = new URL(url)
      candidate.searchParams.set('w', String(width))
      return `${candidate.href} ${width}w`
    })
    .join(', ')
}

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement> & { eager?: boolean }) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, srcSet, sizes = '100vw', alt, style, className, eager = false, ...rest } = props
  const responsiveSrcSet = srcSet ?? getResponsiveSrcSet(src)

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img
      src={src}
      srcSet={responsiveSrcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      {...rest}
      onError={handleError}
    />
  )
}
