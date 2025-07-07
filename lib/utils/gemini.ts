import { GoogleGenerativeAI } from "@google/generative-ai"
import { OUTLINE_PROMPT, LESSON_CONTENT_PROMPT, LESSON_ASSISTANT_PROMPT } from "./prompts"

export async function generateOutline(formData: any, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" })
  const prompt = OUTLINE_PROMPT(formData)
  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  // Attempt to extract and parse the JSON response from markdown
  let jsonString = text.trim()
  const jsonMatch = jsonString.match(/^```json\n([\s\S]*)\n```$/)
  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1].trim()
  } else {
    // If no markdown block is found, assume the response is plain JSON
    // Optionally, try to extract JSON object
    const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonObjectMatch) {
      jsonString = jsonObjectMatch[0]
    }
  }
  return JSON.parse(jsonString)
}

export async function generateLessonContent({ outlineData, module, lesson }: any, apiKey: string, validateAndFixReferences?: (content: string) => Promise<string>) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: { maxOutputTokens: 8192 },
  })
  const prompt = LESSON_CONTENT_PROMPT({ outlineData, module, lesson })
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    }
  })
  let content = result.response.text().trim()
  // Gunakan seluruh isi markdown, jangan hanya blok kode
  // Validasi dan perbaiki link referensi jika fungsi disediakan
  if (validateAndFixReferences) {
    content = await validateAndFixReferences(content)
  }
  return {
    id: lesson.id,
    title: lesson.title,
    content,
  }
}

export async function generateLessonAssistant({ currentLesson, userMessage }: any, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" })
  const prompt = LESSON_ASSISTANT_PROMPT({ currentLesson, userMessage })
  const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  return result.response.text().trim()
} 