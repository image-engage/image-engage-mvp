'use client'

import { JSXElementConstructor, Key, ReactElement, ReactNode, useState } from 'react'
import { Settings, Folder, Tag } from 'lucide-react'
import { PublishConfig } from './types'

interface ConfigurationPanelProps {
  config: PublishConfig
  onConfigChange: (config: PublishConfig) => void
  onLoadPhotos: () => void
}

export default function ConfigurationPanel({
  config,
  onConfigChange,
  onLoadPhotos,
}: ConfigurationPanelProps) {
  const [newTag, setNewTag] = useState('')

  const handleConfigUpdate = (updates: Partial<PublishConfig>) => {
    const newConfig = { ...config, ...updates }
    onConfigChange(newConfig)
  }

  const addTag = () => {
    if (newTag.trim() && !config.tags.includes(newTag.trim())) {
      handleConfigUpdate({
        tags: [...config.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    handleConfigUpdate({
      tags: config.tags.filter((t: string) => t !== tag)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTag()
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary-600" />
        <h2 className="text-xl font-semibold">Configuration</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Drive Folder */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            <Folder className="inline h-4 w-4 mr-2" />
            Google Drive Folder ID
          </label>
          <input
            type="text"
            value={config.folderId}
            onChange={(e) => handleConfigUpdate({ folderId: e.target.value })}
            placeholder="Enter Google Drive folder ID"
            className="input"
          />
          <p className="text-xs text-gray-500">
            Find this in your Google Drive folder URL
          </p>
          <button
            onClick={onLoadPhotos}
            disabled={!config.folderId}
            className="btn-secondary text-sm"
          >
            Load Photos
          </button>
        </div>

        {/* Default Caption */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Default Caption
          </label>
          <textarea
            value={config.caption}
            onChange={(e) => handleConfigUpdate({ caption: e.target.value })}
            placeholder="Enter default caption for posts..."
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            <Tag className="inline h-4 w-4 mr-2" />
            Default Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add tag (without #)"
              className="input flex-1"
            />
            <button
              onClick={addTag}
              className="btn-secondary"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                #{tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Schedule Time */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Schedule Time (Optional)
          </label>
          <input
            type="datetime-local"
            value={config.scheduleTime || ''}
            onChange={(e) => handleConfigUpdate({ scheduleTime: e.target.value || null })}
            className="input"
          />
          <p className="text-xs text-gray-500">
            Leave empty to publish immediately
          </p>
        </div>
      </div>
    </div>
  )
}