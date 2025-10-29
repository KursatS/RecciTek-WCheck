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
          <span class="favorite" onclick="toggleFavorite('${item.serial}')">⭐</span>
          <div class="card-content">
            <p><strong>Seri Numarası:</strong> ${item.serial}</p>
            <p><strong>Model:</strong> ${item.model_name.replace(/SON[Iİ]C/g, '').trim()} - ${item.model_color}</p>
            <p><strong>Garanti Durumu:</strong> ${item.warranty_status}</p>
            <p><strong>Kopyalama Tarihi:</strong> ${item.copy_date}</p>
            ${item.warranty_end ? `<p><strong>Garanti Bitiş:</strong> ${item.warranty_end}</p>` : ''}
            <button class="note-btn" onclick="addNote('${item.serial}')">Not Ekle</button>
            <select class="status-dropdown" onchange="updateStatus('${item.serial}', this.value)">
              <option value="">Durum Seç</option>
              <option value="ARIZA EKSİK" ${item.status === 'ARIZA EKSİK' ? 'selected' : ''}>ARIZA EKSİK</option>
              <option value="ADRES EKSİK" ${item.status === 'ADRES EKSİK' ? 'selected' : ''}>ADRES EKSİK</option>
              <option value="ARIZA VE ADRES EKSİK" ${item.status === 'ARIZA VE ADRES EKSİK' ? 'selected' : ''}>ARIZA VE ADRES EKSİK</option>
              <option value="SERVİS KAYIT FORMU EKSİK" ${item.status === 'SERVİS KAYIT FORMU EKSİK' ? 'selected' : ''}>SERVİS KAYIT FORMU EKSİK</option>
              <option value="DİĞER" ${item.status === 'DİĞER' ? 'selected' : ''}>DİĞER</option>
            </select>
          </div>
        `;
        cardsDiv.appendChild(card);
      }
    });
  }).catch(error => {
  });
}

loadCards();

// Global functions
(window as any).toggleFavorite = async (serial: string) => {
  await ipcRenderer.invoke('toggle-favorite', serial);
  loadCards();
};

(window as any).addNote = async (serial: string) => {
  const existingNote = await ipcRenderer.invoke('get-note', serial);
  const modal = document.getElementById('note-modal') as HTMLDivElement;
  const textArea = document.getElementById('note-text') as HTMLTextAreaElement;
  textArea.value = existingNote || '';
  modal.style.display = 'flex';

  (document.getElementById('save-note') as HTMLButtonElement).onclick = async () => {
    const note = textArea.value;
    await ipcRenderer.invoke('save-note', serial, note);
    modal.style.display = 'none';
    loadCards();
  };

  (document.getElementById('cancel-note') as HTMLButtonElement).onclick = () => {
    modal.style.display = 'none';
  };
};

(window as any).updateStatus = async (serial: string, status: string) => {
  await ipcRenderer.invoke('save-status', serial, status);
  loadCards();
};