import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

import { resolveImage } from '../../utils/formatters'

export default function PhotoGallery({ photos = [], title }) {
  const [index, setIndex] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-tan bg-tan-soft text-ochre md:h-[420px]">
        <div className="text-center">
          <ImageOff size={40} className="mx-auto opacity-60" />
          <p className="mt-2 text-sm text-ink-muted">No photos yet</p>
        </div>
      </div>
    )
  }

  const move = (step) =>
    setIndex((current) => (current + step + photos.length) % photos.length)

  return (
    <div>
      <div className="group relative h-72 overflow-hidden rounded-lg border border-tan bg-tan-soft md:h-[420px]">
        <img
          src={resolveImage(photos[index])}
          alt={`${title} — photo ${index + 1}`}
          className="h-full w-full object-cover"
        />

        {photos.length > 1 && (
          <>
            <GalleryButton side="left" onClick={() => move(-1)}>
              <ChevronLeft size={20} />
            </GalleryButton>
            <GalleryButton side="right" onClick={() => move(1)}>
              <ChevronRight size={20} />
            </GalleryButton>
            <span className="absolute right-3 bottom-3 rounded-full bg-ink/60 px-2.5 py-1 text-xs text-shell">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, position) => (
            <button
              key={photo}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Show photo ${position + 1}`}
              aria-current={position === index}
              className={[
                'h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-base border-2 transition-colors',
                position === index
                  ? 'border-terracotta'
                  : 'border-transparent opacity-70 hover:opacity-100',
              ].join(' ')}
            >
              <img
                src={resolveImage(photo)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GalleryButton({ side, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={`absolute top-1/2 ${
        side === 'left' ? 'left-3' : 'right-3'
      } -translate-y-1/2 cursor-pointer rounded-full bg-shell/90 p-2 text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100`}
    >
      {children}
    </button>
  )
}
