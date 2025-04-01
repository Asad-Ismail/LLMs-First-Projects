# CLAUDE.md - Guidelines for Airline Route Ranker

## Build/Run Commands
- **Frontend**: `cd frontend && npm run dev` - Start the SvelteKit development server
- **Frontend Build**: `cd frontend && npm run build` - Build for production
- **Frontend Type Check**: `cd frontend && npm run check` - Run TypeScript checks
- **Backend**: `cd backend && uvicorn app.main:app --reload` - Start the FastAPI backend
- **Backend Install**: `cd backend && pip install -r requrirements.txt` - Install Python dependencies

## Code Style Guidelines
- **TypeScript**: Strict mode enabled. Use strong typing for all variables and functions.
- **Python**: Use type hints (typing module) for function parameters and return values.
- **Naming**: camelCase for JavaScript/TypeScript, snake_case for Python variables/functions.
- **Error Handling**: Use try/catch blocks in frontend, try/except with specific exceptions in Python.
- **Imports**: Group imports by standard library, third-party, and local modules.
- **Frontend Structure**: SvelteKit with Tailwind CSS for styling. Follow component-based architecture.
- **Backend Structure**: FastAPI with proper endpoint versioning (/api/ prefix).
- **Comments**: Use JSDoc for TypeScript functions, docstrings for Python functions.
- **Formatting**: Maintain consistent indentation (2 spaces for TS/JS, 4 spaces for Python).