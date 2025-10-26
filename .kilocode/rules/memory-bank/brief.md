Project Overview

This project is a desktop application built with Electron and TypeScript that monitors the clipboard to automatically verify product warranty statuses. The app detects copied serial numbers, checks their warranty information from specific sources, and instantly displays the result to the user.

Core Functionality

Clipboard Monitoring: Continuously listens for copied text. Automatically detects 14-character serial numbers starting with the letter “R.”

Web Scraping & API Integration:

Queries the RECCI Teknoloji warranty check website.

If no valid result is found, it falls back to the KVK Teknik Servis API.

Caching System (SQLite): Stores previously checked serial numbers to avoid redundant API requests and improve response time.

Popup Notifications:

🟩 RECCI Warranty – Green popup

🟦 KVK Warranty – Blue popup

🟥 Out of Warranty – Red popup
Each notification appears at the bottom-right corner of the screen for 5 seconds with a modern, GPU-accelerated UI.

Main Menu Interface: Displays all cached devices as interactive cards containing full device details, copy date, and notes. Includes filters (favorites, noted, all) and a clipboard monitoring toggle.

Error Handling: Displays warnings only if there is no internet connection or an API timeout occurs.

Technologies

Framework: Electron

Language: TypeScript

Backend: Node.js

Database: SQLite

Libraries: JSDOM (web scraping), Axios (API requests), Electron-Builder (packaging)

Purpose & Impact

This application significantly streamlines warranty verification for technical support teams and service centers. By automating a repetitive manual task, it saves time, reduces errors, and enhances workflow efficiency with a modern, user-friendly interface.