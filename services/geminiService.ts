import { GoogleGenAI, Content, Part } from "@google/genai";
import { ChatMessage } from "../types";

const SYSTEM_INSTRUCTION = `你是一位专业的视觉分析师和乐于助人的助手。
你的目标是准确解读用户提供的图像、图表和艺术作品（包括 ASCII 字符画）。

请遵循以下规则：
1. **语言**：始终使用**简体中文**回答。
2. **ASCII 艺术**：如果用户提供字符画（ASCII Art），请仔细识别其代表的视觉内容（如人物、动物、标志等），不要只把它当作乱码。
3. **风格**：回答要简洁、准确、描述性强。
4. **格式**：使用 Markdown 格式优化排版。
`;

export const streamResponse = async (
  history: ChatMessage[],
  newMessage: string,
  imageAttachment: { data: string; mimeType: string } | null,
  onChunk: (text: string) => void
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("环境变量中缺少 API Key。");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Transform chat history into Gemini 'Content' format
  const contents: Content[] = history.map((msg) => {
    const parts: Part[] = [];
    if (msg.image) {
      // Extract pure base64 if it has the prefix
      const base64Data = msg.image.split(',')[1] || msg.image;
      parts.push({
        inlineData: {
          mimeType: 'image/png', // Assuming png/jpeg for simplicity in history
          data: base64Data,
        },
      });
    }
    if (msg.text) {
      parts.push({ text: msg.text });
    }
    return {
      role: msg.role,
      parts: parts,
    };
  });

  // Construct current message parts
  const currentParts: Part[] = [];
  if (imageAttachment) {
    const base64Data = imageAttachment.data.split(',')[1] || imageAttachment.data;
    currentParts.push({
      inlineData: {
        mimeType: imageAttachment.mimeType,
        data: base64Data,
      },
    });
  }
  currentParts.push({ text: newMessage });

  // Add current message to contents
  contents.push({
    role: 'user',
    parts: currentParts,
  });

  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};