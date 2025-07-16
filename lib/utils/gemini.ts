import { GoogleGenerativeAI } from "@google/generative-ai"
import { OUTLINE_PROMPT, LESSON_CONTENT_PROMPT, LESSON_ASSISTANT_PROMPT } from "./prompts"

export async function generateOutline(formData: any, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    tools: [
      { googleSearch: {} } as any
    ],
    generationConfig: {
      responseMimeType: 'text/plain',
    }
  })
  const prompt = OUTLINE_PROMPT(formData)
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  })
  const response = result.response
  const text = response.text()

  let jsonString = text.trim()
  const jsonMatch = jsonString.match(/^```json\n([\s\S]*)\n```$/)
  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1].trim()
  } else {
    const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonObjectMatch) {
      jsonString = jsonObjectMatch[0]
    }
  }
  try {
    const outline = JSON.parse(jsonString);
    // Sort modulesList and lessons by 'order' or 'index'
    if (Array.isArray(outline.modulesList)) {
      outline.modulesList.sort((a: any, b: any) => (a.order ?? a.index ?? 0) - (b.order ?? b.index ?? 0));
      outline.modulesList.forEach((module: any) => {
        if (Array.isArray(module.lessons)) {
          module.lessons.sort((a: any, b: any) => (a.order ?? a.index ?? 0) - (b.order ?? b.index ?? 0));
        }
      });
    }
    return outline;
  } catch (err) {
    console.error("[Gemini Outline] Failed to parse JSON:", err)
    console.error("[Gemini Outline] Raw output:", text)
    throw new Error("Failed to parse outline JSON. Please try again or periksa format output Gemini.")
  }
}

export async function generateLessonContent({ outlineData, module, lesson }: any, apiKey: string, validateAndFixReferences?: (content: string) => Promise<string>) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    tools: [
      { googleSearch: {} } as any
    ],
    generationConfig: {
      responseMimeType: 'text/plain',
      maxOutputTokens: 8192,
      temperature: 0.7,
    }
  })
  const prompt = LESSON_CONTENT_PROMPT({ outlineData, module, lesson })
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
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