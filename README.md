# React + TypeScript + ScheduleWise AI Planner

An intelligent scheduling application that helps you plan your week using AI.

## Project Structure

```
.
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── server/        # Backend server code
│   │   ├── api/       # API route handlers
│   │   ├── routes/    # Express routes
│   │   ├── utils/     # Utility functions
│   │   ├── config.ts  # Server configuration
│   │   └── index.ts   # Server entry point
│   └── ...            # Other frontend code
├── env.example        # Example environment variables
└── ...
```

## Features

- AI-powered weekly schedule generation
- Intuitive drag-and-drop interface
- Task prioritization and categorization
- Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/schedulewise-ai-planner.git
   cd schedulewise-ai-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.example .env
   ```
   Edit the `.env` file and add your OpenAI API key.

### Development

To start the development server:

```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run dev:frontend  # Frontend on port 8080
npm run dev:server    # Backend on port 3001
```

### Building for Production

```bash
# Build both frontend and backend
npm run build:all

# Start production server
npm start
```

## Environment Variables

- `VITE_OPENAI_API_KEY` - Your OpenAI API key (required)
- `VITE_SERVER_PORT` - Port for the backend server (default: 3001)
- `VITE_CLIENT_URL` - URL of the frontend (for CORS, default: http://localhost:8080)
- `NODE_ENV` - Environment (development/production)

## API Endpoints

- `POST /api/schedule/generate` - Generate a new schedule
- `GET /api/health` - Health check endpoint

## License

This project is licensed under the MIT License.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
