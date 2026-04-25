import express from 'express';
import { getRestaurants, getRestaurantById, getRestaurantByName } from '../controllers/restaurantController';

const router = express.Router();

router.get('/', getRestaurants);
router.get('/by-name/:name', getRestaurantByName);
router.get('/:id', getRestaurantById);

export default router;
