/* empty css               */
/* empty css               */
import { s as showToast, S as SVG_EMPTY_FOLDER } from "./svgUtils-BxY6k_uX.js";
const cardsDiv = document.getElementById("cards");
const searchInput = document.getElementById("search");
const toggleBtn = document.getElementById("toggle");
const themeBtn = document.getElementById("theme-toggle");
const clearCacheBtn = document.getElementById("clear-cache");
const dcBtn = document.getElementById("double-copy-toggle");
const statusDot = document.getElementById("status-dot");
const statusInfo = document.getElementById("status-info");
const statusRefreshBtn = document.getElementById("status-refresh-btn");
const sideLevel = document.getElementById("side-level");
const sideName = document.getElementById("side-name");
const sideXp = document.getElementById("side-xp");
const sideXpFill = document.getElementById("side-xp-fill");
const navItems = document.querySelectorAll(".nav-item");
const viewSections = document.querySelectorAll(".view-section");
const ticketBadge = document.getElementById("ticket-badge");
const ticketList = document.getElementById("ticket-list");
const tcPending = document.getElementById("count-pending");
const tcProgress = document.getElementById("count-progress");
const tcCompleted = document.getElementById("count-completed");
const tSearchInput = document.getElementById("ticket-search");
const tFilterTabs = document.getElementById("filter-tabs");
const pMyLevel = document.getElementById("my-level");
const pMyName = document.getElementById("my-name");
const pMyRole = document.getElementById("my-role");
const pMyXp = document.getElementById("my-xp");
const pNextLevelXp = document.getElementById("next-level-xp");
const pXpFill = document.getElementById("my-xp-fill");
const scoreboardContainer = document.getElementById("scoreboard");
const profileFilterBtns = document.querySelectorAll(".filter-btn");
const prioList = document.getElementById("priority-list");
const pSerial = document.getElementById("p-serial");
const pCustomer = document.getElementById("p-customer");
const pDesc = document.getElementById("p-desc");
const addPrioBtn = document.getElementById("add-priority-btn");
const sPopupTimeout = document.getElementById("popup-timeout");
const sAutoStart = document.getElementById("auto-start");
const sSaveBtn = document.getElementById("save-settings-btn");
const bonusDropZone = document.getElementById("bonus-drop-zone");
const bonusFileInput = document.getElementById("bonus-file-input");
const bonusResults = document.getElementById("bonus-results");
const bonusAnalytics = document.getElementById("bonus-analytics");
const workStartInput = document.getElementById("work-start");
const workEndInput = document.getElementById("work-end");
const adminUserList = document.getElementById("admin-user-list");
const btnAddUser = document.getElementById("btn-add-user");
const adminModal = document.getElementById("admin-user-modal");
const adminModalTitle = document.getElementById("admin-modal-title");
const adminUserId = document.getElementById("admin-user-id");
const adminUsername = document.getElementById("admin-user-username");
const adminPassword = document.getElementById("admin-user-password");
const adminFullname = document.getElementById("admin-user-fullname");
const adminRole = document.getElementById("admin-user-role");
const btnCancelAdminModal = document.getElementById("btn-cancel-admin-modal");
const btnSaveAdminUser = document.getElementById("btn-save-admin-user");
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalConfirm = document.getElementById("modal-confirm");
const modalCancel = document.getElementById("modal-cancel");
const api = window.electronAPI;
let monitoringEnabled = true;
let currentRole = "kargo_kabul";
let personnelName = "";
let activeTickets = [];
function showConfirm(title, message, confirmText = "Evet, Sil") {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalText.textContent = message;
    modalConfirm.textContent = confirmText;
    modalOverlay.classList.add("active");
    const close = (result) => {
      modalOverlay.classList.remove("active");
      resolve(result);
    };
    modalConfirm.onclick = () => close(true);
    modalCancel.onclick = () => close(false);
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) close(false);
    };
  });
}
function showAskMHModal(serial, modelName, modelColor) {
  modalTitle.textContent = "MH'ye Sor";
  modalText.innerHTML = "";
  const form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:12px;";
  const fields = [
    { id: "chk-ariza", label: "Arıza Beyanı" },
    { id: "chk-adres", label: "Adres Bilgisi" },
    { id: "chk-tel", label: "Telefon Numarası" },
    { id: "chk-fatura", label: "Fatura Tarihi" },
    { id: "chk-seri", label: "Seri Numarası" },
    { id: "chk-isim", label: "İsim ve Soyisim" }
  ];
  let checkboxesHtml = '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;">';
  fields.forEach((f) => {
    checkboxesHtml += `
            <label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;cursor:pointer;">
                <input type="checkbox" id="${f.id}" value="${f.label}" style="accent-color:#38bdf8;width:16px;height:16px;">
                ${f.label}
            </label>
        `;
  });
  checkboxesHtml += "</div>";
  form.innerHTML = `
    <label style="font-size:0.85rem;color:#94a3b8;margin-bottom:-8px;">Eksik Bilgiler (Birden fazla seçebilirsiniz)</label>
    ${checkboxesHtml}
    
    <label style="font-size:0.85rem;color:#94a3b8;">Müşteri İsmi (Opsiyonel)</label>
    <input type="text" id="mh-customer" placeholder="Müşteri adı soyadı..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Aras Kodu (Opsiyonel)</label>
    <input type="text" id="mh-aras" placeholder="Aras kargo kodu..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Telefon Numarası (Opsiyonel)</label>
    <input type="text" id="mh-phone" placeholder="Müşteri iletişim numarası..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Not (Opsiyonel)</label>
    <input type="text" id="mh-note" placeholder="Ekstra detay ekleyin..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">
    `;
  modalText.appendChild(form);
  modalConfirm.textContent = "Gönder";
  modalOverlay.classList.add("active");
  modalConfirm.onclick = async () => {
    const selectedTypes = [];
    fields.forEach((f) => {
      const el = document.getElementById(f.id);
      if (el && el.checked) {
        selectedTypes.push(el.value);
      }
    });
    const missingType = selectedTypes.length > 0 ? selectedTypes.join(", ") : "Belirtilmedi";
    const note = document.getElementById("mh-note").value.trim();
    const customerName = document.getElementById("mh-customer").value.trim();
    const arasCode = document.getElementById("mh-aras").value.trim();
    const phoneNumber = document.getElementById("mh-phone").value.trim();
    try {
      await api.createTicket({
        serial,
        model_name: modelName,
        model_color: modelColor,
        missing_type: missingType,
        note,
        customer_name: customerName,
        aras_code: arasCode,
        phone_number: phoneNumber,
        created_by: personnelName || "İsimsiz Personel"
      });
      showToast("Eksik bilgi talebiniz MH departmanına iletildi.", "success");
    } catch (e) {
      showToast("Talep oluşturulurken hata: " + e.message, "error");
    }
    modalOverlay.classList.remove("active");
  };
  modalCancel.onclick = () => {
    modalOverlay.classList.remove("active");
  };
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("active");
  };
}
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
function loadCards() {
  cardsDiv.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; gap:12px; pointer-events:none; opacity:0.7;">
            <div class="skeleton" style="width: 30%; height: 24px;"></div>
            <div class="skeleton" style="width: 100%; height: 60px;"></div>
            <div class="skeleton" style="width: 60%; height: 20px;"></div>
        </div>
        <div class="card" style="display:flex; flex-direction:column; gap:12px; pointer-events:none; opacity:0.5;">
            <div class="skeleton" style="width: 40%; height: 24px;"></div>
            <div class="skeleton" style="width: 100%; height: 60px;"></div>
            <div class="skeleton" style="width: 80%; height: 20px;"></div>
        </div>
    `;
  api.getCachedData().then((data) => {
    cardsDiv.innerHTML = "";
    if (!data || data.length === 0) {
      cardsDiv.innerHTML = `
        <div class="empty-state">
          ${SVG_EMPTY_FOLDER}
          <h3>Henüz bir cihaz sorgulanmadı</h3>
          <p>Panoya bir seri numarası kopyaladığınızda burada görünecektir.</p>
        </div>
      `;
      return;
    }
    const query = searchInput.value.toLowerCase();
    data.sort((a, b) => new Date(b.copy_date).getTime() - new Date(a.copy_date).getTime());
    const completedTicketsMap = /* @__PURE__ */ new Map();
    activeTickets.forEach((t) => {
      if (t.status === "completed") {
        completedTicketsMap.set(t.serial, t);
      }
    });
    const fragment = document.createDocumentFragment();
    data.forEach((item) => {
      if (item.serial.toLowerCase().includes(query)) {
        const card = document.createElement("div");
        let cardClass = "card";
        const statusLabel = item.warranty_status;
        if (statusLabel.includes("RECCI")) cardClass += " recci";
        else if (statusLabel.includes("KVK")) cardClass += " kvk";
        else cardClass += " out-of-warranty";
        const completedTicket = completedTicketsMap.get(item.serial);
        const askMHBtn = currentRole === "kargo_kabul" && !completedTicket?.response ? `<button class="ask-mh-btn" data-serial="${item.serial}" data-model="${item.model_name || ""}" data-color="${item.model_color || ""}" style="position:absolute;bottom:12px;right:12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;" title="MH'ye Sor">📩 MH'ye Sor</button>` : "";
        card.className = cardClass;
        card.style.position = "relative";
        card.innerHTML = `
          <button class="delete-btn" onclick="deleteEntry('${item.serial}')">✕</button>
          ${askMHBtn}
          <div class="status-tag">${statusLabel}</div>
          <p><strong>Seri:</strong> ${item.serial}</p>
          <p><strong>Model:</strong> ${item.model_name || "Bilinmiyor"} ${item.model_color || ""}</p>
          <p><strong>Tarih:</strong> ${formatDate(item.copy_date)}</p>
          ${item.warranty_end ? `<p><strong>Bitiş:</strong> ${item.warranty_end}</p>` : ""}
          ${completedTicket?.response ? `<div style="margin-top:8px;padding:8px 12px;background:rgba(16,185,129,0.08);border-radius:10px;font-size:0.8rem;max-height:100px;overflow-y:auto;word-break:break-word;border:1px solid rgba(16,185,129,0.2);"><strong style="color:#10b981;display:block;margin-bottom:2px;">MH Cevap:</strong>${completedTicket.response}</div>` : ""}
        `;
        fragment.appendChild(card);
      }
    });
    cardsDiv.appendChild(fragment);
    cardsDiv.querySelectorAll(".ask-mh-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const el = btn;
        showAskMHModal(el.dataset.serial, el.dataset.model, el.dataset.color);
      });
    });
  });
}
toggleBtn.onclick = () => {
  monitoringEnabled = !monitoringEnabled;
  const span = toggleBtn.querySelector("span");
  if (span) {
    span.textContent = monitoringEnabled ? "👁️ Clipboard İzleme: Aktif" : "👁️ Clipboard İzleme: Devre Dışı";
  }
  toggleBtn.style.opacity = monitoringEnabled ? "1" : "0.6";
  api.toggleMonitoring(monitoringEnabled);
};
function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  document.body.classList.toggle("light", !isDark);
  themeBtn.textContent = isDark ? "🌙" : "☀️";
}
themeBtn.onclick = () => {
  const isDark = document.body.classList.contains("dark");
  const newDark = !isDark;
  applyTheme(newDark);
  api.getSettings().then((s) => {
    api.saveSettings({ ...s, theme: newDark ? "dark" : "light" });
  });
};
api.getSettings().then((s) => {
  const theme = s.theme || "dark";
  applyTheme(theme === "dark");
});
searchInput.oninput = () => loadCards();
function switchView(viewName) {
  viewSections.forEach((sec) => sec.classList.remove("active"));
  navItems.forEach((item) => item.classList.remove("active"));
  const targetSec = document.getElementById(`view-${viewName}`);
  const targetNavItem = document.querySelector(`[data-view="${viewName}"]`);
  if (targetSec && targetNavItem) {
    targetSec.classList.add("active");
    targetNavItem.classList.add("active");
  }
  if (viewName === "history") loadCards();
  else if (viewName === "tickets") loadTickets();
  else if (viewName === "profile") loadProfileScoreboard();
  else if (viewName === "priority") loadPriorityDevices();
  else if (viewName === "admin") loadAdminUsers();
  else if (viewName === "settings") loadSettingsToUI();
}
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const view = item.dataset.view;
    if (view) switchView(view);
  });
});
function calculateLevel(xp) {
  let level = 1;
  let threshold = 100;
  while (xp >= threshold) {
    level++;
    threshold += 100 * (level * 0.5);
  }
  return { level, nextXp: Math.floor(threshold) };
}
async function refreshSidebarProfile() {
  const settings = await api.getSettings();
  personnelName = settings.personnelName || "İsimsiz";
  sideName.textContent = personnelName.toUpperCase();
  const users = await api.getUsers();
  const me = users?.find((u) => u.username === settings.username);
  if (me) {
    const { level, nextXp } = calculateLevel(me.xp || 0);
    sideLevel.textContent = String(level);
    sideXp.textContent = String(me.xp || 0);
    const progress = (me.xp || 0) / nextXp * 100;
    sideXpFill.style.width = `${Math.min(100, progress)}%`;
    if (pMyLevel) {
      pMyLevel.textContent = String(level);
      pMyName.textContent = me.fullName || me.username;
      pMyRole.textContent = me.role === "mh" ? "Müşteri Hizmetleri" : "Kargo Kabul";
      pMyXp.textContent = String(me.xp || 0);
      pNextLevelXp.textContent = String(nextXp);
      pXpFill.style.width = `${Math.min(100, progress)}%`;
    }
  }
}
clearCacheBtn.onclick = async () => {
  const confirmed = await showConfirm(
    "Tüm Geçmişi Temizle",
    "Tüm sorgu geçmişiniz kalıcı olarak silinecektir. Emin misiniz?",
    "Tümünü Sil"
  );
  if (confirmed) {
    try {
      await api.clearCache();
      loadCards();
      showToast("Tüm önbellek başarıyla temizlendi.", "success");
    } catch (e) {
      showToast("Temizleme hatası: " + e.message, "error");
    }
  }
};
window.deleteEntry = async (serial) => {
  const confirmed = await showConfirm(
    "Kaydı Sil",
    `${serial} seri numaralı cihazı listeden silmek istediğinizden emin misiniz?`
  );
  if (confirmed) {
    try {
      await api.deleteEntry(serial);
      loadCards();
      showToast(`${serial} kaydı silindi.`, "success");
    } catch (e) {
      showToast("Silinemedi: " + e.message, "error");
    }
  }
};
function updateDCUI(enabled) {
  dcBtn.textContent = enabled ? "🔄 Double Copy: Açık" : "🔄 Double Copy: Kapalı";
  dcBtn.classList.toggle("btn-warning", !enabled);
  dcBtn.classList.toggle("btn-primary", enabled);
}
api.getDoubleCopy().then((enabled) => updateDCUI(enabled));
dcBtn.onclick = async () => {
  const current = dcBtn.textContent.includes("Açık");
  try {
    await api.toggleDoubleCopy(!current);
    updateDCUI(!current);
    showToast(`Double Copy modu ${!current ? "açıldı" : "kapatıldı"}.`, "info");
  } catch (e) {
    showToast("Double Copy değişemedi: " + e.message, "error");
  }
};
api.onServerStatusUpdate((status) => {
  statusDot.className = "status-dot " + (status.online ? status.latency > 1e3 ? "slow" : "online" : "offline");
  statusInfo.textContent = status.online ? `Sunucu: ${status.latency}ms` : "Sunucu: Erişilemiyor";
  statusRefreshBtn.classList.remove("rotating");
});
statusRefreshBtn.addEventListener("click", () => {
  statusRefreshBtn.classList.add("rotating");
  api.manualServerStatusRefresh();
});
api.onCacheCleared(() => loadCards());
api.onMonitoringToggled((enabled) => {
  monitoringEnabled = enabled;
  const span = toggleBtn.querySelector("span");
  if (span) {
    span.textContent = monitoringEnabled ? "👁️ Clipboard İzleme: Aktif" : "👁️ Clipboard İzleme: Devre Dışı";
  }
  toggleBtn.style.opacity = monitoringEnabled ? "1" : "0.6";
});
api.onTicketUpdate((tickets) => {
  activeTickets = tickets;
  const pendingCount = tickets.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  if (pendingCount > 0) {
    ticketBadge.style.display = "block";
    ticketBadge.textContent = String(pendingCount);
  } else {
    ticketBadge.style.display = "none";
  }
  loadCards();
});
api.onPriorityDeviceMatch((device) => {
  const alertDiv = document.createElement("div");
  alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(239, 68, 68, 0.4);
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 300px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        animation: slideDownIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    `;
  alertDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:1.1rem;">⚠️ ÖNCELİKLİ CİHAZ!</strong>
            <button id="close-priority-alert" style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer; padding:0 4px;">✕</button>
        </div>
        <div style="font-size:0.95rem; font-weight:600;">${device.customer_name}</div>
        <div style="font-size:0.85rem; opacity:0.9; background:rgba(0,0,0,0.1); padding:8px; border-radius:8px;">${device.description}</div>
    `;
  if (!document.getElementById("priority-animations")) {
    const style = document.createElement("style");
    style.id = "priority-animations";
    style.textContent = `
            @keyframes slideDownIn {
                from { opacity: 0; transform: translate(-50%, -40px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
        `;
    document.head.appendChild(style);
  }
  document.body.appendChild(alertDiv);
  const closeBtn = alertDiv.querySelector("#close-priority-alert");
  closeBtn.onclick = () => alertDiv.remove();
  setTimeout(() => {
    if (alertDiv.parentNode) alertDiv.remove();
  }, 15e3);
});
async function loadTickets() {
  const tickets = await api.getTickets();
  if (!tickets) return;
  renderTicketsList(tickets);
}
function renderTicketsList(tickets) {
  ticketList.innerHTML = "";
  const searchQuery = tSearchInput?.value?.toLowerCase().trim() || "";
  const activeFilter = tFilterTabs?.querySelector(".active")?.dataset.filter || "all";
  tcPending.textContent = String(tickets.filter((t) => t.status === "pending").length);
  tcProgress.textContent = String(tickets.filter((t) => t.status === "in_progress").length);
  tcCompleted.textContent = String(tickets.filter((t) => t.status === "completed").length);
  let filtered = tickets;
  if (activeFilter !== "all") {
    if (activeFilter === "aras") filtered = filtered.filter((t) => t.aras_code);
    else filtered = filtered.filter((t) => t.status === activeFilter);
  }
  if (searchQuery) {
    filtered = filtered.filter((t) => (t.serial || "").toLowerCase().includes(searchQuery) || (t.customer_name || "").toLowerCase().includes(searchQuery));
  }
  if (filtered.length === 0) {
    ticketList.innerHTML = '<div class="priority-empty">Henüz talep yok.</div>';
    return;
  }
  filtered.forEach((ticket) => {
    const card = document.createElement("div");
    card.className = `ticket-card status-${ticket.status}`;
    const statusLabel = ticket.status === "pending" ? "Bekliyor" : ticket.status === "in_progress" ? "İşleniyor" : "Tamamlandı";
    const badgeClass = `badge-${ticket.status}`;
    const missingLabels = { address: "Adres", fault_form: "Arıza Formu", contact: "İletişim", other: "Diğer" };
    const missingLabel = missingLabels[ticket.missing_type] || ticket.missing_type;
    const createdDate = ticket.created_at ? new Date(ticket.created_at).toLocaleString("tr-TR") : "";
    let actionsHTML = "";
    if (ticket.status === "pending" && currentRole === "mh") {
      actionsHTML = `<button class="btn-sm btn-claim" data-action="claim" data-id="${ticket.id}">Üstlen</button>`;
    } else if (ticket.status === "in_progress" && currentRole === "mh") {
      actionsHTML = `
                <input class="response-input" id="resp-${ticket.id}" placeholder="Yanıtınızı yazın...">
                <button class="btn-sm btn-complete" data-action="complete" data-id="${ticket.id}">Tamamla</button>
            `;
    } else if (ticket.status === "completed") {
      actionsHTML = `<button class="btn-sm btn-reopen" data-action="reopen" data-id="${ticket.id}">Yeniden Aç</button>`;
    }
    let responseHTML = "";
    if (ticket.response) {
      responseHTML = `<div class="ticket-response"><strong>${ticket.responded_by || "MH"}:</strong> ${ticket.response}</div>`;
    }
    let collabHTML = "";
    if (ticket.customer_name || ticket.aras_code || ticket.phone_number) {
      collabHTML = `<div class="collab-container">
                ${ticket.customer_name ? `<div class="collab-group"><span class="collab-label">Müşteri</span><span>${ticket.customer_name}</span></div>` : ""}
                ${ticket.aras_code ? `<div class="collab-group"><span class="collab-label">Aras Kodu</span><span>${ticket.aras_code}</span></div>` : ""}
                ${ticket.phone_number ? `<div class="collab-group"><span class="collab-label">Telefon</span><span>${ticket.phone_number}</span></div>` : ""}
            </div>`;
    }
    card.innerHTML = `
            <div class="ticket-body">
                <div class="ticket-serial">${ticket.serial || "Seri No Yok"}</div>
                <div class="ticket-model">${ticket.model_name || ""} ${ticket.model_color ? "- " + ticket.model_color : ""}</div>
                <span class="ticket-missing-type">${missingLabel}</span>
                ${ticket.note ? `<div class="ticket-note"><strong>Not:</strong> ${ticket.note}</div>` : ""}
                ${responseHTML}
                ${collabHTML}
                <div class="ticket-time">${createdDate}</div>
            </div>
            <div class="ticket-actions">
                <span class="${badgeClass}">${statusLabel}</span>
                ${actionsHTML}
            </div>
        `;
    ticketList.appendChild(card);
  });
  ticketList.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const el = e.target;
      const action = el.dataset.action;
      const id = el.dataset.id;
      if (action === "claim") {
        await api.claimTicket(id, personnelName);
        showToast("Talep üstlenildi.", "success");
      } else if (action === "complete") {
        const input = document.getElementById(`resp-${id}`);
        const response = input?.value?.trim();
        if (!response) {
          showToast("Lütfen bir yanıt yazın.", "error");
          return;
        }
        await api.completeTicket(id, response);
        showToast("Talep tamamlandı.", "success");
      } else if (action === "reopen") {
        await api.reopenTicket(id);
        showToast("Talep yeniden açıldı.", "info");
      }
      loadTickets();
    });
  });
}
tFilterTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;
  tFilterTabs.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  loadTickets();
});
tSearchInput.addEventListener("input", () => loadTickets());
async function loadProfileScoreboard() {
  const users = await api.getUsers();
  if (!users) return;
  scoreboardContainer.innerHTML = "";
  users.sort((a, b) => (b.xp || 0) - (a.xp || 0));
  const activeRole = Array.from(profileFilterBtns).find((b) => b.classList.contains("active"))?.dataset.role || "all";
  let filtered = users;
  if (activeRole !== "all") filtered = filtered.filter((u) => u.role === activeRole);
  const currentUser = users.find((u) => u.fullName === personnelName || u.username === personnelName);
  if (currentUser) {
    const { level, nextXp } = calculateLevel(currentUser.xp || 0);
    const currentXp = currentUser.xp || 0;
    pMyLevel.textContent = String(level);
    pMyName.textContent = currentUser.fullName || currentUser.username;
    pMyRole.textContent = currentUser.role === "mh" ? "Müşteri Hizmetleri" : "Kargo Kabul";
    pMyXp.textContent = String(currentXp);
    pNextLevelXp.textContent = String(nextXp);
    pXpFill.style.width = `${currentXp / nextXp * 100}%`;
  }
  if (filtered.length === 0) {
    scoreboardContainer.innerHTML = '<div class="priority-empty">Kullanıcı bulunamadı.</div>';
    return;
  }
  filtered.forEach((u, idx) => {
    const rank = idx + 1;
    const { level } = calculateLevel(u.xp || 0);
    const roleLabel = u.role === "mh" ? "Müşteri Hizmetleri" : u.role === "admin" || u.username === "KursatS" ? "Yönetici" : "Kargo Kabul";
    let medalIcon = `#${rank}`;
    if (rank === 1) medalIcon = "🥇";
    else if (rank === 2) medalIcon = "🥈";
    else if (rank === 3) medalIcon = "🥉";
    const row = document.createElement("div");
    row.className = `score-row${rank <= 3 ? " rank-" + rank : ""}`;
    row.style.setProperty("--i", String(idx));
    row.innerHTML = `
            <div class="score-rank">${medalIcon}</div>
            <div class="score-name">${u.fullName || u.username}</div>
            <div class="score-role">${roleLabel}</div>
            <div class="score-level">Lv. ${level}</div>
            <div class="score-xp">${u.xp || 0} XP</div>
        `;
    scoreboardContainer.appendChild(row);
  });
  refreshSidebarProfile();
}
profileFilterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    profileFilterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadProfileScoreboard();
  });
});
async function loadPriorityDevices() {
  const devices = await api.getPriorityDevices();
  prioList.innerHTML = "";
  if (!devices || devices.length === 0) {
    prioList.innerHTML = '<div class="priority-empty">Kayıtlı öncelikli cihaz yok.</div>';
    return;
  }
  devices.forEach((d) => {
    const item = document.createElement("div");
    item.className = "priority-item";
    item.innerHTML = `
            <div class="priority-item-body">
                <div class="priority-item-name">${d.customer_name}</div>
                <div class="priority-item-serial">${d.serial}</div>
                <div class="priority-item-desc">${d.description}</div>
            </div>
            <button class="btn-del-priority" onclick="deletePriority('${d.id}')">✕</button>
        `;
    prioList.appendChild(item);
  });
}
addPrioBtn.onclick = async () => {
  const data = {
    serial: pSerial.value.trim().toUpperCase(),
    customer_name: pCustomer.value.trim(),
    description: pDesc.value.trim()
  };
  if (!data.serial || !data.customer_name) return;
  await api.addPriorityDevice(data);
  pSerial.value = "";
  pCustomer.value = "";
  pDesc.value = "";
  loadPriorityDevices();
};
async function loadSettingsToUI() {
  const s = await api.getSettings();
  sPopupTimeout.value = String(s.popupTimeout || 5e3);
  sAutoStart.checked = s.autoStartEnabled || false;
}
sSaveBtn.onclick = async () => {
  const s = await api.getSettings();
  await api.saveSettings({
    ...s,
    popupTimeout: parseInt(sPopupTimeout.value),
    autoStartEnabled: sAutoStart.checked
  });
  showToast("Ayarlar kaydedildi.", "success");
};
window.deletePriority = async (id) => {
  await api.deletePriorityDevice(id);
  loadPriorityDevices();
};
Promise.all([
  api.getSettings(),
  api.getTickets(),
  api.getUsers().catch(() => [])
]).then(([s, tickets, users]) => {
  currentRole = s.role || "kargo_kabul";
  personnelName = s.personnelName || "";
  const isAdmin = s.isAdmin === true || s.username === "KursatS";
  const isLoggedIn = !!s.personnelName?.trim();
  const sideBonus = document.getElementById("side-bonus-btn");
  const sideAdmin = document.getElementById("side-admin-btn");
  const sideProfile = document.getElementById("side-profile-btn");
  if (sideBonus) sideBonus.style.display = currentRole === "kargo_kabul" ? "flex" : "none";
  if (sideAdmin) sideAdmin.style.display = isAdmin ? "flex" : "none";
  if (sideProfile) sideProfile.style.display = isLoggedIn ? "flex" : "none";
  if (tickets) {
    activeTickets = tickets;
    const pendingCount = tickets.filter((t) => t.status === "pending" || t.status === "in_progress").length;
    ticketBadge.style.display = pendingCount > 0 ? "flex" : "none";
    ticketBadge.textContent = String(pendingCount);
  }
  refreshSidebarProfile();
  loadCards();
});
api.onRefreshCards(() => {
  api.getSettings().then((s) => {
    personnelName = s.personnelName || "";
    const isAdmin = s.isAdmin === true || s.username === "KursatS";
    const isLoggedIn = !!s.personnelName?.trim();
    const sideBonus = document.getElementById("side-bonus-btn");
    const sideAdmin = document.getElementById("side-admin-btn");
    const sideProfile = document.getElementById("side-profile-btn");
    if (sideBonus) sideBonus.style.display = s.role === "kargo_kabul" ? "flex" : "none";
    if (sideAdmin) sideAdmin.style.display = isAdmin ? "flex" : "none";
    if (sideProfile) sideProfile.style.display = isLoggedIn ? "flex" : "none";
    refreshSidebarProfile();
    loadCards();
  });
});
api.onTicketUpdate((tickets) => {
  activeTickets = tickets;
  const pendingCount = tickets.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  ticketBadge.style.display = pendingCount > 0 ? "flex" : "none";
  ticketBadge.textContent = String(pendingCount);
  if (document.getElementById("view-tickets")?.classList.contains("active")) {
    renderTicketsList(tickets);
  }
  loadCards();
});
let lastBonusFilePath = "";
let currentBonusResults = [];
bonusDropZone.onclick = () => bonusFileInput.click();
bonusDropZone.ondragover = (e) => {
  e.preventDefault();
  bonusDropZone.classList.add("dragover");
};
bonusDropZone.ondragleave = () => bonusDropZone.classList.remove("dragover");
bonusDropZone.ondrop = async (e) => {
  e.preventDefault();
  bonusDropZone.classList.remove("dragover");
  const file = e.dataTransfer?.files[0];
  if (file) {
    lastBonusFilePath = file.path || file.name;
    await handleBonusFile(lastBonusFilePath);
  }
};
bonusFileInput.onchange = async () => {
  if (bonusFileInput.files && bonusFileInput.files[0]) {
    lastBonusFilePath = bonusFileInput.files[0].path || bonusFileInput.files[0].name;
    await handleBonusFile(lastBonusFilePath);
  }
};
workStartInput.onchange = () => {
  if (lastBonusFilePath) handleBonusFile(lastBonusFilePath);
};
workEndInput.onchange = () => {
  if (lastBonusFilePath) handleBonusFile(lastBonusFilePath);
};
async function handleBonusFile(path) {
  if (!path) return;
  bonusResults.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Hesaplanıyor...</div>';
  bonusAnalytics.style.display = "none";
  try {
    const customHours = { start: workStartInput.value, end: workEndInput.value };
    const results = await api.calculateBonus(path, customHours);
    currentBonusResults = results;
    displayBonusResults(results);
  } catch (err) {
    bonusResults.innerHTML = '<div style="text-align:center; color:#ef4444;">Dosya okunurken hata oluştu.</div>';
  }
}
function displayBonusResults(results) {
  bonusResults.innerHTML = "";
  if (!results || results.length === 0) {
    bonusResults.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Geçerli veri bulunamadı.</p>';
    return;
  }
  results.forEach((res, index) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.style.animationDelay = `${index * 0.1}s`;
    let statusText = "";
    let statusClass = "";
    if (res.isEligible) {
      statusText = "🏆 Prim Tamam";
      statusClass = "status-eligible";
    } else {
      const remaining = 850 - res.validCount;
      statusText = index === 0 ? `Eksik: ${remaining}` : "Prim tamamlanamadı";
      statusClass = "status-pending-badge";
    }
    card.innerHTML = `
            <div class="result-info">
                <h3>${res.month}</h3>
                <div class="result-stats">
                    <div class="stat-item">Geçerli: <strong>${res.validCount}</strong></div>
                    <div class="stat-item">Mesai Dışı: <strong>${res.overtimeCount}</strong></div>
                    <div class="stat-item">Toplam: ${res.totalCount}</div>
                </div>
            </div>
            <div class="status-badge ${statusClass}">${statusText}</div>
        `;
    card.onclick = () => {
      bonusResults.querySelectorAll(".result-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      showBonusAnalytics(res);
    };
    bonusResults.appendChild(card);
    if (index === 0) card.click();
  });
}
function showBonusAnalytics(res) {
  bonusAnalytics.style.display = "block";
  bonusAnalytics.innerHTML = "";
  if (!res.dailyStats || res.dailyStats.length === 0) {
    bonusAnalytics.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Günlük veri yok</p>';
    return;
  }
  const maxVal = Math.max(...res.dailyStats.map((d) => d.validCount + d.overtimeCount));
  bonusAnalytics.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <div><h2>${res.month} Günlük Dağılım</h2></div>
            <div style="text-align:right;"><div style="font-size:1.5rem; font-weight:800; color:var(--accent);">${res.totalCount}</div><div style="font-size:0.8rem; color:var(--text-muted);">TOPLAM CİHAZ</div></div>
        </div>
        <div id="bonus-chart" style="display:flex; align-items:flex-end; gap:6px; height:240px; border-bottom:2px solid var(--glass-border); position:relative;"></div>
        <div style="display:flex; gap:20px; margin-top:16px; justify-content:center; font-size:0.8rem; color:var(--text-muted);">
            <div style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:3px; background:var(--success);"></span> Mesai İçi</div>
            <div style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:3px; background:var(--warning);"></span> Fazla Mesai</div>
        </div>
    `;
  const chart = document.getElementById("bonus-chart");
  res.dailyStats.forEach((day, i) => {
    const total = day.validCount + day.overtimeCount;
    const nH = maxVal > 0 ? day.validCount / maxVal * 220 : 0;
    const oH = maxVal > 0 ? day.overtimeCount / maxVal * 220 : 0;
    const dayNum = day.date.split("-")[2];
    const group = document.createElement("div");
    group.style.cssText = "flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;";
    group.innerHTML = `
            <div style="width:100%; display:flex; flex-direction:column-reverse; align-items:center; border-radius:4px 4px 0 0; cursor:pointer; position:relative; height:0; transition:height 0.6s cubic-bezier(0.175,0.885,0.32,1.275);" class="bar-stack">
                ${oH > 0 ? `<div style="width:100%; height:${oH}px; background:var(--warning); opacity:0.8;"></div>` : ""}
                <div style="width:100%; height:${nH}px; background:var(--success);"></div>
                <span style="position:absolute; top:-18px; font-size:11px; font-weight:800; color:var(--text-main);">${total}</span>
            </div>
            <div style="font-size:11px; font-weight:600; color:var(--text-muted);">${dayNum}</div>
        `;
    chart.appendChild(group);
    setTimeout(() => {
      const stack = group.querySelector(".bar-stack");
      stack.style.height = `${nH + oH}px`;
    }, 30 + i * 20);
  });
  bonusAnalytics.scrollIntoView({ behavior: "smooth" });
}
api.onSwitchView((view) => switchView(view));
let adminUsersCache = [];
async function loadAdminUsers() {
  const users = await api.getUsers();
  adminUsersCache = users || [];
  renderAdminUsers(adminUsersCache);
}
function renderAdminUsers(users) {
  adminUserList.innerHTML = "";
  users.forEach((user) => {
    const card = document.createElement("div");
    card.className = "user-card";
    let badgeClass = "badge-kargo";
    let roleDisplay = "Kargo Kabul";
    if (user.role === "admin" || user.username === "KursatS") {
      badgeClass = "badge-admin";
      roleDisplay = "Yönetici";
    } else if (user.role === "mh") {
      badgeClass = "badge-mh";
      roleDisplay = "Müşteri Hizmetleri";
    }
    card.innerHTML = `
            <span class="${badgeClass}">${roleDisplay}</span>
            <h3>${user.fullName || "İsimsiz"}</h3>
            <p><strong>K. Adı:</strong> ${user.username}</p>
            <p><strong>Şifre:</strong> <span style="cursor:pointer;opacity:0.5;" title="Göstermek için tıklayın" data-pw="${user.password}">••••••</span></p>
            <p><strong>Level:</strong> ${user.level || 1} (${user.xp || 0} XP)</p>
            <div class="actions">
                <button class="btn-edit" data-id="${user.id}">Düzenle</button>
                <button class="btn-delete" data-id="${user.id}">Sil</button>
                <button class="btn-reset-xp" data-id="${user.id}" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);">XP Sıfırla</button>
            </div>
        `;
    adminUserList.appendChild(card);
  });
  adminUserList.querySelectorAll("[data-pw]").forEach((el) => {
    el.addEventListener("click", function() {
      this.textContent = this.dataset.pw || "";
      this.style.opacity = "1";
    });
  });
  adminUserList.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const user = adminUsersCache.find((u) => u.id === id);
      if (user) openAdminModal(user);
    });
  });
  adminUserList.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const user = adminUsersCache.find((u) => u.id === id);
      const confirmed = await showConfirm("Kullanıcıyı Sil", `"${user?.username}" kullanıcısını silmek istediğinize emin misiniz?`);
      if (confirmed) {
        await api.deleteUser(id);
        loadAdminUsers();
        showToast("Kullanıcı silindi.", "success");
      }
    });
  });
  adminUserList.querySelectorAll(".btn-reset-xp").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const user = adminUsersCache.find((u) => u.id === id);
      const confirmed = await showConfirm("XP Sıfırla", `"${user?.username}" kullanıcısının XP ve Level bilgisi sıfırlanacak. Emin misiniz?`);
      if (confirmed) {
        await api.resetUserXp(id);
        loadAdminUsers();
        showToast("XP sıfırlandı.", "success");
      }
    });
  });
}
function openAdminModal(user = null) {
  if (user) {
    adminModalTitle.textContent = "Kullanıcıyı Düzenle";
    adminUserId.value = user.id;
    adminUsername.value = user.username || "";
    adminPassword.value = user.password || "";
    adminFullname.value = user.fullName || "";
    adminRole.value = user.role || "kargo_kabul";
  } else {
    adminModalTitle.textContent = "Yeni Kullanıcı";
    adminUserId.value = "";
    adminUsername.value = "";
    adminPassword.value = "";
    adminFullname.value = "";
    adminRole.value = "kargo_kabul";
  }
  adminModal.classList.add("active");
}
btnAddUser.onclick = () => openAdminModal();
btnCancelAdminModal.onclick = () => adminModal.classList.remove("active");
btnSaveAdminUser.onclick = async () => {
  const username = adminUsername.value.trim();
  const password = adminPassword.value.trim();
  const fullName = adminFullname.value.trim();
  const role = adminRole.value;
  const id = adminUserId.value;
  if (!username || !password || !fullName || !role) {
    showToast("Lütfen tüm alanları doldurun.", "error");
    return;
  }
  try {
    btnSaveAdminUser.textContent = "Kaydediliyor...";
    btnSaveAdminUser.disabled = true;
    if (id) {
      await api.updateUser(id, { username, password, fullName, role });
    } else {
      await api.createUser({ username, password, fullName, role });
    }
    adminModal.classList.remove("active");
    loadAdminUsers();
    showToast("Kullanıcı kaydedildi.", "success");
  } catch (e) {
    showToast("Hata: " + e.message, "error");
  } finally {
    btnSaveAdminUser.textContent = "Kaydet";
    btnSaveAdminUser.disabled = false;
  }
};
