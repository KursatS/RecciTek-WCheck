/* empty css               */
/* empty css               */
const api = window.electronAPI;
const ticketList = document.getElementById("ticket-list");
const emptyState = document.getElementById("empty-state");
const countPending = document.getElementById("count-pending");
const countProgress = document.getElementById("count-progress");
const countCompleted = document.getElementById("count-completed");
const filterTabs = document.getElementById("filter-tabs");
const searchInput = document.getElementById("ticket-search");
const priorityList = document.getElementById("priority-list");
const priorityFormSection = document.getElementById("priority-form-section");
const btnAddPriority = document.getElementById("btn-add-priority");
const pdCustomer = document.getElementById("pd-customer");
const pdSerial = document.getElementById("pd-serial");
const pdDesc = document.getElementById("pd-desc");
let allTickets = [];
let activeFilter = "all";
let searchQuery = "";
let currentRole = "mh";
let personnelName = "";
const MISSING_TYPE_LABELS = {
  address: "Adres Bilgisi",
  fault_form: "Arıza Beyanı",
  contact: "Müşteri İletişim",
  other: "Diğer"
};
filterTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;
  filterTabs.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  activeFilter = tab.dataset.filter || "all";
  renderTickets(allTickets);
});
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.toLowerCase().trim();
  renderTickets(allTickets);
});
api.onTicketUpdate((tickets) => renderTickets(tickets));
api.onRefreshCards(() => {
  api.getSettings().then((s) => {
    currentRole = s.role || "mh";
    personnelName = s.personnelName || "Bilinmeyen";
    syncRoleUI();
    api.getTickets().then((tickets) => {
      if (tickets) renderTickets(tickets);
    });
  });
});
api.onPriorityDevicesUpdate((devices) => {
  renderPriorityDevices(devices);
});
Promise.all([
  api.getSettings(),
  api.getTickets(),
  api.getPriorityDevices()
]).then(([settings, tickets, devices]) => {
  if (settings.theme === "light") document.body.classList.add("light");
  currentRole = settings.role || "mh";
  personnelName = settings.personnelName || "Bilinmeyen";
  syncRoleUI();
  if (tickets) renderTickets(tickets);
  if (devices) {
    renderPriorityDevices(devices);
  }
});
function syncRoleUI() {
  priorityFormSection.style.display = currentRole === "mh" ? "block" : "none";
}
function renderTickets(tickets) {
  allTickets = tickets;
  const oldCards = ticketList.querySelectorAll(".ticket-card");
  oldCards.forEach((c) => c.remove());
  const pending = tickets.filter((t) => t.status === "pending").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const completed = tickets.filter((t) => t.status === "completed").length;
  countPending.textContent = String(pending);
  countProgress.textContent = String(inProgress);
  countCompleted.textContent = String(completed);
  let filtered = [...tickets];
  if (activeFilter === "pending") filtered = filtered.filter((t) => t.status === "pending");
  else if (activeFilter === "in_progress") filtered = filtered.filter((t) => t.status === "in_progress");
  else if (activeFilter === "completed") filtered = filtered.filter((t) => t.status === "completed");
  else if (activeFilter === "aras") filtered = filtered.filter((t) => t.aras_code && t.aras_code.trim() !== "");
  if (searchQuery) {
    filtered = filtered.filter(
      (t) => (t.serial || "").toLowerCase().includes(searchQuery) || (t.customer_name || "").toLowerCase().includes(searchQuery)
    );
  }
  if (filtered.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";
  filtered.forEach((ticket) => {
    const card = document.createElement("div");
    card.className = `ticket-card status-${ticket.status}`;
    const timeStr = ticket.created_at ? new Date(ticket.created_at).toLocaleString("tr-TR") : "";
    let actionsHtml = "";
    if (currentRole === "mh") {
      if (ticket.status === "pending") {
        actionsHtml = `
          <span class="badge badge-pending">Bekliyor</span>
          <button class="btn-sm btn-claim" data-id="${ticket.id}">Üstlen</button>
        `;
      } else if (ticket.status === "in_progress") {
        if (ticket.responded_by === personnelName) {
          const types = ticket.missing_type.split(",").map((t) => t.trim());
          let structuredInputs = '<div class="structured-responses" style="display:flex;flex-direction:column;gap:8px;">';
          types.forEach((type, idx) => {
            structuredInputs += `
                            <div class="collab-group">
                                <span class="collab-label">${type}</span>
                                <input type="text" class="response-input structured-input"
                                    data-type="${type}"
                                    id="resp-${ticket.id}-${idx}"
                                    placeholder="${type} cevabını girin...">
                            </div>
                        `;
          });
          structuredInputs += "</div>";
          actionsHtml = `
                        <span class="badge badge-in_progress">Üstlenildi</span>
                        ${structuredInputs}
                        <button class="btn-sm btn-complete" data-id="${ticket.id}" style="margin-top:8px;">Tamamla</button>
                    `;
        } else {
          actionsHtml = `<span class="badge badge-in_progress">${ticket.responded_by} üstlendi</span>`;
        }
      } else {
        actionsHtml = `
                    <span class="badge badge-completed">Tamamlandı</span>
                    <button class="btn-sm btn-reopen" data-id="${ticket.id}" style="margin-top:8px;">Düzenle</button>
                `;
      }
    } else {
      if (ticket.status === "pending") actionsHtml = `<span class="badge badge-pending">Bekliyor</span>`;
      else if (ticket.status === "in_progress") actionsHtml = `<span class="badge badge-in_progress">${ticket.responded_by} bakıyor</span>`;
      else actionsHtml = `<span class="badge badge-completed">✅ Tamamlandı</span>`;
    }
    let responseHtml = "";
    if (ticket.status === "completed" && ticket.response) {
      responseHtml = `
        <div class="ticket-response">
          <strong>Cevap:</strong> ${ticket.response}
          <div class="ticket-time">${ticket.responded_by} tarafından</div>
        </div>
      `;
    }
    const collabHtml = `
            <div class="collab-container">
                <div class="collab-group">
                    <span class="collab-label">Müşteri İsmi</span>
                    <input type="text" class="response-input collab-input" id="cust-${ticket.id}" value="${ticket.customer_name || ""}" placeholder="İsim Girin...">
                </div>
                <div class="collab-group">
                    <span class="collab-label">Aras Kodu</span>
                    <input type="text" class="response-input collab-input" id="aras-${ticket.id}" value="${ticket.aras_code || ""}" placeholder="Aras Kodu...">
                </div>
                <div class="collab-group">
                    <span class="collab-label">Telefon Numarası</span>
                    <input type="text" class="response-input collab-input" id="phone-${ticket.id}" value="${ticket.phone_number || ""}" placeholder="05XX...">
                </div>
            </div>
            <button class="btn-sm btn-update" data-id="${ticket.id}" style="margin-top: 12px;">Güncelle</button>
        `;
    card.innerHTML = `
      <div class="ticket-body">
        <div class="ticket-serial">${ticket.serial}</div>
        <div class="ticket-model">${ticket.model_name || ""} ${ticket.model_color || ""}</div>
        <span class="ticket-missing-type">${MISSING_TYPE_LABELS[ticket.missing_type] || ticket.missing_type}</span>
        ${ticket.note ? `<div class="ticket-note" style="margin-top:8px;"><strong>Not:</strong> ${ticket.note}</div>` : ""}
        ${collabHtml}
        ${responseHtml}
        <div class="ticket-time" style="margin-top:12px;">${timeStr} — ${ticket.created_by}</div>
      </div>
      <div class="ticket-actions">
        ${actionsHtml}
      </div>
    `;
    ticketList.appendChild(card);
  });
  bindTicketActions();
}
function bindTicketActions() {
  document.querySelectorAll(".btn-claim").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api.claimTicket(btn.dataset.id, personnelName);
    });
  });
  document.querySelectorAll(".btn-complete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const inputs = document.querySelectorAll(`[id^="resp-${id}-"]`);
      const responses = [];
      let allFilled = true;
      inputs.forEach((input) => {
        const val = input.value.trim();
        if (!val) {
          input.style.borderColor = "#ef4444";
          allFilled = false;
        } else {
          input.style.borderColor = "";
          responses.push(`${input.dataset.type}: ${val}`);
        }
      });
      if (!allFilled) return;
      await api.completeTicket(id, responses.join(" | "));
    });
  });
  document.querySelectorAll(".btn-reopen").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api.reopenTicket(btn.dataset.id);
    });
  });
  document.querySelectorAll(".btn-update").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      btn.textContent = "Güncelleniyor...";
      btn.disabled = true;
      await api.updateTicketDetails(id, {
        customer_name: document.getElementById(`cust-${id}`)?.value?.trim() || "",
        aras_code: document.getElementById(`aras-${id}`)?.value?.trim() || "",
        phone_number: document.getElementById(`phone-${id}`)?.value?.trim() || ""
      });
      btn.textContent = "Güncelle";
      btn.disabled = false;
    });
  });
}
function renderPriorityDevices(devices) {
  priorityList.innerHTML = "";
  if (devices.length === 0) {
    priorityList.innerHTML = '<div class="priority-empty">Henüz kayıt yok.</div>';
    return;
  }
  devices.forEach((device) => {
    const item = document.createElement("div");
    item.className = "priority-item";
    item.innerHTML = `
            <div class="priority-item-body">
                <div class="priority-item-name">${device.customer_name}</div>
                ${device.serial ? `<div class="priority-item-serial">📦 ${device.serial}</div>` : ""}
                <div class="priority-item-desc">${device.description}</div>
            </div>
            ${currentRole === "mh" ? `<button class="btn-del-priority" data-id="${device.id}" title="Sil">✕</button>` : ""}
        `;
    priorityList.appendChild(item);
  });
  if (currentRole === "mh") {
    priorityList.querySelectorAll(".btn-del-priority").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        await api.deletePriorityDevice(id);
      });
    });
  }
}
btnAddPriority?.addEventListener("click", async () => {
  const customer = pdCustomer.value.trim();
  const serial = pdSerial.value.trim();
  const desc = pdDesc.value.trim();
  if (!customer || !desc) {
    if (!customer) pdCustomer.style.borderColor = "#ef4444";
    if (!desc) pdDesc.style.borderColor = "#ef4444";
    return;
  }
  pdCustomer.style.borderColor = "";
  pdDesc.style.borderColor = "";
  btnAddPriority.textContent = "Kaydediliyor...";
  btnAddPriority.disabled = true;
  try {
    await api.addPriorityDevice({
      customer_name: customer,
      serial: serial.toUpperCase(),
      description: desc,
      created_by: personnelName
    });
    pdCustomer.value = "";
    pdSerial.value = "";
    pdDesc.value = "";
  } catch (e) {
    console.error("Error adding priority device:", e);
  } finally {
    btnAddPriority.textContent = "➕ Kaydet";
    btnAddPriority.disabled = false;
  }
});
