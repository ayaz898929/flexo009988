import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateProductDescription = async (productName: string, category: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, catchy, and professional product description for a ${category} product named "${productName}". Keep it under 100 words.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate description.";
  }
};

export const getChatResponse = async (userMessage: string, products: any[]) => {
  try {
    const productContext = products.map(p => `${p.name} (Price: ৳${p.price}, Category: ${p.category})`).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: `You are a helpful shopping assistant for "Flexo Brand", a premium lifestyle store. 
        Available products: ${productContext}. 
        Answer user questions about products, prices, and recommendations. 
        Be polite, professional, and concise. If asked about something not related to the store, politely redirect them to store topics.`,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. How else can I help you?";
  }
};

export const getShoppingRecommendations = async (preferences: string, products: any[]) => {
  try {
    const productContext = products.map(p => `${p.name} (ID: ${p.id}, Category: ${p.category})`).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these preferences: "${preferences}", recommend 3 products from this list: ${productContext}. Return only the IDs of the products as a comma-separated list.`,
    });
    return response.text?.split(",").map(id => id.trim()) || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};
