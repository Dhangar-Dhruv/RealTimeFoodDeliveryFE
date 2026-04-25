import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('FoodHub API is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);

// Database Connection
const mongoURI = process.env.MONGODB_URI as string;

mongoose.connect(mongoURI, { dbName: 'foodhub' })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
