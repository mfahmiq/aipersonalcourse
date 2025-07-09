import React, { useState, useRef } from 'react'

export default function GeminiTestPage() {
  const [outlineData, setOutlineData] = useState('{\n  "title": "Test Course",\n  "description": "A test course.",\n  "topic": "AI",\n  "level": "Beginner",\n  "duration": "1h",\n  "language": "English",\n  "learningGoals": ["Goal 1"]\n}')
  const [module, setModule] = useState('{\n  "title": "Module 1"\n}')
  const [lesson, setLesson] = useState('{\n  "title": "Lesson 1",\n  "duration": "10m"\n}')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)

  const handleStart = async () => {
    setOutput('')
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlineData: JSON.parse(outlineData),
          module: JSON.parse(module),
          lesson: JSON.parse(lesson),
        }),
      })
      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunk = decoder.decode(value)
          setOutput(prev => prev + chunk)
          console.log('[GeminiTestPage Stream Chunk]', chunk)
          // Auto-scroll to bottom
          setTimeout(() => {
            if (outputRef.current) {
              outputRef.current.scrollTop = outputRef.current.scrollHeight
            }
          }, 0)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Gemini Streaming Test</h1>
      <div className="mb-4">
        <label className="font-semibold">outlineData (JSON):</label>
        <textarea className="w-full border rounded p-2 mt-1 text-sm" rows={6} value={outlineData} onChange={e => setOutlineData(e.target.value)} />
      </div>
      <div className="mb-4">
        <label className="font-semibold">module (JSON):</label>
        <textarea className="w-full border rounded p-2 mt-1 text-sm" rows={3} value={module} onChange={e => setModule(e.target.value)} />
      </div>
      <div className="mb-4">
        <label className="font-semibold">lesson (JSON):</label>
        <textarea className="w-full border rounded p-2 mt-1 text-sm" rows={3} value={lesson} onChange={e => setLesson(e.target.value)} />
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded font-semibold mb-4" onClick={handleStart} disabled={loading}>
        {loading ? 'Generating...' : 'Start Streaming'}
      </button>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div ref={outputRef} className="border rounded p-3 bg-gray-50 h-64 overflow-y-auto whitespace-pre-wrap text-sm">
        {output || (loading ? 'Waiting for output...' : 'Output will appear here.')}
      </div>
    </div>
  )
} 