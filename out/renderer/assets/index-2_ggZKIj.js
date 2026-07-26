/* empty css               */
/* empty css               */
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    Object.assign(container.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      zIndex: "9999",
      pointerEvents: "none"
    });
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  Object.assign(toast.style, {
    padding: "12px 20px",
    borderRadius: "12px",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.9rem",
    fontWeight: "500",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transform: "translateX(120%)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
    pointerEvents: "auto",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    minWidth: "250px"
  });
  let icon = "";
  if (type === "success") {
    toast.style.background = "rgba(16, 185, 129, 0.85)";
    toast.style.borderColor = "rgba(16, 185, 129, 0.3)";
    icon = "✅";
  } else if (type === "error") {
    toast.style.background = "rgba(239, 68, 68, 0.85)";
    toast.style.borderColor = "rgba(239, 68, 68, 0.3)";
    icon = "❌";
  } else {
    toast.style.background = "rgba(59, 130, 246, 0.85)";
    toast.style.borderColor = "rgba(59, 130, 246, 0.3)";
    icon = "ℹ️";
  }
  const iconSpan = document.createElement("span");
  iconSpan.textContent = icon;
  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;
  toast.append(iconSpan, messageSpan);
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3e3);
}
const SVG_EMPTY_FOLDER = `
<svg class="empty-state-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V10C20 8.89543 19.1046 8 18 8H11.5L9.5 6H6C4.89543 6 4 6.89543 4 8Z" fill="url(#paint0_linear)" fill-opacity="0.2"/>
<path d="M11.5 8H18C19.1046 8 20 8.89543 20 10V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7M4 7C4 6.44772 4.44772 6 5 6H9.5L11.5 8M4 7V8" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<defs>
<linearGradient id="paint0_linear" x1="12" y1="6" x2="12" y2="19" gradientUnits="userSpaceOnUse">
<stop stop-color="#38BDF8"/>
<stop offset="1" stop-color="#38BDF8" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>
`;
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function formatTimestamp$1(timestampMs) {
  if (!timestampMs) return "tarih verisi bulunamadı";
  try {
    const date = new Date(timestampMs);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch (e) {
    return "tarih verisi bulunamadı";
  }
}
function initPriorityLogic(api2, elements) {
  const { prioList: prioList2, addPrioBtn: addPrioBtn2, pSerial: pSerial2, pCustomer: pCustomer2, pDesc: pDesc2 } = elements;
  if (!document.getElementById("prio-highlight-style")) {
    const style = document.createElement("style");
    style.id = "prio-highlight-style";
    style.textContent = `
            @keyframes highlightPulse {
                0% { box-shadow: 0 0 0px rgba(59, 130, 246, 0); background: rgba(255,255,255,0.02); }
                20% { box-shadow: 0 0 25px rgba(59, 130, 246, 1); background: rgba(59, 130, 246, 0.3); }
                100% { box-shadow: 0 0 0px rgba(59, 130, 246, 0); background: rgba(255,255,255,0.02); }
            }
            .highlight-pulse {
                animation: highlightPulse 2s ease-out !important;
                border: 1px solid rgba(59, 130, 246, 0.6) !important;
            }
        `;
    document.head.appendChild(style);
  }
  window._editingPriorityId = null;
  let cachedDevices = [];
  function focusPriorityDevice2(target) {
    const searchInput2 = document.getElementById("priority-search");
    if (searchInput2) {
      searchInput2.value = "";
    }
    const matched = cachedDevices.find(
      (d) => target.id && d.id === target.id || target.serial && d.serial?.toUpperCase() === target.serial.toUpperCase()
    );
    if (!matched) return;
    window._editingPriorityId = null;
    renderPriorityDevices();
    setTimeout(() => {
      const itemEl = document.getElementById(`prio-item-${matched.id}`);
      if (itemEl) {
        itemEl.scrollIntoView({ behavior: "smooth", block: "center" });
        itemEl.classList.add("highlight-pulse");
        setTimeout(() => itemEl.classList.remove("highlight-pulse"), 2e3);
      }
    }, 120);
  }
  async function loadPriorityDevices2() {
    cachedDevices = await api2.getPriorityDevices();
    renderPriorityDevices();
  }
  function renderPriorityDevices() {
    const query = document.getElementById("priority-search")?.value.toLowerCase() || "";
    prioList2.innerHTML = "";
    const filtered = cachedDevices.filter(
      (d) => d.serial && d.serial.toLowerCase().includes(query) || d.customer_name && d.customer_name.toLowerCase().includes(query)
    );
    if (!filtered || filtered.length === 0) {
      prioList2.innerHTML = '<div class="priority-empty">Kayıtlı öncelikli cihaz yok.</div>';
      return;
    }
    filtered.forEach((d) => {
      const item = document.createElement("div");
      item.className = "priority-item";
      item.id = `prio-item-${d.id}`;
      const isEditing = window._editingPriorityId === d.id;
      if (isEditing) {
        item.innerHTML = `
                    <div class="priority-item-body" style="display:flex; flex-direction:column; gap:6px; width: 100%;">
                        <input type="text" id="edit-prio-customer-${d.id}" value="${escapeHtml(d.customer_name)}" class="priority-input" placeholder="Müşteri Adı">
                        <input type="text" id="edit-prio-serial-${d.id}" value="${escapeHtml(d.serial)}" class="priority-input" placeholder="Seri No">
                        <input type="text" id="edit-prio-desc-${d.id}" value="${escapeHtml(d.description)}" class="priority-input" placeholder="Açıklama">
                        <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); padding-top:4px;">
                            Ekleyen: ${escapeHtml(d.created_by || "Bilinmiyor")} | Tarih: ${formatTimestamp$1(d.created_at)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px; padding-left: 10px; align-items:center;">
                        <button class="btn-add-priority" style="padding: 6px 10px; font-size: 0.8rem;" onclick="saveEditPriority('${d.id}')">Kaydet</button>
                        <button class="btn-del-priority" style="background: rgba(255,255,255,0.1);" onclick="cancelEditPriority()">×</button>
                    </div>
                `;
      } else {
        item.innerHTML = `
                    <div class="priority-item-body">
                        <div class="priority-item-name">${escapeHtml(d.customer_name)}</div>
                        <div class="priority-item-serial">${escapeHtml(d.serial)}</div>
                        <div class="priority-item-desc">${escapeHtml(d.description)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">
                            Ekleyen: ${escapeHtml(d.created_by || "Bilinmiyor")} | Tarih: ${formatTimestamp$1(d.created_at)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px; padding-left: 10px; align-items:center;">
                        <button class="btn-del-priority" style="background: rgba(59, 130, 246, 0.4);" onclick="startEditPriority('${d.id}')">✏️</button>
                        <button class="btn-del-priority" onclick="deletePriority('${d.id}')">×</button>
                    </div>
                `;
      }
      prioList2.appendChild(item);
    });
  }
  document.getElementById("priority-search")?.addEventListener("input", renderPriorityDevices);
  addPrioBtn2.onclick = async () => {
    const serialVal = pSerial2.value.trim().toUpperCase();
    if (!serialVal) return;
    const existing = cachedDevices.find((d) => d.serial.toUpperCase() === serialVal);
    if (existing) {
      const confirmed = await window.showConfirm(
        "Cihaz Zaten Kayıtlı",
        "Aynı seri numarasında farklı bir kayıt var. Bu cihazı düzenlemek ister misiniz?",
        "Evet"
      );
      if (confirmed) {
        window.startEditPriority(existing.id);
        focusPriorityDevice2({ id: existing.id });
        pSerial2.value = "";
        pCustomer2.value = "";
        pDesc2.value = "";
      }
      return;
    }
    const settings = await api2.getSettings();
    const data = {
      serial: serialVal,
      customer_name: pCustomer2.value.trim() || "Belirtilmedi",
      description: pDesc2.value.trim(),
      created_by: settings.personnelName || settings.username || "Bilinmiyor"
    };
    await api2.addPriorityDevice(data);
    pSerial2.value = "";
    pCustomer2.value = "";
    pDesc2.value = "";
    loadPriorityDevices2();
  };
  window.deletePriority = async (id) => {
    await api2.deletePriorityDevice(id);
    loadPriorityDevices2();
  };
  window.startEditPriority = (id) => {
    window._editingPriorityId = id;
    renderPriorityDevices();
  };
  window.cancelEditPriority = () => {
    window._editingPriorityId = null;
    renderPriorityDevices();
  };
  window.saveEditPriority = async (id) => {
    const cInput = document.getElementById(`edit-prio-customer-${id}`);
    const sInput = document.getElementById(`edit-prio-serial-${id}`);
    const dInput = document.getElementById(`edit-prio-desc-${id}`);
    if (!sInput.value.trim()) return;
    await api2.updatePriorityDevice(id, {
      customer_name: cInput.value.trim() || "Belirtilmedi",
      serial: sInput.value.trim().toUpperCase(),
      description: dInput.value.trim()
    });
    window._editingPriorityId = null;
    loadPriorityDevices2();
  };
  return { loadPriorityDevices: loadPriorityDevices2, focusPriorityDevice: focusPriorityDevice2 };
}
function initSettingsLogic(api2, elements, refreshSidebarProfile2) {
  const {
    sPersonnelName: sPersonnelName2,
    sUserRole: sUserRole2,
    sShortcutClear: sShortcutClear2,
    sShortcutCopy: sShortcutCopy2,
    sPopupSize: sPopupSize2,
    sPopupTimeout: sPopupTimeout2,
    sAutoStart: sAutoStart2,
    sPreventDuplicate: sPreventDuplicate2,
    sLogoutBtn: sLogoutBtn2,
    sClipboardUpper: sClipboardUpper2
  } = elements;
  let initialRole = "";
  const logoutLabel = "Oturumdan Çıkış Yap";
  async function loadSettingsToUI2() {
    const s = await api2.getSettings();
    sPersonnelName2.value = (s.personnelName || "").toUpperCase();
    let displayRole = s.role;
    if (displayRole === "kargo_kabul") displayRole = "Kargo Kabul";
    else if (displayRole === "mh") displayRole = "Müşteri Hizmetleri";
    else if (displayRole === "admin") displayRole = "Yönetici";
    sUserRole2.value = displayRole || "";
    initialRole = s.role || "";
    sShortcutClear2.value = s.shortcuts?.clearCache || "CommandOrControl+Shift+X";
    sShortcutCopy2.value = s.shortcuts?.toggleMonitoring || "CommandOrControl+Shift+C";
    sPopupSize2.value = String(s.popupSizeLevel || 2);
    sPopupTimeout2.value = String(s.popupTimeout || 5e3);
    sAutoStart2.checked = s.autoStartEnabled || false;
    sPreventDuplicate2.checked = s.preventDuplicatePopup || false;
    sClipboardUpper2.checked = s.clipboardUpperEnabled !== false;
    if (sLogoutBtn2) {
      sLogoutBtn2.textContent = logoutLabel;
    }
  }
  async function saveCurrentSettings() {
    const currentSettings = await api2.getSettings();
    const settingsToSave = {
      ...currentSettings,
      personnelName: sPersonnelName2.value.trim(),
      role: initialRole,
      shortcuts: {
        clearCache: sShortcutClear2.value,
        toggleMonitoring: sShortcutCopy2.value
      },
      popupSizeLevel: parseInt(sPopupSize2.value),
      popupTimeout: parseInt(sPopupTimeout2.value),
      autoStartEnabled: sAutoStart2.checked,
      preventDuplicatePopup: sPreventDuplicate2.checked,
      clipboardUpperEnabled: sClipboardUpper2.checked
    };
    try {
      await api2.saveSettings(settingsToSave);
      refreshSidebarProfile2();
    } catch (e) {
      showToast("Ayarlar kaydedilirken hata oluştu.", "error");
    }
  }
  let saveTimeout = null;
  function triggerAutoSave(debounceMs = 0) {
    if (saveTimeout) clearTimeout(saveTimeout);
    if (debounceMs > 0) {
      saveTimeout = setTimeout(saveCurrentSettings, debounceMs);
    } else {
      saveCurrentSettings();
    }
  }
  sPersonnelName2.addEventListener("input", () => {
    const start = sPersonnelName2.selectionStart;
    const end = sPersonnelName2.selectionEnd;
    sPersonnelName2.value = sPersonnelName2.value.replace(/\s/g, "").toUpperCase();
    sPersonnelName2.setSelectionRange(start, end);
    triggerAutoSave(500);
  });
  sPopupSize2.addEventListener("change", () => triggerAutoSave(0));
  sPopupTimeout2.addEventListener("input", () => triggerAutoSave(500));
  sAutoStart2.addEventListener("change", () => triggerAutoSave(0));
  sPreventDuplicate2.addEventListener("change", () => triggerAutoSave(0));
  sClipboardUpper2.addEventListener("change", () => triggerAutoSave(0));
  function setupShortcutRecorder(input) {
    input.onkeydown = (e) => {
      e.preventDefault();
      const keys = [];
      if (e.ctrlKey || e.metaKey) keys.push("CommandOrControl");
      if (e.shiftKey) keys.push("Shift");
      if (e.altKey) keys.push("Alt");
      if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        keys.push(e.key.toUpperCase());
        input.value = keys.join("+");
        triggerAutoSave(0);
      }
    };
  }
  setupShortcutRecorder(sShortcutClear2);
  setupShortcutRecorder(sShortcutCopy2);
  if (sLogoutBtn2) {
    sLogoutBtn2.onclick = async () => {
      const confirmed = await window.showConfirm(
        "Oturumu Kapat",
        "Oturumdan çıkış yapmak istiyor musunuz?",
        "Çıkış Yap"
      );
      if (!confirmed) return;
      try {
        await api2.logout();
      } catch (e) {
        showToast("Oturum kapatılırken hata oluştu.", "error");
      }
    };
  }
  return { loadSettingsToUI: loadSettingsToUI2 };
}
function initAdminLogic(api2, elements, loadAdminUsersCallback) {
  const {
    adminUserList: adminUserList2,
    btnAddUser: btnAddUser2,
    adminModal: adminModal2,
    adminModalTitle: adminModalTitle2,
    adminUserId: adminUserId2,
    adminUsername: adminUsername2,
    adminPassword: adminPassword2,
    adminFullname: adminFullname2,
    adminRole: adminRole2,
    btnCancelAdminModal: btnCancelAdminModal2,
    btnSaveAdminUser: btnSaveAdminUser2
  } = elements;
  let adminUsersCache = [];
  async function loadAdminUsers2() {
    const users = await api2.getUsers();
    adminUsersCache = users || [];
    renderAdminUsers(adminUsersCache);
  }
  function renderAdminUsers(users) {
    adminUserList2.innerHTML = "";
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
                <h3>${escapeHtml(user.fullName || "İsimsiz")}</h3>
                <p><strong>K. Adı:</strong> ${escapeHtml(user.username)}</p>
                <p><strong>Şifre:</strong> <span style="opacity:0.7;">Güvenlik nedeniyle gizli</span></p>
                <p><strong>Level:</strong> ${user.level || 1} (${user.xp || 0} XP)</p>
                <div class="actions">
                    <button class="btn-edit" data-id="${user.id}">Düzenle</button>
                    <button class="btn-delete" data-id="${user.id}">Sil</button>
                    <button class="btn-reset-xp" data-id="${user.id}" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);">XP Sıfırla</button>
                </div>
            `;
      adminUserList2.appendChild(card);
    });
    adminUserList2.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        const user = adminUsersCache.find((u) => u.id === id);
        if (user) openAdminModal(user);
      });
    });
    adminUserList2.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const user = adminUsersCache.find((u) => u.id === id);
        const confirmed = await showConfirm("Kullanıcıyı Sil", `"${user?.username}" kullanıcısını silmek istediğinize emin misiniz?`);
        if (confirmed) {
          await api2.deleteUser(id);
          loadAdminUsers2();
          showToast("Kullanıcı silindi.", "success");
        }
      });
    });
    adminUserList2.querySelectorAll(".btn-reset-xp").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const user = adminUsersCache.find((u) => u.id === id);
        const confirmed = await showConfirm("XP Sıfırla", `"${user?.username}" kullanıcısının XP ve Level bilgisi sıfırlanacak. Emin misiniz?`);
        if (confirmed) {
          await api2.resetUserXp(id);
          loadAdminUsers2();
          showToast("XP sıfırlandı.", "success");
        }
      });
    });
  }
  function openAdminModal(user = null) {
    if (user) {
      adminModalTitle2.textContent = "Kullanıcıyı Düzenle";
      adminUserId2.value = user.id;
      adminUsername2.value = user.username || "";
      adminPassword2.value = "";
      adminPassword2.placeholder = "Değiştirmek için yeni şifre girin";
      adminFullname2.value = user.fullName || "";
      adminRole2.value = user.role || "kargo_kabul";
    } else {
      adminModalTitle2.textContent = "Yeni Kullanıcı";
      adminUserId2.value = "";
      adminUsername2.value = "";
      adminPassword2.value = "";
      adminPassword2.placeholder = "Giriş şifresi...";
      adminFullname2.value = "";
      adminRole2.value = "kargo_kabul";
    }
    adminModal2.classList.add("active");
  }
  btnAddUser2.onclick = () => openAdminModal();
  btnCancelAdminModal2.onclick = () => adminModal2.classList.remove("active");
  btnSaveAdminUser2.onclick = async () => {
    const username = adminUsername2.value.trim();
    const password = adminPassword2.value.trim();
    const fullName = adminFullname2.value.trim();
    const role = adminRole2.value;
    const id = adminUserId2.value;
    if (!username || !fullName || !role || !id && !password) {
      showToast("Lütfen tüm alanları doldurun.", "error");
      return;
    }
    try {
      btnSaveAdminUser2.textContent = "Kaydediliyor...";
      btnSaveAdminUser2.disabled = true;
      if (id) {
        const updateData = { username, fullName, role };
        if (password) updateData.password = password;
        await api2.updateUser(id, updateData);
      } else {
        await api2.createUser({ username, password, fullName, role });
      }
      adminModal2.classList.remove("active");
      loadAdminUsers2();
      showToast("Kullanıcı kaydedildi.", "success");
    } catch (e) {
      showToast("Hata: " + e.message, "error");
    } finally {
      btnSaveAdminUser2.textContent = "Kaydet";
      btnSaveAdminUser2.disabled = false;
    }
  };
  return { loadAdminUsers: loadAdminUsers2 };
}
function initZReportLogic(api2, elements) {
  const {
    zreportDropZone: zreportDropZone2,
    zreportFileInput: zreportFileInput2,
    zreportResults: zreportResults2,
    zreportAnalytics: zreportAnalytics2
  } = elements;
  zreportDropZone2.onclick = () => zreportFileInput2.click();
  zreportDropZone2.ondragover = (e) => {
    e.preventDefault();
    zreportDropZone2.classList.add("dragover");
  };
  zreportDropZone2.ondragleave = () => zreportDropZone2.classList.remove("dragover");
  zreportDropZone2.ondrop = async (e) => {
    e.preventDefault();
    zreportDropZone2.classList.remove("dragover");
    const file = e.dataTransfer?.files[0];
    if (file) {
      await handleZReportFile(file);
    }
  };
  zreportFileInput2.onchange = async () => {
    if (zreportFileInput2.files && zreportFileInput2.files[0]) {
      const file = zreportFileInput2.files[0];
      await handleZReportFile(file);
      zreportFileInput2.value = "";
    }
  };
  async function handleZReportFile(file) {
    if (!file) return;
    zreportResults2.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Hesaplanıyor...</div>';
    zreportAnalytics2.style.display = "none";
    try {
      const buffer = await file.arrayBuffer();
      const results = await api2.calculateZReport(buffer);
      displayZReportResults(results);
    } catch (err) {
      zreportResults2.innerHTML = '<div style="text-align:center; color:#ef4444;">Dosya okunurken hata oluştu.</div>';
    }
  }
  function displayZReportResults(results) {
    zreportResults2.innerHTML = "";
    if (!results || results.length === 0) {
      zreportResults2.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Geçerli veri bulunamadı. Excel dosyasını kontrol edin.</p>';
      return;
    }
    results.forEach((res, index) => {
      const card = document.createElement("div");
      card.className = "result-card";
      card.style.animationDelay = `${index * 0.1}s`;
      const topModels = (res.models || []).slice(0, 3).map((m) => `${m.model}: ${m.count}`).join(" | ");
      card.innerHTML = `
                <div class="result-info">
                    <h3>${res.date}</h3>
                    <div class="result-stats">
                        <div class="stat-item">Toplam Girilen Kayıt: <strong>${res.totalCount}</strong></div>
                    </div>
                    ${topModels ? `<div style="margin-top:10px; font-size:0.78rem; color:var(--text-muted);">${topModels}</div>` : ""}
                </div>
                <div class="status-badge status-eligible">Z Raporu Hazır</div>
            `;
      card.onclick = () => {
        zreportResults2.querySelectorAll(".result-card").forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        showZReportAnalytics(res);
      };
      zreportResults2.appendChild(card);
      if (index === 0) card.click();
    });
  }
  function showZReportAnalytics(res) {
    zreportAnalytics2.style.display = "block";
    zreportAnalytics2.innerHTML = "";
    if (!res.models || res.models.length === 0) {
      zreportAnalytics2.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Model verisi yok</p>';
      return;
    }
    const maxCount = Math.max(...res.models.map((m) => m.count), 1);
    const modelCards = res.models.map((model) => `
            <div style="background:rgba(255,255,255,0.04); border:1px solid var(--glass-border); border-radius:16px; padding:14px 16px;">
                <div style="font-size:0.88rem; font-weight:700; color:var(--text-main); margin-bottom:8px; word-break:break-word;">${model.model}</div>
                <div style="font-size:0.78rem; color:var(--text-muted);">
                    Toplam Kayıt: <strong style="color:var(--accent);">${model.count}</strong>
                </div>
            </div>
        `).join("");
    zreportAnalytics2.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:16px; flex-wrap:wrap;">
                <div>
                    <h2 style="margin:0 0 6px 0;">${res.date} Cihaz Dağılımı</h2>
                    <div style="font-size:0.85rem; color:var(--text-muted);">O gün girilen modellerin detaylı adet bilgileri.</div>
                </div>
                <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.18); border-radius:16px; padding:12px 14px; min-width:120px;">
                    <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Günlük Toplam</div>
                    <div style="font-size:1.4rem; font-weight:800; color:var(--accent);">${res.totalCount}</div>
                </div>
            </div>
            
            <div id="zreport-chart" style="display:flex; align-items:flex-end; gap:8px; height:240px; border-bottom:2px solid var(--glass-border); position:relative; margin-bottom:18px; overflow-x:auto; padding-bottom:4px;"></div>
            
            <div style="margin-top:28px;">
                <h3 style="margin:0 0 14px 0;">Model Bazlı Toplamlar</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    ${modelCards}
                </div>
            </div>

            <div style="margin-top:28px; margin-bottom:24px;">
                <h3 style="margin:0 0 14px 0;">Personel Bazlı Kayıt Sayıları</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    ${(res.personnel || []).map((p) => `
                        <div style="background:rgba(255,255,255,0.04); border:1px solid var(--glass-border); border-radius:16px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
                            <div style="font-size:0.88rem; font-weight:700; color:var(--text-main); word-break:break-word;">${escapeHtml(p.name)}</div>
                            <div style="font-size:0.78rem; color:var(--text-muted);">
                                Kayıt Sayısı: <strong style="color:var(--accent);">${p.count}</strong>
                            </div>
                        </div>
                    `).join("") || '<p style="color:var(--text-muted);">Veri yok</p>'}
                </div>
            </div>
        `;
    const chart = document.getElementById("zreport-chart");
    const chartModels = res.models.slice(0, 15);
    chartModels.forEach((model, i) => {
      const barHeight = maxCount > 0 ? model.count / maxCount * 200 : 0;
      const displayLabel = model.model.length > 8 ? model.model.substring(0, 6) + ".." : model.model;
      const group = document.createElement("div");
      group.style.cssText = "flex:1; min-width:32px; max-width:80px; display:flex; flex-direction:column; align-items:center; gap:6px;";
      group.innerHTML = `
                <div title="${model.model} | Kayıt: ${model.count}" style="width:100%; display:flex; flex-direction:column-reverse; align-items:center; border-radius:8px 8px 0 0; cursor:pointer; position:relative; height:0; transition:height 0.6s cubic-bezier(0.175,0.885,0.32,1.275);" class="bar-stack">
                    <div style="width:100%; height:${barHeight}px; background:linear-gradient(to top, var(--accent), #38bdf8); border-radius:4px 4px 0 0;"></div>
                    <span style="position:absolute; top:-18px; font-size:11px; font-weight:800; color:var(--text-main);">${model.count}</span>
                </div>
                <div style="font-size:9px; font-weight:600; color:var(--text-muted); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;" title="${model.model}">${displayLabel}</div>
            `;
      chart.appendChild(group);
      setTimeout(() => {
        const stack = group.querySelector(".bar-stack");
        stack.style.height = `${barHeight}px`;
      }, 30 + i * 18);
    });
    zreportAnalytics2.scrollIntoView({ behavior: "smooth" });
  }
}
function formatTimestamp(timestampMs) {
  if (!timestampMs) return "Tarih yok";
  try {
    const date = new Date(timestampMs);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch {
    return "Tarih yok";
  }
}
function initDeviceCallLogic(api2, elements) {
  const {
    dcallHistoryList: dcallHistoryList2,
    dcallSearchInput: dcallSearchInput2,
    dcallStatusFilter: dcallStatusFilter2,
    btnOpenModal,
    deviceCallModal: deviceCallModal2,
    dcallSerial: dcallSerial2,
    dcallModel: dcallModel2,
    dcallCustomer: dcallCustomer2,
    btnCancelModal,
    btnSendModal
  } = elements;
  let latestCalls = [];
  let currentPersonnelName = "";
  function openModal() {
    if (dcallSerial2) dcallSerial2.value = "";
    if (dcallModel2) dcallModel2.value = "";
    if (dcallCustomer2) dcallCustomer2.value = "";
    if (deviceCallModal2) deviceCallModal2.classList.add("active");
    if (dcallSerial2) dcallSerial2.focus();
  }
  function closeModal() {
    if (deviceCallModal2) deviceCallModal2.classList.remove("active");
  }
  if (btnOpenModal) btnOpenModal.onclick = () => openModal();
  if (btnCancelModal) btnCancelModal.onclick = () => closeModal();
  if (btnSendModal) {
    btnSendModal.onclick = async () => {
      const serial = dcallSerial2.value.trim().toUpperCase();
      const model = dcallModel2.value.trim().toUpperCase();
      const customer = dcallCustomer2.value.trim();
      if (!serial) {
        dcallSerial2.focus();
        return;
      }
      if (!model) {
        dcallModel2.focus();
        return;
      }
      btnSendModal.textContent = "Gönderiliyor...";
      btnSendModal.setAttribute("disabled", "true");
      try {
        await api2.createDeviceCall({
          serial,
          model_name: model,
          customer_name: customer,
          created_by: currentPersonnelName || "Bilinmiyor"
        });
        closeModal();
      } catch (err) {
        console.error("Device call error:", err);
        showToast("Hata", "Çağrı gönderilemedi");
      } finally {
        btnSendModal.textContent = "📢 Çağrı Gönder";
        btnSendModal.removeAttribute("disabled");
      }
    };
  }
  if (dcallSearchInput2) {
    dcallSearchInput2.addEventListener("input", () => renderHistory());
  }
  if (dcallStatusFilter2) {
    dcallStatusFilter2.addEventListener("change", () => renderHistory());
  }
  function renderHistory() {
    if (!dcallHistoryList2) return;
    const query = (dcallSearchInput2?.value || "").trim().toLowerCase();
    const filterStatus = dcallStatusFilter2?.value || "all";
    let filtered = latestCalls.filter((call) => {
      if (filterStatus !== "all" && call.status !== filterStatus) return false;
      if (query) {
        const s = (call.serial || "").toLowerCase();
        const m = (call.model_name || "").toLowerCase();
        const c = (call.customer_name || "").toLowerCase();
        const creator = (call.created_by || "").toLowerCase();
        const resolver = (call.resolved_by || "").toLowerCase();
        if (!s.includes(query) && !m.includes(query) && !c.includes(query) && !creator.includes(query) && !resolver.includes(query)) {
          return false;
        }
      }
      return true;
    });
    if (filtered.length === 0) {
      dcallHistoryList2.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02); border: 1.5px dashed var(--glass-border); border-radius: 24px;">
                    <div style="font-size: 3rem; margin-bottom: 12px; opacity: 0.5;">📢</div>
                    <h3 style="font-size: 1.25rem; color: var(--text-main); margin-bottom: 6px;">Henüz bir cihaz çağrısı yok</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">"📢 Yeni Cihaz Sor" butonuna tıklayarak yeni bir çağrı başlatabilirsiniz.</p>
                </div>
            `;
      return;
    }
    dcallHistoryList2.innerHTML = filtered.map((call) => {
      const isMine = currentPersonnelName && (call.created_by || "").toLowerCase() === currentPersonnelName.toLowerCase();
      let badgeHtml = "";
      if (call.status === "active") {
        badgeHtml = `<span style="display:inline-flex; align-items:center; gap:6px; font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:8px; background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;"></span> ⏳ AKTİF / YANIT BEKLENİYOR</span>`;
      } else if (call.status === "resolved") {
        badgeHtml = `<span style="display:inline-flex; align-items:center; gap:6px; font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:8px; background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3);">✅ CİHAZ BULUNDU</span>`;
      } else if (call.status === "cancelled") {
        badgeHtml = `<span style="display:inline-flex; align-items:center; gap:6px; font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:8px; background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">✕ İPTAL EDİLDİ</span>`;
      }
      const customerLine = call.customer_name ? `<div style="font-size:0.83rem; color:#94a3b8; margin-top:2px;">Müşteri: <strong style="color:#f1f5f9; cursor:pointer;" class="dcall-copyable" data-copy="${escapeHtml(call.customer_name)}" title="Tıklayarak kopyalayın">${escapeHtml(call.customer_name)}</strong></div>` : "";
      let resolvedLine = "";
      if (call.status === "resolved" && call.resolved_by) {
        resolvedLine = `<div style="font-size:0.8rem; color:#22c55e; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.08); display:flex; align-items:center; gap:6px;"><span>✅</span> <span>Bulan: <strong>${escapeHtml(call.resolved_by)}</strong> (${formatTimestamp(call.resolved_at)})</span></div>`;
      }
      let actionBtnHtml = "";
      if (call.status === "active") {
        if (!isMine) {
          actionBtnHtml = `<button class="dcall-here-act-btn" data-id="${call.id}" style="width:100%; margin-top:14px; padding:10px; background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; border:none; border-radius:12px; font-weight:700; font-size:0.88rem; cursor:pointer; box-shadow:0 4px 12px rgba(22,163,74,0.3); transition:all 0.2s;">📱 Cihaz Bende</button>`;
        } else {
          actionBtnHtml = `<button class="dcall-cancel-act-btn" data-id="${call.id}" style="width:100%; margin-top:14px; padding:10px; background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.3); border-radius:12px; font-weight:700; font-size:0.88rem; cursor:pointer; transition:all 0.2s;">✕ Çağrıyı İptal Et</button>`;
        }
      }
      return `
                <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; position:relative; background:var(--card-bg); border:1px solid var(--glass-border); border-radius:20px; padding:20px;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            ${badgeHtml}
                            <span style="font-size:0.75rem; color:#64748b;">${formatTimestamp(call.created_at)}</span>
                        </div>
                        <div style="font-size:1.15rem; font-weight:800; color:#f8fafc; cursor:pointer; margin-bottom:4px;" class="dcall-copyable" data-copy="${escapeHtml(call.model_name)}" title="Tıklayarak kopyalayın">${escapeHtml(call.model_name)}</div>
                        <div style="font-size:0.85rem; color:#94a3b8; margin-bottom:4px;">Seri No: <strong style="color:#38bdf8; cursor:pointer;" class="dcall-copyable" data-copy="${escapeHtml(call.serial)}" title="Tıklayarak kopyalayın">${escapeHtml(call.serial)}</strong></div>
                        ${customerLine}
                        <div style="font-size:0.78rem; color:#64748b; margin-top:10px;">Çağrı Yapan: <strong style="color:#cbd5e1;">${escapeHtml(call.created_by)}</strong></div>
                        ${resolvedLine}
                    </div>
                    ${actionBtnHtml}
                </div>
            `;
    }).join("");
    dcallHistoryList2.querySelectorAll(".dcall-copyable").forEach((el) => {
      el.addEventListener("click", (e) => {
        const text = e.currentTarget.dataset.copy;
        if (text) {
          navigator.clipboard.writeText(text);
          showToast("Kopyalandı", `${text} panoya kopyalandı!`);
        }
      });
    });
    dcallHistoryList2.querySelectorAll(".dcall-here-act-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        if (!id) return;
        try {
          await api2.resolveDeviceCall(id, currentPersonnelName || "Bilinmiyor");
          showToast("Başarılı", "Cihazın sizde olduğu bildirildi!");
        } catch (err) {
          console.error(err);
        }
      });
    });
    dcallHistoryList2.querySelectorAll(".dcall-cancel-act-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        if (!id) return;
        try {
          await api2.cancelDeviceCall(id);
          showToast("İptal Edildi", "Çağrı iptal edildi");
        } catch (err) {
          console.error(err);
        }
      });
    });
  }
  return {
    updateData(calls, name) {
      latestCalls = calls || [];
      currentPersonnelName = name || "";
      const viewSec = document.getElementById("view-device-calls");
      if (viewSec && viewSec.classList.contains("active")) {
        renderHistory();
      }
    },
    renderHistory,
    openModal
  };
}
const cardsDiv = document.getElementById("cards");
const searchInput = document.getElementById("search");
const toggleBtn = document.getElementById("toggle");
const themeBtn = document.getElementById("theme-toggle");
const clearCacheBtn = document.getElementById("clear-cache");
const clipboardUpperToggleBtn = document.getElementById("clipboard-upper-toggle");
const statusDot = document.getElementById("status-dot");
const statusInfo = document.getElementById("status-info");
const statusRefreshBtn = document.getElementById("status-refresh-btn");
const sideName = document.getElementById("side-name");
const navItems = document.querySelectorAll(".nav-item");
const viewSections = document.querySelectorAll(".view-section");
const prioList = document.getElementById("priority-list");
const pSerial = document.getElementById("p-serial");
const pCustomer = document.getElementById("p-customer");
const pDesc = document.getElementById("p-desc");
const addPrioBtn = document.getElementById("add-priority-btn");
const sPersonnelName = document.getElementById("personnel-name");
const sUserRole = document.getElementById("user-role");
const sShortcutClear = document.getElementById("shortcut-clear");
const sShortcutCopy = document.getElementById("shortcut-copy");
const sPopupSize = document.getElementById("popup-size");
const sPopupTimeout = document.getElementById("popup-timeout");
const sAutoStart = document.getElementById("auto-start");
const sPreventDuplicate = document.getElementById("prevent-duplicate");
const sClipboardUpper = document.getElementById("clipboard-upper");
const sLogoutBtn = document.getElementById("logout-btn");
document.getElementById("bonus-drop-zone");
document.getElementById("bonus-file-input");
document.getElementById("bonus-results");
document.getElementById("bonus-analytics");
document.getElementById("work-start");
document.getElementById("work-end");
const zreportDropZone = document.getElementById("zreport-drop-zone");
const zreportFileInput = document.getElementById("zreport-file-input");
const zreportResults = document.getElementById("zreport-results");
const zreportAnalytics = document.getElementById("zreport-analytics");
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
document.getElementById("side-device-call-btn");
const deviceCallModal = document.getElementById("device-call-modal");
const dcallSerial = document.getElementById("dcall-serial");
const dcallModel = document.getElementById("dcall-model");
const dcallCustomer = document.getElementById("dcall-customer");
const btnCancelDeviceCall = document.getElementById("btn-cancel-device-call");
const btnSendDeviceCall = document.getElementById("btn-send-device-call");
document.getElementById("device-call-toast-container");
const dcallHistoryList = document.getElementById("device-call-history-list");
const dcallSearchInput = document.getElementById("device-call-search");
const dcallStatusFilter = document.getElementById("device-call-status-filter");
const btnOpenDeviceCallModal = document.getElementById("btn-open-device-call-modal");
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalConfirm = document.getElementById("modal-confirm");
const modalCancel = document.getElementById("modal-cancel");
const api = window.electronAPI;
let monitoringEnabled = true;
let currentRole = "kargo_kabul";
let personnelName = "";
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
window.showConfirm = showConfirm;
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
    const fragment = document.createDocumentFragment();
    data.forEach((item) => {
      if (item.serial.toLowerCase().includes(query)) {
        const card = document.createElement("div");
        let cardClass = "card";
        const statusLabel = item.warranty_status;
        if (statusLabel.includes("RECCI")) cardClass += " recci";
        else if (statusLabel.includes("KVK")) cardClass += " kvk";
        else cardClass += " out-of-warranty";
        const isExpiredRecci = statusLabel.includes("SÜRESİ DOLMUŞ") || statusLabel.includes("FATURA KONTROL");
        const statusTagContent = isExpiredRecci ? `<span style="color:#10b981;">RECCI GARANTİLİ</span> <span style="color:#f59e0b;font-weight:700;">(SÜRESİ DOLMUŞ - FATURA KONTROL)</span>` : statusLabel;
        card.className = cardClass;
        card.style.position = "relative";
        card.innerHTML = `
          <button class="delete-btn" onclick="deleteEntry('${item.serial}')">&#10005;</button>
          <div class="status-tag">${statusTagContent}</div>
          <p><strong>Seri:</strong> ${item.serial}</p>
          <p><strong>Model:</strong> ${item.model_name || "Bilinmiyor"} ${item.model_color || ""}</p>
          <p><strong>Tarih:</strong> ${formatDate(item.copy_date)}</p>
          ${item.warranty_end ? `<p><strong>FT Bitiş:</strong> ${item.warranty_end}</p>` : ""}
        `;
        fragment.appendChild(card);
      }
    });
    cardsDiv.appendChild(fragment);
  });
}
toggleBtn.onclick = () => {
  monitoringEnabled = !monitoringEnabled;
  const span = toggleBtn.querySelector("span");
  if (span) {
    span.textContent = monitoringEnabled ? "📋 Clipboard İzleme: Aktif" : "📋 Clipboard İzleme: Devre Dışı";
  }
  toggleBtn.style.opacity = monitoringEnabled ? "1" : "0.6";
  api.toggleMonitoring(monitoringEnabled);
};
const ALL_THEMES = ["dark", "midnight", "ocean", "sunset"];
const THEME_ICONS = {
  dark: "🌙",
  midnight: "🔮",
  ocean: "🌊",
  sunset: "🌅"
};
let currentTheme = "dark";
function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.remove(...ALL_THEMES);
  document.body.classList.add(theme);
  themeBtn.textContent = THEME_ICONS[theme] || "🌙";
  document.querySelectorAll(".theme-card").forEach((c) => {
    c.classList.toggle("selected", c.dataset.theme === theme);
  });
}
themeBtn.onclick = () => {
  const idx = ALL_THEMES.indexOf(currentTheme);
  const next = ALL_THEMES[(idx + 1) % ALL_THEMES.length];
  applyTheme(next);
  api.getSettings().then((s) => {
    api.saveSettings({ ...s, theme: next });
  });
};
const themePicker = document.getElementById("theme-picker");
if (themePicker) {
  themePicker.addEventListener("click", (e) => {
    const card = e.target.closest(".theme-card");
    if (!card || !card.dataset.theme) return;
    const theme = card.dataset.theme;
    applyTheme(theme);
    api.getSettings().then((s) => {
      api.saveSettings({ ...s, theme });
    });
  });
}
api.getSettings().then((s) => {
  const theme = s.theme || "dark";
  applyTheme(theme);
});
let mainSearchTimeout;
searchInput.oninput = () => {
  clearTimeout(mainSearchTimeout);
  mainSearchTimeout = setTimeout(() => {
    loadCards();
  }, 300);
};
function switchView(viewName) {
  viewSections.forEach((sec) => sec.classList.remove("active"));
  navItems.forEach((item) => item.classList.remove("active"));
  const targetSec = document.getElementById(`view-${viewName}`);
  const targetNavItem = document.querySelector(`[data-view="${viewName}"]`);
  if (targetSec && targetNavItem) {
    targetSec.classList.add("active");
    targetNavItem.classList.add("active");
  }
  if (viewName === "history") {
    loadCards();
    api.getSettings().then((s) => {
      updateClipboardUpperUI(s.clipboardUpperEnabled !== false);
    });
  } else if (viewName === "priority") loadPriorityDevices();
  else if (viewName === "admin") loadAdminUsers();
  else if (viewName === "settings") loadSettingsToUI();
  else if (viewName === "device-calls") deviceCallController.renderHistory();
}
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const view = item.dataset.view;
    if (view) switchView(view);
  });
});
async function refreshSidebarProfile() {
  const settings = await api.getSettings();
  personnelName = settings.personnelName || "İsimsiz";
  if (sideName) sideName.textContent = personnelName.toUpperCase();
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
function updateClipboardUpperUI(enabled) {
  const span = clipboardUpperToggleBtn.querySelector("span");
  if (span) {
    span.textContent = enabled ? "🔠 Büyük Harf Yapıştır: Aktif" : "🔠 Büyük Harf Yapıştır: Kapalı";
  }
  clipboardUpperToggleBtn.classList.toggle("btn-warning", !enabled);
  clipboardUpperToggleBtn.classList.toggle("btn-primary", enabled);
}
api.getSettings().then((s) => updateClipboardUpperUI(s.clipboardUpperEnabled !== false));
clipboardUpperToggleBtn.onclick = async () => {
  const s = await api.getSettings();
  const current = s.clipboardUpperEnabled !== false;
  const next = !current;
  try {
    await api.saveSettings({ ...s, clipboardUpperEnabled: next });
    updateClipboardUpperUI(next);
    showToast(`Büyük harf yapıştırma özelliği ${next ? "etkinleştirildi" : "devre dışı bırakıldı"}.`, "info");
  } catch (e) {
    showToast("Büyük harf yapıştırma ayarı değiştirilemedi: " + e.message, "error");
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
    span.textContent = monitoringEnabled ? "📋 Clipboard İzleme: Aktif" : "📋 Clipboard İzleme: Devre Dışı";
  }
  toggleBtn.style.opacity = monitoringEnabled ? "1" : "0.6";
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
            <strong style="font-size:1.1rem;">&#9888;&#65039; ÖNCELİKLİ CİHAZ!</strong>
            <button id="close-priority-alert" style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer; padding:0 4px;">&#10005;</button>
        </div>
        <div style="font-size:0.95rem; font-weight:600;">${escapeHtml(device.customer_name)}</div>
        <div style="font-size:0.85rem; opacity:0.9; background:rgba(0,0,0,0.1); padding:8px; border-radius:8px;">${escapeHtml(device.description)}</div>
        <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
            <button id="delete-priority-bound" style="background: rgba(239, 68, 68, 0.5); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;">Sistemden Sil</button>
        </div>
    `;
  if (!document.getElementById("priority-animations")) {
    const style = document.createElement("style");
    style.id = "priority-animations";
    style.textContent = `
            @keyframes slideDownIn {
                from { opacity: 0; transform: translate(-50%, -40px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
            #delete-priority-bound:hover { background: #dc2626 !important; transform: scale(1.05); }
        `;
    document.head.appendChild(style);
  }
  document.body.appendChild(alertDiv);
  const closeBtn = alertDiv.querySelector("#close-priority-alert");
  closeBtn.onclick = () => alertDiv.remove();
  const deleteBtn = alertDiv.querySelector("#delete-priority-bound");
  deleteBtn.onclick = async () => {
    const confirmed = await showConfirm(
      "Sistemden Kalıcı Olarak Sil",
      `${device.customer_name} cihazı işleme alındı olarak işaretlenecek ve listeden kalkacaktır. Emin misiniz?`,
      "Evet, Sil"
    );
    if (confirmed) {
      await api.deletePriorityDevice(device.id);
      if (alertDiv.parentNode) alertDiv.remove();
      loadPriorityDevices();
      showToast("Cihaz sistemden kalıcı olarak silindi.", "success");
    }
  };
});
const { loadPriorityDevices, focusPriorityDevice } = initPriorityLogic(api, {
  prioList,
  addPrioBtn,
  pSerial,
  pCustomer,
  pDesc
});
const { loadSettingsToUI } = initSettingsLogic(api, {
  sPersonnelName,
  sUserRole,
  sShortcutClear,
  sShortcutCopy,
  sPopupSize,
  sPopupTimeout,
  sAutoStart,
  sPreventDuplicate,
  sLogoutBtn,
  sClipboardUpper
}, refreshSidebarProfile);
window.deletePriority = async (id) => {
  const confirmed = await showConfirm(
    "Öncelikli Cihazı Sil",
    "Bu cihazı öncelikli listeden silmek istediğinize emin misiniz?",
    "Evet, Sil"
  );
  if (confirmed) {
    await api.deletePriorityDevice(id);
    loadPriorityDevices();
    showToast("Cihaz başarıyla silindi.", "success");
  }
};
Promise.all([
  api.getSettings(),
  api.getUsers().catch(() => [])
]).then(([s]) => {
  currentRole = s.role || "kargo_kabul";
  personnelName = s.personnelName || "";
  const isAdmin = s.isAdmin === true || s.username === "KursatS";
  const sideAdmin = document.getElementById("side-admin-btn");
  const sideDeviceCallBtn2 = document.getElementById("side-device-call-btn");
  if (sideDeviceCallBtn2) sideDeviceCallBtn2.style.display = currentRole === "kargo_kabul" ? "flex" : "none";
  if (sideAdmin) sideAdmin.style.display = isAdmin ? "flex" : "none";
  refreshSidebarProfile();
  loadCards();
});
api.onRefreshCards(() => {
  api.getSettings().then((s) => {
    currentRole = s.role || "kargo_kabul";
    personnelName = s.personnelName || "";
    const isAdmin = s.isAdmin === true || s.username === "KursatS";
    const sideAdmin = document.getElementById("side-admin-btn");
    const sideDeviceCallBtn2 = document.getElementById("side-device-call-btn");
    if (sideDeviceCallBtn2) sideDeviceCallBtn2.style.display = s.role === "kargo_kabul" ? "flex" : "none";
    if (sideAdmin) sideAdmin.style.display = isAdmin ? "flex" : "none";
    refreshSidebarProfile();
    loadCards();
  });
});
api.onFocusPriorityDevice((device) => {
  switchView("priority");
  loadPriorityDevices().then(() => {
    focusPriorityDevice(device);
  });
});
api.onPriorityDevicesUpdate(() => {
  loadPriorityDevices();
});
initZReportLogic(api, {
  zreportDropZone,
  zreportFileInput,
  zreportResults,
  zreportAnalytics
});
const { loadAdminUsers } = initAdminLogic(api, {
  adminUserList,
  btnAddUser,
  adminModal,
  adminModalTitle,
  adminUserId,
  adminUsername,
  adminPassword,
  adminFullname,
  adminRole,
  btnCancelAdminModal,
  btnSaveAdminUser
});
(function setupAutoUpdater() {
  const bar = document.createElement("div");
  bar.id = "update-bar";
  bar.style.cssText = "display:none;position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-top:1px solid #38bdf8;padding:12px 24px;align-items:center;gap:14px;font-size:0.9rem;color:#f8fafc;box-shadow:0 -4px 24px rgba(0,0,0,0.5);";
  bar.innerHTML = `
        <span id="update-msg" style="font-weight:600;flex:1;">📢 Yeni sürüm mevcut!</span>
        <div id="update-progress-wrap" style="display:none;flex:1;max-width:200px;height:8px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;">
            <div id="update-progress-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#38bdf8,#0284c7);border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <button id="update-action-btn" style="padding:8px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#ffffff;cursor:pointer;font-size:0.85rem;font-weight:700;box-shadow:0 0 12px rgba(56,189,248,0.4);transition:all 0.2s;">İndir</button>
        <button id="update-dismiss-btn" style="padding:6px 10px;border:none;background:transparent;color:#94a3b8;cursor:pointer;font-size:1.2rem;line-height:1;">&#10005;</button>
    `;
  document.body.appendChild(bar);
  const updateMsg = document.getElementById("update-msg");
  const progressWrap = document.getElementById("update-progress-wrap");
  const progressBar = document.getElementById("update-progress-bar");
  const actionBtn = document.getElementById("update-action-btn");
  const dismissBtn = document.getElementById("update-dismiss-btn");
  const btnCheckUpdate = document.getElementById("btn-check-update");
  const updateCheckStatus = document.getElementById("update-check-status");
  let updateState = "idle";
  api.onUpdateAvailable((version) => {
    updateState = "available";
    updateMsg.textContent = `📢 Yeni sürüm mevcut: v${version}`;
    bar.style.display = "flex";
    actionBtn.textContent = "⚡ İndir";
    actionBtn.disabled = false;
    actionBtn.style.opacity = "1";
    actionBtn.style.background = "linear-gradient(135deg,#38bdf8,#0284c7)";
    actionBtn.style.color = "#ffffff";
    actionBtn.style.boxShadow = "0 0 12px rgba(56,189,248,0.4)";
    actionBtn.style.cursor = "pointer";
    if (updateCheckStatus) {
      updateCheckStatus.style.color = "#38bdf8";
      updateCheckStatus.textContent = `📢 Yeni sürüm bulundu: v${version}`;
    }
    if (btnCheckUpdate) {
      btnCheckUpdate.textContent = "🔄 Tekrar Denetle";
      btnCheckUpdate.disabled = false;
    }
  });
  api.onUpdateNotAvailable(() => {
    if (updateCheckStatus) {
      updateCheckStatus.style.color = "#4ade80";
      updateCheckStatus.textContent = "✓ Harika! En güncel sürümü kullanıyorsunuz.";
    }
    if (btnCheckUpdate) {
      btnCheckUpdate.textContent = "🔍 Güncellemeleri Kontrol Et";
      btnCheckUpdate.disabled = false;
    }
  });
  api.onUpdateError((err) => {
    if (updateCheckStatus) {
      updateCheckStatus.style.color = "#f87171";
      updateCheckStatus.textContent = `⚠️ Kontrol hatası: ${err}`;
    }
    if (updateState === "downloading") {
      updateState = "available";
      actionBtn.textContent = "⚡ İndir";
      actionBtn.disabled = false;
      actionBtn.style.opacity = "1";
      actionBtn.style.background = "linear-gradient(135deg,#38bdf8,#0284c7)";
      actionBtn.style.boxShadow = "0 0 12px rgba(56,189,248,0.4)";
      actionBtn.style.cursor = "pointer";
    }
    if (btnCheckUpdate) {
      btnCheckUpdate.textContent = "🔍 Güncellemeleri Kontrol Et";
      btnCheckUpdate.disabled = false;
    }
  });
  api.onUpdateProgress((percent) => {
    progressWrap.style.display = "block";
    progressBar.style.width = `${percent}%`;
    updateMsg.textContent = `⏬ İndiriliyor... %${percent}`;
  });
  api.onUpdateDownloaded(() => {
    updateState = "ready";
    progressWrap.style.display = "none";
    updateMsg.textContent = "✓ Güncelleme hazır! Uygulamayı yeniden başlatıp yükleyin.";
    actionBtn.textContent = "🚀 Şimdi Güncelle";
    actionBtn.disabled = false;
    actionBtn.style.opacity = "1";
    actionBtn.style.background = "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
    actionBtn.style.color = "#ffffff";
    actionBtn.style.fontWeight = "800";
    actionBtn.style.boxShadow = "0 0 16px rgba(34, 197, 94, 0.6)";
    actionBtn.style.cursor = "pointer";
  });
  actionBtn.onclick = () => {
    if (updateState === "available" || updateState === "idle") {
      updateState = "downloading";
      actionBtn.textContent = "⏳ İndiriliyor...";
      actionBtn.style.opacity = "0.7";
      actionBtn.disabled = true;
      api.startUpdateDownload();
    } else if (updateState === "ready") {
      actionBtn.textContent = "Yükleniyor...";
      actionBtn.disabled = true;
      api.installUpdate();
    }
  };
  dismissBtn.onclick = () => {
    bar.style.display = "none";
  };
  if (btnCheckUpdate) {
    btnCheckUpdate.onclick = async () => {
      btnCheckUpdate.disabled = true;
      btnCheckUpdate.textContent = "⏳ Kontrol Ediliyor...";
      if (updateCheckStatus) {
        updateCheckStatus.style.color = "#94a3b8";
        updateCheckStatus.textContent = "GitHub sunucularına bağlanılıyor...";
      }
      try {
        const res = await api.checkForUpdates();
        if (res && res.updateInfo && res.updateInfo.version) {
          updateState = "available";
          updateMsg.textContent = `📢 Yeni sürüm mevcut: v${res.updateInfo.version}`;
          bar.style.display = "flex";
          actionBtn.textContent = "⚡ İndir";
          actionBtn.disabled = false;
          actionBtn.style.opacity = "1";
          actionBtn.style.background = "linear-gradient(135deg,#38bdf8,#0284c7)";
          actionBtn.style.color = "#ffffff";
          actionBtn.style.boxShadow = "0 0 12px rgba(56,189,248,0.4)";
          actionBtn.style.cursor = "pointer";
          if (updateCheckStatus) {
            updateCheckStatus.style.color = "#38bdf8";
            updateCheckStatus.textContent = `📢 Yeni sürüm bulundu: v${res.updateInfo.version}`;
          }
          btnCheckUpdate.textContent = "🔄 Tekrar Denetle";
        }
      } catch (e) {
        if (updateCheckStatus) {
          updateCheckStatus.style.color = "#f87171";
          updateCheckStatus.textContent = "⚠️ Güncelleme kontrolü başlatılamadı.";
        }
        btnCheckUpdate.textContent = "🔍 Güncellemeleri Kontrol Et";
      } finally {
        btnCheckUpdate.disabled = false;
        if (btnCheckUpdate.textContent === "⏳ Kontrol Ediliyor...") {
          btnCheckUpdate.textContent = "🔍 Güncellemeleri Kontrol Et";
        }
      }
    };
  }
})();
const deviceCallController = initDeviceCallLogic(api, {
  dcallHistoryList,
  dcallSearchInput,
  dcallStatusFilter,
  btnOpenModal: btnOpenDeviceCallModal,
  deviceCallModal,
  dcallSerial,
  dcallModel,
  dcallCustomer,
  btnCancelModal: btnCancelDeviceCall,
  btnSendModal: btnSendDeviceCall
});
api.onDeviceCallsUpdate((calls) => {
  deviceCallController.updateData(calls, personnelName);
});
