import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getChatbotResponse(userMessage: string): Promise<string> {
  try {
    const prompt = `You are lendibot, lendibl's helpful AI assistant. lendibl is a peer-to-peer rental marketplace where people can rent and list items in their community.

Key information about lendibl:
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

Provide a helpful, friendly response about lendibl. Keep it concise but informative. If asked about technical details you're unsure about, suggest contacting support.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are lendibot, lendibl's helpful AI assistant for a peer-to-peer rental marketplace."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return response.choices[0].message.content || "I'm here to help with any questions about Lendibl! Feel free to ask about renting items, listing your belongings, payments, or anything else.";
  } catch (error) {
    console.error('Chatbot error:', error);
    return "I'm having trouble connecting right now. Please try again in a moment, or feel free to contact our support team if you need immediate assistance!";
  }
}