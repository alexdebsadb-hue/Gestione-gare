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
            // Mappiamo e normalizziamo le chiavi, includendo il nuovo campo ID
            raceData = results.data.map(row => ({
                ID: row.ID, // ATTENZIONE: Questa colonna deve esistere nel tuo foglio Google!
                data: row.Data,
                evento: row.Evento,
                ruolo: row['Ruolo Strategico'],
                obiettivo: row['Pace Target / Obiettivo']
            }));
            
            populateFilters();
            renderTable(raceData);
        },
        error: function(error) {
            console.error("Errore nel caricamento del foglio di calcolo:", error);
            tableBody.innerHTML = '<tr><td colspan="4">Errore nel caricamento dei dati. Controlla l\'URL.</td></tr>';
        }
    });
}

function renderTable(data) {
    tableBody.innerHTML = '';
    data.sort((a, b) => new Date(a.data) - new Date(b.data));
    const today = new Date().toISOString().split('T')[0];

    data.forEach(race => {
        const row = tableBody.insertRow();
        
        if (race.data && race.data < today) {
            row.classList.add('past-race');
        }

        // Cell 1: Data
        row.insertCell().textContent = formatDate(race.data);
        
        // Cell 2: Evento (Trasformato in link alla pagina di dettaglio)
        const eventCell = row.insertCell();
        const eventLink = document.createElement('a');
        
        // Usa l'ID per creare il link: dettaglio.html?id=X
        if (race.ID) {
            eventLink.href = `dettaglio.html?id=${race.ID}`; 
        } else {
            // Se manca l'ID, non è un link cliccabile
            eventLink.href = "#"; 
        }
        
        eventLink.textContent = race.evento;
        eventCell.appendChild(eventLink);
        
        // Cell 3 & 4: Ruolo e Obiettivo
        row.insertCell().textContent = race.ruolo;
        row.insertCell().textContent = race.obiettivo;
    });
}

function filterRaces() {
    const searchText = searchInput.value.toLowerCase();
    const selectedRole = filterSelect.value;

    const filteredData = raceData.filter(race => {
        const matchesSearch = 
            (race.evento && race.evento.toLowerCase().includes(searchText)) ||
            (race.ruolo && race.ruolo.toLowerCase().includes(searchText)) ||
            (race.obiettivo && race.obiettivo.toLowerCase().includes(searchText));

        const matchesRole = selectedRole === '' || (race.ruolo && race.ruolo === selectedRole);

        return matchesSearch && matchesRole;
    });

    renderTable(filteredData);
}

function populateFilters() {
    const uniqueRoles = [...new Set(raceData.map(race => race.ruolo).filter(Boolean))];
    
    filterSelect.innerHTML = '<option value="">Tutti i Ruoli</option>'; 
    
    uniqueRoles.sort().forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role;
        filterSelect.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromSheet();
    searchInput.addEventListener('keyup', filterRaces);
    filterSelect.addEventListener('change', filterRaces);
});