const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const { createClient } = require('redis');
require('dotenv').config();

// PostgreSQL Connection (Sequelize)
const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
});

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');
    await sequelize.sync();
    console.log('Database tables synced');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

// MongoDB Connection (Mongoose)
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Unable to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Redis Connection
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected');
  } catch (error) {
    console.error('Unable to connect to Redis:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectPostgres,
  connectMongo,
  redisClient,
  connectRedis
};
