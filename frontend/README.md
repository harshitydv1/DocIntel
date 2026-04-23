# DocIntel RAG - Frontend

This is the frontend user interface for the DocIntel Retrieval-Augmented Generation (RAG) system. It is built using **React, Vite, and Tailwind CSS v4**.

It provides a premium, glassmorphism-styled interface for users to:
1. Upload PDF and TXT documents.
2. Chat dynamically with an AI (Llama-3) that understands the uploaded documents.

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn

## 🚀 How to Start Locally

1. **Install Dependencies**
   Navigate into the `frontend` folder and install the required npm packages:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Development Server**
   Start the local Vite server:
   ```bash
   npm run dev
   ```
   The application will usually be available at `http://localhost:5173` or `http://localhost:5174`.

## 🌍 Environment Variables for Deployment
If you are deploying this frontend to Vercel or Netlify, you must provide the URL to your deployed backend so the frontend knows where to send the API requests.

Add the following environment variable in your Vercel/Netlify dashboard:
- `VITE_API_URL`: The URL of your deployed backend (e.g., `https://docintel-backend.onrender.com`)
