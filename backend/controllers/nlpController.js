import natural from "natural";
const { WordTokenizer, PorterStemmer, BayesClassifier } = natural;
import { getHotelInfo, getRooms } from '../database/db.js';

// Initialize NLP components
const tokenizer = new WordTokenizer();
const stemmer = PorterStemmer;
const classifier = new BayesClassifier();

// Intent patterns and keywords
const intentPatterns = {
  booking: {
    keywords: ['book', 'reserve', 'reservation', 'booking', 'room', 'check in', 'checkin'],
    patterns: ['book a room', 'make a reservation', 'reserve a room']
  },
  availability: {
    keywords: ['available', 'availability', 'vacant', 'free', 'rooms available'],
    patterns: ['rooms available', 'do you have', 'any vacancy']
  },
  pricing: {
    keywords: ['price', 'cost', 'rate', 'rates', 'charge', 'how much', 'pricing'],
    patterns: ['what is the price', 'how much does', 'room rates']
  },
  amenities: {
    keywords: ['amenities', 'facilities', 'services', 'features', 'offer', 'provide'],
    patterns: ['what amenities', 'what facilities', 'what services']
  },
  cancellation: {
    keywords: ['cancel', 'cancellation', 'refund', 'policy'],
    patterns: ['cancel booking', 'cancellation policy', 'refund policy']
  },
  location: {
    keywords: ['location', 'address', 'where', 'directions', 'nearby', 'distance'],
    patterns: ['where is', 'hotel location', 'how to reach']
  },
  checkout: {
    keywords: ['checkout', 'check out', 'leaving', 'departure'],
    patterns: ['check out time', 'checkout policy']
  },
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening'],
    patterns: ['hello', 'hi there']
  },
  help: {
    keywords: ['help', 'assist', 'support', 'guidance'],
    patterns: ['can you help', 'need help']
  },
  roomTypes: {
    keywords: ['deluxe room', 'executive suite', 'family room', 'presidential suite'],
    patterns: ['tell me about the',
      'details of the',
      'information about the',
      'price of the',
      'rate of the',
      'how much is the',
      'describe the']
  }
};

// Entity extraction patterns
const entityPatterns = {
  date: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
  number: /\b\d+\b/g,
  email: /[\w.-]+@[\w.-]+\.\w+/,
  phone: /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/
};

// Train classifier with sample data
function trainClassifier() {
  // Booking intent
  classifier.addDocument('I want to book a room', 'booking');
  classifier.addDocument('Make a reservation', 'booking');
  classifier.addDocument('Reserve a room for two nights', 'booking');
  classifier.addDocument('Book a suite', 'booking');

  // Availability intent
  classifier.addDocument('Do you have rooms available', 'availability');
  classifier.addDocument('Are there any vacant rooms', 'availability');
  classifier.addDocument('Check availability', 'availability');

  // Pricing intent
  classifier.addDocument('What are your room rates', 'pricing');
  classifier.addDocument('How much does a room cost', 'pricing');
  classifier.addDocument('What is the price', 'pricing');
  classifier.addDocument('Room pricing', 'pricing');

  // Amenities intent
  classifier.addDocument('What amenities do you offer', 'amenities');
  classifier.addDocument('What facilities are available', 'amenities');
  classifier.addDocument('Tell me about your services', 'amenities');

  // Cancellation intent
  classifier.addDocument('How can I cancel my booking', 'cancellation');
  classifier.addDocument('Cancellation policy', 'cancellation');
  classifier.addDocument('Can I get a refund', 'cancellation');

  // Location intent
  classifier.addDocument('Where is the hotel located', 'location');
  classifier.addDocument('Hotel address', 'location');
  classifier.addDocument('How to reach', 'location');

  // Greeting intent
  classifier.addDocument('Hello', 'greeting');
  classifier.addDocument('Hi there', 'greeting');
  classifier.addDocument('Good morning', 'greeting');

  // Help intent
  classifier.addDocument('Can you help me', 'help');
  classifier.addDocument('I need assistance', 'help');

  // Room Types intent
  // Room Type intent
  classifier.addDocument('Tell me about the deluxe room', 'roomTypes');
  classifier.addDocument('Give me details of the deluxe room', 'roomTypes');
  classifier.addDocument('What is the price of the deluxe room', 'roomTypes');

  classifier.addDocument('Tell me about the executive suite', 'roomTypes');
  classifier.addDocument('Give me details of the executive suite', 'roomTypes');
  classifier.addDocument('What is the cost of the executive suite', 'roomTypes');

  classifier.addDocument('Tell me about the family room', 'roomTypes');
  classifier.addDocument('Give me details of the family room', 'roomTypes');
  classifier.addDocument('How much is the family room', 'roomTypes');

  classifier.addDocument('Tell me about the presidential suite', 'roomTypes');
  classifier.addDocument('Give me details of the presidential suite', 'roomTypes');
  classifier.addDocument('What is the price of the presidential suite', 'roomTypes');


  classifier.train();
}



