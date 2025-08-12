import { GoogleGenerativeAI } from "@google/generative-ai"
import { OUTLINE_PROMPT, LESSON_CONTENT_PROMPT, LESSON_ASSISTANT_PROMPT } from "./prompts"

// Helper function to generate minimal fallback prerequisites if AI fails
function generateMinimalPrasyarat(tingkat: string): string {
  switch (tingkat) {
    case "Pemula":
      return 'Untuk mengikuti kursus ini, peserta harus memiliki kemampuan menggunakan komputer dasar, minat dalam teknologi dan programming, serta kemampuan membaca dan menulis yang baik. Kemampuan logika dasar dan pemahaman konsep sederhana juga diperlukan.';
    case "Menengah":
      return 'Peserta harus memiliki pemahaman dasar programming dan familiar dengan environment development. Kemampuan logika dan problem solving yang baik, serta pengalaman coding minimal 6 bulan diperlukan untuk mengikuti kursus ini.';
    case "Lanjutan":
      return 'Untuk mengikuti kursus tingkat lanjut ini, peserta harus memiliki pengalaman programming minimal 2 tahun dengan pemahaman mendalam tentang algoritma dan struktur data. Familiar dengan multiple programming languages, pengalaman dengan version control seperti Git, serta kemampuan debugging dan troubleshooting yang solid juga diperlukan.';
    default:
      return 'Untuk mengikuti kursus ini, peserta harus memiliki kemampuan menggunakan komputer dasar, minat dalam teknologi dan programming, serta kemampuan membaca dan menulis yang baik.';
  }
}

// Helper function to ensure prasyarat is always generated and in correct format
function ensurePrasyaratExists(outline: any, formData: any): any {
  // If prasyarat doesn't exist or is empty, generate it
  if (!outline.prasyarat || outline.prasyarat.trim() === '') {
    outline.prasyarat = generateMinimalPrasyarat(
      outline.tingkat || formData.tingkat || "Menengah"
    );
  }
  
  // If prasyarat exists but is in wrong format, convert it
  if (outline.prasyarat) {
    // If it's an array, convert to comma-separated string
    if (Array.isArray(outline.prasyarat)) {
      outline.prasyarat = outline.prasyarat.join(', ');
    }
    // If it's JSON string, parse and convert
    else if (typeof outline.prasyarat === 'string' && outline.prasyarat.startsWith('[')) {
      try {
        const parsed = JSON.parse(outline.prasyarat);
        if (Array.isArray(parsed)) {
          outline.prasyarat = parsed.join(', ');
        }
      } catch (e) {
        outline.prasyarat = generateMinimalPrasyarat(
          outline.tingkat || formData.tingkat || "Menengah"
        );
      }
    }
    // If it's object, convert to default prasyarat
    else if (typeof outline.prasyarat === 'object' && outline.prasyarat !== null) {
      outline.prasyarat = generateMinimalPrasyarat(
        outline.tingkat || formData.tingkat || "Menengah"
      );
    }
  }
  
  return outline;
}

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
  
  // Try to extract JSON from markdown code blocks
  const jsonMatch = jsonString.match(/^```json\n([\s\S]*)\n```$/)
  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1].trim()
  } else {
    // Try to find JSON object in the text
    const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonObjectMatch) {
      jsonString = jsonObjectMatch[0]
    }
  }
  
  try {
    let outline = JSON.parse(jsonString);
    
    // Ensure prasyarat field exists and is in correct format
    outline = ensurePrasyaratExists(outline, formData);
    
    // Sort modulesList and materi by 'order' or 'index'
    if (Array.isArray(outline.modulesList)) {
      outline.modulesList.sort((a: any, b: any) => (a.order ?? a.index ?? 0) - (b.order ?? b.index ?? 0));
      outline.modulesList.forEach((module: any) => {
        if (Array.isArray(module.materi)) {
          module.materi.sort((a: any, b: any) => (a.order ?? a.index ?? 0) - (b.order ?? b.index ?? 0));
        }
      });

      // Enforce requested counts if provided in formData
      const requestedModules = formData && parseInt(formData.jumlah_modul, 10);
      const requestedLessonsPerModule = formData && parseInt(formData.jumlah_materi_per_modul, 10);

      if (!Number.isNaN(requestedModules) && requestedModules > 0) {
        outline.modulesList = outline.modulesList.slice(0, requestedModules);
      }
      if (!Number.isNaN(requestedLessonsPerModule) && requestedLessonsPerModule > 0) {
        outline.modulesList = outline.modulesList.map((module: any) => ({
          ...module,
          materi: Array.isArray(module.materi)
            ? module.materi.slice(0, requestedLessonsPerModule)
            : []
        }));
      }
    }
    return outline;
  } catch (err) {
    console.warn("Failed to parse JSON, trying to create structured outline from text:", err);
    
    // Fallback: Create a structured outline from the text response
    return createStructuredOutlineFromText(text, formData);
  }
}

