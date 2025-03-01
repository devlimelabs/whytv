# WhyTV Development Guide

## Commands
- **Dev Server**: `ng serve` or `npm start` - Start local development
- **Build**: `ng build` or `npm run build` - Build for production
- **Test**: `ng test` - Run unit tests with Karma
- **Generate**: `ng generate component component-name` - Create component
- **Functions**:
  - `cd functions && npm run build` - Build Firebase functions
  - `cd functions && npm run serve` - Start Firebase emulators
  - `cd functions && npm run lint` - Lint Firebase functions

## Code related documentation can be found in the [docs directory](./docs/) 

## Code Style Guidelines
- **Component Structure**: Use standalone components with OnPush change detection
- **State Management**: Use Angular signals and [@ngrx/signalStore](./docs/ngrx-signal-store/index.md)
- **Async Code**: Prefer async/await over direct Observable usage
- **Utility Functions**: Use lodash over native array/object methods
- **Modules**: Never use Angular Modules, only standalone components
- **Routing**: Use static routes files, always lazy-load non-primary routes
- **Files**: Separate HTML, CSS, and TS into individual files
- **Reactivity**: Always use signals and signal-based functions (input(), output())
- **Imports**: Group imports logically (Angular core, libraries, project)
- **Error Handling**: Use try/catch with consistent error logging pattern
