const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const { createClient } = require('redis');
require('dotenv').config();

// PostgreSQL Connection
const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  logging: false,
  dialect: 'postgres',
});

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');
    await sequelize.sync({ alter: true }); // Use alter to add new columns to existing tables
    console.log('Database tables synced');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

// MongoDB Connection
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

// Redis Connection
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
  await redisClient.connect();
  console.log('Redis Connected');
};

module.exports = {
  sequelize,
  connectPostgres,
  connectMongo,
  redisClient,
  connectRedis
};
