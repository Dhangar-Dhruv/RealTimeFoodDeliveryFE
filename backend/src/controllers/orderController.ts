import { Response } from 'express';
import { Order } from '../models/Order';
import { AuthRequest } from '../middleware/auth';

export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const orderData = { ...req.body, userId };
    const order = new Order(orderData);
    await order.save();

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating order' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Admin checking could go here, but for now we allow the frontend simulation to update it
    const order = await Order.findOneAndUpdate(
      { _id: id, userId: req.user?.id },
      { status },
      { new: true }
    );
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};
