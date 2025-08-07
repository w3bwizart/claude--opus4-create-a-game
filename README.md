# Note from the author

This is just a workflow I am just trying out, since now Opus 4 (and now Opus 4.1) can handle this type of thing, so it's what I used for this project:

I started with the file `.claude/agents/meta-agent.md` and used that to generate the other agents by asking "please create a react expert agent", "please create a deep research expert", ...

I then used claude code to manually assign them all the correct tools (read/write files, execute commands, use context7 MCP for docs) and once I had all of them, I asked to set up the project based on the PDF that I put in the "assignment" folder and the image from the PDF that I screenshotted.
That can be found in `1_initial_prompt.md`.

Then, I basically just copy/pasted errors into claude until I had a running application (I guess I could have set up the playwright MCP and automated this) - this can be seen in `2_fixing_import_errors.md`.

And at last, I told Claude to run the Uncle Bob subagent to make sure the code was clean, and told it to update the readme with all the info - this can be seen in `3_uncle_bob.md`.


# Whack-a-Mole Game

A modern, production-ready implementation of the classic Whack-a-Mole arcade game built with React, TypeScript, and Redux Toolkit. Features clean architecture, comprehensive testing, and follows Clean Code principles.

## Features

- **3x4 Grid Game Board**: 12 mole holes for exciting gameplay
- **Real-time Score Tracking**: Instant score updates with every successful whack
- **2-Minute Timer**: Fast-paced gameplay with countdown timer
- **Three Difficulty Levels**:
  - Easy: Slower moles (1500ms), 5 points per hit
  - Medium: Normal speed (1000ms), 10 points per hit  
  - Hard: Faster moles (600ms) with multiple active, 15 points per hit
- **Persistent Leaderboard**: Top 10 high scores with backend API
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Full Accessibility**: Keyboard navigation, ARIA labels, and screen reader support
- **Smooth Animations**: CSS-based transitions for optimal performance

## Tech Stack

### Frontend
- React 19 with TypeScript
- Redux Toolkit for state management
- Vite for build tooling
- CSS for styling with animations
- React Testing Library & Vitest for testing

### Backend
- Express.js server
- In-memory data storage (can be replaced with database)
- RESTful API for leaderboard

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+
- Modern browser with ES6+ support

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd whack-a-mole
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

Configure the following in `.env`:
```
VITE_API_URL=http://localhost:3001/api
PORT=3001
```

### Running the Application

#### Development Mode

Start both frontend and backend concurrently:
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api-docs (if configured)

Or run them separately:
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

