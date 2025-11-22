// In-memory database for demo purposes
// In production, replace with MongoDB, PostgreSQL, or your preferred database

let database = {
  queries: [],
  hotelInfo: {},
  rooms: [],
  bookings: []
};

// Initialize database with sample data
function initialize() {
  database.hotelInfo = {
    name: 'Simplotel Grand Hotel',
    address: 'MG Road, Bangalore, Karnataka 560001, India',
    phone: '+91-80-12345678',
    email: 'info@simplоtelgrand.com',
    website: 'www.simplotelgrand.com',
    description: 'A luxury hotel in the heart of Bangalore, offering world-class amenities and services.',
    amenities: [
      'Free High-Speed WiFi',
      'Swimming Pool',
      '24/7 Fitness Center',
      'Spa & Wellness Center',
      'Multi-Cuisine Restaurant',
      'Bar & Lounge',
      'Conference Rooms',
      'Business Center',
      'Airport Shuttle Service',
      'Valet Parking',
      'Concierge Service',
      'Room Service 24/7',
      'Laundry Service',
      'Travel Desk'
    ],
    checkInTime: '2:00 PM',
    checkOutTime: '11:00 AM'
  };

  database.rooms = [
    {
      id: 'R001',
      type: 'Deluxe Room',
      price: 3500,
      capacity: 2,
      size: '300 sq ft',
      description: 'Comfortable room with modern amenities, perfect for couples',
      amenities: ['King Size Bed', 'City View', 'Work Desk', 'Smart TV', 'Mini Bar'],
      available: 5
    },
    {
      id: 'R002',
      type: 'Executive Suite',
      price: 6500,
      capacity: 3,
      size: '500 sq ft',
      description: 'Spacious suite with separate living area, ideal for business travelers',
      amenities: ['King Size Bed', 'Living Room', 'City View', 'Work Station', 'Smart TV', 'Mini Bar', 'Coffee Maker'],
      available: 3
    },
    {
      id: 'R003',
      type: 'Family Room',
      price: 5000,
      capacity: 4,
      size: '450 sq ft',
      description: 'Perfect for families with extra beds and kid-friendly amenities',
      amenities: ['2 Queen Beds', 'City View', 'Smart TV', 'Mini Fridge', 'Extra Bedding'],
      available: 4
    },
    {
      id: 'R004',
      type: 'Presidential Suite',
      price: 12000,
      capacity: 4,
      size: '1000 sq ft',
      description: 'Luxurious suite with premium amenities and stunning city views',
      amenities: ['Master Bedroom', 'Living Room', 'Dining Area', 'Panoramic View', 'Jacuzzi', 'Butler Service', 'Premium Bar'],
      available: 1
    }
  ];

  console.log('✅ Database initialized with sample hotel data');
}

// Query operations
function addQuery(query) {
  database.queries.push(query);
}

function getQueries() {
  return database.queries;
}

function getQueryById(id) {
  return database.queries.find(q => q.id === id);
}

// Hotel info operations
function getHotelInfo() {
  return database.hotelInfo;
}

function updateHotelInfo(info) {
  database.hotelInfo = { ...database.hotelInfo, ...info };
}

// Room operations
function getRooms() {
  return database.rooms;
}

function getRoomById(id) {
  return database.rooms.find(r => r.id === id);
}

function getRoomByType(type) {
  return database.rooms.find(r => r.type.toLowerCase() === type.toLowerCase());
}

function getAvailableRooms() {
  return database.rooms.filter(r => r.available > 0);
}

function updateRoomAvailability(roomId, available) {
  const room = database.rooms.find(r => r.id === roomId);
  if (room) {
    room.available = available;
    return room;
  }
  return null;
}

// Booking operations
function addBooking(booking) {
  const bookingWithId = {
    ...booking,
    id: `BK${Date.now()}`,
    createdAt: new Date()
  };
  database.bookings.push(bookingWithId);
  
  // Update room availability
  const room = getRoomById(booking.roomId);
  if (room && room.available > 0) {
    room.available -= 1;
  }
  
  return bookingWithId;
}

function getBookings() {
  return database.bookings;
}

function getBookingById(id) {
  return database.bookings.find(b => b.id === id);
}

function cancelBooking(id) {
  const bookingIndex = database.bookings.findIndex(b => b.id === id);
  if (bookingIndex !== -1) {
    const booking = database.bookings[bookingIndex];
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    
    // Restore room availability
    const room = getRoomById(booking.roomId);
    if (room) {
      room.available += 1;
    }
    
    return booking;
  }
  return null;
}

// Analytics operations
function getQueryStatistics() {
  const queries = database.queries;
  
  if (queries.length === 0) {
    return {
      total: 0,
      avgResponseTime: 0,
      intentDistribution: {}
    };
  }
  
  const total = queries.length;
  const totalResponseTime = queries.reduce((sum, q) => sum + (q.responseTime || 0), 0);
  const avgResponseTime = Math.round(totalResponseTime / total);
  
  const intentDistribution = {};
  queries.forEach(q => {
    if (q.intent) {
      intentDistribution[q.intent] = (intentDistribution[q.intent] || 0) + 1;
    }
  });
  
  return {
    total,
    avgResponseTime,
    intentDistribution
  };
}

// Clear data (for testing)
function clearQueries() {
  database.queries = [];
}

function clearBookings() {
  database.bookings = [];
}

function resetDatabase() {
  database = {
    queries: [],
    hotelInfo: {},
    rooms: [],
    bookings: []
  };
  initialize();
}

export{
  initialize,
  addQuery,
  getQueries,
  getQueryById,
  getHotelInfo,
  updateHotelInfo,
  getRooms,
  getRoomById,
  getRoomByType,
  getAvailableRooms,
  updateRoomAvailability,
  addBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  getQueryStatistics,
  clearQueries,
  clearBookings,
  resetDatabase
};