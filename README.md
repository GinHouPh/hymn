# Hymnal App Monorepo

A comprehensive hymnal application consisting of a mobile app, admin portal, and backend API.

## Project Structure

```
hymn/
├── apps/
│   ├── mobile/          # React Native mobile app (Expo)
│   ├── admin-portal/    # React admin web portal (Vite + TypeScript)
│   └── backend/         # Node.js Express API (TypeScript)
├── package.json         # Root package.json with workspaces
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- npm (>= 9.0.0)
- Expo CLI (for mobile development)

### Installation

1. Clone the repository
2. Install dependencies for all workspaces:
   ```bash
   npm install
   ```

### Development

#### Mobile App
```bash
npm run dev:mobile
```

#### Admin Portal
```bash
npm run dev:admin
```

#### Backend API
```bash
npm run dev:backend
```

### Building

#### Build all applications
```bash
npm run build:mobile
npm run build:admin
npm run build:backend
```

### Testing

#### Run tests for all workspaces
```bash
npm test
```

#### Run linting for all workspaces
```bash
npm run lint
```

## Applications

### Mobile App (`apps/mobile`)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint

### Admin Portal (`apps/admin-portal`)
- **Framework**: React with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (to be configured)
- **Testing**: Jest
- **Linting**: ESLint

### Backend API (`apps/backend`)
- **Framework**: Express.js
- **Language**: TypeScript
- **Testing**: Jest
- **Linting**: ESLint
- **Environment**: dotenv for configuration

## Development Guidelines

1. Each application maintains its own dependencies and configuration
2. Shared dependencies are managed at the root level
3. Follow TypeScript best practices across all applications
4. Maintain consistent code style using ESLint and Prettier
5. Write tests for new features and bug fixes

## Environment Setup

### Backend
Copy `.env.example` to `.env` and configure your environment variables:
```bash
cd apps/backend
cp .env.example .env
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

ISC