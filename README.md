# 🥗 NutriTrack - AI Powered Nutrition Tracker

NutriTrack is a full-stack AI-powered nutrition tracking web application that allows users to:

- 📸 Upload food images
- 🤖 Analyze food using Google Gemini AI
- 📊 Track calories and macronutrients
- 👤 Manage personal health profile
- 🎯 Set daily nutrition goals

Built with modern technologies including React (Vite), Supabase, and Google Gemini API.

---

## 🚀 Live Demo

🔗 https://nutri-track-olive.vercel.app/

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Supabase JS Client

### Backend
- Supabase (Auth, Database, Storage)
- Supabase Edge Functions (Deno)
- PostgreSQL

### AI Integration
- Google Gemini API (Gemini 2.5 Flash)

---

## ✨ Features

### 🔐 Authentication
- Email/Password login
- Secure session handling
- Row Level Security (RLS) policies

### 📸 AI Food Analysis
- Upload food image
- Image sent to Gemini API
- Extracts:
  - Food name
  - Serving size
  - Calories
  - Protein
  - Carbohydrates
  - Fats
  - Sugar
  - Sodium
  - Confidence score

### 👤 User Profile
- Update personal information
- Set nutrition goals
- Automatic BMI calculation
- Profile upsert logic

### 📊 Dashboard
- Track food logs
- View nutritional breakdown
- Monitor daily goals

---

## 📂 Project Structure
src/
├── pages/
│ ├── Upload.tsx
│ ├── Dashboard.tsx
│ ├── Profile.tsx
│ └── Login.tsx
│
├── integrations/
│ └── supabase/
│ └── client.ts
│
supabase/
└── functions/
└── analyze-food/
└── index.ts
