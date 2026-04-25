# Food Delivery Platform: RealTimeFoodDelivery

A full-stack real-time food delivery application where users can browse food items, manage their cart, save addresses, choose payment options, and place orders.

## Features

### Frontend
- **Landing Page**: Navigation to menu and cart, showcasing the platform.
- **Menu Page**: 
  - Displays food items with details (veg/non-veg, spicy levels).
  - Filtering by categories.
  - Fuzzy Search functionality.
- **Cart Page**:
  - Review selected items, quantities, and calculated prices.
  - Subtotal, taxes, surge fees, and delivery charges breakdown.
- **Checkout Page**:
  - Secure address input with validations.
  - Payment options: Cash, Card (Luhn Algorithm validation), and Wallet.
- **Authentication**: User login and profile management.
- **Order History**: Track past orders.

### Backend
- **RESTful API**: Built with Node.js and Express.
- **Database**: MongoDB (Mongoose) for storing users, restaurants, menus, and orders.
- **Authentication**: JWT-based secure authentication and bcrypt for password hashing.
- **Seeding**: Script to populate the database with initial restaurant and menu data.

## Technologies Used
- **Frontend**: HTML5, Vanilla TypeScript/JavaScript, Bootstrap 5, Vite.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: MongoDB Atlas.
- **Security**: JWT, bcryptjs.

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB connection string (Atlas or Local)

### 1. Clone the Repository
```bash
git clone <repository_url>
cd RealTimeFoodDeliveryFE
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and configure environment variables.
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory with your configuration:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```
Seed the database with initial data and start the development server:
```bash
npm run seed
npm run dev
```

### 3. Frontend Setup
Open a new terminal and navigate to the root directory. Install dependencies and start the Vite development server.
```bash
npm install
npm run dev
```

## Algorithms Used
- **Filtering**: Dynamic category and preference filtering on the frontend.
- **Luhn Algorithm**: Used for credit card validation during checkout.
- **Fuzzy Search**: Implemented on the frontend to match user search queries effectively.

## Developer
**Dhangar Dhruv Kishorbhai**
