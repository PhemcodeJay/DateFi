# DateFi - Crypto Dating Platform

Connect, Match, and Pay with Crypto.

## Features

- User authentication with JWT
- Profile management with photo uploads
- Swipe-based matching system
- Real-time chat with Socket.io
- Subscription tiers (Free, Premium, VIP)
- Crypto payment integration via NowPayments
- Mobile-responsive design

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Payments**: NowPayments API

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- NowPayments API key

## Installation

1. Clone the repository
2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install server dependencies:
   ```bash
   npm run install-all
   ```
   
   Or manually:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

4. Set up environment variables:
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Update `.env` with your values:
   - `PORT` - Server port (default: 5000)
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - Random secret key for JWT
   - `NOWPAYMENTS_API_KEY` - Your NowPayments API key
   - `NOWPAYMENTS_IPN_SECRET_KEY` - NowPayments IPN secret
   - `NOWPAYMENTS_WEBHOOK_URL` - Your webhook URL

5. Start MongoDB

6. Run the application:
   ```bash
   npm run dev
   ```

This will start:
- Backend server on `http://localhost:5000`
- Frontend on `http://localhost:3000`

## Subscription Plans

- **Free**: Basic features (5 messages/day)
- **Premium**: $9.99/month - Unlimited messages, see who liked you
- **VIP**: $19.99/month - All Premium features + profile boost

## Payment Integration

Payments are processed through NowPayments. Users can pay with:
- Bitcoin (BTC)
- Ethereum (ETH)
- USDT
- SOL
- 100+ other cryptocurrencies

## API Endpoints

### Auth
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Profiles
- PUT `/api/profiles/me` - Update profile
- POST `/api/profiles/photo` - Upload photo
- GET `/api/profiles/discover` - Get discoverable profiles
- GET `/api/profiles/:id` - Get user profile

### Matches
- POST `/api/matches/like/:userId` - Like a user
- POST `/api/matches/pass/:userId` - Pass on a user
- GET `/api/matches` - Get all matches
- DELETE `/api/matches/:matchId` - Unmatch

### Messages
- GET `/api/messages/:matchId` - Get messages
- POST `/api/messages/:matchId` - Send message
- PUT `/api/messages/:matchId/read` - Mark as read

### Payments
- POST `/api/payments/create` - Create payment
- GET `/api/payments/history` - Payment history
- GET `/api/payments/status/:paymentId` - Check payment status
- POST `/api/payments/webhook` - NowPayments webhook

## Usage

1. Register a new account
2. Complete your profile setup
3. Start discovering and matching
4. Chat with your matches
5. Upgrade for premium features

## Scripts

- `npm run dev` - Start both server and client
- `npm run server` - Start server only
- `npm run client` - Start client only
- `npm run build` - Build for production
- `npm start` - Start production server

## License

MIT License - feel free to use this project for your own purposes.