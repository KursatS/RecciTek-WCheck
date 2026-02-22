import { ipcRenderer } from 'electron';

const cardsDiv = document.getElementById('cards')!;
const searchInput = document.getElementById('search') as HTMLInputElement;
const toggleBtn = document.getElementById('toggle') as HTMLButtonElement;

let monitoringEnabled = true;

toggleBtn.onclick = () => {
  monitoringEnabled = !monitoringEnabled;
  toggleBtn.textContent = monitoringEnabled ? '👁️ Clipboard İzlemeyi Devre Dışı Bırak' : '👁️ Clipboard İzlemeyi Etkinleştir';
  ipcRenderer.send('toggle-monitoring', monitoringEnabled);
};

searchInput.oninput = () => {
  loadCards();
};

function loadCards() {
  ipcRenderer.invoke('get-cached-data').then((data: any[]) => {
    cardsDiv.innerHTML = '';
    const query = searchInput.value.toLowerCase();
    data.forEach(item => {
      if (item.serial.toLowerCase().includes(query)) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-content">
            <p><strong>Seri Numarası:</strong> ${item.serial}</p>
            <p><strong>Model:</strong> ${item.model_name.replace(/SON[Iİ]C/g, '').trim()} - ${item.model_color}</p>
            <p><strong>Garanti Durumu:</strong> ${item.warranty_status}</p>
            <p><strong>Kopyalama Tarihi:</strong> ${item.copy_date}</p>
            ${item.warranty_end ? `<p><strong>Garanti Bitiş:</strong> ${item.warranty_end}</p>` : ''}
          </div>
        `;
        cardsDiv.appendChild(card);
      }
    });
  }).catch(error => {
  });
}
loadCards();

// Global functions (if any needed in future)