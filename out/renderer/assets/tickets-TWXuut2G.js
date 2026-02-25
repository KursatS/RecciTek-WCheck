/* empty css               */
const api = window.electronAPI;
const ticketList = document.getElementById("ticket-list");
const emptyState = document.getElementById("empty-state");
const countPending = document.getElementById("count-pending");
const countProgress = document.getElementById("count-progress");
const countCompleted = document.getElementById("count-completed");
const MISSING_TYPE_LABELS = {
  address: "Adres Bilgisi",
  fault_form: "Arıza Beyanı",
  contact: "Müşteri İletişim",
  other: "Diğer"
};
let currentRole = "mh";
let personnelName = "";
api.getSettings().then((settings) => {
  currentRole = settings.role || "mh";
  personnelName = settings.personnelName || "Bilinmeyen";
});
api.onTicketUpdate((tickets) => {
  renderTickets(tickets);
});
api.getTickets().then((tickets) => {
  if (tickets) renderTickets(tickets);
});
function renderTickets(tickets) {
  const oldCards = ticketList.querySelectorAll(".ticket-card");
  oldCards.forEach((c) => c.remove());
  const pending = tickets.filter((t) => t.status === "pending").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const completed = tickets.filter((t) => t.status === "completed").length;
  countPending.textContent = String(pending);
  countProgress.textContent = String(inProgress);
  countCompleted.textContent = String(completed);
  if (tickets.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";
  tickets.forEach((ticket) => {
    const card = document.createElement("div");
    card.className = `ticket-card status-${ticket.status}`;
    const timeStr = ticket.created_at?.seconds ? new Date(ticket.created_at.seconds * 1e3).toLocaleString("tr-TR") : "";
    let actionsHtml = "";
    if (currentRole === "mh") {
      if (ticket.status === "pending") {
        actionsHtml = `
          <span class="badge badge-pending">Bekliyor</span>
          <button class="btn-sm btn-claim" data-id="${ticket.id}">Üstlen</button>
        `;
      } else if (ticket.status === "in_progress") {
        if (ticket.responded_by === personnelName) {
          actionsHtml = `
            <span class="badge badge-in_progress">Üstlenildi</span>
            <input type="text" class="response-input" id="resp-${ticket.id}" placeholder="Cevabınızı yazın...">
            <button class="btn-sm btn-complete" data-id="${ticket.id}">Tamamla</button>
          `;
        } else {
          actionsHtml = `
            <span class="badge badge-in_progress">${ticket.responded_by} üstlendi</span>
          `;
        }
      } else {
        actionsHtml = `<span class="badge badge-completed">Tamamlandı</span>`;
      }
    } else {
      if (ticket.status === "pending") {
        actionsHtml = `<span class="badge badge-pending">Bekliyor</span>`;
      } else if (ticket.status === "in_progress") {
        actionsHtml = `<span class="badge badge-in_progress">${ticket.responded_by} bakıyor</span>`;
      } else {
        actionsHtml = `<span class="badge badge-completed">✅ Tamamlandı</span>`;
      }
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
    const isCompleted = ticket.status === "completed";
    const disabledAttr = isCompleted ? "disabled" : "";
    const collabHtml = `
            <div class="collab-container">
                <div class="collab-group">
                    <span class="collab-label">Müşteri İsmi</span>
                    <input type="text" class="response-input collab-input" id="cust-${ticket.id}" value="${ticket.customer_name || ""}" placeholder="İsim Girin..." ${disabledAttr}>
                </div>
                <div class="collab-group">
                    <span class="collab-label">Aras Kodu</span>
                    <input type="text" class="response-input collab-input" id="aras-${ticket.id}" value="${ticket.aras_code || ""}" placeholder="Aras Kodu..." ${disabledAttr}>
                </div>
                <div class="collab-group">
                    <span class="collab-label">Telefon Numarası</span>
                    <input type="text" class="response-input collab-input" id="phone-${ticket.id}" value="${ticket.phone_number || ""}" placeholder="05XX..." ${disabledAttr}>
                </div>
            </div>
            ${!isCompleted ? `<button class="btn-sm btn-update" data-id="${ticket.id}" style="margin-top: 12px;">Güncelle</button>` : ""}
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
  document.querySelectorAll(".btn-claim").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await api.claimTicket(id, personnelName);
    });
  });
  document.querySelectorAll(".btn-complete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const input = document.getElementById(`resp-${id}`);
      const response = input?.value?.trim();
      if (!response) {
        input.style.borderColor = "#ef4444";
        input.placeholder = "Lütfen bir cevap yazın!";
        return;
      }
      await api.completeTicket(id, response);
    });
  });
  document.querySelectorAll(".btn-update").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const custInput = document.getElementById(`cust-${id}`);
      const arasInput = document.getElementById(`aras-${id}`);
      const phoneInput = document.getElementById(`phone-${id}`);
      btn.textContent = "Güncelleniyor...";
      btn.disabled = true;
      await api.updateTicketDetails(id, {
        customer_name: custInput?.value?.trim() || "",
        aras_code: arasInput?.value?.trim() || "",
        phone_number: phoneInput?.value?.trim() || ""
      });
      btn.textContent = "Güncelle";
      btn.disabled = false;
    });
  });
}
