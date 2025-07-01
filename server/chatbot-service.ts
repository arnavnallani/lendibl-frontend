import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChatbotResponse(userMessage: string): Promise<string> {
  try {
    const prompt = `You are Lendibot, Lendibl's helpful AI assistant. Lendibl is a peer-to-peer rental marketplace where people can rent and list items in their community.

Key information about Lendibl:
- Users can browse and rent items from neighbors
- Owners can list their belongings for daily rental rates
- We use Stripe Connect for secure payments and payouts
- AI-powered smart pricing helps owners set competitive rates
- Real-time messaging between renters and owners
- Items include tools, electronics, sporting goods, and more
- Payment is held in escrow until rental is approved
- Owners receive payouts directly to their bank accounts
- Users can filter by category, price, and location
- We have a comprehensive review and rating system

User question: ${userMessage}

Provide a helpful, friendly response about Lendibl. Keep it concise but informative. If asked about technical details you're unsure about, suggest contacting support.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return response.text || "I'm here to help with any questions about Lendibl! Feel free to ask about renting items, listing your belongings, payments, or anything else.";
  } catch (error) {
    console.error('Chatbot error:', error);
    return "I'm having trouble connecting right now. Please try again in a moment, or feel free to contact our support team if you need immediate assistance!";
  }
}