// Fallback function to create structured outline from text
function createStructuredOutlineFromText(text: string, formData: any) {
  const lines = text.split('\n').filter(line => line.trim());
  const outline: any = {
    judul: formData.judul,
    deskripsi: formData.deskripsi || "",
    topik: formData.topik,
    mata_pelajaran: formData.mata_pelajaran || "",
    tingkat: formData.tingkat || "Menengah",
    durasi: formData.durasi || "",
    bahasa: formData.bahasa || "Indonesia",
    ringkasan: "",
    prasyarat: generateMinimalPrasyarat(formData.tingkat || "Menengah"),
    modulesList: []
  };

  let currentModule: any = null;
  let moduleNumber = 1;
  let lessonNumber = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and common prefixes
    if (!trimmedLine || trimmedLine.startsWith('```') || trimmedLine.startsWith('Context:') || trimmedLine.startsWith('Task:')) {
      continue;
    }

    // Check if this looks like a module title (starts with number and has significant length)
    if (/^\d+\.\s+[A-Za-z]/.test(trimmedLine) && trimmedLine.length > 10) {
      // Save previous module if exists
      if (currentModule) {
        outline.modulesList.push(currentModule);
      }
      
      // Create new module
      currentModule = {
        judul: trimmedLine.replace(/^\d+\.\s+/, ''),
        materi: []
      };
      lessonNumber = 1;
    }
    // Check if this looks like a lesson title (starts with number.number)
    else if (/^\d+\.\d+\.\s+[A-Za-z]/.test(trimmedLine) && currentModule) {
      currentModule.materi.push({
        judul: trimmedLine.replace(/^\d+\.\d+\.\s+/, ''),
        deskripsi: "Deskripsi materi akan diisi saat generate lesson"
      });
      lessonNumber++;
    }
    // Check if this is a description line (starts with "Deskripsi:")
    else if (trimmedLine.startsWith('Deskripsi:') && currentModule && currentModule.materi.length > 0) {
      const lastMateri = currentModule.materi[currentModule.materi.length - 1];
      lastMateri.deskripsi = trimmedLine.replace('Deskripsi:', '').trim();
    }
    // If no module exists yet, create a default one
    else if (!currentModule && trimmedLine.length > 5) {
      currentModule = {
        judul: "Modul 1: Pengenalan",
        materi: []
      };
    }
  }

  // Add the last module if exists
  if (currentModule) {
    outline.modulesList.push(currentModule);
  }

  // If no modules were created, create a basic structure
  if (outline.modulesList.length === 0) {
    outline.modulesList = [{
      judul: "Modul 1: Pengenalan",
      materi: [{
        judul: "1.1 Konsep Dasar",
        deskripsi: "Mempelajari konsep dasar dan fundamental dari topik ini"
      }]
    }];
  }

  // Enforce requested counts if provided in formData
  const requestedModules = formData && parseInt(formData.jumlah_modul, 10);
  const requestedLessonsPerModule = formData && parseInt(formData.jumlah_materi_per_modul, 10);
  if (!Number.isNaN(requestedModules) && requestedModules > 0) {
    outline.modulesList = outline.modulesList.slice(0, requestedModules);
  }
  if (!Number.isNaN(requestedLessonsPerModule) && requestedLessonsPerModule > 0) {
    outline.modulesList = outline.modulesList.map((module: any, idx: number) => {
      let materi = Array.isArray(module.materi) ? module.materi : [];
      // Ensure at least one lesson exists if requested > 0
      if (materi.length === 0 && requestedLessonsPerModule > 0) {
        materi = [{ judul: `1.${idx + 1} Materi`, deskripsi: "Deskripsi materi akan diisi saat generate lesson" }];
      }
      return {
        ...module,
        materi: materi.slice(0, requestedLessonsPerModule)
      };
    });
  }

  // Ensure prasyarat is always present and in correct format
  const finalOutline = ensurePrasyaratExists(outline, formData);

  return finalOutline;
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
    judul: lesson.judul,
    konten: content,
    deskripsi: lesson.deskripsi || "Deskripsi materi pembelajaran"
  }
}

export async function generateLessonAssistant({ currentLesson, userMessage }: any, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" })
  const prompt = LESSON_ASSISTANT_PROMPT({ currentLesson, userMessage })
  const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  return result.response.text().trim()
} 