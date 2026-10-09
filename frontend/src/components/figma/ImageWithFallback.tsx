import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

// Pide la imagen al tamaño en que se muestra: las miniaturas de Wikimedia (500 o 960 px) y las fotos
// de Unsplash aceptan el ancho en la dirección. Así el celular descarga varias veces menos.
const TAMANOS_WIKIMEDIA = [250, 330, 500, 960, 1280]
export function imagenOptimizada(src: string | undefined, ancho?: number) {
  if (!src || !ancho) return src
  if (/^https:\/\/(thumb|upload)\.wikimedia\.org\/.*\/thumb\/.*\/\d+px-/.test(src)) {
    const t = TAMANOS_WIKIMEDIA.find((x) => x >= ancho) ?? 1280
    return src.replace(/\/\d+px-/, `/${t}px-`)
  }
  if (src.startsWith('https://images.unsplash.com/')) {
    const u = new URL(src)
    u.searchParams.set('w', String(ancho))
    u.searchParams.set('q', '70')
    u.searchParams.set('auto', 'format')
    u.searchParams.delete('fm')
    return u.toString()
  }
  return src
}

export function ImageWithFallback({ ancho, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { ancho?: number }) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

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
    <img src={imagenOptimizada(src, ancho)} alt={alt} className={className} style={style}
      loading="lazy" decoding="async" {...rest} onError={handleError} />
  )
}
