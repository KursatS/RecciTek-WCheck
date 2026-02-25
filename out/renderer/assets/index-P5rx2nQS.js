/* empty css               */
const cardsDiv = document.getElementById("cards");
const searchInput = document.getElementById("search");
const toggleBtn = document.getElementById("toggle");
const themeBtn = document.getElementById("theme-toggle");
const clearCacheBtn = document.getElementById("clear-cache");
const settingsBtn = document.getElementById("settings-btn");
const bonusBtn = document.getElementById("bonus-btn");
const ticketsBtn = document.getElementById("tickets-btn");
const ticketBadge = document.getElementById("ticket-badge");
const dcBtn = document.getElementById("double-copy-toggle");
const statusDot = document.getElementById("status-dot");
const statusInfo = document.getElementById("status-info");
const statusRefreshBtn = document.getElementById("status-refresh-btn");
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
  api.getCachedData().then((data) => {
    cardsDiv.innerHTML = "";
    if (!data || data.length === 0) {
      cardsDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <h3>Henüz bir cihaz sorgulanmadı</h3>
          <p>Panoya bir seri numarası kopyaladığınızda burada görünecektir.</p>
        </div>
      `;
      return;
    }
    const query = searchInput.value.toLowerCase();
    data.sort((a, b) => new Date(b.copy_date).getTime() - new Date(a.copy_date).getTime());
    data.forEach((item) => {
      if (item.serial.toLowerCase().includes(query)) {
        const card = document.createElement("div");
        let cardClass = "card";
        const statusLabel = item.warranty_status;
        if (statusLabel.includes("RECCI")) cardClass += " recci";
        else if (statusLabel.includes("KVK")) cardClass += " kvk";
        else cardClass += " out-of-warranty";
        const completedTicket = activeTickets.find((t) => t.serial === item.serial && t.status === "completed");
        const askMHBtn = currentRole === "kargo_kabul" ? `<button class="ask-mh-btn" data-serial="${item.serial}" data-model="${item.model_name || ""}" data-color="${item.model_color || ""}" style="position:absolute;top:12px;right:48px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;" title="MH'ye Sor">📩</button>` : "";
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
          ${completedTicket?.response ? `<p style="margin-top:6px;padding:6px 10px;background:rgba(16,185,129,0.08);border-radius:8px;font-size:0.8rem;"><strong style="color:#10b981;">MH Cevap:</strong> ${completedTicket.response}</p>` : ""}
        `;
        cardsDiv.appendChild(card);
      }
    });
    document.querySelectorAll(".ask-mh-btn").forEach((btn) => {
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
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  const isDark = document.body.classList.contains("dark");
  themeBtn.textContent = isDark ? "🌙" : "☀️";
};
searchInput.oninput = () => loadCards();
settingsBtn.onclick = () => api.openSettings();
bonusBtn.onclick = () => api.openBonus();
ticketsBtn.onclick = () => api.openTickets();
clearCacheBtn.onclick = async () => {
  const confirmed = await showConfirm(
    "Tüm Geçmişi Temizle",
    "Tüm sorgu geçmişiniz kalıcı olarak silinecektir. Emin misiniz?",
    "Tümünü Sil"
  );
  if (confirmed) {
    await api.clearCache();
    loadCards();
  }
};
window.deleteEntry = async (serial) => {
  const confirmed = await showConfirm(
    "Kaydı Sil",
    `${serial} seri numaralı cihazı listeden silmek istediğinizden emin misiniz?`
  );
  if (confirmed) {
    await api.deleteEntry(serial);
    loadCards();
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
  await api.toggleDoubleCopy(!current);
  updateDCUI(!current);
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
api.onRefreshCards(() => loadCards());
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
Promise.all([
  api.getSettings(),
  api.getTickets()
]).then(([s, tickets]) => {
  currentRole = s.role || "kargo_kabul";
  personnelName = s.personnelName || "";
  if (!personnelName.trim()) {
    setTimeout(() => {
      api.openSettings();
    }, 1e3);
  }
  if (tickets) {
    activeTickets = tickets;
    const pendingCount = tickets.filter((t) => t.status === "pending" || t.status === "in_progress").length;
    if (pendingCount > 0) {
      ticketBadge.style.display = "block";
      ticketBadge.textContent = String(pendingCount);
    } else {
      ticketBadge.style.display = "none";
    }
  }
  loadCards();
});
