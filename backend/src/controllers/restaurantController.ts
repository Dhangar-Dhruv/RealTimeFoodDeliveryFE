import { Request, Response } from 'express';
import { Restaurant } from '../models/Restaurant';

export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find().select('-menu'); // keep payload small
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching restaurants' });
  }
};

export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findOne({ id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching restaurant' });
  }
};

export const getRestaurantByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const restaurant = await Restaurant.findOne({ name: decodeURIComponent(name) });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching restaurant' });
  }
};
