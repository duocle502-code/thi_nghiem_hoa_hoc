import { GoogleGenAI } from "@google/genai";

const MODELS = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];

export async function callGeminiAI(prompt: string, modelIndex = 0): Promise<string | null> {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = MODELS[modelIndex];
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || '';
  } catch (error: any) {
    console.error(`Error with model ${MODELS[modelIndex]}:`, error);
    
    // Fallback logic
    if (modelIndex < MODELS.length - 1) {
      return callGeminiAI(prompt, modelIndex + 1);
    }
    
    throw error;
  }
}

export const SYSTEM_PROMPT = `Bạn là một giáo viên Hóa học ảo thông minh (AI Tutor). 
Nhiệm vụ của bạn là giải đáp các thắc mắc về hóa học, giải thích các phản ứng, 
hướng dẫn thực hiện thí nghiệm và kiểm tra kiến thức của học sinh.
Hãy trả lời bằng tiếng Việt, phong cách thân thiện, dễ hiểu và chính xác về mặt khoa học.
Sử dụng Markdown để định dạng câu trả lời (in đậm, danh sách, phương trình hóa học).`;

export const REACTION_PROMPT = `Bạn là một chuyên gia hóa học. 
Khi tôi cung cấp danh sách các hóa chất, hãy dự đoán phản ứng xảy ra.
Trả về kết quả dưới dạng JSON duy nhất với cấu trúc sau:
{
  "color": "mã màu hex (ví dụ: #ff0000)",
  "bubbles": true/false (có sủi bọt khí không),
  "precipitate": true/false (có kết tủa không),
  "message": "mô tả ngắn gọn hiện tượng bằng tiếng Việt",
  "equation": "phương trình hóa học cân bằng",
  "explanation": "giải thích ngắn gọn cơ chế phản ứng"
}
Nếu không có phản ứng, hãy trả về màu trung bình của các hóa chất và message "Không có phản ứng xảy ra".`;

export async function predictReaction(chemicals: string[]): Promise<any> {
  const prompt = `${REACTION_PROMPT}\n\nDanh sách hóa chất: ${chemicals.join(', ')}`;
  const response = await callGeminiAI(prompt);
  if (!response) return null;
  
  try {
    // Extract JSON from response if it's wrapped in markdown
    const jsonStr = response.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse reaction JSON:", e);
    return null;
  }
}

