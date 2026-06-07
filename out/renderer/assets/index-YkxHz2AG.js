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
function formatWaitTime(ms) {
  const mins = Math.floor(ms / 6e4);
  if (mins < 1) return "Az önce eklendi";
  if (mins < 60) return `${mins} dakikadır cevap bekliyor`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (remMins === 0) return `${hrs} saattir cevap bekliyor`;
  return `${hrs} sa ${remMins} dk bekleniyor`;
}
let waitTimerInterval = null;
function startWaitingTimers() {
  if (waitTimerInterval) return;
  waitTimerInterval = setInterval(() => {
    document.querySelectorAll(".wait-timer[data-created-at]").forEach((el) => {
      const createdAt = parseInt(el.dataset.createdAt, 10);
      if (!createdAt) return;
      el.textContent = formatWaitTime(Date.now() - createdAt);
    });
  }, 6e4);
}
function stopWaitingTimers() {
  if (waitTimerInterval) {
    clearInterval(waitTimerInterval);
    waitTimerInterval = null;
  }
}
function getMissingTypes(ticket) {
  return String(ticket.missing_type || "").split(",").map((t) => t.trim()).filter((t) => t && t !== "Belirtilmedi");
}
function isPhoneMissingQueue(ticket) {
  const missingTypes = getMissingTypes(ticket);
  const needsPhone = missingTypes.some((t) => t.toLowerCase().includes("telefon"));
  return !!ticket.aras_code && !ticket.phone_number && needsPhone;
}
function isInfoMissingQueue(ticket) {
  const missingTypes = getMissingTypes(ticket);
  const remainingTypes = missingTypes.filter((t) => !t.toLowerCase().includes("telefon"));
  return !!ticket.phone_number && remainingTypes.length > 0;
}
function normalizeHistoryAction(action) {
  const trimmed = String(action || "").trim();
  const actionMap = {
    "Oluşturuldu": "Oluşturuldu",
    "OluÅŸturuldu": "Oluşturuldu",
    "OluÃ…Å¸turuldu": "Oluşturuldu",
    "Üstlendi": "Üstlendi",
    "Ãœstlendi": "Üstlendi",
    "ÃƒÅ“stlendi": "Üstlendi",
    "Tamamlandı": "Tamamlandı",
    "TamamlandÄ±": "Tamamlandı",
    "TamamlandÃ„Â±": "Tamamlandı",
    "Yeniden Açtı": "Yeniden Açtı",
    "Yeniden AÃ§tı": "Yeniden Açtı",
    "Yeniden AÃƒÂ§tÃ„Â±": "Yeniden Açtı",
    "Ulaşılamadı Olarak İşaretledi": "Ulaşılamadı Olarak İşaretledi",
    "UlaÅŸÄ±lamadÄ± Olarak Ä°ÅŸaretledi": "Ulaşılamadı Olarak İşaretledi",
    "UlaÃ…Å¸Ã„Â±lamadÃ„Â± Olarak Ã„Â°Ã…Å¸aretledi": "Ulaşılamadı Olarak İşaretledi"
  };
  return actionMap[trimmed] || trimmed;
}
function showTicketHistoryModal(ticket) {
  document.getElementById("ticket-history-modal")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "ticket-history-modal";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);animation:fadeIn 0.2s ease;";
  let historyRows = "";
  const history = ticket.action_history || [];
  if (history.length > 0) {
    const sorted = [...history].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    sorted.forEach((entry, idx) => {
      const date = entry.timestamp ? new Date(entry.timestamp) : null;
      const normalizedAction = normalizeHistoryAction(entry.action);
      const dateStr = date ? `${date.toLocaleDateString("tr-TR")} ${date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` : "—";
      const iconMap = {
        "Oluşturuldu": "📝",
        "Üstlendi": "🤝",
        "Tamamlandı": "✅",
        "Ulaşılamadı Olarak İşaretledi": "🚫",
        "Yeniden Açtı": "🔄"
      };
      const icon = iconMap[normalizedAction] || "📌";
      const isLast = idx === sorted.length - 1;
      historyRows += `
                <div style="display:flex;gap:12px;align-items:flex-start;position:relative;">
                    <div style="display:flex;flex-direction:column;align-items:center;">
                        <div style="width:32px;height:32px;border-radius:50%;background:rgba(56,189,248,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;border:1px solid rgba(56,189,248,0.3);">${icon}</div>
                        ${!isLast ? '<div style="width:2px;flex:1;background:rgba(255,255,255,0.1);margin:4px 0;min-height:20px;"></div>' : ""}
                    </div>
                    <div style="flex:1;padding-bottom:${isLast ? "0" : "16px"};">
                        <div style="font-weight:600;font-size:0.9rem;color:white;">${normalizedAction}</div>
                        <div style="font-size:0.8rem;color:#94a3b8;margin-top:2px;">${entry.user}</div>
                        <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${dateStr}</div>
                    </div>
                </div>
            `;
    });
  } else {
    historyRows = `
            <div style="display:flex;gap:12px;align-items:center;">
                <div style="width:32px;height:32px;border-radius:50%;background:rgba(56,189,248,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;border:1px solid rgba(56,189,248,0.3);">&#128221;</div>
                <div>
                    <div style="font-weight:600;font-size:0.9rem;color:white;">Oluşturan</div>
                    <div style="font-size:0.8rem;color:#94a3b8;">${ticket.created_by || "Bilinmiyor"}</div>
                </div>
            </div>
            ${ticket.responded_by ? `
            <div style="display:flex;gap:12px;align-items:center;margin-top:12px;">
                <div style="width:32px;height:32px;border-radius:50%;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;border:1px solid rgba(16,185,129,0.3);">&#129309;</div>
                <div>
                    <div style="font-weight:600;font-size:0.9rem;color:white;">Üstlenen</div>
                    <div style="font-size:0.8rem;color:#94a3b8;">${ticket.responded_by}</div>
                </div>
            </div>` : ""}
        `;
  }
  overlay.innerHTML = `
        <div style="background:rgba(15,23,42,0.97);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;max-width:420px;width:90%;max-height:70vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h3 style="margin:0;font-size:1.1rem;color:white;">&#128220; İşlem Geçmişi</h3>
                <button id="close-history-modal" style="background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer;padding:0 4px;">&#10005;</button>
            </div>
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);">
                ${ticket.serial || "Seri No Yok"} ${ticket.model_name ? "— " + ticket.model_name : ""}
            </div>
            <div style="display:flex;flex-direction:column;">
                ${historyRows}
            </div>
        </div>
    `;
  document.body.appendChild(overlay);
  overlay.querySelector("#close-history-modal").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
