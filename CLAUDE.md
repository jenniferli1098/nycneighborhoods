# NYC Neighborhood Project Guidelines

## Client Commands
- `npm run dev` - Start  dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build

## Server Commands
- `npm run start` - Start server
- `npm run dev` - Start server with nodemon for development

## Code Style

### Client (React/TypeScript)
- **Modules**: ES Modules with explicit imports
- **Components**: Functional components with proper TypeScript interfaces
- **UI Framework**: Material UI with Tailwind CSS
- **State**: React Context API for state management (see AuthContext.tsx)
- **Naming**: PascalCase for components, camelCase for variables/functions

### Server (Node.js/Express)
- **Modules**: CommonJS with require statements
- **Error Handling**: Use `AppError` class for consistent error responses
- **Logging**: Use logger object with levels (info, error, success, debug)
- **Database**: MongoDB with Mongoose for data modeling
- **Routes**: RESTful API design with proper documentation comments

## Project Organization
- **Client**: Component-based architecture with UI components, pages, and contexts
- **Server**: Route-based organization with domain-specific modules
- Follow existing patterns when adding new files or features

## Additional Libraries
- Map Features: Use OpenStreetMap tiles
- Use GeoJSON to render NYC neighborhoods on map
- Use Leaflet to create interactive map of NYC

## Security and Configuration
- Do not assign MONGODB_URI in .js files, instead look and see if the variable is already defined in .env files