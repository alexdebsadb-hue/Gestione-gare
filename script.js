const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

const tableBody = document.getElementById('racesTableBody');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
let raceData = [];

function formatDate(dateString) {
    if (!dateString || dateString.length < 10) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function loadDataFromSheet() {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true, 
        skipEmptyLines: true,
        complete: function(results) {
            // Mappatura AGGIORNATA per includere Città, Regione, e PB
            raceData = results.data.map(row => ({
                ID: row.ID, 
                data: row.Data,
                evento: row.Evento,
                tipo: row.Tipo, 
                distanza: row.Distanza, 
                citta: row.Città,
                regione: row.Regione,
                obiettivo: row.Obiettivo,
                tempoFinale: row['Tempo Finale'] || '',
                pb: row.PB || '', // Nuovo campo PB
                sitoWeb: row.SitoWeb || ''
            }));
            
            populateFilters(); 
            renderTable(raceData);
        },
        error: function(error) {
            console.error("Errore nel caricamento del foglio di calcolo:", error);
            tableBody.innerHTML = '<tr><td colspan="6">Errore nel caricamento dei dati. Controlla l\'URL.</td></tr>';
        }
    });
}

function renderTable(data) {
    tableBody.innerHTML = '';
    data.sort((a, b) => new Date(a.data) - new Date(b.data));
    const today = new Date().toISOString().split('T')[0];
    
    // Ridisegna l'intestazione: AGGIUNTO Città/Regione e PB
    const tableHeader = document.querySelector('#racesTable thead tr');
    tableHeader.innerHTML = `
        <th>Data</th>
        <th>Evento (Tipo/Distanza)</th>
        <th>Città / Regione</th>
        <th>Obiettivo / Risultato</th>
        <th>PB</th>
        <th>Stato</th>
    `;

    data.forEach(race => {
        const row = tableBody.insertRow();
        const isPastRace = race.data && race.data < today;

        if (isPastRace) {
            row.classList.add('past-race');
        }
        
        // 1. Data
        row.insertCell().textContent = formatDate(race.data);
        
        // 2. Evento (link a dettaglio)
        const eventCell = row.insertCell();
        const eventLink = document.createElement('a');
        eventLink.href = `dettaglio.html?id=${race.ID}`; 
        eventLink.textContent = `${race.evento} (${race.tipo} ${race.distanza})`; 
        eventCell.appendChild(eventLink);
        
        // 3. Città / Regione
        row.insertCell().textContent = `${race.citta} (${race.regione})`;

        // 4. Obiettivo / Risultato Finale
        let risultato = '';
        if (isPastRace) {
            risultato = race.tempoFinale || 'N/D';
        } else {
            risultato = race.obiettivo || 'Tempo da definire';
        }
        row.insertCell().textContent = risultato;

        // 5. PB
        const pbCell = row.insertCell();
        pbCell.textContent = (race.pb && isPastRace) ? '⭐️' : ''; // Mostra stella solo se PB è marcato X e gara è passata
        pbCell.style.textAlign = 'center';
        
        // 6. Stato
        const stato = isPastRace ? (race.tempoFinale ? 'Completata' : 'Ritirata') : 'In Programma';
        row.insertCell().textContent = stato;
    });
}

function filterRaces() {
    const searchText = searchInput.value.toLowerCase();
    
    const filteredData = raceData.filter(race => {
        // Aggiunti Città, Regione, Tipo e Distanza alla ricerca
        const matchesSearch = 
            (race.evento && race.evento.toLowerCase().includes(searchText)) ||
            (race.tipo && race.tipo.toLowerCase().includes(searchText)) ||
            (race.distanza && race.distanza.toLowerCase().includes(searchText)) ||
            (race.citta && race.citta.toLowerCase().includes(searchText)) ||
            (race.regione && race.regione.toLowerCase().includes(searchText));

        return matchesSearch;
    });

    renderTable(filteredData);
}

function populateFilters() {
    // La funzione rimane, ma il filtro a tendina non viene popolato perché non hai specificato una colonna per filtrare
    filterSelect.innerHTML = '<option value="">Tutti</option>'; 
}

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromSheet();
    searchInput.addEventListener('keyup', filterRaces);
    filterSelect.addEventListener('change', filterRaces); 
});
3. 📝 Aggiorna dettaglio.html (Opzionale, ma consigliato)
Per completezza, puoi aggiungere i dettagli di Città e Regione nella pagina di dettaglio. Modifica il file dettaglio.html su GitHub:

HTML

<div class="container">
        <a href="index.html" class="back-link">&leftarrow; Torna al Calendario</a>
        
        <h1 id="detail-title">Caricamento Gara...</h1>
        <p class="subtitle" id="detail-date"></p>
        
        <div class="detail-box">
            <h2>📍 Luogo & Dettagli Gara</h2>
            <p id="detail-luogo"></p>
            <p id="detail-tipo"></p>
        </div>

        <div class="detail-box">
            <h2>🎯 Obiettivo o Risultato Finale</h2>
            <p id="detail-stato"></p> 
            <p id="detail-obiettivo"></p>
        </div>
        
4. 📝 Aggiorna detail_script.js (Per mostrare Luogo e PB)
Infine, modifica il file detail_script.js su GitHub per leggere i nuovi dati:

JavaScript

// ... (codice iniziale, URL)

function renderDetails(race) {
    document.getElementById('detail-title').textContent = race.Evento;
    document.getElementById('detail-date').textContent = `${formatDate(race.Data)}`; 
    
    // NUOVI CAMPI LUOGO
    document.getElementById('detail-luogo').innerHTML = `**Luogo:** ${race.Città}, ${race.Regione}`;
    document.getElementById('detail-tipo').innerHTML = `**Tipo di Gara:** ${race.Tipo} (${race.Distanza})`;
    
    // Logica Stato/Obiettivo/Risultato
    const isPastRace = race.Data && race.Data < new Date().toISOString().split('T')[0];
    let statoFinale = isPastRace ? (race['Tempo Finale'] ? 'Completata' : 'Ritirata') : 'In Programma';
    let obiettivoRisultato = isPastRace ? (race['Tempo Finale'] || 'Tempo non registrato') : (race.Obiettivo || 'Obiettivo non definito');
    
    // Aggiungi marcatore PB se presente
    if (isPastRace && race.PB === 'X') { // Assumendo che 'X' sia il marcatore di PB nel foglio
        obiettivoRisultato += ' ⭐️ (Personal Best)';
    }

    document.getElementById('detail-stato').innerHTML = `**Stato:** ${statoFinale}`;
    document.getElementById('detail-obiettivo').innerHTML = `**${isPastRace ? 'Tempo Finale' : 'Obiettivo'}:** ${obiettivoRisultato}`;
    
    // ... (Logica SitoWeb e Protocollo Gara invariata)
}
// ... (il resto del codice rimane invariato)
