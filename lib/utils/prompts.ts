// Prompt untuk generate course outline dengan Gemini
export const OUTLINE_PROMPT = (formData: any) => `Context:
You are an expert course designer assistant helping a user generate a structured course outline for an online learning platform.

Task:
Generate a detailed course outline based on user input.

Instruction:
Use the provided data to build a JSON structure that represents the course, including title, description, modules, and lessons.

Clarify & Refine:
User has provided:
- Title: ${formData.title}
- Topic: ${formData.topic}
${formData.degree ? `- Degree/Field: ${formData.degree}` : ""}
${formData.difficulty ? `- Difficulty Level: ${formData.difficulty}` : ""}
${formData.duration ? `- Estimated Duration: ${formData.duration}` : ""}
${formData.language ? `- Language: ${formData.language}` : ""}
${formData.video === 'yes' ? "- Include video content suggestions." : ""}
${formData.chapters ? `- Target Number of Chapters/Modules: ${formData.chapters}` : ""}
${formData.goals ? `- Specific Learning Goals:\n${formData.goals}` : ""}

Rule:
- Output must be valid JSON
- Do not include any commentary outside the JSON
- Structure must include:
  - id, title, description, topic, degree, level, duration, language, includeVideo, status, modules, lessons, estimatedHours, createdAt, learningGoals, overview
  - modulesList: Array of modules each with title and lessons (with id, title, duration)
`;

// Prompt untuk generate konten lesson
export const LESSON_CONTENT_PROMPT = ({ outlineData, module, lesson }: any) => `Context:
You are an expert technical writer and subject matter educator helping generate high-quality online course content. The course is part of an AI-powered course platform similar to 101.school.

Task:
Generate a comprehensive, in-depth, and detailed lesson article in Markdown format based on the lesson information provided. The article should be long, thorough, and cover the topic from multiple angles, including background, theory, practical applications, examples, and advanced insights. Expand each section with as much detail as possible. Aim for a length of at least 1500 words if possible.

Instruction:
Use updated knowledge and only include verifiable information with clear structure. Do not include fabricated or unverifiable claims. Use a professional and friendly tone suitable for self-paced learners. Expand on each section with detailed explanations, real-world examples, and practical tips. Go deep into the subject matter and provide advanced insights where appropriate.

Clarify & Refine:
Course Info:
- Title: ${outlineData.title}
- Description: ${outlineData.description}
- Topic: ${outlineData.topic}
- Level: ${outlineData.level}
- Duration: ${outlineData.duration}
- Language: ${outlineData.language}
- Learning Goals: ${outlineData.learningGoals?.join("; ")}

Module Info:
- Title: ${module.title}

Lesson Info:
- Title: ${lesson.title}
- Duration: ${lesson.duration}

Rules:
1. Always fact-check every statement. Avoid hallucinations.
2. If no valid source exists, DO NOT mention the information.
3. Provide citations in format: [1], [2], etc., at relevant points.
4. Include full reference list at the end using valid URLs only.
5. Use proper **Markdown formatting** with the following structure:
   ### Introduction
   - Introduce the topic with relevance and purpose
   ### Basic Concepts
   - Explain theoretical foundations or key ideas
   ### Detailed Explanation
   - Break down main topic into sections
   ### Real-world Examples
   - Provide clear examples or use cases
   ### Code Samples (if applicable)
   - Use fenced code blocks (e.g., \`\`\`python ... \`\`\`)
   ### Best Practices
   - Offer practical tips or dos and don'ts
   ### Common Pitfalls
   - Highlight mistakes to avoid with solutions
   ### Summary
   - Recap important points
   ### References
   - List complete sources like this:
     [1] "Title" - Author - URL
6. Expand each section with as much detail as possible, including background, context, and advanced insights.
7. The article should be as long and comprehensive as possible, aiming for at least 1500 words.

Formatting Notes:
- Use bullet points (- ) or numbered lists (1.) where applicable
- Always use ### for headings and \`\`\` for code blocks
- Do not return text outside the lesson article (no assistant remarks)
`;

// Prompt untuk AI Assistant (chat lesson)
export const LESSON_ASSISTANT_PROMPT = ({ currentLesson, userMessage }: any) => `Context:
You are a helpful AI teaching assistant embedded within an online course platform.

Task:
Assist the user in understanding the current lesson content.

Instruction:
Respond to user questions clearly and accurately, using the lesson content as reference.

Clarify & Refine:
Lesson:
- Title: ${currentLesson.title}
- Description: ${currentLesson.description || "-"}
- Content: ${typeof currentLesson.content === "string" ? currentLesson.content.slice(0, 4000) : ""}

User Question:
${userMessage}

Rules:
- Use the same language as the user's input
- Be concise, accurate, and avoid fabricating information
- If the answer isn't in the content, state it clearly
- Never guess or assume unsupported facts
`;

// Prompt tambahan untuk validasi anti-hallusinasi
export const HALLUCINATION_PREVENTION_PROMPT = ({ courseContent }: any) => `Context:
You are an AI content validator. The following is a generated course lesson that needs to be reviewed for factual accuracy.

Task:
Review and validate the content, checking for hallucination or unverifiable claims.

Instruction:
Highlight and suggest corrections for any part of the text that cannot be supported by reputable sources.

Clarify & Refine:
Course Lesson Content (Markdown):
${courseContent.slice(0, 4000)}

Rules:
- Mark potentially hallucinated facts
- Provide suggestions with source references if possible
- Only allow content that can be supported by valid, trustworthy sources
- Maintain the tone and clarity of the original content
`;

// Tambahkan prompt lain di bawah ini jika ada (misal: prompt untuk lesson, assistant, dsb) 