function initTicketLogic(api2, elements, getCurrentRole, getPersonnelName) {
  const {
    ticketList: ticketList2,
    tSearchInput: tSearchInput2,
    tFilterStatus: tFilterStatus2,
    tQueueAll: tQueueAll2,
    tQueuePhone: tQueuePhone2,
    tQueueDetail: tQueueDetail2,
    tcPending: tcPending2,
    tcProgress: tcProgress2,
    tcCompleted: tcCompleted2,
    btnManualTicket: btnManualTicket2
  } = elements;
  const ensureActionSucceeded = (result, fallbackMessage) => {
    if (result && typeof result === "object" && "success" in result && result.success === false) {
      throw new Error(result.error || fallbackMessage);
    }
    return result;
  };
  function promptManualTicket() {
    const modalOverlay2 = document.getElementById("modal-overlay");
    const modalTitle2 = document.getElementById("modal-title");
    const modalText2 = document.getElementById("modal-text");
    const modalConfirm2 = document.getElementById("modal-confirm");
    const modalCancel2 = document.getElementById("modal-cancel");
    modalTitle2.textContent = "Manuel Bildirim Aç";
    modalText2.innerHTML = "";
    const form = document.createElement("div");
    form.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:12px;";
    const fields = [
      { id: "chk-man-ariza", label: "Arıza Beyanı" },
      { id: "chk-man-adres", label: "Adres Bilgisi" },
      { id: "chk-man-tel", label: "Telefon Numarası" },
      { id: "chk-man-fatura", label: "Fatura Tarihi" },
      { id: "chk-man-seri", label: "Seri Numarası" },
      { id: "chk-man-isim", label: "İsim ve Soyisim" }
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

        <label style="font-size:0.85rem;color:#94a3b8;">Seri Numarası (Opsiyonel)</label>
        <input type="text" id="man-serial" placeholder="Bilinmiyorsa boş bırakın..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">
        
        <label style="font-size:0.85rem;color:#94a3b8;">Müşteri İsmi (Opsiyonel)</label>
        <input type="text" id="man-customer" placeholder="Müşteri adı soyadı..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

        <label style="font-size:0.85rem;color:#94a3b8;">Aras Kodu (Opsiyonel)</label>
        <input type="text" id="man-aras" placeholder="Aras kargo kodu..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

        <label style="font-size:0.85rem;color:#94a3b8;">Telefon Numarası (Opsiyonel)</label>
        <input type="text" id="man-phone" placeholder="Müşteri iletişim numarası..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

        <label style="font-size:0.85rem;color:#94a3b8;">Not (Opsiyonel)</label>
        <input type="text" id="man-note" placeholder="Ekstra detay ekleyin..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">
        `;
    modalText2.appendChild(form);
    modalConfirm2.textContent = "Oluştur";
    modalOverlay2.classList.add("active");
    modalConfirm2.onclick = async () => {
      const selectedTypes = [];
      fields.forEach((f) => {
        const el = document.getElementById(f.id);
        if (el && el.checked) {
          selectedTypes.push(el.value);
        }
      });
      const missingType = selectedTypes.length > 0 ? selectedTypes.join(", ") : "Belirtilmedi";
      const serial = document.getElementById("man-serial").value.trim();
      const note = document.getElementById("man-note").value.trim();
      const customerName = document.getElementById("man-customer").value.trim();
      const arasCode = document.getElementById("man-aras").value.trim();
      const phoneNumber = document.getElementById("man-phone").value.trim();
      try {
        await api2.createTicket({
          serial: serial || "Seri No Yok",
          model_name: "",
          model_color: "",
          missing_type: missingType,
          note,
          customer_name: customerName,
          aras_code: arasCode,
          phone_number: phoneNumber,
          created_by: getPersonnelName() || "İsimsiz Personel"
        });
        showToast("Manuel bildirim oluşturuldu.", "success");
      } catch (e) {
        showToast("Bildirim oluşturulurken hata: " + e.message, "error");
      }
      modalOverlay2.classList.remove("active");
    };
    modalCancel2.onclick = () => {
      modalOverlay2.classList.remove("active");
    };
  }
  if (btnManualTicket2) {
    btnManualTicket2.addEventListener("click", promptManualTicket);
  }
  async function loadTickets2() {
    const tickets = await api2.getTickets();
    if (!tickets) return;
    renderTicketsList2(tickets);
  }
  function renderTicketsList2(tickets) {
    ticketList2.innerHTML = "";
    const searchQuery = tSearchInput2?.value?.toLowerCase().trim() || "";
    const currentRole2 = getCurrentRole();
    const statusFilter = tFilterStatus2?.value || "all";
    const queueMode = tQueueAll2?.dataset?.mode || "main";
    tcPending2.textContent = String(tickets.filter((t) => t.status === "pending").length);
    tcProgress2.textContent = String(tickets.filter((t) => t.status === "in_progress").length);
    tcCompleted2.textContent = String(tickets.filter((t) => t.status === "completed").length);
    let filtered = tickets;
    if (queueMode === "phone") {
      filtered = filtered.filter((t) => isPhoneMissingQueue(t));
    } else if (queueMode === "detail") {
      filtered = filtered.filter((t) => isInfoMissingQueue(t) && !isPhoneMissingQueue(t));
    } else {
      filtered = filtered.filter((t) => !isPhoneMissingQueue(t));
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter((t) => (t.serial || "").toLowerCase().includes(searchQuery) || (t.customer_name || "").toLowerCase().includes(searchQuery));
    }
    if (filtered.length === 0) {
      ticketList2.innerHTML = '<div class="priority-empty">Talep bulunamadı.</div>';
      return;
    }
    const fragment = document.createDocumentFragment();
    filtered.forEach((ticket) => {
      const card = document.createElement("div");
      card.className = `ticket-card status-${ticket.status}`;
      const statusLabel = ticket.status === "pending" ? "Bekliyor" : ticket.status === "in_progress" ? "İşleniyor" : "Tamamlandı";
      const badgeClass = `badge-${ticket.status}`;
      const missingLabels = { address: "Adres", fault_form: "Arıza Formu", contact: "İletişim", other: "Diğer" };
      const missingLabel = missingLabels[ticket.missing_type] || ticket.missing_type;
      const createdDate = ticket.created_at ? new Date(ticket.created_at).toLocaleString("tr-TR") : "";
      let actionsHTML = "";
      let waitTimerHTML = "";
      if (ticket.status === "pending") {
        const waitMs = ticket.created_at ? Date.now() - ticket.created_at : 0;
        waitTimerHTML = `<div class="wait-timer" data-created-at="${ticket.created_at || ""}" style="font-size:0.75rem;color:#f59e0b;margin-top:4px;display:flex;align-items:center;gap:4px;">&#9203; ${formatWaitTime(waitMs)}</div>`;
      }
      let detailedResponseInputsHTML = "";
      if (ticket.status === "in_progress" && currentRole2 === "mh") {
        const requestedTypes = ticket.missing_type.split(",").map((t) => t.trim()).filter((t) => t !== "Belirtilmedi" && t !== "");
        let parsedResponses = {};
        if (ticket.response) {
          ticket.response.split(" | ").forEach((part) => {
            const idx = part.indexOf(": ");
            if (idx !== -1) {
              const key = part.substring(0, idx).trim();
              const val = part.substring(idx + 2).trim();
              parsedResponses[key] = val;
            } else {
              parsedResponses["Genel"] = part.trim();
            }
          });
        }
        if (requestedTypes.length === 0) {
          detailedResponseInputsHTML = `
                        <div class="detailed-response-field" style="margin-bottom:8px;">
                            <label style="font-size:0.75rem;color:#94a3b8;display:block;margin-bottom:2px;">Yanıtınız</label>
                            <input class="response-input dyn-resp-${ticket.id}" data-reqtype="Genel" value="${parsedResponses["Genel"] || ""}" placeholder="Yanıtınızı yazın..." style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:0.85rem;outline:none;transition:all 0.3s;">
                        </div>
                     `;
        } else {
          detailedResponseInputsHTML = requestedTypes.map((reqType) => `
                        <div class="detailed-response-field" style="margin-bottom:8px;">
                            <label style="font-size:0.75rem;color:#94a3b8;display:block;margin-bottom:2px;">${reqType}</label>
                            <input class="response-input dyn-resp-${ticket.id}" data-reqtype="${reqType}" value="${parsedResponses[reqType] || ""}" placeholder="${reqType} değerini girin..." style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:0.85rem;outline:none;transition:all 0.3s;">
                        </div>
                     `).join("");
        }
      }
      if (ticket.status === "pending" && currentRole2 === "mh") {
        actionsHTML = `<button class="btn-sm btn-claim" data-action="claim" data-id="${ticket.id}">Üstlen</button>`;
      } else if (ticket.status === "in_progress" && currentRole2 === "mh") {
        card.style.paddingBottom = "32px";
        actionsHTML = `
                    <div style="display:flex;flex-direction:column;gap:8px;width:100%;">
                        ${detailedResponseInputsHTML}
                        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
                            <button class="btn-sm" data-action="unreachable" data-id="${ticket.id}" style="background:rgba(239, 68, 68, 0.2);color:#ef4444;border:1px solid rgba(239, 68, 68, 0.3);" title="Ulaşılamıyor">&#128683; Ulaşılamadı</button>
                            <button class="btn-sm btn-complete" data-action="complete" data-id="${ticket.id}" style="flex:1;">Tamamla</button>
                        </div>
                    </div>
                `;
      } else if (ticket.status === "completed" && currentRole2 === "mh") {
        actionsHTML = `<button class="btn-sm btn-reopen" data-action="reopen" data-id="${ticket.id}">Yeniden Aç</button>`;
      }
      let responseHTML = "";
      if (ticket.response) {
        const responseBlocksHTML = ticket.response.split(" | ").map((part) => {
          const idx = part.indexOf(": ");
          if (idx !== -1) {
            const key = part.substring(0, idx).trim();
            const val = part.substring(idx + 2).trim();
            return `
                            <div style="background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;">
                                <span style="font-size:0.75rem;color:#94a3b8;display:block;margin-bottom:2px;">${key}</span>
                                <span style="color:white;font-size:0.85rem;">${val}</span>
                            </div>
                        `;
          } else {
            return `
                            <div style="background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;">
                                <span style="font-size:0.75rem;color:#94a3b8;display:block;margin-bottom:2px;">Yanıt</span>
                                <span style="color:white;font-size:0.85rem;">${part.trim()}</span>
                            </div>
                        `;
          }
        }).join("");
        responseHTML = `
                    <div class="ticket-response" style="background:transparent;padding:0;border:none;">
                        <div style="font-size:0.8rem;color:var(--accent);margin-bottom:8px;"><strong>${ticket.responded_by || "MH"}</strong> yanıtladı:</div>
                        ${responseBlocksHTML}
                    </div>
                `;
      }
      let collabHTML = "";
      if (ticket.customer_name || ticket.aras_code || ticket.phone_number) {
        collabHTML = `<div class="collab-container">
                    ${ticket.customer_name ? `<div class="collab-group"><span class="collab-label">Müşteri</span><span>${ticket.customer_name}</span></div>` : ""}
                    ${ticket.aras_code ? `<div class="collab-group"><span class="collab-label">Aras Kodu</span><span>${ticket.aras_code}</span></div>` : ""}
                    ${ticket.phone_number ? `<div class="collab-group"><span class="collab-label">Telefon</span><span><span aria-hidden="true">&#128222;</span> ${ticket.phone_number}</span></div>` : ""}
                </div>`;
      }
      let deleteHTML = "";
      if (currentRole2 === "kargo_kabul") {
        deleteHTML = `<button class="delete-btn" title="Sil" data-action="delete" data-id="${ticket.id}">&#128465;&#65039;</button>`;
      }
      let noteHTML = "";
      if (ticket.note) {
        noteHTML = `<div class="ticket-note">
                    <span><strong>Not:</strong> ${ticket.note}</span>
                </div>`;
      }
      card.innerHTML = `
                ${deleteHTML}
                <div class="ticket-body">
                    <div class="ticket-serial">${ticket.serial || "Seri No Yok"}</div>
                    <div class="ticket-model">${ticket.model_name || ""} ${ticket.model_color ? "- " + ticket.model_color : ""}</div>
                    <span class="ticket-missing-type">${missingLabel}</span>
                    ${noteHTML}
                    ${responseHTML}
                    ${waitTimerHTML}
                    ${collabHTML}
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="ticket-time">${createdDate}</div>
                    </div>
                </div>
                <div class="ticket-actions" style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
                    ${ticket.status === "in_progress" && currentRole2 === "mh" ? "" : `<span class="${badgeClass}">${statusLabel}</span>`}
                    <div style="display: flex; gap: 8px; flex:1; justify-content: flex-end; align-items:flex-end; ${ticket.status === "in_progress" && currentRole2 === "mh" ? "width:100%;" : ""}">
                      ${actionsHTML}
                      <button class="btn-sm ticket-info-btn" data-action="info" data-id="${ticket.id}" title="İşlem Geçmişi">&#8505;</button>
                    </div>
                </div>
            `;
      fragment.appendChild(card);
    });
    ticketList2.appendChild(fragment);
    startWaitingTimers();
    ticketList2.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const button = e.currentTarget;
        const action = button.dataset.action;
        const id = button.dataset.id;
        if (!action || !id) return;
        try {
          if (action === "claim") {
            ensureActionSucceeded(
              await api2.claimTicket(id, getPersonnelName()),
              "Talep üstlenilemedi."
            );
            showToast("Talep üstlenildi.", "success");
          } else if (action === "complete") {
            const inputs = document.querySelectorAll(`.dyn-resp-${id}`);
            const responseParts = [];
            inputs.forEach((input) => {
              const val = input.value.trim();
              if (val) {
                responseParts.push(`${input.dataset.reqtype}: ${val}`);
              }
            });
            const finalResponse = responseParts.join(" | ");
            if (!finalResponse) {
              showToast("Lütfen en az bir alanı doldurun.", "error");
              return;
            }
            ensureActionSucceeded(
              await api2.completeTicket(id, finalResponse),
              "Talep tamamlanamadı."
            );
            showToast("Talep tamamlandı.", "success");
          } else if (action === "unreachable") {
            ensureActionSucceeded(
              await api2.markTicketUnreachable(id, getPersonnelName()),
              "Bilet durumu güncellenemedi."
            );
            showToast("Bilet durumu ulaşılamıyor olarak güncellendi.", "info");
          } else if (action === "reopen") {
            ensureActionSucceeded(
              await api2.reopenTicket(id, getPersonnelName()),
              "Talep yeniden açılamadı."
            );
            showToast("Talep yeniden açıldı.", "info");
          } else if (action === "delete") {
            if (!confirm("Bu bileti silmek istediğinize emin misiniz?")) return;
            ensureActionSucceeded(
              await api2.deleteTicket(id),
              "Bilet silinemedi."
            );
            showToast("Bilet silindi.", "success");
          } else if (action === "info") {
            const t = filtered.find((x) => x.id === id);
            if (t) showTicketHistoryModal(t);
            return;
          }
          loadTickets2();
        } catch (error) {
          showToast(error?.message || "Bilet işlemi sırasında bir hata oluştu.", "error");
        }
      });
    });
  }
  if (tFilterStatus2) tFilterStatus2.addEventListener("change", loadTickets2);
  const setQueueMode = (mode) => {
    [tQueueAll2, tQueuePhone2, tQueueDetail2].forEach((btn) => {
      if (!btn) return;
      const isActive = btn.dataset.queue === mode;
      btn.dataset.mode = mode;
      btn.style.background = isActive ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.05)";
      btn.style.borderColor = isActive ? "rgba(56,189,248,0.55)" : "rgba(255,255,255,0.1)";
      btn.style.color = isActive ? "#e0f2fe" : "white";
      btn.style.boxShadow = isActive ? "0 10px 25px rgba(56,189,248,0.15)" : "none";
    });
  };
  if (tQueueAll2 && tQueuePhone2 && tQueueDetail2) {
    setQueueMode("main");
    tQueueAll2.addEventListener("click", () => {
      setQueueMode("main");
      loadTickets2();
    });
    tQueuePhone2.addEventListener("click", () => {
      setQueueMode("phone");
      loadTickets2();
    });
    tQueueDetail2.addEventListener("click", () => {
      setQueueMode("detail");
      loadTickets2();
    });
  }
  let searchTimeout;
  tSearchInput2.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadTickets2();
    }, 300);
  });
  return { loadTickets: loadTickets2, renderTicketsList: renderTicketsList2, stopWaitingTimers };
}
function initProfileLogic(api2, elements, personnelName2, calculateLevel2, refreshSidebarProfile2) {
  const {
    scoreboardContainer: scoreboardContainer2,
    profileFilterBtns: profileFilterBtns2,
    pMyLevel: pMyLevel2,
    pMyName: pMyName2,
    pMyRole: pMyRole2,
    pMyXp: pMyXp2,
    pNextLevelXp: pNextLevelXp2,
    pXpFill: pXpFill2
  } = elements;
  async function loadProfileScoreboard2() {
    const users = await api2.getUsers();
    if (!users) return;
    scoreboardContainer2.innerHTML = "";
    users.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    const activeRole = Array.from(profileFilterBtns2).find((b) => b.classList.contains("active"))?.dataset.role || "all";
    let filtered = users;
    if (activeRole !== "all") filtered = filtered.filter((u) => u.role === activeRole);
    const currentUser = users.find((u) => u.fullName === personnelName2 || u.username === personnelName2);
    if (currentUser) {
      const { level, nextXp } = calculateLevel2(currentUser.xp || 0);
      const currentXp = currentUser.xp || 0;
      pMyLevel2.textContent = String(level);
      pMyName2.textContent = currentUser.fullName || currentUser.username;
      pMyRole2.textContent = currentUser.role === "mh" ? "Müşteri Hizmetleri" : "Kargo Kabul";
      pMyXp2.textContent = String(currentXp);
      pNextLevelXp2.textContent = String(nextXp);
      pXpFill2.style.width = `${currentXp / nextXp * 100}%`;
    }
    if (filtered.length === 0) {
      scoreboardContainer2.innerHTML = '<div class="priority-empty">Kullanıcı bulunamadı.</div>';
      return;
    }
    filtered.forEach((u, idx) => {
      const rank = idx + 1;
      const { level } = calculateLevel2(u.xp || 0);
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
      scoreboardContainer2.appendChild(row);
    });
    refreshSidebarProfile2();
  }
  profileFilterBtns2.forEach((btn) => {
    btn.addEventListener("click", () => {
      profileFilterBtns2.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadProfileScoreboard2();
    });
  });
  return { loadProfileScoreboard: loadProfileScoreboard2 };
}
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
                            Ekleyen: ${escapeHtml(d.created_by || "Bilinmiyor")}
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
                            Ekleyen: ${escapeHtml(d.created_by || "Bilinmiyor")}
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
    sLogoutBtn: sLogoutBtn2
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
      preventDuplicatePopup: sPreventDuplicate2.checked
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
function initBonusLogic(api2, elements) {
  const {
    bonusDropZone: bonusDropZone2,
    bonusFileInput: bonusFileInput2,
    bonusResults: bonusResults2,
    bonusAnalytics: bonusAnalytics2,
    workStartInput: workStartInput2,
    workEndInput: workEndInput2
  } = elements;
  let lastBonusFile = null;
  bonusDropZone2.onclick = () => bonusFileInput2.click();
  bonusDropZone2.ondragover = (e) => {
    e.preventDefault();
    bonusDropZone2.classList.add("dragover");
  };
  bonusDropZone2.ondragleave = () => bonusDropZone2.classList.remove("dragover");
  bonusDropZone2.ondrop = async (e) => {
    e.preventDefault();
    bonusDropZone2.classList.remove("dragover");
    const file = e.dataTransfer?.files[0];
    if (file) {
      lastBonusFile = file;
      await handleBonusFile(file);
    }
  };
  bonusFileInput2.onchange = async () => {
    if (bonusFileInput2.files && bonusFileInput2.files[0]) {
      const file = bonusFileInput2.files[0];
      lastBonusFile = file;
      await handleBonusFile(file);
    }
  };
  workStartInput2.onchange = () => {
    if (lastBonusFile) handleBonusFile(lastBonusFile);
  };
  workEndInput2.onchange = () => {
    if (lastBonusFile) handleBonusFile(lastBonusFile);
  };
  async function handleBonusFile(file) {
    if (!file) return;
    bonusResults2.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Hesaplanıyor...</div>';
    bonusAnalytics2.style.display = "none";
    try {
      const buffer = await file.arrayBuffer();
      const customHours = { start: workStartInput2.value, end: workEndInput2.value };
      const results = await api2.calculateBonus(buffer, customHours);
      displayBonusResults(results);
    } catch (err) {
      bonusResults2.innerHTML = '<div style="text-align:center; color:#ef4444;">Dosya okunurken hata oluştu.</div>';
    }
  }
  function displayBonusResults(results) {
    bonusResults2.innerHTML = "";
    if (!results || results.length === 0) {
      bonusResults2.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Geçerli veri bulunamadı.</p>';
      return;
    }
    results.forEach((res, index) => {
      const card = document.createElement("div");
      card.className = "result-card";
      card.style.animationDelay = `${index * 0.1}s`;
      let statusText = "";
      let statusClass = "";
      if (res.isEligible) {
        statusText = "Prim tamam";
        statusClass = "status-eligible";
      } else {
        const remaining = Math.max(0, 850 - res.validCount);
        statusText = index === 0 ? `Eksik: ${remaining}` : "Prim tamamlanmadı";
        statusClass = "status-pending-badge";
        if (index === 0 && remaining > 0) {
          const monthParts = res.month.split(" ");
          const monthName = monthParts[0];
          const year = parseInt(monthParts[1] || (/* @__PURE__ */ new Date()).getFullYear().toString(), 10);
          const monthMap = {
            Ocak: 1,
            "Şubat": 2,
            Mart: 3,
            Nisan: 4,
            "Mayıs": 5,
            Haziran: 6,
            Temmuz: 7,
            "Ağustos": 8,
            "Eylül": 9,
            Ekim: 10,
            "Kasım": 11,
            "Aralık": 12
          };
          const monthNumber = monthMap[monthName];
          if (monthNumber) {
            const today = /* @__PURE__ */ new Date();
            if (today.getMonth() + 1 === monthNumber && today.getFullYear() === year) {
              const lastDay = new Date(year, monthNumber, 0).getDate();
              let workingDayUnits = 0;
              for (let day = today.getDate(); day <= lastDay; day++) {
                const weekDay = new Date(year, monthNumber - 1, day).getDay();
                if (weekDay >= 1 && weekDay <= 5) workingDayUnits += 1;
                else if (weekDay === 6) workingDayUnits += 0.5;
              }
              if (workingDayUnits > 0) {
                statusText += ` (Günde ~${Math.ceil(remaining / workingDayUnits)} cihaz)`;
              }
            }
          }
        }
      }
      const topModels = (res.modelStats || []).slice(0, 3).map((model) => `${model.model}: ${model.totalCount}`).join(" | ");
      card.innerHTML = `
                <div class="result-info">
                    <h3>${res.month}</h3>
                    <div class="result-stats">
                        <div class="stat-item">Mesai İçi: <strong>${res.validCount}</strong></div>
                        <div class="stat-item">Mesai Dışı: <strong>${res.overtimeCount}</strong></div>
                        <div class="stat-item">Toplam: <strong>${res.totalCount}</strong></div>
                    </div>
                    ${topModels ? `<div style="margin-top:10px; font-size:0.78rem; color:var(--text-muted);">${topModels}</div>` : ""}
                </div>
                <div class="status-badge ${statusClass}">${statusText}</div>
            `;
      card.onclick = () => {
        bonusResults2.querySelectorAll(".result-card").forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        showBonusAnalytics(res);
      };
      bonusResults2.appendChild(card);
      if (index === 0) card.click();
    });
  }
  function showBonusAnalytics(res) {
    bonusAnalytics2.style.display = "block";
    bonusAnalytics2.innerHTML = "";
    if (!res.dailyStats || res.dailyStats.length === 0) {
      bonusAnalytics2.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Günlük veri yok</p>';
      return;
    }
    const maxVal = Math.max(...res.dailyStats.map((d) => d.totalCount || d.validCount + d.overtimeCount), 1);
    const modelCards = (res.modelStats || []).slice(0, 12).map((model) => `
            <div style="background:rgba(255,255,255,0.04); border:1px solid var(--glass-border); border-radius:16px; padding:14px 16px;">
                <div style="font-size:0.88rem; font-weight:700; color:var(--text-main); margin-bottom:8px; word-break:break-word;">${model.model}</div>
                <div style="display:flex; justify-content:space-between; gap:12px; font-size:0.78rem; color:var(--text-muted);">
                    <span>Toplam <strong style="color:var(--text-main);">${model.totalCount}</strong></span>
                    <span>İçi <strong style="color:var(--success);">${model.validCount}</strong></span>
                    <span>Dışı <strong style="color:var(--warning);">${model.overtimeCount}</strong></span>
                </div>
            </div>
        `).join("");
    bonusAnalytics2.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:16px; flex-wrap:wrap;">
                <div>
                    <h2 style="margin:0 0 6px 0;">${res.month} Günlük Dağılım</h2>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Mesai içi ve mesai dışı cihaz girişleri aynı grafik üzerinde.</div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(4, minmax(110px, 1fr)); gap:12px; flex:1; min-width:320px;">
                    <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.18); border-radius:16px; padding:12px 14px;">
                        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Mesai İçi</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--success);">${res.validCount}</div>
                    </div>
                    <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.18); border-radius:16px; padding:12px 14px;">
                        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Mesai Dışı</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--warning);">${res.overtimeCount}</div>
                    </div>
                    <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.18); border-radius:16px; padding:12px 14px;">
                        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Toplam</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--accent);">${res.totalCount}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.04); border:1px solid var(--glass-border); border-radius:16px; padding:12px 14px;">
                        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Model Çeşidi</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--text-main);">${(res.modelStats || []).length}</div>
                    </div>
                </div>
            </div>
            <div id="bonus-chart" style="display:flex; align-items:flex-end; gap:6px; height:260px; border-bottom:2px solid var(--glass-border); position:relative; margin-bottom:18px;"></div>
            <div style="display:flex; gap:20px; margin-top:16px; justify-content:center; font-size:0.8rem; color:var(--text-muted);">
                <div style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:3px; background:var(--success);"></span> Mesai İçi</div>
                <div style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:3px; background:var(--warning);"></span> Mesai Dışı</div>
            </div>
            <div style="margin-top:28px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap;">
                    <h3 style="margin:0;">Model Bazlı Dağılım</h3>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Toplam, mesai içi ve mesai dışı adetleri</div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    ${modelCards || '<div style="color:var(--text-muted);">Model verisi bulunamadı.</div>'}
                </div>
            </div>
        `;
    const chart = document.getElementById("bonus-chart");
    res.dailyStats.forEach((day, i) => {
      const total = day.totalCount || day.validCount + day.overtimeCount;
      const normalHeight = maxVal > 0 ? day.validCount / maxVal * 220 : 0;
      const overtimeHeight = maxVal > 0 ? day.overtimeCount / maxVal * 220 : 0;
      const dayNum = day.date.split("-")[2];
      const group = document.createElement("div");
      group.style.cssText = "flex:1; min-width:16px; display:flex; flex-direction:column; align-items:center; gap:6px;";
      group.innerHTML = `
                <div title="${day.date} | Mesai İçi: ${day.validCount} | Mesai Dışı: ${day.overtimeCount} | Toplam: ${total}" style="width:100%; display:flex; flex-direction:column-reverse; align-items:center; border-radius:8px 8px 0 0; cursor:pointer; position:relative; height:0; transition:height 0.6s cubic-bezier(0.175,0.885,0.32,1.275);" class="bar-stack">
                    ${overtimeHeight > 0 ? `<div style="width:100%; height:${overtimeHeight}px; background:var(--warning); opacity:0.9;"></div>` : ""}
                    <div style="width:100%; height:${normalHeight}px; background:var(--success);"></div>
                    <span style="position:absolute; top:-18px; font-size:11px; font-weight:800; color:var(--text-main);">${total}</span>
                </div>
                <div style="font-size:11px; font-weight:600; color:var(--text-muted);">${dayNum}</div>
            `;
      chart.appendChild(group);
      setTimeout(() => {
        const stack = group.querySelector(".bar-stack");
        stack.style.height = `${normalHeight + overtimeHeight}px`;
      }, 30 + i * 18);
    });
    bonusAnalytics2.scrollIntoView({ behavior: "smooth" });
  }
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
const tQueueBar = document.getElementById("ticket-queue-bar");
const tSearchInput = document.getElementById("ticket-search");
const tFilterStatus = document.getElementById("filter-status");
document.getElementById("filter-visibility");
document.getElementById("filter-ownership-toggle");
const tQueueAll = document.getElementById("ticket-queue-main");
const tQueuePhone = document.getElementById("ticket-queue-phone");
const tQueueDetail = document.getElementById("ticket-queue-detail");
const btnManualTicket = document.getElementById("btn-manual-ticket");
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
const sPersonnelName = document.getElementById("personnel-name");
const sUserRole = document.getElementById("user-role");
const sShortcutClear = document.getElementById("shortcut-clear");
const sShortcutCopy = document.getElementById("shortcut-copy");
const sPopupSize = document.getElementById("popup-size");
const sPopupTimeout = document.getElementById("popup-timeout");
const sAutoStart = document.getElementById("auto-start");
const sPreventDuplicate = document.getElementById("prevent-duplicate");
const sLogoutBtn = document.getElementById("logout-btn");
const bonusDropZone = document.getElementById("bonus-drop-zone");
const bonusFileInput = document.getElementById("bonus-file-input");
const bonusResults = document.getElementById("bonus-results");
const bonusAnalytics = document.getElementById("bonus-analytics");
const workStartInput = document.getElementById("work-start");
const workEndInput = document.getElementById("work-end");
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
window.showConfirm = showConfirm;
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
        const askMHBtn = currentRole === "kargo_kabul" && !completedTicket?.response ? `<button class="ask-mh-btn" data-serial="${item.serial}" data-model="${item.model_name || ""}" data-color="${item.model_color || ""}" style="position:absolute;bottom:12px;right:12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;" title="MH'ye Sor">&#128233; MH'ye Sor</button>` : "";
        card.className = cardClass;
        card.style.position = "relative";
        card.innerHTML = `
          <button class="delete-btn" onclick="deleteEntry('${item.serial}')">&#10005;</button>
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
const { loadTickets, renderTicketsList } = initTicketLogic(
  api,
  { ticketList, tSearchInput, tFilterStatus, tQueueAll, tQueuePhone, tQueueDetail, tcPending, tcProgress, tcCompleted, btnManualTicket },
  () => currentRole,
  () => personnelName
);
const { loadProfileScoreboard } = initProfileLogic(
  api,
  {
    scoreboardContainer,
    profileFilterBtns,
    pMyLevel,
    pMyName,
    pMyRole,
    pMyXp,
    pNextLevelXp,
    pXpFill
  },
  personnelName,
  calculateLevel,
  refreshSidebarProfile
);
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
  sLogoutBtn
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
  if (btnManualTicket) btnManualTicket.style.display = currentRole === "kargo_kabul" ? "flex" : "none";
  if (tQueueBar) tQueueBar.style.display = "flex";
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
    currentRole = s.role || "kargo_kabul";
    personnelName = s.personnelName || "";
    const isAdmin = s.isAdmin === true || s.username === "KursatS";
    const isLoggedIn = !!s.personnelName?.trim();
    const sideBonus = document.getElementById("side-bonus-btn");
    const sideAdmin = document.getElementById("side-admin-btn");
    const sideProfile = document.getElementById("side-profile-btn");
    if (sideBonus) sideBonus.style.display = s.role === "kargo_kabul" ? "flex" : "none";
    if (btnManualTicket) btnManualTicket.style.display = s.role === "kargo_kabul" ? "flex" : "none";
    if (tQueueBar) tQueueBar.style.display = "flex";
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
api.onFocusPriorityDevice((device) => {
  switchView("priority");
  loadPriorityDevices().then(() => {
    focusPriorityDevice(device);
  });
});
api.onPriorityDevicesUpdate(() => {
  loadPriorityDevices();
});
initBonusLogic(api, {
  bonusDropZone,
  bonusFileInput,
  bonusResults,
  bonusAnalytics,
  workStartInput,
  workEndInput
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
  bar.style.cssText = "display:none;position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-top:1px solid var(--accent);padding:10px 20px;align-items:center;gap:12px;font-size:0.85rem;color:var(--text-main);";
  bar.innerHTML = `
        <span id="update-msg">&#128276; Yeni sürüm mevcut!</span>
        <div id="update-progress-wrap" style="display:none;flex:1;max-width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
            <div id="update-progress-bar" style="height:100%;width:0%;background:var(--accent);border-radius:3px;transition:width 0.3s;"></div>
        </div>
        <button id="update-action-btn" style="padding:6px 16px;border:none;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer;font-size:0.8rem;font-weight:600;">İndir</button>
        <button id="update-dismiss-btn" style="padding:6px 10px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;font-size:1rem;">&#10005;</button>
    `;
  document.body.appendChild(bar);
  const updateMsg = document.getElementById("update-msg");
  const progressWrap = document.getElementById("update-progress-wrap");
  const progressBar = document.getElementById("update-progress-bar");
  const actionBtn = document.getElementById("update-action-btn");
  const dismissBtn = document.getElementById("update-dismiss-btn");
  let updateState = "available";
  api.onUpdateAvailable((version) => {
    updateMsg.textContent = `📢 Yeni sürüm mevcut: v${version}`;
    bar.style.display = "flex";
    updateState = "available";
    actionBtn.textContent = "İndir";
  });
  api.onUpdateProgress((percent) => {
    progressWrap.style.display = "block";
    progressBar.style.width = `${percent}%`;
    updateMsg.textContent = `⏬ İndiriliyor... %${percent}`;
  });
  api.onUpdateDownloaded(() => {
    updateState = "ready";
    progressWrap.style.display = "none";
    updateMsg.textContent = "✓ Güncelleme hazır!";
    actionBtn.textContent = "Güncelle";
  });
  actionBtn.onclick = () => {
    if (updateState === "available") {
      updateState = "downloading";
      actionBtn.textContent = "İndiriliyor...";
      actionBtn.style.opacity = "0.6";
      api.startUpdateDownload();
    } else if (updateState === "ready") {
      api.installUpdate();
    }
  };
  dismissBtn.onclick = () => {
    bar.style.display = "none";
  };
})();
