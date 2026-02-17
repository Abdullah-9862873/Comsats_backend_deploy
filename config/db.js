const mongoose = require('mongoose');

const globalState = globalThis;

if (!globalState.__mongooseConnection) {
  globalState.__mongooseConnection = {
    conn: null,
    promise: null
  };
}

const cached = globalState.__mongooseConnection;

const connectDB = async () => {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    console.warn('⚠️  MONGO_URI is not defined. Skipping MongoDB connection.');
    return null;
  }

  if (!cached.promise) {
    console.log('🔌 Connecting to MongoDB...');
    console.log('MONGO_URI starts with:', process.env.MONGO_URI.substring(0, 20) + '...');
    
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increased from 5000
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Added connection timeout
      maxPoolSize: 10, // Limit connections for serverless
      bufferCommands: false // Disable buffering for faster errors
    })
      .then((conn) => {
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
        cached.conn = conn;
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        console.error(`❌ MongoDB connection error: ${error.message}`);

        if (error.message.includes('IP') || error.message.includes('whitelist') || error.message.includes('authentication')) {
          console.log(`
🔧 QUICK FIX NEEDED:
1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Click "Add IP Address"
4. Select "Allow Access from Anywhere (0.0.0.0/0)"
5. Save and restart the server

Alternatively, add your current IP to the whitelist.
          `);
        }

        console.log('⚠️  Server will continue running without an active MongoDB connection.');
        return null;
      });
  }

  return cached.promise;
};

module.exports = connectDB;
