import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

function getSmartFallbackResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  // Rental-related questions
  if (message.includes('rent') || message.includes('borrow')) {
    return "You can browse available items on our homepage! Use the search bar or filter by category to find what you need. Once you find an item, click 'Reserve Now' to request a rental.";
  }
  
  // Listing questions
  if (message.includes('list') || message.includes('own') || message.includes('sell')) {
    return "To list an item, click 'List Item' in the top navigation. You can add photos, set your price (or use our AI pricing suggestions), and specify availability dates. You'll start earning money when people rent your items!";
  }
  
  // Payment questions
  if (message.includes('pay') || message.includes('money') || message.includes('price')) {
    return "We use Stripe Connect for secure payments. Renters pay when reserving items, and owners receive payouts directly to their bank accounts after rentals complete. Payment is held safely until the rental is approved.";
  }
  
  // Safety/trust questions
  if (message.includes('safe') || message.includes('trust') || message.includes('damage')) {
    return "Lendibl prioritizes safety with our review system, secure payments, and damage protection features. Both renters and owners can rate each other, and we have reporting systems in place for any issues.";
  }
  
  // Location questions
  if (message.includes('location') || message.includes('near') || message.includes('area')) {
    return "You can filter items by location to find rentals near you. We show the general area for privacy, and full addresses are shared only after rental approval for pickup coordination.";
  }
  
  // Categories/items questions
  if (message.includes('category') || message.includes('item') || message.includes('available')) {
    return "We have thousands of items across categories like Tools & Equipment, Electronics, Sports Gear, Outdoor equipment, Vehicles, Home & Garden, and Clothing. Use our search or browse by category to explore!";
  }
  
  // Default helpful response
  return "I'm here to help with Lendibl! You can rent items from neighbors, list your own belongings for income, browse by category, and enjoy secure payments. What would you like to know more about?";
}

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
  } catch (error: any) {
    console.error('Chatbot error:', error);
    
    // Check if it's a quota/rate limit error and provide smart fallback
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return getSmartFallbackResponse(userMessage);
    }
    
    return "I'm having trouble connecting right now. Please try again in a moment, or feel free to contact our support team if you need immediate assistance!";
  }
}