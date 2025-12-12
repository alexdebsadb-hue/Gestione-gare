// Contenuto Completo e Definitivo per script.js (o script_final.js)
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

const tableBody = document.getElementById('racesTableBody');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
let raceData = [];

// Funzione per formattare la data da GG-MM-AAAA a GG/MM/AAAA (per la visualizzazione)
function formatDate(dateString) {
    if (!dateString) return '';
    // Sostituisce tutti i trattini con gli slash per la visualizzazione
    return dateString.replace(/-/g, '/');
}

// Funzione per convertire GG-MM-AAAA in AAAA-MM-GG (per il confronto e l'ordinamento)
// NOTA: 'Comparison' ha la 'C' maiuscola qui e ovunque!
function parseDateForComparison(dateString) {
    if (!dateString || dateString.length < 10) return "1900-01-01"; 
    const parts = dateString.split('-');
    // Ricostruisce la stringa in formato ISO (AAAA-MM-GG)
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString; 
}


function loadDataFromSheet() {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // Mappatura che usa i nomi delle colonne senza spazi e senza accenti
            raceData = results.data.map(row => ({
                ID: row.ID, 
                data: row.Data,
                evento: row.Evento,
                tipo: row.Tipo, 
                distanza: row.Distanza, 
                citta: row.Citta,
                regione: row.Regione,
                obiettivo: row.Obiettivo,
                tempoFinale: row.TempoFinale || '', 
                pb: row.PB || '', 
                sitoWeb: row.SitoWeb || ''
            }));
            
            populateFilters(); 
            renderTable(raceData);
        },
        error: function(error) {
            console.error("Errore nel caricamento del foglio di calcolo:", error);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">ERRORE: Impossibile caricare i dati. Verifica l\'URL CSV e i nomi delle colonne.</td></tr>';
        }
    });
}

function populateFilters() {
    const types = [...new Set(raceData.map(race => race.tipo))].sort();
    filterSelect.innerHTML = '<option value="Tutti">Tutti</option>' + 
        types.map(type => `<option value="${type}">${type}</option>`).join('');
}

function filterRaces() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterType = filterSelect.value;
    
    const filteredData = raceData.filter(race => {
        const matchesSearch = searchTerm === '' || 
            race.evento.toLowerCase().includes(searchTerm) ||
            race.citta.toLowerCase().includes(searchTerm) ||
            race.distanza.toLowerCase().includes(searchTerm);
            
        const matchesType = filterType === 'Tutti' || race.tipo === filterType;
        
        return matchesSearch && matchesType;
    });
    
    renderTable(filteredData);
}

function renderTable(data) {
    tableBody.innerHTML = '';
    
    // LOGICA DI ORDINAMENTO AFFIDABILE (basata sulla stringa ISO), USANDO 'C' MAIUSCOLA
    data.sort((a, b) => {
        const dateA = parseDateForComparison(a.data);
        const dateB = parseDateForComparison(b.data);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
    }); 

    const today = new Date().toISOString().split('T')[0];
    
    data.forEach(race => {
        const row = tableBody.insertRow();
        
        // CONFRONTO STATO: USANDO 'C' MAIUSCOLA
        const isPastRace = race.data && parseDateForComparison(race.data) < today; 

        if (isPastRace) {
            row.classList.add('past-race');
        }
        
        // Visualizzazione della data (GG/MM/AAAA)
        row.insertCell().textContent = formatDate(race.data);
        
        const eventCell = row.insertCell();
        const eventLink = document.createElement('a');
        eventLink.href = `dettaglio.html?id=${race.ID}`; 
        eventLink.textContent = `${race.evento} (${race.tipo} ${race.distanza})`; 
        eventCell.appendChild(eventLink);
        
        row.insertCell().textContent = `${race.citta} (${race.regione})`;

        let risultato = '';
        if (isPastRace) {
            risultato = race.tempoFinale || 'N/D';
        } else {
            risultato = race.obiettivo || 'Obiettivo non definito';
        }
        row.insertCell().textContent = risultato;

        const pbCell = row.insertCell();
        pbCell.textContent = (race.pb && isPastRace) ? '⭐️' : ''; 
        pbCell.style.textAlign = 'center';
        
        // Logica dello Stato: Completata solo se passata E TempoFinale NON è vuoto
        const stato = isPastRace ? (race.tempoFinale ? 'Completata' : 'Ritirata') : 'In Programma';
        row.insertCell().textContent = stato;
    });
}


document.addEventListener('DOMContentLoaded', () => {
    loadDataFromSheet();
    searchInput.addEventListener('keyup', filterRaces);
    filterSelect.addEventListener('change', filterRaces); 
});