// Initialize training
trainClassifier();

// Extract entities from text
function extractEntities(text) {
  const entities = {};

  // Extract dates
  const dateMatch = text.match(entityPatterns.date);
  if (dateMatch) {
    entities.date = dateMatch[0];
  }

  // Extract numbers (could be room numbers, guest count, etc.)
  const numbers = text.match(entityPatterns.number);
  if (numbers) {
    entities.numbers = numbers;
  }

  // Extract email
  const emailMatch = text.match(entityPatterns.email);
  if (emailMatch) {
    entities.email = emailMatch[0];
  }

  // Extract phone
  const phoneMatch = text.match(entityPatterns.phone);
  if (phoneMatch) {
    entities.phone = phoneMatch[0];
  }

  return entities;
}

// Detect intent using multiple methods for better accuracy
function detectIntent(text) {
  const lowercaseText = text.toLowerCase();
  const tokens = tokenizer.tokenize(lowercaseText);

  // Use Bayesian classifier
  const classifierIntent = classifier.classify(lowercaseText);
  const classifications = classifier.getClassifications(lowercaseText);
  const confidence = classifications[0]?.value || 0;

  // Keyword matching for additional confidence
  let maxScore = 0;
  let keywordIntent = classifierIntent;

  for (const [intent, data] of Object.entries(intentPatterns)) {
    let score = 0;
    for (const keyword of data.keywords) {
      if (lowercaseText.includes(keyword)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      keywordIntent = intent;
    }
  }

  // Combine results - prefer keyword matching if it has a strong match
  const finalIntent = maxScore >= 2 ? keywordIntent : classifierIntent;

  return { intent: finalIntent, confidence };
}

// Generate response based on intent
async function generateResponse(intent, entities, originalMessage) {
  // Get hotel data from database
  const hotelInfo = getHotelInfo();
  const rooms = getRooms();

  let response = '';


  switch (intent) {
    case 'greeting':
      response = `Hello! Welcome to ${hotelInfo.name}. I'm your virtual assistant. How can I help you today? You can ask about room bookings, availability, pricing, amenities, or our location.`;
      break;

    case 'booking':
      response = `I'd be happy to help you book a room at ${hotelInfo.name}! We have several room types available:\n\n`;
      rooms.forEach(room => {
        if (room.available > 0) {
          response += `${room.type} - ₹${room.price} per night (${room.available} available)\n`;
        }
      });
      response += `\nTo complete your booking, please provide:\n- Check-in and check-out dates\n- Number of guests\n- Room preference\n\nYou can also call us at ${hotelInfo.phone} or email ${hotelInfo.email}`;
      break;

    case 'availability':
      const availableRooms = rooms.filter(r => r.available > 0);
      if (availableRooms.length > 0) {
        response = `Yes! We currently have the following rooms available:\n\n`;
        availableRooms.forEach(room => {
          response += `✓ ${room.type}: ${room.available} rooms available at ₹${room.price}/night\n`;
        });
        response += `\nWould you like to make a reservation?`;
      } else {
        response = `I apologize, but we're currently fully booked. However, I can help you with:\n- Joining our waitlist\n- Checking availability for alternative dates\n- Recommending nearby partner hotels\n\nWhen would you like to visit?`;
      }
      break;

    case 'pricing':
      response = `Here are our current room rates at ${hotelInfo.name}:\n\n`;
      rooms.forEach(room => {
        response += `${room.type}:\n- ₹${room.price} per night\n- ${room.description}\n\n`;
      });
      response += `Note: Rates may vary based on season and availability. Special discounts available for:\n- Extended stays (7+ nights)\n- Corporate bookings\n- Advance bookings (30+ days)\n\nWould you like to know more about any specific room type?`;
      break;

    case 'amenities':
      response = `${hotelInfo.name} offers a wide range of amenities to make your stay comfortable:\n\n`;
      hotelInfo.amenities.forEach(amenity => {
        response += `✓ ${amenity}\n`;
      });
      response += `\nAll rooms include:\n- Complimentary WiFi\n- Air conditioning\n- 24/7 room service\n- Daily housekeeping\n\nIs there a specific amenity you'd like to know more about?`;
      break;

    case 'cancellation':
      response = `Our cancellation policy at ${hotelInfo.name}:\n\n`;
      response += `✓ Free cancellation up to 48 hours before check-in\n`;
      response += `✓ 50% refund for cancellations between 24-48 hours\n`;
      response += `✓ No refund for cancellations within 24 hours of check-in\n`;
      response += `✓ Full refund in case of emergencies (documentation required)\n\n`;
      response += `To cancel your booking:\n1. Call us at ${hotelInfo.phone}\n2. Email us at ${hotelInfo.email}\n3. Use the booking reference number\n\n`;
      response += `Need to cancel a booking?`;
      break;

    case 'location':
      response = `${hotelInfo.name} is located at:\n\n`;
      response += `📍 ${hotelInfo.address}\n\n`;
      response += `We're conveniently located near:\n`;
      response += `- City center: 2 km\n`;
      response += `- Airport: 15 km\n`;
      response += `- Railway station: 3 km\n`;
      response += `- Major shopping areas: 1 km\n\n`;
      response += `Contact us:\n📞 ${hotelInfo.phone}\n📧 ${hotelInfo.email}\n\n`;
      response += `Would you like directions or transportation assistance?`;
      break;

    case 'checkout':
      response = `Check-out information for ${hotelInfo.name}:\n\n`;
      response += `⏰ Standard check-out time: 11:00 AM\n`;
      response += `⏰ Late check-out available until 2:00 PM (subject to availability, additional charges may apply)\n\n`;
      response += `Before check-out:\n`;
      response += `✓ Return all room keys\n`;
      response += `✓ Clear any outstanding bills\n`;
      response += `✓ Check for personal belongings\n\n`;
      response += `Express check-out available! Just drop your key at the reception.\n\n`;
      response += `Need a late check-out or have questions about your bill?`;
      break;

    case 'help':
      response = `I'm here to help! I can assist you with:\n\n`;
      response += `🏨 Room Bookings & Reservations\n`;
      response += `📅 Check Availability\n`;
      response += `💰 Pricing & Special Offers\n`;
      response += `🎯 Hotel Amenities & Services\n`;
      response += `📍 Location & Directions\n`;
      response += `❌ Cancellation Policy\n`;
      response += `⏰ Check-in/Check-out Times\n\n`;
      response += `Simply ask me anything, or choose a topic you'd like to know more about!`;
      break;

    case 'roomTypes':
      response = `Here are the room types available at ${hotelInfo.name}:\n\n`;

      rooms.forEach(room => {
        response += `🏨 *${room.type}*\n`;
        response += `• Price: ₹${room.price} per night\n`;
        response += `• Capacity: ${room.capacity} guests\n`;
        response += `• Size: ${room.size}\n`;
        response += `• Description: ${room.description}\n`;
        response += `• Available: ${room.available} rooms\n\n`;
      });

      response += `If you'd like details about a specific room, you can ask:\n`;
      response += `- "Tell me about the Deluxe Room"\n`;
      response += `- "How much is the Executive Suite?"\n`;
      response += `- "What facilities does the Family Room have?"\n\n`;
      response += `Which room would you like to know more about?`;
      break;

    default:
      response = `Thank you for your query! I understand you're asking about "${originalMessage}". `;
      response += `While I can help with bookings, availability, pricing, amenities, and general hotel information, `;
      response += `I'd be happy to connect you with our staff for more specific requests.\n\n`;
      response += `You can reach us at:\n📞 ${hotelInfo.phone}\n📧 ${hotelInfo.email}\n\n`;
      response += `Is there anything else I can help you with?`;
  }

  return response;
}

// Main processing function
async function processMessage(message) {
  try {
    // Detect intent
    const { intent, confidence } = detectIntent(message);

    // Extract entities
    const entities = extractEntities(message);

    // Generate response
    const response = await generateResponse(intent, entities, message);

    return {
      intent,
      entities,
      confidence,
      response
    };
  } catch (error) {
    console.error('Error in NLP processing:', error);
    throw error;
  }
}

export {
  processMessage,
  detectIntent,
  extractEntities
};