"use strict";
const electron$1 = require("electron");
const path = require("path");
const jsdom = require("jsdom");
const Database = require("better-sqlite3");
const fs = require("fs");
const XLSX = require("xlsx");
const dateFns = require("date-fns");
const firestore = require("firebase/firestore");
const app$2 = require("firebase/app");
const child_process = require("child_process");
const electronUpdater = require("electron-updater");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const XLSX__namespace = /* @__PURE__ */ _interopNamespaceDefault(XLSX);
const is = {
  dev: !electron$1.app.isPackaged
};
({
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
});
async function checkWarranty(serial) {
  function makeRequest(url) {
    return new Promise((resolve, reject) => {
      const request = electron$1.net.request(url);
      request.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
      request.setHeader("Accept-Charset", "utf-8");
      const timeout = setTimeout(() => {
        request.abort();
        reject(new Error("Request timeout"));
      }, 7e3);
      request.on("response", (response) => {
        clearTimeout(timeout);
        if (response.statusCode !== 200) {
          request.abort();
          reject(new Error(`HTTP Error: ${response.statusCode}`));
          return;
        }
        let buffers = [];
        response.on("data", (chunk) => {
          buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          try {
            const fullBuffer = Buffer.concat(buffers);
            const data = fullBuffer.toString("utf8");
            const cleanData = data.replace(/�/g, "").replace(/[\x00-\x1F\x7F-\x9F]/g, "");
            resolve(cleanData);
          } catch (error) {
            reject(error);
          }
        });
      });
      request.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      request.end();
    });
  }
  try {
    const html = await makeRequest(`https://www.recciteknoloji.com/garantibelgesi2/?q=${serial}`);
    const dom = new jsdom.JSDOM(html);
    const document = dom.window.document;
    const window = dom.window;
    const getByXPath = (xpath) => {
      try {
        const res = document.evaluate(xpath, document, null, window.XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return res.singleNodeValue ? res.singleNodeValue.textContent.trim() : "";
      } catch (e) {
        return "";
      }
    };
    const rawModel = getByXPath("/html/body/main/div/div[1]/div[2]/div[2]");
    const rawColor = getByXPath("/html/body/main/div/div[1]/div[3]/div[2]");
    const rawStatus = getByXPath("/html/body/main/div/div[4]");
    const isGarantili = rawStatus.toUpperCase().includes("GARANTİ KAPSAMINDADIR") || rawStatus.toUpperCase().includes("GARANTI KAPSAMINDADIR") || document.body.textContent.includes("Garanti Kapsamındadır");
    if (isGarantili && rawModel) {
      let model_name = rawModel.toUpperCase().trim().replace(/^(MODEL|MARKA)\s*:\s*/i, "").replace(/^(MODEL|MARKA)\s*/i, "").trim();
      let model_color = rawColor.toUpperCase().trim().replace(/^RENK\s*:\s*/i, "").replace(/^RENK\s*/i, "").trim();
      if (model_name.includes("QREVO")) {
        model_name = model_name.replace("QREVO", "Q REVO");
      }
      if (model_name.includes("S8")) {
        model_name = model_name.replace(/SON[Iİ]C/g, "").trim();
      }
      return {
        serial,
        warranty_status: "RECCI GARANTILI",
        model_name,
        model_color
      };
    }
  } catch (error) {
    if (error.message && error.message.includes("HTTP Error:")) ;
    else {
      throw new Error("TIMEOUT");
    }
  }
  try {
    const json = await makeRequest(`https://guvencesorgula.kvkteknikservis.com/api/device-data?imeiNo=${serial}`);
    const data = JSON.parse(json);
    if (data.IsSucceeded && data.ResultData && Array.isArray(data.ResultData) && data.ResultData.length > 0 && data.ResultData[0] !== "No data found") {
      const deviceData = data.ResultData[0];
      const description = deviceData.DESCRIPTION || "";
      let model_name = "";
      let model_color = "";
      if (description.includes("Roborock")) {
        const parts = description.split(" ");
        if (parts.length >= 4) {
          model_name = parts.slice(1, -1).join(" ").trim();
          model_color = parts[parts.length - 1].trim();
        }
      } else {
        model_name = description;
      }
      model_name = model_name.toUpperCase();
      if (model_name.includes("QREVO")) {
        model_name = model_name.replace("QREVO", "Q REVO");
      }
      if (model_name.includes("S8")) {
        model_name = model_name.replace(/SON[Iİ]C/g, "").trim();
      }
      return {
        serial,
        warranty_status: "KVK GARANTILI",
        model_name,
        model_color,
        warranty_end: deviceData.WARRANTYEND
      };
    }
  } catch (error) {
    if (error.message && error.message.includes("HTTP Error:")) ;
    else {
      throw new Error("TIMEOUT");
    }
  }
  return {
    serial,
    warranty_status: "GARANTI KAPSAMI DISINDA",
    model_name: "",
    model_color: ""
  };
}
const electron = require("electron");
const { app: app$1 } = electron;
let db$1 = null;
const CACHE_MAX_AGE_DAYS = 3;
function getCacheMaxAgeMs() {
  return CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1e3;
}
function initCache() {
  console.log("Initializing cache...");
  try {
    const dbDir = path__namespace.join(app$1.getPath("documents"), "RecciTek");
    console.log("DB Directory:", dbDir);
    const fs2 = require("fs");
    if (!fs2.existsSync(dbDir)) {
      fs2.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path__namespace.join(dbDir, "cache.db");
    db$1 = new Database(dbPath);
    db$1.exec(`CREATE TABLE IF NOT EXISTS cache (
      serial TEXT PRIMARY KEY,
      model_name TEXT,
      model_color TEXT,
      warranty_status TEXT,
      copy_date TEXT,
      warranty_end TEXT,
      status TEXT
    )`);
    const tableInfo = db$1.prepare("PRAGMA table_info(cache)").all();
    const hasStatus = tableInfo.some((col) => col.name === "status");
    if (!hasStatus) {
      try {
        db$1.exec(`ALTER TABLE cache ADD COLUMN status TEXT`);
      } catch (err) {
        console.error("Failed to add status column:", err);
      }
    }
    purgeOldCache();
  } catch (err) {
    console.error("Error in initCache:", err);
  }
}
function purgeOldCache() {
  if (!db$1) return;
  try {
    const staleThreshold = new Date(Date.now() - getCacheMaxAgeMs()).toISOString();
    const result = db$1.prepare("DELETE FROM cache WHERE copy_date < ?").run(staleThreshold);
    if (result.changes > 0) {
      console.log(`Cache: ${result.changes} eski kayit silindi (3 gunden eski).`);
    }
  } catch (err) {
    console.error("Error purging old cache:", err);
  }
}
function loadCache() {
  const stmt = db$1.prepare("SELECT * FROM cache ORDER BY copy_date DESC LIMIT 500");
  return Promise.resolve(stmt.all());
}
function getCachedData(serial) {
  const stmt = db$1.prepare("SELECT * FROM cache WHERE serial = ?");
  return Promise.resolve(stmt.get(serial) || null);
}
function isCacheEntryStale(entry) {
  if (!entry?.copy_date) return true;
  const copiedAt = new Date(entry.copy_date);
  if (Number.isNaN(copiedAt.getTime())) return true;
  return Date.now() - copiedAt.getTime() >= getCacheMaxAgeMs();
}
function saveToCache(serial, info) {
  if ((serial.startsWith("RCCVBY") || serial.startsWith("RCFVBY")) && info.warranty_status === "GARANTI KAPSAMI DISINDA") {
    info.warranty_status = "RECCI GARANTILI";
    info.model_name = "cihaz üzerinden öğreniniz";
    info.model_color = "cihaz üzerinden öğreniniz";
  }
  const entry = {
    serial,
    model_name: info.model_name || "",
    model_color: info.model_color || "",
    warranty_status: info.warranty_status,
    copy_date: (/* @__PURE__ */ new Date()).toISOString(),
    warranty_end: info.warranty_end,
    status: info.status || ""
  };
  const stmt = db$1.prepare(`INSERT OR REPLACE INTO cache (serial, model_name, model_color, warranty_status, copy_date, warranty_end, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(entry.serial, entry.model_name, entry.model_color, entry.warranty_status, entry.copy_date, entry.warranty_end, entry.status);
  return Promise.resolve();
}
function clearCache() {
  const stmt = db$1.prepare("DELETE FROM cache");
  stmt.run();
  return Promise.resolve();
}
function deleteEntry(serial) {
  const stmt = db$1.prepare("DELETE FROM cache WHERE serial = ?");
  stmt.run(serial);
  return Promise.resolve();
}
function getSettingsPath() {
  return path__namespace.join(electron$1.app.getPath("documents"), "RecciTek", "settings.json");
}
function loadSettings() {
  const defaultSettings = {
    popupTimeout: 5e3,
    popupSizeLevel: 2,
    doubleCopyEnabled: true,
    autoStartEnabled: false,
    preventDuplicatePopup: true,
    clipboardUpperEnabled: true,
    shortcuts: {
      clearCache: "CommandOrControl+Shift+X",
      toggleMonitoring: "CommandOrControl+Shift+C"
    },
    role: "kargo_kabul",
    personnelName: "",
    theme: "dark",
    rememberMe: false,
    autoLogin: false,
    savedUsername: "",
    savedPassword: "",
    workingHours: {
      start: "09:30",
      end: "18:30"
    }
  };
  try {
    const p = getSettingsPath();
    if (fs__namespace.existsSync(p)) {
      const savedSettings = JSON.parse(fs__namespace.readFileSync(p, "utf8"));
      return { ...defaultSettings, ...savedSettings, isLoggedIn: false };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return { ...defaultSettings, isLoggedIn: false };
}
function saveSettings(settings) {
  try {
    const settingsPath = getSettingsPath();
    fs__namespace.mkdirSync(path__namespace.dirname(settingsPath), { recursive: true });
    fs__namespace.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}
const POPUP_SIZE_LEVELS = [
  { level: 1, file: "popup.html", width: 400, height: 300, label: "Küçük" },
  { level: 2, file: "popup.html", width: 460, height: 330, label: "Orta" },
  { level: 3, file: "popup.html", width: 500, height: 350, label: "Büyük" }
];
class WindowManager {
  constructor(appPath) {
    this.appPath = appPath;
    this.mainWindow = null;
    this.loginWindow = null;
    this.currentPopup = null;
    this.priorityPopup = null;
    this.popupTimeout = null;
    this.priorityPopupTimeout = null;
    this.popupVisible = false;
    this.popupStartTime = 0;
    this.popupRemaining = 0;
    this.preloadPath = "";
    this.mainWindowReady = false;
    this.deviceCallToasts = /* @__PURE__ */ new Map();
    this.preloadPath = path__namespace.join(__dirname, "../preload/index.js");
  }
  loadFile(win, fileName) {
    if (is.dev) {
      if (fileName === "deviceCallToast.html") {
        win.loadFile(path__namespace.join(electron$1.app.getAppPath(), "src", fileName));
      } else if (process.env["ELECTRON_RENDERER_URL"]) {
        win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/${fileName}`);
      } else {
        win.loadFile(path__namespace.join(__dirname, `../renderer/${fileName}`));
      }
    } else {
      win.loadFile(path__namespace.join(__dirname, `../renderer/${fileName}`));
    }
  }
  getPopupBounds(sizeLevel, kind) {
    const size = POPUP_SIZE_LEVELS.find((l) => l.level === sizeLevel) || POPUP_SIZE_LEVELS[2];
    const { width, height } = electron$1.screen.getPrimaryDisplay().workAreaSize;
    const baseX = width - size.width - 20;
    const baseY = height - size.height - 60;
    return {
      size,
      x: baseX,
      y: kind === "priority" ? Math.max(20, baseY - size.height - 18) : baseY
    };
  }
  createPopupWindow(sizeLevel, kind) {
    const { size, x, y } = this.getPopupBounds(sizeLevel, kind);
    return new electron$1.BrowserWindow({
      width: size.width,
      height: size.height,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      x,
      y,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      }
    });
  }
  createSplashWindow() {
    const splash = new electron$1.BrowserWindow({
      width: 600,
      height: 400,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    this.loadFile(splash, "splash.html");
    return splash;
  }
  createMainWindow() {
    const settings = loadSettings();
    const bounds = settings.windowBounds;
    this.mainWindow = new electron$1.BrowserWindow({
      width: bounds?.width || 800,
      height: bounds?.height || 600,
      x: bounds?.x,
      y: bounds?.y,
      minWidth: 475,
      minHeight: 400,
      show: false,
      backgroundColor: "#0f172a",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      },
      icon: path__namespace.join(__dirname, "../../assets/logo.png"),
      autoHideMenuBar: true
    });
    this.mainWindowReady = false;
    this.loadFile(this.mainWindow, "index.html");
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindowReady = true;
    });
    this.mainWindow.webContents.on("did-finish-load", () => {
      this.mainWindowReady = true;
    });
    let saveBoundsTimer = null;
    const saveBounds = () => {
      if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
      saveBoundsTimer = setTimeout(() => {
        if (this.mainWindow && !this.mainWindow.isDestroyed() && !this.mainWindow.isMaximized()) {
          const b = this.mainWindow.getBounds();
          const s = loadSettings();
          saveSettings({ ...s, windowBounds: b });
        }
      }, 800);
    };
    this.mainWindow.on("resize", saveBounds);
    this.mainWindow.on("move", saveBounds);
    this.mainWindow.on("close", (e) => {
      if (this.mainWindow) {
        e.preventDefault();
        this.mainWindow.hide();
      }
    });
    return this.mainWindow;
  }
  createLoginWindow(showOnReady = true) {
    this.loginWindow = new electron$1.BrowserWindow({
      width: 500,
      height: 500,
      frame: false,
      resizable: false,
      show: false,
      backgroundColor: "#0f172a",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      },
      icon: path__namespace.join(__dirname, "../../assets/logo.png")
    });
    this.loadFile(this.loginWindow, "login.html");
    if (showOnReady) {
      this.loginWindow.once("ready-to-show", () => this.loginWindow?.show());
    }
    this.loginWindow.on("closed", () => {
      if (!this.mainWindow?.isVisible()) {
        this.forceQuit();
      }
      this.loginWindow = null;
    });
    return this.loginWindow;
  }
  onLoginSuccess() {
    if (this.loginWindow && !this.loginWindow.isDestroyed()) {
      this.loginWindow.close();
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      let hasShown = false;
      const showMainWindow = () => {
        if (hasShown) return;
        if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
        hasShown = true;
        this.mainWindow.show();
        this.mainWindow.focus();
        try {
          const size = this.mainWindow.getSize();
          this.mainWindow.setSize(size[0] + 1, size[1]);
          setTimeout(() => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.setSize(size[0], size[1]);
            }
          }, 50);
        } catch (err) {
          console.error("Failed to trigger window force-resize:", err);
        }
        this.mainWindow.webContents.send("refresh-cards");
      };
      if (this.mainWindowReady || !this.mainWindow.webContents.isLoadingMainFrame()) {
        showMainWindow();
      } else {
        this.mainWindow.once("ready-to-show", showMainWindow);
        this.mainWindow.webContents.once("did-finish-load", showMainWindow);
      }
    }
  }
  getMainWindow() {
    return this.mainWindow;
  }
  getLoginWindow() {
    return this.loginWindow;
  }
  showPopup(info, timeoutDuration, sizeLevel) {
    const kind = info?.variant === "priority" ? "priority" : "warranty";
    if (kind === "priority") {
      this.showPriorityPopup(info, timeoutDuration, sizeLevel);
      return;
    }
    this.showWarrantyPopup(info, timeoutDuration, sizeLevel);
  }
  showWarrantyPopup(info, timeoutDuration, sizeLevel) {
    this.closePopup();
    this.currentPopup = this.createPopupWindow(sizeLevel, "warranty");
    this.loadFile(this.currentPopup, "popup.html");
    this.currentPopup.once("ready-to-show", () => {
      if (!this.currentPopup) return;
      this.currentPopup.show();
      this.popupVisible = true;
      const settings = loadSettings();
      const payload = { ...info, sizeLevel, theme: settings.theme || "dark", variant: "warranty" };
      this.currentPopup.webContents.send("popup-data", payload, timeoutDuration);
      this.popupStartTime = Date.now();
      this.popupRemaining = timeoutDuration;
      this.popupTimeout = setTimeout(() => this.closePopup(), timeoutDuration);
    });
    const popup = this.currentPopup;
    popup.on("closed", () => {
      if (this.currentPopup === popup) {
        this.currentPopup = null;
        this.popupVisible = false;
      }
    });
  }
  showPriorityPopup(info, timeoutDuration, sizeLevel) {
    this.closePriorityPopup();
    this.priorityPopup = this.createPopupWindow(sizeLevel, "priority");
    this.loadFile(this.priorityPopup, "popup.html");
    this.priorityPopup.once("ready-to-show", () => {
      if (!this.priorityPopup) return;
      this.priorityPopup.show();
      const settings = loadSettings();
      const payload = { ...info, sizeLevel, theme: settings.theme || "dark", variant: "priority" };
      this.priorityPopup.webContents.send("popup-data", payload, timeoutDuration);
      this.priorityPopupTimeout = setTimeout(() => this.closePriorityPopup(), timeoutDuration);
      const anchorDelay = typeof info?.anchorDelay === "number" ? info.anchorDelay : settings.popupTimeout;
      setTimeout(() => {
        if (!this.priorityPopup || this.priorityPopup.isDestroyed()) return;
        const targetBounds = this.getPopupBounds(sizeLevel, "warranty");
        this.animatePriorityPopupTo(targetBounds.x, targetBounds.y);
      }, Math.max(300, anchorDelay));
    });
    const popup = this.priorityPopup;
    popup.on("closed", () => {
      if (this.priorityPopup === popup) {
        this.priorityPopup = null;
      }
    });
  }
  closePopup() {
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout);
      this.popupTimeout = null;
    }
    if (this.currentPopup && !this.currentPopup.isDestroyed()) {
      this.currentPopup.close();
      this.currentPopup = null;
    }
    this.popupVisible = false;
  }
  closePriorityPopup() {
    if (this.priorityPopupTimeout) {
      clearTimeout(this.priorityPopupTimeout);
      this.priorityPopupTimeout = null;
    }
    if (this.priorityPopup && !this.priorityPopup.isDestroyed()) {
      this.priorityPopup.close();
      this.priorityPopup = null;
    }
  }
  animatePriorityPopupTo(targetX, targetY) {
    if (!this.priorityPopup || this.priorityPopup.isDestroyed()) return;
    const startBounds = this.priorityPopup.getBounds();
    const steps = 12;
    const duration = 240;
    const deltaX = (targetX - startBounds.x) / steps;
    const deltaY = (targetY - startBounds.y) / steps;
    let currentStep = 0;
    const interval = setInterval(() => {
      if (!this.priorityPopup || this.priorityPopup.isDestroyed()) {
        clearInterval(interval);
        return;
      }
      currentStep++;
      const nextX = Math.round(startBounds.x + deltaX * currentStep);
      const nextY = Math.round(startBounds.y + deltaY * currentStep);
      this.priorityPopup.setPosition(nextX, nextY);
      if (currentStep >= steps) {
        clearInterval(interval);
        if (this.priorityPopup && !this.priorityPopup.isDestroyed()) {
          this.priorityPopup.setPosition(targetX, targetY);
        }
      }
    }, duration / steps);
  }
  isPopupVisible() {
    return this.popupVisible;
  }
  pausePopupTimeout() {
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout);
      this.popupTimeout = null;
      const elapsed = Date.now() - this.popupStartTime;
      this.popupRemaining = Math.max(0, this.popupRemaining - elapsed);
    }
  }
  resumePopupTimeout() {
    if (!this.popupTimeout && this.popupVisible && this.popupRemaining > 0) {
      this.popupStartTime = Date.now();
      this.popupTimeout = setTimeout(() => this.closePopup(), this.popupRemaining);
    }
  }
  showDeviceCallToast(callId, data) {
    if (this.deviceCallToasts.has(callId)) {
      const existing = this.deviceCallToasts.get(callId);
      if (!existing.isDestroyed()) {
        existing.webContents.send("device-call-toast-data", data);
        return;
      }
    }
    const { width } = electron$1.screen.getPrimaryDisplay().workAreaSize;
    const toastWidth = 440;
    const hasCustomer = !!(data.customer_name && data.customer_name.trim());
    const toastHeight = data.isMine ? hasCustomer ? 280 : 256 : hasCustomer ? 268 : 242;
    const x = Math.round((width - toastWidth) / 2);
    const y = 24;
    const win = new electron$1.BrowserWindow({
      width: toastWidth,
      height: toastHeight,
      x,
      y,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      focusable: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      }
    });
    win.setAlwaysOnTop(true, "screen-saver");
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.loadFile(win, "deviceCallToast.html");
    this.deviceCallToasts.set(callId, win);
    win.once("ready-to-show", () => {
      if (!win.isDestroyed()) {
        win.showInactive();
        setTimeout(() => {
          if (!win.isDestroyed()) {
            win.webContents.send("device-call-toast-data", data);
          }
        }, 80);
      }
    });
    win.on("closed", () => {
      this.deviceCallToasts.delete(callId);
    });
  }
  sendDeviceCallToastResolve(callId, data) {
    const win = this.deviceCallToasts.get(callId);
    if (win && !win.isDestroyed()) {
      win.webContents.send("device-call-toast-resolve", data);
    }
  }
  sendDeviceCallStatusUpdate(callId, statusData) {
    const win = this.deviceCallToasts.get(callId);
    if (win && !win.isDestroyed()) {
      win.webContents.send("device-call-status-update", statusData);
    }
  }
  closeDeviceCallToast(callId) {
    const win = this.deviceCallToasts.get(callId);
    if (win && !win.isDestroyed()) {
      win.close();
    }
    this.deviceCallToasts.delete(callId);
  }
  closeAllDeviceCallToasts() {
    this.deviceCallToasts.forEach((win) => {
      if (!win.isDestroyed()) win.close();
    });
    this.deviceCallToasts.clear();
  }
  forceQuit() {
    this.closeAllDeviceCallToasts();
    [this.mainWindow, this.loginWindow, this.currentPopup, this.priorityPopup].forEach((win) => {
      if (win && !win.isDestroyed()) {
        win.destroy();
      }
    });
    electron$1.app.exit(0);
  }
}
function isSerialNumber(text) {
  return /^R[A-Za-z0-9]{13}$/.test(text);
}
class ClipboardMonitor {
  constructor(onDetected) {
    this.onDetected = onDetected;
    this.lastClipboard = "";
    this.interval = null;
    this.isEnabled = true;
  }
  start(intervalMs = 800) {
    if (this.interval) return;
    this.interval = setInterval(() => {
      if (!this.isEnabled) return;
      const text = electron$1.clipboard.readText().trim();
      if (!text || text === this.lastClipboard) return;
      this.lastClipboard = text;
      if (isSerialNumber(text)) {
        this.onDetected(text);
      }
    }, intervalMs);
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}
const MONTH_NAMES_TR = {
  "01": "Ocak",
  "02": "Şubat",
  "03": "Mart",
  "04": "Nisan",
  "05": "Mayıs",
  "06": "Haziran",
  "07": "Temmuz",
  "08": "Ağustos",
  "09": "Eylül",
  "10": "Ekim",
  "11": "Kasım",
  "12": "Aralık"
};
const DATE_FORMATS = [
  "dd-MM-yyyy HH:mm:ss",
  "dd-MM-yyyy HH:mm",
  "dd.MM.yyyy HH:mm:ss",
  "dd.MM.yyyy HH:mm",
  "dd/MM/yyyy HH:mm:ss",
  "dd/MM/yyyy HH:mm",
  "yyyy-MM-dd HH:mm:ss",
  "yyyy-MM-dd HH:mm",
  "yyyy/MM/dd HH:mm:ss",
  "yyyy/MM/dd HH:mm",
  "dd-MM-yyyy",
  "dd.MM.yyyy",
  "dd/MM/yyyy",
  "yyyy-MM-dd",
  "yyyy/MM/dd"
];
function normalizeHeader(value) {
  return String(value || "").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function findColumnIndex(headers, variants, fallbackIndex) {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const variant of variants) {
    const exactIndex = normalizedHeaders.findIndex((header) => header === variant);
    if (exactIndex >= 0) return exactIndex;
  }
  for (const variant of variants) {
    const tokens = variant.split(" ").filter(Boolean);
    const partialIndex = normalizedHeaders.findIndex((header) => tokens.every((token) => header.includes(token)));
    if (partialIndex >= 0) return partialIndex;
  }
  return fallbackIndex;
}
function extractDate(cell) {
  if (cell === null || cell === void 0 || cell === "") return null;
  let parsedDate = null;
  if (cell instanceof Date) {
    parsedDate = cell;
  } else if (typeof cell === "number") {
    if (cell <= 0) return null;
    const parsed = XLSX__namespace.SSF.parse_date_code(cell);
    if (!parsed || !parsed.y) return null;
    parsedDate = new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
  } else if (typeof cell === "string") {
    const clean = cell.trim();
    if (!clean || clean.length < 8) return null;
    for (const dateFormat of DATE_FORMATS) {
      const candidate = dateFns.parse(clean, dateFormat, /* @__PURE__ */ new Date());
      if (dateFns.isValid(candidate)) {
        parsedDate = candidate;
        break;
      }
    }
    if (!parsedDate) {
      const nativeParsed = new Date(clean);
      if (dateFns.isValid(nativeParsed)) {
        parsedDate = nativeParsed;
      }
    }
  }
  if (!parsedDate || !dateFns.isValid(parsedDate)) return null;
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  if (parsedDate.getFullYear() < 2020 || parsedDate.getFullYear() > currentYear + 1) {
    return null;
  }
  return parsedDate;
}
function ensureMonthAccumulator(monthlyStats, key, date) {
  if (!monthlyStats[key]) {
    monthlyStats[key] = {
      total: 0,
      valid: 0,
      overtime: 0,
      date: dateFns.startOfMonth(date),
      days: {},
      models: {}
    };
  }
  return monthlyStats[key];
}
function ensureDayAccumulator(stats, dayKey) {
  if (!stats.days[dayKey]) {
    stats.days[dayKey] = { valid: 0, overtime: 0 };
  }
  return stats.days[dayKey];
}
function ensureModelAccumulator(stats, modelName) {
  if (!stats.models[modelName]) {
    stats.models[modelName] = { total: 0, valid: 0, overtime: 0 };
  }
  return stats.models[modelName];
}
function parseBonusData(buffer, workingHours) {
  const workbook = XLSX__namespace.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX__namespace.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  if (!rows.length) return [];
  const headers = rows[0] || [];
  const dateIndex = findColumnIndex(headers, ["kayit tarihi", "kayit zamani", "olusturma tarihi", "olusturma zamani"], 14);
  const modelIndex = findColumnIndex(headers, ["model", "urun modeli", "cihaz modeli"], 2);
  const [startH, startM] = workingHours.start.split(":").map(Number);
  const [endH, endM] = workingHours.end.split(":").map(Number);
  const monthlyStats = {};
  rows.forEach((row, rowIndex) => {
    if (rowIndex === 0 || !row) return;
    const date = extractDate(row[dateIndex]);
    if (!date) return;
    const monthKey = dateFns.format(date, "MM-yyyy");
    const dayKey = dateFns.format(date, "yyyy-MM-dd");
    const stats = ensureMonthAccumulator(monthlyStats, monthKey, date);
    const dayStats = ensureDayAccumulator(stats, dayKey);
    const modelName = String(row[modelIndex] || "Model belirtilmedi").trim() || "Model belirtilmedi";
    const modelStats = ensureModelAccumulator(stats, modelName);
    stats.total++;
    modelStats.total++;
    const startLimit = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startH, startM, 0);
    const endLimit = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endH, endM, 59);
    const isWorkingHours = dateFns.isWithinInterval(date, { start: startLimit, end: endLimit });
    if (isWorkingHours) {
      stats.valid++;
      dayStats.valid++;
      modelStats.valid++;
    } else {
      stats.overtime++;
      dayStats.overtime++;
      modelStats.overtime++;
    }
  });
  const sortedMonthKeys = Object.keys(monthlyStats).sort(
    (a, b) => dateFns.compareDesc(monthlyStats[a].date, monthlyStats[b].date)
  );
  return sortedMonthKeys.map((key) => {
    const stats = monthlyStats[key];
    const [monthNumber, year] = key.split("-");
    const dailyStats = Object.keys(stats.days).sort().map((dayKey) => ({
      date: dayKey,
      validCount: stats.days[dayKey].valid,
      overtimeCount: stats.days[dayKey].overtime,
      totalCount: stats.days[dayKey].valid + stats.days[dayKey].overtime
    }));
    const modelStats = Object.entries(stats.models).map(([model, modelStats2]) => ({
      model,
      totalCount: modelStats2.total,
      validCount: modelStats2.valid,
      overtimeCount: modelStats2.overtime
    })).sort((a, b) => b.totalCount - a.totalCount || b.validCount - a.validCount || a.model.localeCompare(b.model, "tr"));
    return {
      month: `${MONTH_NAMES_TR[monthNumber] || monthNumber} ${year}`,
      totalCount: stats.total,
      validCount: stats.valid,
      overtimeCount: stats.overtime,
      isEligible: stats.valid >= 850,
      dailyStats,
      modelStats
    };
  });
}
function parseZReportData(buffer) {
  const workbook = XLSX__namespace.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX__namespace.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  if (!rows.length) return [];
  const headers = rows[0] || [];
  const dateIndex = findColumnIndex(headers, ["kayit tarihi", "kayit zamani", "olusturma tarihi", "olusturma zamani"], 14);
  const modelIndex = findColumnIndex(headers, ["model", "urun modeli", "cihaz modeli"], 2);
  const personnelIndex = findColumnIndex(headers, ["kayd a an", "kaydi acan", "kaydi acan personel", "kullanici", "created_by"], 15);
  const dailyAccumulator = {};
  rows.forEach((row, rowIndex) => {
    if (rowIndex === 0 || !row) return;
    const date = extractDate(row[dateIndex]);
    if (!date) return;
    const dayKey = dateFns.format(date, "yyyy-MM-dd");
    const modelName = String(row[modelIndex] || "Model belirtilmedi").trim() || "Model belirtilmedi";
    const personnelName = String(row[personnelIndex] || "Bilinmiyor").trim() || "Bilinmiyor";
    if (!dailyAccumulator[dayKey]) {
      dailyAccumulator[dayKey] = {
        total: 0,
        models: {},
        personnel: {}
      };
    }
    dailyAccumulator[dayKey].total++;
    dailyAccumulator[dayKey].models[modelName] = (dailyAccumulator[dayKey].models[modelName] || 0) + 1;
    dailyAccumulator[dayKey].personnel[personnelName] = (dailyAccumulator[dayKey].personnel[personnelName] || 0) + 1;
  });
  const sortedDays = Object.keys(dailyAccumulator).sort((a, b) => b.localeCompare(a));
  const last5Days = sortedDays.slice(0, 5);
  return last5Days.map((dayKey) => {
    const data = dailyAccumulator[dayKey];
    const modelsArray = Object.entries(data.models).map(([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count || a.model.localeCompare(b.model, "tr"));
    const personnelArray = Object.entries(data.personnel).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"));
    const parsedDate = dateFns.parse(dayKey, "yyyy-MM-dd", /* @__PURE__ */ new Date());
    const displayDate = dateFns.isValid(parsedDate) ? dateFns.format(parsedDate, "dd.MM.yyyy") : dayKey;
    return {
      date: displayDate,
      totalCount: data.total,
      models: modelsArray,
      personnel: personnelArray
    };
  });
}
const firebaseConfig = {
  apiKey: "AIzaSyBbKdmGohakaU5woTt90BSNeH2DoVD3XNo",
  authDomain: "reccitek-wcheck.firebaseapp.com",
  projectId: "reccitek-wcheck",
  storageBucket: "reccitek-wcheck.firebasestorage.app",
  messagingSenderId: "231625980465",
  appId: "1:231625980465:web:d1f93529f724c68088b310"
};
const app = app$2.initializeApp(firebaseConfig);
const db = firestore.getFirestore(app);
const TICKETS_COLLECTION = "tickets";
const PRIORITY_COLLECTION = "priority_devices";
async function createTicket(data) {
  const missingTypeTokens = data.missing_type.split(",").map((token) => token.trim()).filter(Boolean);
  const docRef = await firestore.addDoc(firestore.collection(db, TICKETS_COLLECTION), {
    ...data,
    missing_type_tokens: missingTypeTokens,
    created_at: firestore.serverTimestamp(),
    status: "pending",
    response: "",
    responded_by: "",
    responded_at: null,
    action_history: [{
      action: "Oluşturuldu",
      user: data.created_by,
      timestamp: Date.now()
    }]
  });
  try {
    const q = firestore.query(firestore.collection(db, "users"), firestore.where("fullName", "==", data.created_by));
    const snapshot = await firestore.getDocs(q);
    if (!snapshot.empty) {
      await firestore.updateDoc(firestore.doc(db, "users", snapshot.docs[0].id), { xp: firestore.increment(5) });
    }
  } catch (e) {
    console.error("Error adding xp:", e);
  }
  return docRef.id;
}
async function claimTicket(ticketId, personnelName) {
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
    status: "in_progress",
    responded_by: personnelName,
    action_history: firestore.arrayUnion({
      action: "Üstlendi",
      user: personnelName,
      timestamp: Date.now()
    })
  });
}
async function completeTicket(ticketId, response) {
  const ticketDoc = await firestore.getDocs(firestore.query(firestore.collection(db, TICKETS_COLLECTION), firestore.where("__name__", "==", ticketId)));
  let respondedBy = "";
  let xp_awarded = false;
  if (!ticketDoc.empty) {
    const data = ticketDoc.docs[0].data();
    respondedBy = data.responded_by;
    xp_awarded = data.xp_awarded || false;
  }
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
    status: "completed",
    response,
    responded_at: firestore.serverTimestamp(),
    xp_awarded: true,
    action_history: firestore.arrayUnion({
      action: "Tamamlandı",
      user: respondedBy || "Bilinmiyor",
      timestamp: Date.now()
    })
  });
  if (respondedBy && !xp_awarded) {
    try {
      const q = firestore.query(firestore.collection(db, "users"), firestore.where("fullName", "==", respondedBy));
      const snapshot = await firestore.getDocs(q);
      if (!snapshot.empty) {
        await firestore.updateDoc(firestore.doc(db, "users", snapshot.docs[0].id), { xp: firestore.increment(10) });
      }
    } catch (e) {
      console.error("Error adding xp:", e);
    }
  }
}
async function reopenTicket(ticketId, personnelName) {
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
    status: "in_progress",
    action_history: firestore.arrayUnion({
      action: "Yeniden Açtı",
      user: personnelName,
      timestamp: Date.now()
    })
    // Do not clear response so the user can edit their previous response.
  });
}
async function hideTicket(ticketId, personnelName) {
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
    is_hidden: true,
    hidden_by: personnelName
  });
}
async function unhideTicket(ticketId) {
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
    is_hidden: false,
    hidden_by: ""
  });
}
async function deleteTicket(ticketId) {
  await firestore.deleteDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId));
}
async function updateTicketDetails(ticketId, details) {
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), { ...details });
}
async function markTicketUnreachable(ticketId, personnelName) {
  const ticketDoc = await firestore.getDocs(firestore.query(firestore.collection(db, TICKETS_COLLECTION), firestore.where("__name__", "==", ticketId)));
  if (!ticketDoc.empty) {
    await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
      status: "pending",
      responded_by: "",
      last_contact_attempt_at: firestore.serverTimestamp(),
      action_history: firestore.arrayUnion({
        action: "Ulaşılamadı Olarak İşaretledi",
        user: personnelName,
        timestamp: Date.now()
      })
    });
  }
}
function subscribeAsKargoKabul(personnelName, callback) {
  const q = firestore.query(firestore.collection(db, TICKETS_COLLECTION), firestore.orderBy("created_at", "desc"), firestore.limit(200));
  return firestore.onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, created_at: data.created_at?.toMillis?.() ?? null, responded_at: data.responded_at?.toMillis?.() ?? null };
    });
    tickets.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    callback(tickets);
  }, (error) => console.error("Firestore listener error (KK):", error));
}
function subscribeAsMH(callback) {
  const q = firestore.query(firestore.collection(db, TICKETS_COLLECTION), firestore.orderBy("created_at", "desc"), firestore.limit(200));
  return firestore.onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, created_at: data.created_at?.toMillis?.() ?? null, responded_at: data.responded_at?.toMillis?.() ?? null };
    });
    tickets.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    callback(tickets);
  }, (error) => console.error("Firestore listener error (MH):", error));
}
async function addPriorityDevice(data) {
  const docRef = await firestore.addDoc(firestore.collection(db, PRIORITY_COLLECTION), {
    ...data,
    serial: data.serial.trim().toUpperCase(),
    created_at: firestore.serverTimestamp()
  });
  return docRef.id;
}
async function deletePriorityDevice(id) {
  await firestore.deleteDoc(firestore.doc(db, PRIORITY_COLLECTION, id));
}
async function updatePriorityDevice(id, data) {
  if (data.serial) {
    data.serial = data.serial.trim().toUpperCase();
  }
  await firestore.updateDoc(firestore.doc(db, PRIORITY_COLLECTION, id), { ...data });
}
function subscribeToPriorityDevices(callback) {
  const q = firestore.query(firestore.collection(db, PRIORITY_COLLECTION), firestore.orderBy("created_at", "desc"));
  return firestore.onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, created_at: data.created_at?.toMillis?.() ?? null };
    });
    callback(devices);
  }, (error) => console.error("Firestore listener error (PriorityDevices):", error));
}
async function getUsers() {
  const q = firestore.query(firestore.collection(db, "users"));
  const snapshot = await firestore.getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    const { password, ...safeUser } = data;
    return { id: d.id, ...safeUser };
  });
}
async function createUser(data) {
  const docRef = await firestore.addDoc(firestore.collection(db, "users"), {
    ...data,
    level: 1,
    xp: 0,
    createdAt: firestore.serverTimestamp()
  });
  return docRef.id;
}
async function updateUser(id, data) {
  await firestore.updateDoc(firestore.doc(db, "users", id), { ...data, updatedAt: firestore.serverTimestamp() });
}
async function deleteUser(id) {
  await firestore.deleteDoc(firestore.doc(db, "users", id));
}
async function resetUserXp(id) {
  await firestore.updateDoc(firestore.doc(db, "users", id), { xp: 0, level: 1 });
}
const DEVICE_CALLS_COLLECTION = "device_calls";
async function createDeviceCall(data) {
  const docRef = await firestore.addDoc(firestore.collection(db, DEVICE_CALLS_COLLECTION), {
    serial: data.serial.trim().toUpperCase(),
    model_name: data.model_name.trim().toUpperCase(),
    customer_name: (data.customer_name || "").trim(),
    created_by: data.created_by,
    created_at: firestore.serverTimestamp(),
    status: "active",
    resolved_by: "",
    resolved_at: null,
    recipients: [],
    // Personnel who received the popup
    dismissed_by: []
    // Personnel who clicked "Bende Değil"
  });
  return docRef.id;
}
async function resolveDeviceCall(id, resolved_by) {
  await firestore.updateDoc(firestore.doc(db, DEVICE_CALLS_COLLECTION, id), {
    status: "resolved",
    resolved_by,
    resolved_at: firestore.serverTimestamp()
  });
}
async function cancelDeviceCall(id) {
  await firestore.updateDoc(firestore.doc(db, DEVICE_CALLS_COLLECTION, id), {
    status: "cancelled",
    resolved_at: firestore.serverTimestamp()
  });
}
async function markDeviceCallRecipient(id, name) {
  await firestore.updateDoc(firestore.doc(db, DEVICE_CALLS_COLLECTION, id), {
    recipients: firestore.arrayUnion(name)
  });
}
async function dismissDeviceCallBy(id, name) {
  await firestore.updateDoc(firestore.doc(db, DEVICE_CALLS_COLLECTION, id), {
    dismissed_by: firestore.arrayUnion(name)
  });
}
function subscribeToDeviceCalls(callback) {
  const q = firestore.query(firestore.collection(db, DEVICE_CALLS_COLLECTION), firestore.orderBy("created_at", "desc"), firestore.limit(50));
  return firestore.onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: data.created_at?.toMillis?.() ?? null,
        resolved_at: data.resolved_at?.toMillis?.() ?? null
      };
    });
    callback(calls);
  }, (error) => console.error("Firestore listener error (DeviceCalls):", error));
}
const gotTheLock = electron$1.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron$1.app.quit();
  process.exit(0);
} else {
  electron$1.app.on("second-instance", () => {
    const mainWindow = windowManager?.getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      electron$1.dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "RecciTek WCheck",
        message: "Uygulama zaten çalışıyor.",
        detail: "Lütfen sistem tepsisindeki (tray) simgeyi kontrol edin.",
        buttons: ["Tamam"]
      });
    }
  });
}
let windowManager;
let clipboardMonitor;
let tray = null;
let currentSettings;
let monitoringEnabled = true;
let currentPopupData = null;
let lastDetectedSerial = "";
let statusInterval = null;
let ticketUnsubscribe = null;
let priorityUnsubscribe = null;
let deviceCallsUnsubscribe = null;
let cachedTickets = [];
let cachedPriorityDevices = [];
function extractCopyText(data) {
  if (!data) return "";
  if (data.warranty_status === "KVK GARANTILI" && data.warranty_end) {
    return `GÜVENCE BİTİŞ TARİHİ : ${data.warranty_end}`;
  }
  if (data.warranty_status === "RECCI GARANTILI" && data.model_name && data.model_name !== "MODEL BULUNAMADI" && data.model_color && data.model_color !== "RENK BULUNAMADI") {
    return `${data.model_name} - ${data.model_color}`;
  }
  return "";
}
async function checkServerStatus() {
  const start = Date.now();
  try {
    const request = electron$1.net.request({
      method: "HEAD",
      url: "https://www.recciteknoloji.com/garantibelgesi2/",
      redirect: "follow"
    });
    request.on("response", (response) => {
      const latency = Date.now() - start;
      const isOnline = response.statusCode === 200;
      windowManager.getMainWindow()?.webContents.send("server-status-update", {
        online: isOnline,
        latency
      });
    });
    request.on("error", () => {
      windowManager.getMainWindow()?.webContents.send("server-status-update", {
        online: false,
        latency: 0
      });
    });
    request.end();
  } catch {
    windowManager.getMainWindow()?.webContents.send("server-status-update", {
      online: false,
      latency: 0
    });
  }
}
function startServerStatusMonitor() {
  if (statusInterval) clearInterval(statusInterval);
  setTimeout(checkServerStatus, 5e3);
  const baseInterval = 5 * 6e4;
  const scheduleNext = () => {
    const jitter = Math.floor(Math.random() * 12e4);
    statusInterval = setTimeout(() => {
      checkServerStatus();
      scheduleNext();
    }, baseInterval + jitter);
  };
  scheduleNext();
}
function handleDoubleCopy() {
  if (!windowManager.isPopupVisible() || !currentPopupData) return;
  const textToCopy = extractCopyText(currentPopupData);
  if (textToCopy) {
    electron$1.clipboard.writeText(textToCopy);
    windowManager.closePopup();
  }
}
function handleClipboardUpper() {
  const text = electron$1.clipboard.readText();
  if (text) {
    const upperText = text.toLocaleUpperCase("tr-TR");
    electron$1.clipboard.writeText(upperText);
    if (process.platform === "win32") {
      const vbsPath = path__namespace.join(electron$1.app.getPath("userData"), "paste.vbs");
      try {
        if (!fs__namespace.existsSync(vbsPath)) {
          fs__namespace.writeFileSync(vbsPath, 'WScript.Sleep 100\r\nSet w = CreateObject("WScript.Shell")\r\nw.SendKeys "^v"\r\n');
        }
        child_process.exec(`wscript.exe "${vbsPath}"`, (err) => {
          if (err) {
            console.error("VBScript paste failed:", err);
          }
        });
      } catch (e) {
        console.error("Error simulating paste:", e);
      }
    }
  }
}
function shouldSkipDetection(serial) {
  if (!currentSettings.isLoggedIn) return true;
  if (currentSettings.preventDuplicatePopup && serial === lastDetectedSerial) return true;
  return false;
}
async function processWarrantyRequest(serial) {
  const cached = await getCachedData(serial);
  if (cached && !isCacheEntryStale(cached)) return cached;
  if (cached) await deleteEntry(serial);
  const warrantyInfo = await checkWarranty(serial);
  await saveToCache(serial, warrantyInfo);
  return warrantyInfo;
}
async function handleDetection(serial) {
  if (shouldSkipDetection(serial)) return;
  lastDetectedSerial = serial;
  try {
    const data = await processWarrantyRequest(serial);
    currentPopupData = data;
    windowManager.showPopup(data, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
    windowManager.getMainWindow()?.webContents.send("refresh-cards");
    checkPriorityMatch(serial);
  } catch (error) {
    windowManager.showPopup({
      serial,
      warranty_status: "İnternet Bağlantı Hatası",
      is_error: true
    }, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
  }
}
function checkPriorityMatch(serial) {
  if (!serial) return;
  const match = cachedPriorityDevices.find(
    (d) => d.serial && d.serial.toUpperCase() === serial.toUpperCase()
  );
  if (match) {
    windowManager.getMainWindow()?.webContents.send("priority-device-match", match);
    windowManager.showPopup({
      variant: "priority",
      id: match.id,
      serial,
      customer_name: match.customer_name,
      description: match.description,
      created_by: match.created_by,
      anchorDelay: currentSettings.popupTimeout
    }, 15e3, currentSettings.popupSizeLevel);
  }
}
function setupIpcHandlers() {
  electron$1.ipcMain.handle("get-cached-data", async () => await loadCache());
  electron$1.ipcMain.handle("get-double-copy", async () => currentSettings.doubleCopyEnabled);
  electron$1.ipcMain.handle("get-settings", async () => ({
    popupTimeout: currentSettings.popupTimeout,
    popupSizeLevel: currentSettings.popupSizeLevel,
    doubleCopyEnabled: currentSettings.doubleCopyEnabled,
    autoStartEnabled: currentSettings.autoStartEnabled,
    preventDuplicatePopup: currentSettings.preventDuplicatePopup,
    clipboardUpperEnabled: currentSettings.clipboardUpperEnabled !== false,
    shortcuts: currentSettings.shortcuts,
    role: currentSettings.role,
    personnelName: currentSettings.personnelName,
    username: currentSettings.username,
    isAdmin: currentSettings.isAdmin,
    isLoggedIn: currentSettings.isLoggedIn,
    theme: currentSettings.theme,
    workingHours: currentSettings.workingHours,
    rememberMe: currentSettings.rememberMe,
    autoLogin: currentSettings.autoLogin,
    savedUsername: currentSettings.savedUsername,
    savedPassword: currentSettings.savedPassword
  }));
  electron$1.ipcMain.handle("save-settings", async (_, settings) => {
    currentSettings = { ...currentSettings, ...settings };
    saveSettings(currentSettings);
    registerShortcuts();
    startTicketListener();
    electron$1.app.setLoginItemSettings({
      openAtLogin: currentSettings.autoStartEnabled,
      path: electron$1.app.getPath("exe")
    });
    return true;
  });
  electron$1.ipcMain.handle("restart-app", async (_, settings) => {
    if (settings) {
      currentSettings = { ...currentSettings, ...settings };
      saveSettings(currentSettings);
    }
    electron$1.app.relaunch();
    electron$1.app.exit(0);
  });
  electron$1.ipcMain.handle("logout", async () => {
    currentSettings = {
      ...currentSettings,
      isLoggedIn: false,
      personnelName: "",
      role: "kargo_kabul",
      username: "",
      isAdmin: false,
      autoLogin: false
    };
    saveSettings(currentSettings);
    clipboardMonitor.stop();
    monitoringEnabled = true;
    if (statusInterval) {
      clearTimeout(statusInterval);
      statusInterval = null;
    }
    if (ticketUnsubscribe) {
      ticketUnsubscribe();
      ticketUnsubscribe = null;
    }
    if (priorityUnsubscribe) {
      priorityUnsubscribe();
      priorityUnsubscribe = null;
    }
    if (deviceCallsUnsubscribe) {
      deviceCallsUnsubscribe();
      deviceCallsUnsubscribe = null;
    }
    windowManager.closeAllDeviceCallToasts();
    electron$1.globalShortcut.unregisterAll();
    windowManager.closePopup();
    windowManager.closePriorityPopup();
    windowManager.getMainWindow()?.hide();
    const loginWindow = windowManager.getLoginWindow() || windowManager.createLoginWindow();
    loginWindow.show();
    loginWindow.focus();
    return true;
  });
  electron$1.ipcMain.on("toggle-monitoring", (_, enabled) => {
    monitoringEnabled = enabled;
    clipboardMonitor.setEnabled(enabled);
    windowManager.getMainWindow()?.webContents.send("monitoring-toggled", monitoringEnabled);
  });
  electron$1.ipcMain.on("open-settings", () => {
    windowManager.getMainWindow()?.webContents.send("switch-view", "settings");
    windowManager.getMainWindow()?.show();
  });
  electron$1.ipcMain.on("open-bonus", () => {
    windowManager.getMainWindow()?.webContents.send("switch-view", "bonus");
    windowManager.getMainWindow()?.show();
  });
  electron$1.ipcMain.on("open-admin", () => {
    windowManager.getMainWindow()?.webContents.send("switch-view", "admin");
    windowManager.getMainWindow()?.show();
  });
  electron$1.ipcMain.on("open-profile", () => {
    windowManager.getMainWindow()?.webContents.send("switch-view", "profile");
    windowManager.getMainWindow()?.show();
  });
  electron$1.ipcMain.on("open-priority", () => {
    windowManager.getMainWindow()?.webContents.send("switch-view", "priority");
    windowManager.getMainWindow()?.show();
  });
  electron$1.ipcMain.on("open-tickets", () => {
    windowManager.getMainWindow()?.webContents.send("switch-view", "tickets");
    windowManager.getMainWindow()?.show();
  });
  electron$1.ipcMain.handle("login-success", async () => {
    windowManager.onLoginSuccess();
    clipboardMonitor.start();
    startServerStatusMonitor();
    startTicketListener();
    startPriorityDevicesListener();
    startDeviceCallsListener();
    registerShortcuts();
    return true;
  });
  electron$1.ipcMain.on("minimize-window", (e) => {
    const win = electron$1.BrowserWindow.fromWebContents(e.sender);
    win?.minimize();
  });
  electron$1.ipcMain.on("close-window", (e) => {
    const win = electron$1.BrowserWindow.fromWebContents(e.sender);
    win?.close();
  });
  electron$1.ipcMain.on("show-login-window", () => {
    const loginWindow = windowManager.getLoginWindow() || windowManager.createLoginWindow();
    loginWindow.show();
    loginWindow.focus();
  });
  electron$1.ipcMain.on("open-main-view", (_, view) => {
    const mainWindow = windowManager.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("switch-view", view);
  });
  electron$1.ipcMain.on("open-priority-device", (_, device) => {
    const mainWindow = windowManager.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("switch-view", "priority");
    setTimeout(() => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send("focus-priority-device", device);
      }
    }, 180);
  });
  electron$1.ipcMain.handle("calculate-bonus", async (_, fileData, customHours) => {
    try {
      const settings = loadSettings();
      let buffer;
      if (typeof fileData === "string") {
        buffer = fs__namespace.readFileSync(fileData);
      } else {
        buffer = Buffer.from(fileData);
      }
      const workingHours = customHours || settings.workingHours || { start: "08:00", end: "18:30" };
      return parseBonusData(buffer, workingHours);
    } catch (error) {
      console.error("Bonus calculation error:", error);
      throw error;
    }
  });
  electron$1.ipcMain.handle("calculate-zreport", async (_, fileData) => {
    try {
      let buffer;
      if (typeof fileData === "string") {
        buffer = fs__namespace.readFileSync(fileData);
      } else {
        buffer = Buffer.from(fileData);
      }
      return parseZReportData(buffer);
    } catch (error) {
      console.error("Z-Report calculation error:", error);
      throw error;
    }
  });
  electron$1.ipcMain.handle("toggle-double-copy", async (_, enabled) => {
    currentSettings.doubleCopyEnabled = enabled;
    saveSettings(currentSettings);
    return enabled;
  });
  electron$1.ipcMain.handle("save-note", async () => {
  });
  electron$1.ipcMain.handle("get-note", async () => null);
  electron$1.ipcMain.on("popup-hover-enter", () => {
    windowManager.pausePopupTimeout();
  });
  electron$1.ipcMain.on("popup-hover-leave", () => {
    windowManager.resumePopupTimeout();
  });
  electron$1.ipcMain.handle("clear-cache", async () => {
    await clearCache();
    return await loadCache();
  });
  electron$1.ipcMain.on("manual-server-status-refresh", () => {
    checkServerStatus();
  });
  electron$1.ipcMain.handle("delete-entry", async (_, s) => {
    await deleteEntry(s);
    return await loadCache();
  });
  electron$1.ipcMain.handle("get-users", async () => {
    try {
      return await getUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  });
  electron$1.ipcMain.handle("create-user", async (_, data) => {
    try {
      const id = await createUser(data);
      return { success: true, id };
    } catch (error) {
      console.error("Error creating user:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("update-user", async (_, id, data) => {
    try {
      await updateUser(id, data);
      return { success: true };
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("delete-user", async (_, id) => {
    try {
      await deleteUser(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("reset-user-xp", async (_, id) => {
    try {
      await resetUserXp(id);
      return { success: true };
    } catch (error) {
      console.error("Error resetting XP:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("get-tickets", async () => cachedTickets);
  electron$1.ipcMain.handle("create-ticket", async (_, data) => {
    try {
      const id = await createTicket(data);
      return { success: true, id };
    } catch (error) {
      console.error("Error creating ticket:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("claim-ticket", async (_, id, name) => {
    try {
      await claimTicket(id, name);
      return { success: true };
    } catch (error) {
      console.error("Error claiming ticket:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("complete-ticket", async (_, id, response) => {
    try {
      await completeTicket(id, response);
      return { success: true };
    } catch (error) {
      console.error("Error completing ticket:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("reopen-ticket", async (_, id, name) => {
    try {
      await reopenTicket(id, name);
      return { success: true };
    } catch (error) {
      console.error("Error reopening ticket:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("update-ticket-details", async (_, id, details) => {
    try {
      await updateTicketDetails(id, details);
      return { success: true };
    } catch (error) {
      console.error("Error updating ticket details:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("mark-ticket-unreachable", async (_, id, name) => {
    try {
      await markTicketUnreachable(id, name);
      return { success: true };
    } catch (error) {
      console.error("Error marking ticket unreachable:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("hide-ticket", async (_, id, personnelName) => {
    try {
      await hideTicket(id, personnelName);
      return { success: true };
    } catch (error) {
      console.error("Error hiding ticket:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("unhide-ticket", async (_, id) => {
    try {
      await unhideTicket(id);
      return { success: true };
    } catch (error) {
      console.error("Error unhiding ticket:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("delete-ticket", async (_, id) => {
    try {
      await deleteTicket(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting ticket:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("get-priority-devices", async () => cachedPriorityDevices);
  electron$1.ipcMain.handle("add-priority-device", async (_, data) => {
    try {
      const id = await addPriorityDevice(data);
      return { success: true, id };
    } catch (error) {
      console.error("Error adding priority device:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("delete-priority-device", async (_, id) => {
    try {
      await deletePriorityDevice(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting priority device:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("update-priority-device", async (_, id, data) => {
    try {
      await updatePriorityDevice(id, data);
      return { success: true };
    } catch (error) {
      console.error("Error updating priority device:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("create-device-call", async (_, data) => {
    try {
      const id = await createDeviceCall(data);
      return { success: true, id };
    } catch (error) {
      console.error("Error creating device call:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.handle("resolve-device-call", async (_, id, resolved_by) => {
    try {
      await resolveDeviceCall(id, resolved_by);
      return { success: true };
    } catch (error) {
      console.error("Error resolving device call:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.on("device-call-action", async (_, payload) => {
    const { action, callId } = payload;
    if (action === "here") {
      const myName = currentSettings.personnelName || "Bilinmiyor";
      try {
        await resolveDeviceCall(callId, myName);
      } catch (err) {
        console.error("device-call-action here error:", err);
      }
    } else if (action === "cancel") {
      try {
        await cancelDeviceCall(callId);
      } catch (err) {
        console.error("device-call-action cancel error:", err);
        windowManager.closeDeviceCallToast(callId);
      }
    } else if (action === "nothere") {
      const myName = currentSettings.personnelName || "Bilinmiyor";
      try {
        await dismissDeviceCallBy(callId, myName);
      } catch (err) {
        console.error("device-call-action nothere error:", err);
      }
      windowManager.closeDeviceCallToast(callId);
    }
  });
}
function normalizeName(str) {
  return (str || "").toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/\s+/g, "").trim();
}
function startDeviceCallsListener() {
  if (deviceCallsUnsubscribe) {
    deviceCallsUnsubscribe();
    deviceCallsUnsubscribe = null;
  }
  const shownCalls = /* @__PURE__ */ new Map();
  deviceCallsUnsubscribe = subscribeToDeviceCalls((calls) => {
    const mainWin = windowManager.getMainWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send("device-calls-update", calls);
    }
    const myName = currentSettings.personnelName || "";
    const myUsername = currentSettings.username || "";
    const myRole = currentSettings.role;
    if (myRole !== "kargo_kabul") return;
    calls.forEach((call) => {
      const creatorClean = normalizeName(call.created_by);
      const isMine = creatorClean !== "" && (creatorClean === normalizeName(myName) || creatorClean === normalizeName(myUsername));
      const prevStatus = shownCalls.get(call.id);
      if (call.status === "active") {
        if (!prevStatus) {
          windowManager.showDeviceCallToast(call.id, {
            ...call,
            isMine
          });
          shownCalls.set(call.id, "active");
          if (!isMine && myName) {
            markDeviceCallRecipient(call.id, myName).catch(
              (err) => console.error("markDeviceCallRecipient error:", err)
            );
          }
        } else if (prevStatus === "active" && isMine) {
          windowManager.sendDeviceCallStatusUpdate(call.id, {
            recipients: call.recipients || [],
            dismissed_by: call.dismissed_by || []
          });
        }
      } else if (call.status === "resolved" || call.status === "cancelled") {
        if (prevStatus === "active") {
          if (call.status === "resolved" && isMine && call.resolved_by) {
            windowManager.sendDeviceCallToastResolve(call.id, call);
            setTimeout(() => windowManager.closeDeviceCallToast(call.id), 8e3);
          } else {
            windowManager.closeDeviceCallToast(call.id);
          }
          shownCalls.set(call.id, call.status);
        }
      }
    });
    const currentIds = new Set(calls.map((c) => c.id));
    shownCalls.forEach((_, id) => {
      if (!currentIds.has(id)) {
        windowManager.closeDeviceCallToast(id);
        shownCalls.delete(id);
      }
    });
  });
}
function createTray() {
  const mainWindow = windowManager.getMainWindow();
  let iconPath = path__namespace.join(__dirname, "../../assets/logo.png");
  if (!fs__namespace.existsSync(iconPath)) {
    iconPath = path__namespace.join(process.resourcesPath, "assets/logo.png");
  }
  const icon = electron$1.nativeImage.createFromPath(iconPath);
  tray = new electron$1.Tray(icon);
  tray.setToolTip("RecciTek WCheck");
  tray.setContextMenu(electron$1.Menu.buildFromTemplate([
    { label: "Çıkış", click: () => windowManager.forceQuit() }
  ]));
  tray.on("double-click", () => {
    if (currentSettings && currentSettings.isLoggedIn) {
      mainWindow?.show();
      mainWindow?.focus();
    } else {
      const loginWin = windowManager.getLoginWindow();
      loginWin?.show();
      loginWin?.focus();
    }
  });
}
function registerShortcuts() {
  electron$1.globalShortcut.unregisterAll();
  if (!currentSettings || !currentSettings.isLoggedIn) return;
  if (currentSettings.doubleCopyEnabled) {
    try {
      electron$1.globalShortcut.register("CommandOrControl+Shift+C", () => {
        handleDoubleCopy();
      });
    } catch (e) {
      console.error("Failed to register double copy shortcut:", e);
    }
  }
  if (currentSettings.clipboardUpperEnabled !== false) {
    try {
      electron$1.globalShortcut.register("CommandOrControl+Shift+V", () => {
        handleClipboardUpper();
      });
    } catch (e) {
      console.error("Failed to register clipboard upper shortcut:", e);
    }
  }
  if (currentSettings.shortcuts) {
    if (currentSettings.shortcuts.clearCache) {
      try {
        electron$1.globalShortcut.register(currentSettings.shortcuts.clearCache, async () => {
          await clearCache();
          const win = windowManager.getMainWindow();
          if (win) {
            win.webContents.send("cache-cleared");
          }
        });
      } catch (e) {
        console.error("Failed to register clearCache shortcut:", e);
      }
    }
    if (currentSettings.shortcuts.toggleMonitoring) {
      try {
        electron$1.globalShortcut.register(currentSettings.shortcuts.toggleMonitoring, () => {
          monitoringEnabled = !monitoringEnabled;
          clipboardMonitor.setEnabled(monitoringEnabled);
          const win = windowManager.getMainWindow();
          if (win) {
            win.webContents.send("monitoring-toggled", monitoringEnabled);
          }
        });
      } catch (e) {
        console.error("Failed to register toggleMonitoring shortcut:", e);
      }
    }
  }
}
function startPriorityDevicesListener() {
  if (priorityUnsubscribe) {
    priorityUnsubscribe();
    priorityUnsubscribe = null;
  }
  priorityUnsubscribe = subscribeToPriorityDevices((devices) => {
    cachedPriorityDevices = devices;
    electron$1.BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send("priority-devices-update", devices);
      }
    });
  });
}
function startTicketListener() {
  if (ticketUnsubscribe) {
    ticketUnsubscribe();
    ticketUnsubscribe = null;
  }
  const broadcastTickets = (tickets) => {
    if (cachedTickets.length > 0) {
      const oldMap = new Map(cachedTickets.map((t) => [t.id, t]));
      tickets.forEach((ticket) => {
        const old = oldMap.get(ticket.id);
        if (!old && ticket.status === "pending" && currentSettings.role === "mh") {
          new electron$1.Notification({
            title: "Yeni Talep",
            body: `${ticket.serial || "Bilinmeyen"} için yeni bilgi talebi`,
            silent: true
          }).show();
        } else if (old && old.status !== ticket.status) {
          if (currentSettings.role === "kargo_kabul" && ticket.created_by === (currentSettings.personnelName || "İsimsiz Personel")) {
            if (ticket.status === "completed") {
              new electron$1.Notification({
                title: "Talep Tamamlandı",
                body: `${ticket.serial || "Bilinmeyen"} talebiniz tamamlandı`,
                silent: true
              }).show();
            }
          }
        }
      });
    }
    cachedTickets = tickets;
    electron$1.BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send("ticket-update", tickets);
      }
    });
  };
  if (currentSettings.role === "mh") {
    ticketUnsubscribe = subscribeAsMH(broadcastTickets);
  } else {
    const name = (currentSettings.personnelName || "İsimsiz Personel").replace(/\s/g, "").toUpperCase();
    ticketUnsubscribe = subscribeAsKargoKabul(name, broadcastTickets);
  }
}
function initializeApp() {
  currentSettings = loadSettings();
  currentSettings.isLoggedIn = false;
  windowManager = new WindowManager(__dirname);
  clipboardMonitor = new ClipboardMonitor(handleDetection);
  registerShortcuts();
  monitoringEnabled = true;
  const wasOpenedAtLogin = electron$1.app.getLoginItemSettings().wasOpenedAtLogin === true;
  const splash = wasOpenedAtLogin ? null : windowManager.createSplashWindow();
  const startupDelay = wasOpenedAtLogin ? 0 : 1800;
  setTimeout(() => {
    try {
      splash?.close();
    } catch {
    }
    const shouldAutoLogin = !!(currentSettings.autoLogin && currentSettings.rememberMe && currentSettings.savedUsername && currentSettings.savedPassword);
    windowManager.createMainWindow();
    windowManager.createLoginWindow(!shouldAutoLogin);
    createTray();
    electron$1.app.setLoginItemSettings({
      openAtLogin: currentSettings.autoStartEnabled,
      path: electron$1.app.getPath("exe")
    });
  }, startupDelay);
  setupIpcHandlers();
}
electron$1.app.whenReady().then(() => {
  if (process.platform === "win32") {
    electron$1.app.setAppUserModelId("RecciTek WCheck");
  }
  initCache();
  initializeApp();
  if (!is.dev) {
    electronUpdater.autoUpdater.autoDownload = false;
    electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
    electronUpdater.autoUpdater.on("update-available", (info) => {
      const mainWindow = windowManager?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-available", info.version);
      }
    });
    electronUpdater.autoUpdater.on("update-not-available", () => {
      const mainWindow = windowManager?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-not-available");
      }
    });
    electronUpdater.autoUpdater.on("error", (err) => {
      const mainWindow = windowManager?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-error", err?.message || "Bilinmeyen hata");
      }
    });
    electronUpdater.autoUpdater.on("download-progress", (progress) => {
      const mainWindow = windowManager?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-progress", Math.round(progress.percent));
      }
    });
    electronUpdater.autoUpdater.on("update-downloaded", () => {
      const mainWindow = windowManager?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-downloaded");
      }
    });
    let lastUpdateCheckResult = null;
    electron$1.ipcMain.handle("check-for-updates", async () => {
      try {
        const result = await electronUpdater.autoUpdater.checkForUpdates();
        lastUpdateCheckResult = result;
        return { success: true, updateInfo: result?.updateInfo };
      } catch (err) {
        return { success: false, error: err?.message || "Güncelleme kontrolü başarısız" };
      }
    });
    electron$1.ipcMain.on("start-update-download", async () => {
      try {
        if (lastUpdateCheckResult?.cancellationToken) {
          await electronUpdater.autoUpdater.downloadUpdate(lastUpdateCheckResult.cancellationToken);
        } else {
          const result = await electronUpdater.autoUpdater.checkForUpdates();
          lastUpdateCheckResult = result;
          if (result?.cancellationToken) {
            await electronUpdater.autoUpdater.downloadUpdate(result.cancellationToken);
          } else {
            await electronUpdater.autoUpdater.downloadUpdate();
          }
        }
      } catch (err) {
        console.error("Download update error:", err?.message);
        const mainWindow = windowManager?.getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("update-error", err?.message || "İndirme başarısız");
        }
      }
    });
    electron$1.ipcMain.on("install-update", () => {
      electronUpdater.autoUpdater.autoInstallOnAppQuit = false;
      electronUpdater.autoUpdater.quitAndInstall(false, true);
      setTimeout(() => electron$1.app.exit(0), 500);
    });
    setTimeout(() => {
      electronUpdater.autoUpdater.checkForUpdates().then((result) => {
        lastUpdateCheckResult = result;
      }).catch((err) => {
        console.log("Startup update check failed:", err?.message);
      });
    }, 3e3);
  }
});
electron$1.app.on("will-quit", () => {
  electron$1.globalShortcut.unregisterAll();
  if (ticketUnsubscribe) {
    ticketUnsubscribe();
    ticketUnsubscribe = null;
  }
  if (priorityUnsubscribe) {
    priorityUnsubscribe();
    priorityUnsubscribe = null;
  }
  if (deviceCallsUnsubscribe) {
    deviceCallsUnsubscribe();
    deviceCallsUnsubscribe = null;
  }
});
electron$1.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron$1.app.quit();
});
