/**
 * Gemini AI utility functions
 * File ini berisi fungsi-fungsi untuk berinteraksi dengan Google Gemini AI
 * untuk menghasilkan outline kursus, konten pelajaran, dan asisten pembelajaran
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import { OUTLINE_PROMPT, LESSON_CONTENT_PROMPT, LESSON_ASSISTANT_PROMPT } from "./prompts"

/**
 * Menghasilkan outline kursus menggunakan Gemini AI
 * 
 * @param formData - Data form yang berisi informasi kursus
 * @param apiKey - API key untuk Gemini AI
 * @returns Promise object outline kursus
 */
export async function generateOutline(formData: any, apiKey: string) {
  // Inisialisasi Gemini AI client
  const genAI = new GoogleGenerativeAI(apiKey)
  
  // Menggunakan model Gemini 2.0 Flash dengan Google Search tool
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    tools: [
      { googleSearch: {} } as any  // Tool untuk mencari informasi terkini
    ],
    generationConfig: {
      responseMimeType: 'text/plain',
    }
  })
  
  // Membuat prompt berdasarkan data form
  const prompt = OUTLINE_PROMPT(formData)
  
  // Mengirim request ke Gemini AI
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  })
  
  const response = result.response
  const text = response.text()

  // Membersihkan response untuk mengekstrak JSON
  let jsonString = text.trim()
  
  // Mencoba mengekstrak JSON dari markdown code block
  const jsonMatch = jsonString.match(/^```json\n([\s\S]*)\n```$/)
  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1].trim()
  } else {
    // Fallback: mencari object JSON dalam text
    const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonObjectMatch) {
      jsonString = jsonObjectMatch[0]
    }
  }
  
  try {
    // Parse JSON dan sort berdasarkan order/index
    const outline = JSON.parse(jsonString);
    
    // Mengurutkan modulesList berdasarkan order atau index
    if (Array.isArray(outline.modulesList)) {
      outline.modulesList.sort((a: any, b: any) => (a.order ?? a.index ?? 0) - (b.order ?? b.index ?? 0));
      
      // Mengurutkan lessons dalam setiap module
      outline.modulesList.forEach((module: any) => {
        if (Array.isArray(module.lessons)) {
          module.lessons.sort((a: any, b: any) => (a.order ?? a.index ?? 0) - (b.order ?? b.index ?? 0));
        }
      });
    }
    
    return outline;
  } catch (err) {
    throw new Error("Failed to parse outline JSON. Please try again or periksa format output Gemini.")
  }
}

/**
 * Menghasilkan konten pelajaran menggunakan Gemini AI
 * 
 * @param outlineData - Data outline kursus
 * @param module - Data module yang berisi pelajaran
 * @param lesson - Data pelajaran yang akan dibuat kontennya
 * @param apiKey - API key untuk Gemini AI
 * @param validateAndFixReferences - Fungsi opsional untuk validasi dan perbaikan referensi
 * @returns Promise object dengan id, title, dan content pelajaran
 */
export async function generateLessonContent({ outlineData, module, lesson }: any, apiKey: string, validateAndFixReferences?: (content: string) => Promise<string>) {
  // Inisialisasi Gemini AI client
  const genAI = new GoogleGenerativeAI(apiKey)
  
  // Menggunakan model Gemini 2.0 Flash dengan Google Search tool
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    tools: [
      { googleSearch: {} } as any
    ],
    generationConfig: {
      responseMimeType: 'text/plain',
      maxOutputTokens: 8192,  // Maksimal token output
      temperature: 0.7,        // Kreativitas AI (0.0 = sangat fokus, 1.0 = sangat kreatif)
    }
  })
  
  // Membuat prompt berdasarkan outline, module, dan lesson
  const prompt = LESSON_CONTENT_PROMPT({ outlineData, module, lesson })
  
  // Mengirim request ke Gemini AI
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  })
  
  let content = result.response.text().trim()
  
  // Menggunakan seluruh isi markdown, jangan hanya blok kode
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

/**
 * Menghasilkan respons asisten pembelajaran menggunakan Gemini AI
 * 
 * @param currentLesson - Data pelajaran saat ini
 * @param userMessage - Pesan dari user
 * @param apiKey - API key untuk Gemini AI
 * @returns Promise string respons asisten
 */
export async function generateLessonAssistant({ currentLesson, userMessage }: any, apiKey: string) {
  // Inisialisasi Gemini AI client dengan model default
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" })
  
  // Membuat prompt untuk asisten pembelajaran
  const prompt = LESSON_ASSISTANT_PROMPT({ currentLesson, userMessage })
  
  // Mengirim request ke Gemini AI
  const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  
  return result.response.text().trim()
} 