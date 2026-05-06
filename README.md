# 🚀 Timesheet Management App (Next.js)

This is a **Next.js (App Router)** project for managing weekly timesheets with task tracking, built using:

- ⚡ Next.js 16.2.4
- 🧠 Redux Toolkit 2.11.2 + React Redux 9.2.0
- 🔔 React Toastify 11.1.0
- 🎨 Tailwind CSS 4
- ⚛️ React 19.2.4

## 🔑 Credentials

This app uses a backend API for authentication. You'll need to use valid API credentials to log in. Please refer to your backend documentation for login credentials.

---

## 📦 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

---

### 2️⃣ Install Dependencies

Using npm:

```bash
npm install
```

Or with other package managers:

```bash
yarn install
# or
pnpm install
# or
bun install
```

---

## ▶️ Run the Project

Start the development server:

```bash
npm run dev
```

Now open your browser:

👉 http://localhost:3000

---

## 🧩 Project Setup Details

### ✅ Redux Toolkit Setup

Redux is used for global state management.

- Store is configured using **@reduxjs/toolkit**
- Wrap your app with `Provider` in `app/layout.tsx`

Example:

```tsx
import { Providers } from "@/store/provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

### 🔔 React Toastify Setup

Used for notifications (success, error, etc.)

Install:

```bash
npm install react-toastify
```

Usage:

```tsx
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

toast.success("Task added successfully!");
```

Add in root layout:

```tsx
<ToastContainer />
```

---

## 📁 Project Structure

```bash
app/
  dashboard/
  page.tsx
components/
  ui/
  top-nav.tsx
services/
  auth.ts
  timesheets.ts
store/
  index.ts
  provider.tsx
types/
```

---

## 🛠 Features

- 📅 Weekly timesheet view
- 🎯 Date range picker (dropdown-style) for filtering timesheets
- ➕ Add / Edit / Delete tasks
- 📊 Progress bar (hours tracking)
- 📌 Status:
  - Missing
  - Incomplete
  - Completed

- 🔐 Authentication handling
- 💾 LocalStorage persistence (for entries)

## 🆕 Latest Updates

- **Date Range Picker**: Replaced separate start/end date inputs with a clean dropdown-style selector that shows "Date Range" as placeholder and expands to show both date inputs with a clear button.

---

## ⚙️ Scripts

```bash
npm run dev      # Run development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Lint code
```

---

## 🌐 Deployment

You can deploy easily using:

- Vercel (Recommended)
- Netlify
- Any Node.js hosting

---

## 📚 Learn More

- Next.js Docs: https://nextjs.org/docs
- Redux Toolkit: https://redux-toolkit.js.org
- React Toastify: https://fkhadra.github.io/react-toastify

---

## 👨‍💻 Author

Muhammad Zeeshan Ahsan
