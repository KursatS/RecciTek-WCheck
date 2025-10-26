# Technologies Used

## Core Technologies

- **Electron**: Cross-platform desktop app framework
- **TypeScript**: Type-safe JavaScript for better development experience
- **Node.js**: Server-side JavaScript runtime

## Libraries and Dependencies

- **JSDOM**: HTML parsing and DOM manipulation for web scraping
- **Electron Net Module**: HTTP requests within Electron environment
- **Electron IPC**: Inter-process communication between main and renderer processes

## Development Tools

- **TypeScript Compiler**: Compiles TypeScript to JavaScript
- **Copyfiles**: Copies static assets during build process
- **Electron Builder**: Packaging and distribution tool

## Technical Constraints

- **Electron Compatibility**: Must use Electron-specific APIs for network requests
- **File System Access**: Uses Node.js fs module for JSON caching
- **Clipboard Access**: Uses Electron clipboard API for monitoring

## Development Setup

1. Install dependencies: `npm install`
2. Build project: `npm run build`
3. Run application: `npm start`
4. Development mode: `npm run dev`

## Tool Usage Patterns

- **Build Process**: TypeScript compilation followed by asset copying
- **Network Requests**: Electron net module for HTTP requests
- **Data Storage**: JSON file-based caching for simplicity
- **UI Updates**: IPC communication for renderer process updates