#### Production Build
```bash
# Build the application
npm run build

# Preview production build
npm run preview

# Start production server
npm start
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Architecture & Project Structure

### Clean Architecture Design
The project follows Clean Code principles with clear separation of concerns:

```
whack-a-mole/
├── src/                    # Frontend application
│   ├── components/         # React UI components (Presentation Layer)
│   │   ├── GameBoard/      # Main game board component
│   │   ├── Mole/          # Individual mole with animations
│   │   ├── ScoreDisplay/   # Score tracking display
│   │   ├── Timer/         # Countdown timer component
│   │   ├── GameControls/   # Start/pause/difficulty controls
│   │   ├── Leaderboard/    # High scores display
│   │   └── HammerCursor/   # Custom cursor component
│   ├── store/             # Redux state management (Application Layer)
│   │   ├── store.ts       # Store configuration
│   │   └── slices/        # Feature-based slices
│   │       ├── gameSlice.ts       # Game state logic
│   │       └── leaderboardSlice.ts # Leaderboard state
│   ├── hooks/             # Custom React hooks (Business Logic)
│   │   ├── useGameLogic.ts    # Core game mechanics
│   │   └── useTypedRedux.ts   # Typed Redux hooks
│   ├── services/          # External API services (Infrastructure)
│   │   └── leaderboardService.ts  # API communication
│   ├── types/             # TypeScript type definitions
│   │   └── game.types.ts  # Shared type interfaces
│   ├── test/              # Test configuration
│   │   ├── setup.ts       # Test environment setup
│   │   └── testUtils.tsx  # Testing utilities
│   └── App.tsx            # Root application component
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── server.ts      # Express server setup
│   │   ├── routes/        # API route handlers
│   │   └── middleware/    # Express middleware
│   └── types/             # Backend TypeScript types
├── public/                # Static assets
│   └── vite.svg          # Application icon
├── .env.example          # Environment variables template
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint rules
└── package.json          # Project dependencies
```

### Key Design Patterns

1. **Redux Toolkit Pattern**: Centralized state management with slices
2. **Custom Hooks**: Encapsulated business logic separated from UI
3. **Component Composition**: Small, focused components with single responsibilities
4. **Service Layer**: API calls abstracted into service modules
5. **Type Safety**: Full TypeScript coverage with strict mode

## Game Rules

1. Click "Start Game" to begin
2. Click on moles as they pop up from holes
3. Each successful hit increases your score
4. Avoid clicking empty holes or already-whacked moles
5. Game ends after 2 minutes
6. Submit your name to the leaderboard if you get a high score!

## API Endpoints

### GET /api/leaderboard
Returns the top 10 players sorted by score.

### POST /api/leaderboard
Submit a new score to the leaderboard.

Request body:
```json
{
  "name": "Player Name",
  "score": 100
}
```

### GET /api/health
Health check endpoint.

## Technical Implementation Details

### State Management Architecture
The application uses Redux Toolkit for predictable state management:

**Game Slice** (`gameSlice.ts`):
- Manages active moles array with position and timing
- Tracks current score and high score
- Controls game status (idle, playing, ended)
- Handles difficulty settings and their multipliers
- Implements game timer countdown logic

**Leaderboard Slice** (`leaderboardSlice.ts`):
- Manages top 10 scores with async thunks
- Handles API loading and error states
- Implements optimistic updates for better UX
- Caches leaderboard data to reduce API calls

### Component Design Philosophy
Following Clean Code principles:

1. **Single Responsibility**: Each component has one clear purpose
2. **Pure Components**: UI components receive props and render JSX
3. **Logic Extraction**: Business logic lives in custom hooks
4. **Type Safety**: Full TypeScript coverage with strict null checks
5. **Testability**: All components have corresponding test files

### Performance Optimizations

1. **Rendering Optimization**:
   - React.memo for expensive components
   - useCallback for event handlers
   - useMemo for computed values
   - Key-based reconciliation for lists

2. **Animation Performance**:
   - CSS transforms instead of position changes
   - GPU-accelerated transitions
   - RequestAnimationFrame for smooth updates
   - Will-change hints for browser optimization

3. **Bundle Optimization**:
   - Code splitting with React.lazy
   - Tree shaking with Vite
   - Minification and compression
   - Efficient asset loading

### Testing Strategy

- **Unit Tests**: Components, hooks, and utilities
- **Integration Tests**: Redux slices and API services  
- **Coverage Goals**: >80% for critical paths
- **Test Tools**: Vitest, React Testing Library, MSW

### Security Considerations

- Input validation on all user inputs
- XSS prevention with React's built-in escaping
- CORS configuration for API endpoints
- Environment variables for sensitive config
- No hardcoded secrets or API keys

## Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t whack-a-mole .

# Run container
docker run -p 3000:3000 -p 3001:3001 whack-a-mole
```

### Environment Variables
Required environment variables for production:

```env
# Frontend
VITE_API_URL=https://your-api-domain.com/api
NODE_ENV=production

# Backend
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
NODE_ENV=production
```

### Deployment Checklist
- [ ] Set NODE_ENV to production
- [ ] Configure CORS for your domain
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up database (if replacing in-memory storage)
- [ ] Configure CDN for static assets

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code style and conventions
4. Write tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Run linting (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a pull request with a clear description

### Development Guidelines
- Follow Clean Code principles
- Maintain test coverage above 80%
- Use meaningful commit messages
- Update documentation for new features
- Add JSDoc comments for complex functions

## Troubleshooting

### Common Issues

**Game not starting:**
- Check console for errors
- Ensure backend is running on port 3001
- Verify .env configuration

**Leaderboard not updating:**
- Check network tab for API errors
- Verify CORS settings
- Ensure backend server is accessible

**Performance issues:**
- Check browser console for warnings
- Disable browser extensions
- Try incognito/private mode
- Update to latest browser version

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Classic arcade game inspiration
- React and Redux communities
- Clean Code principles by Robert C. Martin
- All contributors and testers

## Contact & Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the maintainers
- Check existing issues before creating new ones

---

Built with ❤️ using React, TypeScript, and Clean Code principles