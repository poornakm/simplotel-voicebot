import express from 'express';
import cors from 'cors';
//import { json, urlencoded } from 'body-parser';
import { processMessage } from './controllers/nlpController.js';
import { logQuery, getAnalytics, getHistory } from './controllers/analyticsController.js';
import { initialize } from './database/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://simplotel-voicebot.vercel.app', // YOUR Vercel URL here
  'https://*.vercel.app'
];

app.use(express.cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || 
        (origin && origin.match(/\.vercel\.app$/))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initialize();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Simplotel Voice Bot API is running',
    version: '1.0.0',
    endpoints: {
      process: 'POST /api/process',
      analytics: 'GET /api/analytics',
      health: 'GET /api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Process user message
app.post('/api/process', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request. Message is required.' 
      });
    }

    const startTime = Date.now();
    
    // Process the message through NLP
    const result = await processMessage(message);
    
    const responseTime = Date.now() - startTime;
    
    // Log to analytics
    await logQuery({
      message,
      intent: result.intent,
      entities: result.entities,
      responseTime,
      timestamp: new Date()
    });

    res.json({
      response: result.response,
      intent: result.intent,
      entities: result.entities,
      confidence: result.confidence,
      responseTime
    });
    
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your message.',
      details: error.message 
    });
  }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'An error occurred while fetching analytics.',
      details: error.message 
    });
  }
});

// Get conversation history (optional)
app.get('/api/history', async (req, res) => {
  try {
    const history = await getHistory();
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      error: 'An error occurred while fetching history.',
      details: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: {
      process: 'POST /api/process',
      analytics: 'GET /api/analytics',
      health: 'GET /api/health'
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simplotel Voice Bot Server is running on port ${PORT}`);
  console.log(`📊 API Documentation available at http://localhost:${PORT}/`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

export default app;