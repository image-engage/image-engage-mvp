'use client'

import { useState } from 'react'
import { Check, Eye, Calendar } from 'lucide-react'
import { Photo } from './types'

interface PhotoGalleryProps {
  photos: Photo[]
  selectedPhotos: string[]
  onSelectionChange: (selected: string[]) => void
}

export default function PhotoGallery({
  photos,
  selectedPhotos,
  onSelectionChange,
}: PhotoGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'selected'>('all')

  const filteredPhotos = photos.filter(photo => {
    if (filter === 'completed') return photo.status === 'completed'
    if (filter === 'selected') return selectedPhotos.includes(photo.id)
    return true
  })

  const toggleSelection = (photoId: string) => {
    const isSelected = selectedPhotos.includes(photoId)
    if (isSelected) {
      onSelectionChange(selectedPhotos.filter(id => id !== photoId))
    } else {
      onSelectionChange([...selectedPhotos, photoId])
    }
  }

  const selectAll = () => {
    const completedPhotos = filteredPhotos
      .filter(photo => photo.status === 'completed')
      .map(photo => photo.id)
    onSelectionChange(completedPhotos)
  }

  const clearSelection = () => {
    onSelectionChange([])
  }

  if (photos.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500">No photos loaded. Configure a folder and click "Load Photos" to get started.</p>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Photo Gallery ({filteredPhotos.length})
          </h2>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="select text-sm"
          >
            <option value="all">All Photos</option>
            <option value="completed">Completed Only</option>
            <option value="selected">Selected Only</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={selectAll} className="btn-secondary text-sm">
            Select All Completed
          </button>
          <button onClick={clearSelection} className="btn-secondary text-sm">
            Clear Selection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all ${
              selectedPhotos.includes(photo.id)
                ? 'ring-2 ring-primary-500 ring-offset-2'
                : 'hover:shadow-lg'
            }`}
            onClick={() => toggleSelection(photo.id)}
          >
            <div className="aspect-square relative">
              <img
                src={photo.thumbnailUrl}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              
              {/* Status indicator */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                photo.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {photo.status}
              </div>

              {/* Selection indicator */}
              {selectedPhotos.includes(photo.id) && (
                <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium text-center px-2">
                    {photo.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Photo info */}
            <div className="p-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {photo.name}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(photo.modifiedTime).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}