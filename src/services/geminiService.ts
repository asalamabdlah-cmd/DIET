/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function estimateFoodCalories(foodDescription: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `分析以下食物描述并估算其营养成分：${foodDescription}. 请返回 JSON 格式。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            weight: { type: Type.STRING, description: "估算的重量，例如 '约 200g'" },
            calories: { type: Type.NUMBER, description: "总热量 (kcal)" },
            carbs: { type: Type.NUMBER, description: "碳水化合物 (g)" },
            protein: { type: Type.NUMBER, description: "蛋白质 (g)" },
            fat: { type: Type.NUMBER, description: "脂肪 (g)" },
          },
          required: ["name", "weight", "calories", "carbs", "protein", "fat"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("AI Estimation Error:", error);
    throw error;
  }
}
