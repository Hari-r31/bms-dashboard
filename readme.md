
# BMS Dashboard

A comprehensive Battery Management System (BMS) Dashboard built with modern web technologies for real-time monitoring and management of battery systems.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Database Setup](#database-setup)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The BMS Dashboard is a full-stack web application designed to provide comprehensive monitoring and management of battery management systems. It features real-time data visualization, system analytics, and management capabilities powered by a Supabase backend.

**Key Capabilities:**
- Real-time battery monitoring
- Performance analytics and reporting
- System configuration management
- User authentication and role-based access
- Responsive UI for desktop and mobile devices

---

## ✨ Features

- 📊 **Real-time Monitoring**: Live dashboard with battery status updates
- 📈 **Analytics & Reporting**: Comprehensive metrics and performance analysis
- 🔐 **Secure Authentication**: User authentication and authorization
- 🎨 **Modern UI**: Responsive design built with Tailwind CSS
- 🔄 **RESTful API Integration**: Seamless backend communication
- 📱 **Mobile Responsive**: Works across all device sizes
- ⚡ **High Performance**: Optimized with Vite and TypeScript

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Tailwind
- **State Management**: React Hooks

### Backend & Database
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time Updates**: Supabase Realtime

### Development Tools
- **Language**: TypeScript
- **Package Manager**: npm
- **CSS Processing**: PostCSS
- **Configuration**: ESLint, Prettier (recommended)

---

## 📁 Project Structure

```
bms-dashboard/
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/               # Page components (routes)
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API and service layer
│   ├── lib/                 # Utility functions and helpers
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── supabase_advanced_schema.sql  # Database schema
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
└── vite-env.d.ts            # Vite environment types

```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Git**
- A **Supabase** account and project
- A modern **web browser**

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Hari-r31/bms-dashboard.git
cd bms-dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

This command installs all required packages listed in `package.json`.

### Step 3: Environment Setup

Copy the example environment file and configure it with your values:

```bash
cp .env.example .env.local
```

---

## ⚙️ Configuration

### Environment Variables

Edit `.env.local` with your configuration values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME=BMS Dashboard
VITE_APP_VERSION=1.0.0
```

**Variable Descriptions:**
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous public key
- `VITE_API_BASE_URL`: Backend API endpoint
- `VITE_APP_NAME`: Application display name
- `VITE_APP_VERSION`: Application version

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or open an existing one
3. Navigate to **Settings** → **API**
4. Copy your **Project URL** and **Anon Key**
5. Paste them into your `.env.local` file

---

## 🎮 Getting Started

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (Vite default port).

### First Time Setup

1. **Initialize Database**: Run the database schema setup
   ```bash
   # Execute supabase_advanced_schema.sql in your Supabase SQL editor
   ```

2. **Create User Account**: Use your Supabase dashboard to create a test user

3. **Access Dashboard**: Navigate to `http://localhost:5173` and log in

---

## 📜 Available Scripts

### Development
```bash
# Start development server with HMR
npm run dev
```

### Production
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Code Quality
```bash
# Type checking (included in build)
npm run build

# Run tests (if configured)
npm run test
```

---

## 🗄️ Database Setup

### Initial Setup

The project includes a comprehensive database schema in `supabase_advanced_schema.sql`.

#### Step-by-Step:

1. **Access Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the sidebar

2. **Create New Query**
   - Click "New Query"
   - Copy the contents of `supabase_advanced_schema.sql`
   - Paste into the SQL editor

3. **Execute Schema**
   - Click "Run" to execute the query
   - Verify all tables are created successfully

### Database Tables

Key tables created:
- `users` - User information and authentication
- `battery_systems` - BMS configurations
- `battery_readings` - Real-time and historical readings
- `alerts` - System alerts and notifications
- `settings` - System configuration

### Migrations

For future database changes:
1. Create new SQL migration files
2. Execute in Supabase SQL Editor
3. Document changes in version control

---

## 🏗️ Architecture

### Component Structure

```
App
├── Layout Components
│   ├── Header/Navigation
│   ├── Sidebar
│   └── Footer
├── Page Components
│   ├── Dashboard
│   ├── Analytics
│   └── Settings
└── Common Components
    ├── Charts
    ├── Cards
    └── Forms
```

### Data Flow

```
UI Components
    ↓
React Hooks (Custom/Built-in)
    ↓
Services Layer (API calls)
    ↓
Supabase Client
    ↓
Backend (Supabase)
```

### Services Layer

Located in `src/services/`:
- `authService.ts` - Authentication operations
- `bmsSservice.ts` - BMS operations
- `dataService.ts` - Data retrieval and management

---

## 🔒 Security

- **Environment Variables**: Never commit `.env.local`
- **Authentication**: All requests require valid user tokens
- **Authorization**: Role-based access control (RBAC)
- **HTTPS**: Always use HTTPS in production
- **CORS**: Configured to allow only authorized domains

---

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Use strict mode for type safety
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Imports**: Organize imports alphabetically

### Best Practices

1. **Keep components small** and focused
2. **Use custom hooks** for reusable logic
3. **Separate concerns** (UI, logic, services)
4. **Add error boundaries** for error handling
5. **Use loading states** for async operations

### File Naming

- Components: `ComponentName.tsx`
- Hooks: `useHookName.ts`
- Services: `serviceName.ts`
- Types: `types.ts`

---

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 5173 (macOS/Linux)
lsof -ti:5173 | xargs kill -9

# Or change Vite port in vite.config.ts
```

#### Dependencies Installation Fails
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Supabase Connection Error
- Verify `VITE_SUPABASE_URL` is correct
- Check `VITE_SUPABASE_ANON_KEY` is valid
- Ensure Supabase project is active

#### Build Errors
```bash
# Clear build cache
rm -rf dist/
npm run build
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.io/docs)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Pull Request Guidelines

- Provide clear description of changes
- Include screenshots for UI changes
- Test thoroughly before submitting
- Follow code style guidelines

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

**Hari-r31** - [GitHub Profile](https://github.com/Hari-r31)

---

## 🆘 Support

If you encounter any issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review existing [GitHub Issues](https://github.com/Hari-r31/bms-dashboard/issues)
3. Create a new issue with detailed information

---

## 📞 Contact

For questions or suggestions, please reach out through:
- GitHub Issues: [Create an Issue](https://github.com/Hari-r31/bms-dashboard/issues)
- GitHub Discussions: [Join Discussion](https://github.com/Hari-r31/bms-dashboard/discussions)

---

**Last Updated**: February 26, 2026  
**Version**: 1.0.0
```