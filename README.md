# 📸 Sweet Booth - Local Photobooth

A beautifully crafted, modern local photobooth application featuring a high-performance Python (FastAPI) backend and a highly interactive, responsive React (TypeScript & Tailwind CSS) frontend with smooth micro-animations.

---

## 📂 Project Architecture & Directory Structure

The repository is structured as a monorepo containing decoupled backend and frontend environments:

```
local-photobooth/
├── backend/                   # Python FastAPI Backend
│   ├── main.py                # Application entry point with API routes
│   └── requirements.txt       # Python package dependencies
├── frontend/                  # React & Tailwind CSS Frontend
│   ├── index.html             # HTML entry template (to be configured)
│   ├── package.json           # npm configuration and dependencies
│   ├── package-lock.json      # Locked npm dependency tree
│   └── src/                   # React source code
│       ├── main.tsx           # Application bootstrapping
│       ├── app/
│       │   ├── App.tsx        # Main application layout, camera UI & interactions
│       │   └── components/    # Reusable UI component modules
│       │       ├── figma/     # Layout or custom utility components (e.g., ImageWithFallback)
│       │       └── ui/        # Rich atomic UI library (Shadcn-style components)
│       └── styles/            # Styling definitions (globals, theme, fonts, tailwind)
├── .gitignore                 # Configured to ignore IDE, venv, node_modules, and env files
└── README.md                  # Project documentation (this file)
```

---

## 🛠️ Tech Stack & Technologies

### Backend
* **Language:** Python 3
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Modern, fast web framework for building APIs)
* **Server:** [Uvicorn](https://www.uvicorn.org/) (Lightning-fast ASGI server implementation)
* **Validation:** [Pydantic v2](https://docs.pydantic.dev/) (Data validation and settings management)

### Frontend
* **Core:** React 18+ & TypeScript
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Utility-first styling with modern custom CSS variables)
* **Animations:** `motion/react` (Framer Motion for beautiful, fluid transitions and layout morphing)
* **Icons:** [Lucide React](https://lucide.dev/) (Clean and consistent icon library)
* **UI Components:** Customized Shadcn-like components styled using Tailwind CSS and CSS variables.

---

## ⚙️ Core System Details

### 1. Backend (`backend/main.py`)
Provides lightweight REST endpoints:
* `GET /`: Health check / welcome message.
* `GET /api/data`: Returns sample mock dataset.

### 2. Frontend main layout (`frontend/src/app/App.tsx`)
Features a fully interactive interface:
* **Camera View Finder:** Implements `navigator.mediaDevices.getUserMedia` for clean real-time front-facing camera integration. Includes visual fallback messages if camera permissions are blocked.
* **Layout Presets:** Allows users to select layout modes including:
  * *4-Cut Strip* (1x4 vertical photobooth strip)
  * *2x2 Grid* (Square 2x2 collage)
  * *Single Shot* (Large Polaroid-style photo)
  * *3-Cut Strip* (1x3 vertical photobooth strip)
  * *Collage* (Freestyle placement)
* **Interactive Design:** Interactive grid selectors with smooth spring-based highlight animations.

### 3. Comprehensive Styling System (`frontend/src/styles/`)
* **`theme.css`:** Declares HSL/Oklch-based design tokens supporting dynamic **Light** and **Dark** modes. Design variables cover backgrounds, primary/secondary accents, cards, forms, borders, and sidebar states.
* **`tailwind.css`:** Imports the core Tailwind modules and handles component animates.
* **`index.css` & `fonts.css`:** Orchestrates the import flow and configures typography/font hierarchies.

---

## 🚀 Getting Started & Local Development

### 🐍 Setting up the Python Backend

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Uvicorn development server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   * The API docs will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### ⚛️ Setting up the React Frontend

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install node modules:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   Ensure your `package.json` scripts are configured for your bundler (e.g., Vite/Rspack/Next), and then run:
   ```bash
   npm run dev
   ```

---

## 🧩 UI Component Directory (`frontend/src/app/components/ui/`)

The frontend includes a highly customizable, atomic component library:

| Component | Description |
| :--- | :--- |
| `button.tsx` | Standard utility buttons with primary, destructive, outline, and link styles. |
| `card.tsx` | Content containers with support for headers, body content, and footers. |
| `dialog.tsx` / `drawer.tsx` | Dialog boxes, overlays, and drawer drawers for focused workflows. |
| `carousel.tsx` | Swipable picture and item carousel elements. |
| `chart.tsx` | Configured graphics, charts, and visualizations. |
| `aspect-ratio.tsx` | Maintains element aspect ratios across responsive breakpoints. |
| `accordion.tsx` | Collapsible section blocks. |
| `sidebar.tsx` | Highly configurable app sidebar dashboard component. |
| `image-with-fallback.tsx` | Custom fallback wrapper rendering a placeholder SVG on image load failures. |

---

## 🌐 Deploying to Vercel

This repository is pre-configured for seamless deployment to **Vercel** with a unified static frontend and Python serverless function backend.

### Deploying via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy directly from the root directory**:
   ```bash
   vercel
   ```

3. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Deploying via GitHub Integration

1. Import the repository into your Vercel dashboard.
2. Vercel automatically detects `vercel.json` and builds both the React Vite frontend (`frontend/dist`) and the Python FastAPI backend (`api/index.py`).
3. Click **Deploy**!