import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Restaurant } from './models/Restaurant';

dotenv.config();

const seedRestaurants = [
  {
    id: '1', name: 'Pizza Palace', rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 30, deliveryFee: 20, priceForTwo: 900, cuisines: ['Pizza', 'Italian'], status: 'Open', reviewCount: 342,
    menu: [
      { id: 'pp1', name: 'Classic Margherita', category: 'Pizzas', price: 450, description: 'Classic tomato sauce, mozzarella, and fresh basil', imageUrl: 'https://images.unsplash.com/photo-1564936281291-294551497d81?auto=format&fit=crop&q=80&w=300', rating: 4.8, spicy: 0, vegetarian: true, inStock: true },
      { id: 'pp2', name: "Devil's Pepperoni", category: 'Pizzas', price: 550, description: 'Spicy pepperoni with double mozzarella and chili flakes', imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=300', rating: 4.7, spicy: 3, vegetarian: false, inStock: true },
      { id: 'pp6', name: 'Cheesy Garlic Bread', category: 'Sides', price: 150, description: 'Toasted baguette with fresh garlic butter', imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&q=80&w=300', rating: 4.6, spicy: 0, vegetarian: true, inStock: true }
    ]
  },
  {
    id: '2', name: 'Burger King', rating: 4.2, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 25, deliveryFee: 30, priceForTwo: 700, cuisines: ['American', 'Fast Food'], status: 'Open', reviewCount: 210,
    menu: [
      { id: 'bk1', name: 'Whopper', category: 'Burgers', price: 350, description: 'Flame-grilled beef patty with juicy tomatoes and fresh lettuce', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300', rating: 4.3, spicy: 0, vegetarian: false, inStock: true },
      { id: 'bk2', name: 'Bacon King', category: 'Burgers', price: 480, description: 'Double beef patty with thick-cut smoked bacon', imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=300', rating: 4.5, spicy: 1, vegetarian: false, inStock: true },
      { id: 'bk3', name: 'Onion Rings', category: 'Sides', price: 120, description: 'Crispy breaded onion rings', imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=300&h=200', rating: 4.2, spicy: 0, vegetarian: true, inStock: true }
    ]
  },
  {
    id: '3', name: 'DimSum House', rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 35, deliveryFee: 10, priceForTwo: 600, cuisines: ['Chinese', 'Asian'], status: 'Open', reviewCount: 189,
    menu: [
      { id: 'ds1', name: 'Shrimp Har Gow', category: 'Dumplings', price: 280, description: 'Translucent dumplings filled with fresh seasoned shrimp', imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=300', rating: 4.8, spicy: 0, vegetarian: false, inStock: true },
      { id: 'ds2', name: 'Szechuan Pork Wontons', category: 'Dumplings', price: 320, description: 'Pork wontons in spicy chili oil and vinegar', imageUrl: 'https://images.unsplash.com/photo-1651783078053-fc9e8f2ed0e3?auto=format&fit=crop&q=80&w=300', rating: 4.7, spicy: 4, vegetarian: false, inStock: true },
      { id: 'ds3', name: 'Egg Fried Rice', category: 'Mains', price: 250, description: 'Classic fried rice with scrambled eggs and scallions', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=300', rating: 4.5, spicy: 0, vegetarian: false, inStock: true }
    ]
  },
  {
    id: '4', name: 'Taco Town', rating: 4.4, imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 20, deliveryFee: 40, priceForTwo: 400, cuisines: ['Mexican'], status: 'Open', reviewCount: 150,
    menu: [
      { id: 'tt1', name: 'Beef Barbacoa Tacos', category: 'Tacos', price: 180, description: 'Slow-cooked beef on corn tortillas with salsa verde', imageUrl: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&q=80&w=300', rating: 4.9, spicy: 2, vegetarian: false, inStock: true },
      { id: 'tt2', name: 'Fish Tacos', category: 'Tacos', price: 220, description: 'Crispy battered cod with chipotle slaw', imageUrl: 'https://images.unsplash.com/photo-1512838243191-e81e8f66f1fd?auto=format&fit=crop&q=80&w=300', rating: 4.6, spicy: 1, vegetarian: false, inStock: true },
      { id: 'tt3', name: 'Loaded Nachos', category: 'Sides', price: 350, description: 'Chips with queso, beans, and fresh jalapeños', imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=300', rating: 4.8, spicy: 1, vegetarian: true, inStock: true }
    ]
  },
  {
    id: '5', name: 'Sushi Zen', rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 45, deliveryFee: 50, priceForTwo: 1200, cuisines: ['Japanese', 'Healthy'], status: 'Closed', reviewCount: 520,
    menu: [
      { id: 'sz1', name: 'Salmon Nigiri', category: 'Sushi', price: 420, description: 'Fresh premium salmon over seasoned rice', imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&q=80&w=300&h=250', rating: 4.9, spicy: 0, vegetarian: false, inStock: true },
      { id: 'sz2', name: 'Dragon Roll', category: 'Special Rolls', price: 650, description: 'Shrimp tempura and cucumber topped with avocado and unagi', imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&q=80&w=300', rating: 4.8, spicy: 0, vegetarian: false, inStock: true }
    ]
  },
  {
    id: '6', name: 'Curry Leaf', rating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 35, deliveryFee: 20, priceForTwo: 800, cuisines: ['Indian'], status: 'Open', reviewCount: 275,
    menu: [
      { id: 'cl1', name: 'Butter Chicken', category: 'Curries', price: 450, description: 'Succulent chicken in a rich, creamy tomato gravy', imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=300', rating: 4.9, spicy: 1, vegetarian: false, inStock: true },
      { id: 'cl2', name: 'Paneer Tikka', category: 'Appetizers', price: 320, description: 'Grilled cottage cheese marinated in spiced yogurt', imageUrl: 'https://images.unsplash.com/photo-1690401767645-595de0e0e5f8?auto=format&fit=crop&q=80&w=300', rating: 4.7, spicy: 2, vegetarian: true, inStock: true }
    ]
  },
  {
    id: '7', name: 'Quick & Questionable', rating: 2.1, imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 15, deliveryFee: 10, priceForTwo: 300, cuisines: ['Fast Food'], status: 'Open', reviewCount: 12,
    menu: [
      { id: 'qq1', name: 'Budget Mystery Box', category: 'Specials', price: 199, description: 'A random assortment of whatever we have left. Risky!', imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&q=80&w=300', rating: 1.8, spicy: 2, vegetarian: false, inStock: true },
      { id: 'qq2', name: 'Oily Fries', category: 'Sides', price: 80, description: 'Extra oily, soft potato strips. No crunch guaranteed.', imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=300', rating: 2.2, spicy: 0, vegetarian: true, inStock: true }
    ]
  },
  {
    id: '8', name: 'Healthy Harvest', rating: 4.3, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 15, deliveryFee: 0, priceForTwo: 600, cuisines: ['Salad', 'Vegan'], status: 'Open', reviewCount: 95,
    menu: [
      { id: 'hh1', name: 'Quinoa Salad Bowl', category: 'Bowls', price: 350, description: 'Protein-packed quinoa with roasted veggies and lemon tahini', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300', rating: 4.7, spicy: 0, vegetarian: true, inStock: true },
      { id: 'hh2', name: 'Avocado Toast', category: 'Breakfast', price: 280, description: 'Sourdough bread with smashed avocado and chili flakes', imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=300', rating: 4.5, spicy: 1, vegetarian: true, inStock: true }
    ]
  },
  {
    id: '9', name: 'Waffle Wonder', rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 25, deliveryFee: 20, priceForTwo: 500, cuisines: ['Breakfast', 'Dessert'], status: 'Open', reviewCount: 310,
    menu: [
      { id: 'ww1', name: 'Classic Belgian Waffle', category: 'Waffles', price: 250, description: 'Fluffy waffle served with maple syrup and butter', imageUrl: 'https://images.unsplash.com/photo-1734772045171-2af52aea78af?auto=format&fit=crop&q=80&w=300', rating: 4.8, spicy: 0, vegetarian: true, inStock: true },
      { id: 'ww2', name: 'Nutella Blast', category: 'Waffles', price: 320, description: 'Waffle topped with Nutella, bananas, and crushed hazelnuts', imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=300', rating: 4.9, spicy: 0, vegetarian: true, inStock: true }
    ]
  },
  {
    id: '10', name: 'Noodle Nirvana', rating: 4.1, imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=800',
    deliveryTime: 30, deliveryFee: 15, priceForTwo: 700, cuisines: ['Asian', 'Japanese'], status: 'Open', reviewCount: 120,
    menu: [
      { id: 'nn1', name: 'Shoyu Ramen', category: 'Ramen', price: 480, description: 'Soy sauce based broth with chicken chashu and soft egg', imageUrl: 'https://images.unsplash.com/photo-1632440722549-692fc6af969e?auto=format&fit=crop&q=80&w=300', rating: 4.6, spicy: 1, vegetarian: false, inStock: true },
      { id: 'nn2', name: 'Spicy Miso Ramen', category: 'Ramen', price: 520, description: 'Fermented bean paste broth with ground spicy pork', imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=300', rating: 4.5, spicy: 3, vegetarian: false, inStock: true }
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string, { dbName: 'foodhub' });
    console.log('Connected to MongoDB. Wiping existing restaurants...');
    await Restaurant.deleteMany({});
    console.log('Seeding 10 restaurants with full menus...');
    await Restaurant.insertMany(seedRestaurants);
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
