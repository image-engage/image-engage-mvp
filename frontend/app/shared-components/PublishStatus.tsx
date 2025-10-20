'use client'

import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { PublishStatusProps } from './types'



export default function PublishStatus({
  status,
  isPublishing,
}: PublishStatusProps) {
  if (!isPublishing && status.length === 0) {
    return null
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        {isPublishing ? (
          <>
            <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
            <h3 className="text-lg font-semibold">Publishing...</h3>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Publish Results</h3>
          </>
        )}
      </div>

      <div className="space-y-3">
        {status.map((message, index) => {
          const isError = message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
          const isSuccess = message.toLowerCase().includes('success') || message.toLowerCase().includes('published')
          
          return (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                isError
                  ? 'bg-red-50 border border-red-200'
                  : isSuccess
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {isError ? (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              ) : isSuccess ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              )}
              <p className={`text-sm ${
                isError
                  ? 'text-red-800'
                  : isSuccess
                  ? 'text-green-800'
                  : 'text-blue-800'
              }`}>
                {message}
              </p>
            </div>
          )
        })}
      </div>

      {isPublishing && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Please don't close this page while publishing is in progress...
          </p>
        </div>
      )}
    </div>
  )
}