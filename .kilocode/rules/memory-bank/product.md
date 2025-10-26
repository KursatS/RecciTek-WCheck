# Product Description

## What This Product Does

This desktop application automates warranty verification for product serial numbers by monitoring the clipboard. When a user copies a serial number, the app instantly checks warranty status from multiple sources and displays the result in a popup notification.

## Problems It Solves

- **Manual Warranty Checks**: Eliminates the need for technicians to manually visit websites and enter serial numbers repeatedly.
- **Time-Consuming Process**: Reduces warranty verification from minutes to seconds.
- **Error-Prone Manual Entry**: Prevents typos and incorrect serial number entries.
- **Inefficient Workflow**: Streamlines support team operations by providing instant, accurate warranty information.

## How It Should Work

1. **Clipboard Monitoring**: App runs in background, continuously monitoring clipboard for serial numbers.
2. **Automatic Detection**: Detects 14-character serial numbers starting with 'R' (with special cases for RCFVBY/RCCVBY prefixes).
3. **Warranty Check**: Queries RECCI Teknoloji website first, falls back to KVK Teknik Servis API if needed.
4. **Caching**: Stores results locally to avoid redundant API calls.
5. **Popup Display**: Shows color-coded popup (green for RECCI, blue for KVK, red for out of warranty) with device details.
6. **Main Interface**: Provides searchable card-based view of all cached warranty checks with filtering options.

## User Experience Goals

- **Instant Feedback**: Results appear within seconds of copying a serial number.
- **Non-Intrusive**: Runs in background with tray icon, minimal system impact.
- **Turkish Language**: Full Turkish localization for target market.
- **Modern UI**: Clean, professional interface with GPU-accelerated popups.
- **Reliable**: Handles network errors gracefully, provides offline caching.

## Target Users

- Technical support teams
- Service centers
- Warranty administrators
- Customer service representatives

## Success Metrics

- Reduces warranty check time by 90%
- Eliminates manual website visits for warranty checks
- Provides 100% accurate serial number detection
- Maintains <1 second response time for cached results