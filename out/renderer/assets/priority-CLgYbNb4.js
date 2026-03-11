/* empty css               */
/* empty css               */
import { b as SVG_EMPTY_STAR, s as showToast } from "./svgUtils-BxY6k_uX.js";
const api = window.electronAPI;
const priorityList = document.getElementById("priority-list");
const searchInput = document.getElementById("priority-search");
const priorityFormSection = document.getElementById("priority-form-section");
const btnAddPriority = document.getElementById("btn-add-priority");
const pdCustomer = document.getElementById("pd-customer");
const pdSerial = document.getElementById("pd-serial");
const pdDesc = document.getElementById("pd-desc");
let allPriorityDevices = [];
let searchQuery = "";
let currentRole = "kargo_kabul";
let personnelName = "";
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.toLowerCase().trim();
  renderPriorityDevices(allPriorityDevices);
});
api.onPriorityDevicesUpdate((devices) => {
  allPriorityDevices = devices;
  renderPriorityDevices(devices);
});
Promise.all([
  api.getSettings(),
  api.getPriorityDevices()
]).then(([settings, devices]) => {
  if (settings.theme === "light") {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
  }
  currentRole = settings.role || "kargo_kabul";
  personnelName = settings.personnelName || "Bilinmeyen";
  priorityFormSection.style.display = currentRole === "mh" ? "block" : "none";
  if (devices) {
    allPriorityDevices = devices;
    renderPriorityDevices(devices);
  }
});
showSkeletonPriority();
function showSkeletonPriority() {
  priorityList.innerHTML = `
        <div class="priority-item" style="pointer-events:none;">
            <div class="priority-item-body">
                <div class="skeleton" style="width:40%;height:18px;margin-bottom:8px;"></div>
                <div class="skeleton" style="width:80%;height:14px;"></div>
            </div>
        </div>
        <div class="priority-item" style="pointer-events:none;opacity:0.6;">
            <div class="priority-item-body">
                <div class="skeleton" style="width:55%;height:18px;margin-bottom:8px;"></div>
                <div class="skeleton" style="width:70%;height:14px;"></div>
            </div>
        </div>
    `;
}
function renderPriorityDevices(devices) {
  priorityList.innerHTML = "";
  let filtered = [...devices];
  if (searchQuery) {
    filtered = filtered.filter(
      (d) => (d.serial || "").toLowerCase().includes(searchQuery) || (d.customer_name || "").toLowerCase().includes(searchQuery)
    );
  }
  if (filtered.length === 0) {
    priorityList.innerHTML = `
            <div class="priority-empty" style="display:flex;flex-direction:column;align-items:center;">
                ${SVG_EMPTY_STAR}
                <div style="font-weight:600;margin-bottom:4px;">Kayıt bulunamadı</div>
                <div style="font-size:0.82rem;">Henüz öncelikli cihaz eklenmedi.</div>
            </div>
        `;
    return;
  }
  filtered.forEach((device) => {
    const item = document.createElement("div");
    item.className = "priority-item";
    const timeStr = device.created_at ? new Date(device.created_at).toLocaleString("tr-TR") : "";
    item.innerHTML = `
            <div class="priority-item-body">
                <div class="priority-item-name">${device.customer_name}</div>
                ${device.serial ? `<div class="priority-item-serial">📦 ${device.serial}</div>` : ""}
                <div class="priority-item-desc">${device.description}</div>
                <div class="priority-item-meta">${timeStr} — ${device.created_by || "Sistem"}</div>
            </div>
            ${currentRole === "mh" ? `<button class="btn-del-priority" data-id="${device.id}" title="Kaydı Sil">✕</button>` : ""}
        `;
    priorityList.appendChild(item);
  });
  if (currentRole === "mh") {
    priorityList.querySelectorAll(".btn-del-priority").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          await api.deletePriorityDevice(id);
          showToast("Öncelikli cihaz listeden silindi.", "success");
        } catch (e) {
          showToast("Silinemedi: " + e.message, "error");
        }
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
    showToast("Öncelikli cihaz başarıyla eklendi.", "success");
  } catch (e) {
    console.error("Error adding priority device:", e);
    showToast("Cihaz eklenirken hata: " + e.message, "error");
  } finally {
    btnAddPriority.textContent = "➕ Kayıt Ekle";
    btnAddPriority.disabled = false;
  }
});
