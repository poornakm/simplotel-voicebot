import { addQuery, getQueries } from '../database/db.js';

// Log query to analytics
async function logQuery(queryData) {
  try {
    const query = {
      id: Date.now().toString(),
      message: queryData.message,
      intent: queryData.intent,
      entities: queryData.entities,
      responseTime: queryData.responseTime,
      timestamp: queryData.timestamp,
      success: true
    };
    
    addQuery(query);
    return query;
  } catch (error) {
    console.error('Error logging query:', error);
    throw error;
  }
}

// Get analytics data
async function getAnalytics() {
  try {
    const queries = getQueries();
    
    if (queries.length === 0) {
      return {
        totalQueries: 0,
        avgResponseTime: 0,
        successRate: 100,
        commonIntents: [],
        recentQueries: []
      };
    }
    
    // Calculate total queries
    const totalQueries = queries.length;
    
    // Calculate average response time
    const totalResponseTime = queries.reduce((sum, q) => sum + (q.responseTime || 0), 0);
    const avgResponseTime = Math.round(totalResponseTime / totalQueries);
    
    // Calculate success rate
    const successfulQueries = queries.filter(q => q.success).length;
    const successRate = Math.round((successfulQueries / totalQueries) * 100);
    
    // Get common intents
    const intentCounts = {};
    queries.forEach(q => {
      if (q.intent) {
        intentCounts[q.intent] = (intentCounts[q.intent] || 0) + 1;
      }
    });
    
    const commonIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get recent queries (last 10)
    const recentQueries = queries
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(q => ({
        message: q.message,
        intent: q.intent,
        responseTime: q.responseTime,
        timestamp: q.timestamp
      }));
    
    return {
      totalQueries,
      avgResponseTime,
      successRate,
      commonIntents,
      recentQueries
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
}

// Get conversation history
async function getHistory() {
  try {
    const queries = getQueries();
    
    return queries
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(q => ({
        id: q.id,
        message: q.message,
        intent: q.intent,
        entities: q.entities,
        responseTime: q.responseTime,
        timestamp: q.timestamp,
        success: q.success
      }));
  } catch (error) {
    console.error('Error getting history:', error);
    throw error;
  }
}

// Get analytics by date range
async function getAnalyticsByDateRange(startDate, endDate) {
  try {
    const queries = getQueries();
    
    const filteredQueries = queries.filter(q => {
      const queryDate = new Date(q.timestamp);
      return queryDate >= startDate && queryDate <= endDate;
    });
    
    return calculateAnalytics(filteredQueries);
  } catch (error) {
    console.error('Error getting analytics by date range:', error);
    throw error;
  }
}

// Helper function to calculate analytics from queries
function calculateAnalytics(queries) {
  if (queries.length === 0) {
    return {
      totalQueries: 0,
      avgResponseTime: 0,
      successRate: 100,
      commonIntents: []
    };
  }
  
  const totalQueries = queries.length;
  const totalResponseTime = queries.reduce((sum, q) => sum + (q.responseTime || 0), 0);
  const avgResponseTime = Math.round(totalResponseTime / totalQueries);
  const successfulQueries = queries.filter(q => q.success).length;
  const successRate = Math.round((successfulQueries / totalQueries) * 100);
  
  const intentCounts = {};
  queries.forEach(q => {
    if (q.intent) {
      intentCounts[q.intent] = (intentCounts[q.intent] || 0) + 1;
    }
  });
  
  const commonIntents = Object.entries(intentCounts)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    totalQueries,
    avgResponseTime,
    successRate,
    commonIntents
  };
}

export {
  logQuery,
  getAnalytics,
  getHistory,
  getAnalyticsByDateRange
};