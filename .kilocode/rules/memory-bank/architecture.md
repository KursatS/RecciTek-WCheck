# System Architecture

## Source Code Paths

- `src/main.ts`: Main Electron process, handles app lifecycle, clipboard monitoring, and IPC communication
- `src/warrantyChecker.ts`: Web scraping logic for RECCI and KVK warranty checks
- `src/serialDetector.ts`: Serial number detection and validation logic
- `src/cacheManager.ts`: JSON-based caching system for warranty data
- `src/popup.ts`: Renderer process for popup window, handles UI updates
- `src/renderer.ts`: Main window renderer, manages cached data display
- `src/index.html`: Main application window HTML
- `src/popup.html`: Popup notification window HTML

## Key Technical Decisions

- **Electron Framework**: Chosen for cross-platform desktop app with Node.js backend
- **TypeScript**: Provides type safety and better development experience
- **JSDOM**: Used for HTML parsing instead of cheerio for better Electron compatibility
- **JSON Caching**: Simple file-based caching instead of SQLite for easier deployment
- **Electron Net Module**: Used for HTTP requests to avoid Node.js fetch compatibility issues

## Design Patterns

- **Observer Pattern**: Clipboard monitoring continuously observes system clipboard
- **Factory Pattern**: Warranty checker creates appropriate response objects
- **Singleton Pattern**: Cache manager maintains single instance of cached data
- **Strategy Pattern**: Different parsing strategies for different warranty sources

## Component Relationships

```
Main Process (main.ts)
├── Clipboard Monitor
├── Window Manager
├── IPC Handler
└── Cache Manager

Renderer Processes
├── Main Window (index.html + renderer.ts)
└── Popup Window (popup.html + popup.ts)

External Services
├── RECCI Teknoloji Website
└── KVK Teknik Servis API
```

## Critical Implementation Paths

1. **Clipboard Detection**: `main.ts` → `serialDetector.ts` → `warrantyChecker.ts`
2. **Cache Lookup**: `warrantyChecker.ts` → `cacheManager.ts`
3. **Popup Display**: `main.ts` → `popup.html` → `popup.ts`
4. **Data Persistence**: `cacheManager.ts` → JSON file storage