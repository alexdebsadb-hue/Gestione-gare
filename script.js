// Contenuto Completo per script.js
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

const tableBody = document.getElementById('racesTableBody');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
let raceData = [];

// Funzione per formattare la data da AAAA-MM-GG a GG/MM/AAAA
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
            // Mappatura AGGIORNATA per i nomi SENZA SPAZI E ACCENTI
            raceData = results.data.map(row => ({
                ID: row.ID, 
                data: row.Data,
                evento: row.Evento,
                tipo: row.Tipo, 
                distanza: row.Distanza, 
                citta: row.Citta,
                regione: row.Regione,
                obiettivo: row.Obiettivo,
                tempoFinale: row.TempoFinale || '', // TempoFinale tutto attaccato
                pb: row.PB || '', 
                sitoWeb: row.SitoWeb || ''
            }));
            
            populateFilters(); 
            renderTable(raceData);
        },
        error: function(error) {
            console.error("Errore nel caricamento del foglio di calcolo:", error);
            // Messaggio di errore visibile se Papa Parse fallisce
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
    // Ordina per data (il più vicino in alto)
    data.sort((a, b) => new Date(a.data) - new Date(b.data)); 
    const today = new Date().toISOString().split('T')[0];
    
    data.forEach(race => {
        const row = tableBody.insertRow();
        const isPastRace = race.data && race.data < today;

        if (isPastRace) {
            row.classList.add('past-race');
        }
        
        row.insertCell().textContent = formatDate(race.data);
        
        const eventCell = row.insertCell();
        const eventLink = document.createElement('a');
        eventLink.href = `dettaglio.html?id=${race.ID}`; 
        eventLink.textContent = `${race.evento} (${race.tipo} ${race.distanza})`; 
        eventCell.appendChild(eventLink);
        
        // Uso Citta senza accento
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
        
        const stato = isPastRace ? (race.tempoFinale ? 'Completata' : 'Ritirata') : 'In Programma';
        row.insertCell().textContent = stato;
    });
}


document.addEventListener('DOMContentLoaded', () => {
    loadDataFromSheet();
    // I listener ora chiamano le funzioni che abbiamo definito sopra
    searchInput.addEventListener('keyup', filterRaces);
    filterSelect.addEventListener('change', filterRaces); 
});




