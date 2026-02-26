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
    const html = await makeRequest(`https://garantibelgesi.recciteknoloji.com/sorgu/${serial}`);
    const dom = new jsdom.JSDOM(html);
    const document = dom.window.document;
    const body = document.body;
    if (body && body.textContent.includes("Ürün Resmi Roborock Türkiye Garanti Kapsamındadır.")) {
      const modelElement = document.querySelector("html > body > div > div:nth-child(3) > div > div:nth-child(2) > a > h3");
      let modelInfo = modelElement ? modelElement.textContent.trim() : "";
      if (!modelInfo) {
        const allElements = document.querySelectorAll("*");
        for (const element of allElements) {
          const text = element.textContent.trim();
          if (text.includes("ROBOROCK") && (text.includes("BEYAZ") || text.includes("SİYAH"))) {
            modelInfo = text;
            break;
          }
        }
      }
      let model_name = "Model Bulunamadı";
      let model_color = "Renk Bulunamadı";
      if (modelInfo) {
        modelInfo = modelInfo.replace(/\s+/g, " ").trim();
        if (modelInfo.includes("ROBOROCK") && (modelInfo.includes("BEYAZ") || modelInfo.includes("SİYAH"))) {
          const parts = modelInfo.split(" ");
          if (parts.length >= 3) {
            model_name = parts.slice(1, -1).join(" ").trim();
            model_color = parts[parts.length - 1].trim();
          }
        } else {
          model_name = modelInfo.trim();
        }
        model_name = model_name.toUpperCase();
        if (model_name.includes("QREVO")) {
          model_name = model_name.replace("QREVO", "Q REVO");
        }
        model_name = model_name.replace(/SON[Iİ]C/g, "").trim();
      }
      return {
        serial,
        warranty_status: "RECCI GARANTILI",
        model_name,
        model_color
      };
    } else if (body && body.textContent.includes("Bu ürün Roborock Türkiye Garanti kapsamında değildir!")) {
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
  } catch (err) {
    console.error("Error in initCache:", err);
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
const is = {
  dev: !electron$1.app.isPackaged
};
({
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
});
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
    shortcuts: {
      clearCache: "CommandOrControl+Shift+X",
      toggleMonitoring: "CommandOrControl+Shift+C"
    },
    role: "kargo_kabul",
    personnelName: "",
    theme: "dark",
    workingHours: {
      start: "08:00",
      end: "18:30"
    }
  };
  try {
    const p = getSettingsPath();
    if (fs__namespace.existsSync(p)) {
      const savedSettings = JSON.parse(fs__namespace.readFileSync(p, "utf8"));
      return { ...defaultSettings, ...savedSettings };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return defaultSettings;
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
    this.settingsWindow = null;
    this.bonusWindow = null;
    this.ticketsWindow = null;
    this.currentPopup = null;
    this.popupTimeout = null;
    this.popupVisible = false;
    this.popupStartTime = 0;
    this.popupDuration = 0;
    this.popupRemaining = 0;
    this.preloadPath = "";
    this.preloadPath = path__namespace.join(__dirname, "../preload/index.js");
  }
  loadFile(win, fileName) {
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/${fileName}`);
    } else {
      win.loadFile(path__namespace.join(__dirname, `../renderer/${fileName}`));
    }
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
    this.mainWindow = new electron$1.BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 475,
      minHeight: 400,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      },
      icon: path__namespace.join(__dirname, "../../assets/logo.png"),
      autoHideMenuBar: true
    });
    this.loadFile(this.mainWindow, "index.html");
    this.mainWindow.on("close", (e) => {
      if (this.mainWindow) {
        e.preventDefault();
        this.mainWindow.hide();
      }
    });
    this.mainWindow.once("ready-to-show", () => this.mainWindow?.show());
    return this.mainWindow;
  }
  getMainWindow() {
    return this.mainWindow;
  }
  openSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return;
    }
    this.settingsWindow = new electron$1.BrowserWindow({
      width: 720,
      height: 520,
      resizable: false,
      frame: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      },
      title: "Ayarlar",
      autoHideMenuBar: true
    });
    this.settingsWindow.setMenuBarVisibility(false);
    this.loadFile(this.settingsWindow, "settings.html");
    this.settingsWindow.on("closed", () => {
      this.settingsWindow = null;
    });
  }
  openBonusWindow() {
    if (this.bonusWindow && !this.bonusWindow.isDestroyed()) {
      this.bonusWindow.focus();
      return;
    }
    this.bonusWindow = new electron$1.BrowserWindow({
      width: 900,
      height: 700,
      resizable: true,
      frame: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      },
      title: "Prim Hesaplama",
      autoHideMenuBar: true
    });
    this.bonusWindow.setMenuBarVisibility(false);
    this.loadFile(this.bonusWindow, "bonus.html");
    this.bonusWindow.on("closed", () => {
      this.bonusWindow = null;
    });
  }
  openTicketsWindow() {
    if (this.ticketsWindow && !this.ticketsWindow.isDestroyed()) {
      this.ticketsWindow.focus();
      return;
    }
    this.ticketsWindow = new electron$1.BrowserWindow({
      width: 1e3,
      height: 700,
      resizable: true,
      frame: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      },
      title: "Bildirim Paneli",
      autoHideMenuBar: true
    });
    this.ticketsWindow.setMenuBarVisibility(false);
    this.loadFile(this.ticketsWindow, "tickets.html");
    this.ticketsWindow.on("closed", () => {
      this.ticketsWindow = null;
    });
  }
  showPopup(info, timeoutDuration, sizeLevel) {
    this.closePopup();
    const size = POPUP_SIZE_LEVELS.find((l) => l.level === sizeLevel) || POPUP_SIZE_LEVELS[2];
    const { width, height } = electron$1.screen.getPrimaryDisplay().workAreaSize;
    this.currentPopup = new electron$1.BrowserWindow({
      width: size.width,
      height: size.height,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      x: width - size.width - 20,
      y: height - size.height - 40,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.preloadPath
      }
    });
    this.loadFile(this.currentPopup, size.file);
    this.currentPopup.once("ready-to-show", () => {
      if (this.currentPopup) {
        this.currentPopup.show();
        this.popupVisible = true;
        const settings = loadSettings();
        const infoWithSize = { ...info, sizeLevel, theme: settings.theme || "dark" };
        this.currentPopup.webContents.send("popup-data", infoWithSize, timeoutDuration);
        this.popupDuration = timeoutDuration;
        this.popupStartTime = Date.now();
        this.popupRemaining = timeoutDuration;
        this.popupTimeout = setTimeout(() => {
          this.closePopup();
        }, timeoutDuration);
      }
    });
    const popup = this.currentPopup;
    popup.on("closed", () => {
      if (this.currentPopup === popup) {
        this.currentPopup = null;
        this.popupVisible = false;
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
      this.popupTimeout = setTimeout(() => {
        this.closePopup();
      }, this.popupRemaining);
    }
  }
  forceQuit() {
    [this.mainWindow, this.settingsWindow, this.currentPopup].forEach((win) => {
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
function parseBonusData(buffer, workingHours) {
  const workbook = XLSX__namespace.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX__namespace.utils.sheet_to_json(worksheet, { header: 1 });
  const monthlyStats = {};
  const [startH, startM] = workingHours.start.split(":").map(Number);
  const [endH, endM] = workingHours.end.split(":").map(Number);
  rows.forEach((row) => {
    let dateCell = row[14];
    if (dateCell) {
      let date;
      try {
        if (dateCell instanceof Date) {
          date = dateCell;
        } else if (typeof dateCell === "string") {
          const formatStr = dateCell.includes("/") ? "dd/MM/yyyy HH:mm" : "dd-MM-yyyy HH:mm";
          date = dateFns.parse(dateCell, formatStr, /* @__PURE__ */ new Date());
        } else if (typeof dateCell === "number") {
          date = XLSX__namespace.SSF.parse_date_code(dateCell);
          date = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S));
        } else {
          return;
        }
        if (isNaN(date.getTime())) return;
        const monthKey = dateFns.format(date, "MM-yyyy");
        const dayKey = dateFns.format(date, "yyyy-MM-dd");
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            total: 0,
            valid: 0,
            overtime: 0,
            date: dateFns.startOfMonth(date),
            days: {}
          };
        }
        if (!monthlyStats[monthKey].days[dayKey]) {
          monthlyStats[monthKey].days[dayKey] = { valid: 0, overtime: 0 };
        }
        monthlyStats[monthKey].total++;
        const startLimit = dateFns.setMinutes(dateFns.setHours(new Date(date), startH), startM);
        const endLimit = dateFns.setMinutes(dateFns.setHours(new Date(date), endH), endM);
        if (dateFns.isWithinInterval(date, { start: startLimit, end: endLimit })) {
          monthlyStats[monthKey].valid++;
          monthlyStats[monthKey].days[dayKey].valid++;
        } else {
          monthlyStats[monthKey].overtime++;
          monthlyStats[monthKey].days[dayKey].overtime++;
        }
      } catch (e) {
      }
    }
  });
  const monthNamesTr = {
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
  const sortedMonthKeys = Object.keys(monthlyStats).sort(
    (a, b) => dateFns.compareDesc(monthlyStats[a].date, monthlyStats[b].date)
  );
  const results = sortedMonthKeys.map((key) => {
    const stats = monthlyStats[key];
    const [m, y] = key.split("-");
    const dailyStats = Object.keys(stats.days).sort().map((dKey) => ({
      date: dKey,
      validCount: stats.days[dKey].valid,
      overtimeCount: stats.days[dKey].overtime
    }));
    return {
      month: `${monthNamesTr[m]} ${y}`,
      totalCount: stats.total,
      validCount: stats.valid,
      overtimeCount: stats.overtime,
      isEligible: stats.valid >= 850,
      dailyStats
    };
  });
  if (results.length > 1) {
    results.pop();
  }
  return results;
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
async function createTicket(data) {
  const docRef = await firestore.addDoc(firestore.collection(db, TICKETS_COLLECTION), {
    ...data,
    created_at: firestore.serverTimestamp(),
    status: "pending",
    response: "",
    responded_by: "",
    responded_at: null
  });
  return docRef.id;
}
async function claimTicket(ticketId, personnelName) {
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
    status: "in_progress",
    responded_by: personnelName
  });
}
async function completeTicket(ticketId, response) {
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
    status: "completed",
    response,
    responded_at: firestore.serverTimestamp()
  });
}
async function updateTicketDetails(ticketId, details) {
  await firestore.updateDoc(firestore.doc(db, TICKETS_COLLECTION, ticketId), {
    ...details
  });
}
function subscribeAsKargoKabul(personnelName, callback) {
  const q = firestore.query(
    firestore.collection(db, TICKETS_COLLECTION),
    firestore.orderBy("created_at", "desc"),
    firestore.limit(200)
  );
  return firestore.onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: data.created_at ? data.created_at.toMillis() : null,
        responded_at: data.responded_at ? data.responded_at.toMillis() : null
      };
    });
    tickets.sort((a, b) => {
      const timeA = a.created_at || 0;
      const timeB = b.created_at || 0;
      return timeB - timeA;
    });
    callback(tickets);
  }, (error) => {
    console.error("Firestore listener error (KK):", error);
  });
}
function subscribeAsMH(callback) {
  const q = firestore.query(
    firestore.collection(db, TICKETS_COLLECTION),
    firestore.orderBy("created_at", "desc"),
    firestore.limit(200)
  );
  return firestore.onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: data.created_at ? data.created_at.toMillis() : null,
        responded_at: data.responded_at ? data.responded_at.toMillis() : null
      };
    });
    tickets.sort((a, b) => {
      const timeA = a.created_at || 0;
      const timeB = b.created_at || 0;
      return timeB - timeA;
    });
    callback(tickets);
  }, (error) => {
    console.error("Firestore listener error (MH):", error);
  });
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
let cachedTickets = [];
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
      url: "https://garantibelgesi.recciteknoloji.com/",
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
async function handleDetection(serial) {
  if (currentSettings.preventDuplicatePopup && serial === lastDetectedSerial) {
    return;
  }
  lastDetectedSerial = serial;
  const cached = await getCachedData(serial);
  if (cached) {
    currentPopupData = cached;
    windowManager.showPopup(cached, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
    windowManager.getMainWindow()?.webContents.send("refresh-cards");
    return;
  }
  try {
    const warrantyInfo = await checkWarranty(serial);
    await saveToCache(serial, warrantyInfo);
    currentPopupData = warrantyInfo;
    windowManager.showPopup(warrantyInfo, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
    windowManager.getMainWindow()?.webContents.send("refresh-cards");
  } catch {
    windowManager.showPopup({
      serial,
      warranty_status: "İnternet Bağlantı Hatası",
      is_error: true
    }, currentSettings.popupTimeout, currentSettings.popupSizeLevel);
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
    shortcuts: currentSettings.shortcuts,
    role: currentSettings.role,
    personnelName: currentSettings.personnelName
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
  electron$1.ipcMain.on("toggle-monitoring", (_, enabled) => {
    monitoringEnabled = enabled;
    clipboardMonitor.setEnabled(enabled);
    windowManager.getMainWindow()?.webContents.send("monitoring-toggled", monitoringEnabled);
  });
  electron$1.ipcMain.on("open-settings", () => {
    windowManager.openSettingsWindow();
  });
  electron$1.ipcMain.on("open-bonus", () => {
    windowManager.openBonusWindow();
  });
  electron$1.ipcMain.handle("calculate-bonus", async (_, filePath, customHours) => {
    try {
      const settings = loadSettings();
      const buffer = fs__namespace.readFileSync(filePath);
      const workingHours = customHours || settings.workingHours || { start: "08:00", end: "18:30" };
      return parseBonusData(buffer, workingHours);
    } catch (error) {
      console.error("Bonus calculation error:", error);
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
  electron$1.ipcMain.handle("update-ticket-details", async (_, id, details) => {
    try {
      await updateTicketDetails(id, details);
      return { success: true };
    } catch (error) {
      console.error("Error updating ticket details:", error);
      return { success: false, error: String(error) };
    }
  });
  electron$1.ipcMain.on("open-tickets", () => {
    windowManager.openTicketsWindow();
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
    mainWindow?.show();
    mainWindow?.focus();
  });
}
function registerShortcuts() {
  electron$1.globalShortcut.unregisterAll();
  if (currentSettings.doubleCopyEnabled) {
    try {
      electron$1.globalShortcut.register("CommandOrControl+Shift+C", () => {
        handleDoubleCopy();
      });
    } catch (e) {
      console.error("Failed to register double copy shortcut:", e);
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
          if (ticket.status === "in_progress" && currentSettings.role === "kargo_kabul") {
            new electron$1.Notification({
              title: "Talep Üstlenildi",
              body: `${ticket.serial || "Bilinmeyen"} talebiniz üstlenildi`,
              silent: true
            }).show();
          } else if (ticket.status === "completed" && currentSettings.role === "kargo_kabul") {
            new electron$1.Notification({
              title: "Talep Tamamlandı",
              body: `${ticket.serial || "Bilinmeyen"} talebiniz tamamlandı`,
              silent: true
            }).show();
          }
        }
      });
    }
    cachedTickets = tickets;
    const mainWin = windowManager.getMainWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send("ticket-update", tickets);
    }
    const { BrowserWindow } = require("electron");
    BrowserWindow.getAllWindows().forEach((win) => {
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
  windowManager = new WindowManager(__dirname);
  clipboardMonitor = new ClipboardMonitor(handleDetection);
  registerShortcuts();
  monitoringEnabled = true;
  const splash = windowManager.createSplashWindow();
  setTimeout(() => {
    try {
      splash.close();
    } catch {
    }
    windowManager.createMainWindow();
    createTray();
    clipboardMonitor.start();
    startServerStatusMonitor();
    startTicketListener();
    electron$1.app.setLoginItemSettings({
      openAtLogin: currentSettings.autoStartEnabled,
      path: electron$1.app.getPath("exe")
    });
  }, 2500);
  setupIpcHandlers();
}
electron$1.app.whenReady().then(() => {
  initCache();
  initializeApp();
});
electron$1.app.on("will-quit", () => {
  electron$1.globalShortcut.unregisterAll();
  if (ticketUnsubscribe) {
    ticketUnsubscribe();
    ticketUnsubscribe = null;
  }
});
electron$1.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron$1.app.quit();
});
