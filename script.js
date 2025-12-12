// Contenuto Completo e Definitivo per script.js (Correzione Parentesi e 11 Colonne Separate)
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
function parseDateForComparison(dateString) {
    if (!dateString || dateString.length < 10) return "1900-01-01"; 
    const parts = dateString.split('-');
    // Ricostruisce la stringa in formato ISO (AAAA-MM-GG)
    if (parts.length === 3) {
        // Assicuriamoci che l'ordine sia Anno, Mese, Giorno
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
            // La colspan deve essere 11 ora
            tableBody.innerHTML = '<tr><td colspan="11" style="text-align:center; color:red;">ERRORE: Impossibile caricare i dati. Verifica l\'URL CSV e i nomi delle colonne.</td></tr>';
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
    
   // LOGICA DI ORDINAMENTO: Dalla data più GRANDE/NUOVA alla più PICCOLA/VECCHIA
data.sort((a, b) => {
    const dateA = parseDateForComparison(a.data);
    const dateB = parseDateForComparison(b.data);
    // Se A è più nuovo/grande di B, A viene PRIMA (-1)
    if (dateA > dateB) return -1; 
    // Se A è più vecchio/piccolo di B, A viene DOPO (1)
    if (dateA < dateB) return 1;
    return 0;
});

    const today = new Date().toISOString().split('T')[0];
    
    data.forEach(race => {
        const row = tableBody.insertRow();
        
        // Determina se la gara è passata (necessario per Stato e Risultato)
        const isPastRace = race.data && parseDateForComparison(race.data) < today; 

        if (isPastRace) {
            row.classList.add('past-race');
        }
        
        // 1. DATA (Formattata GG/MM/AAAA)
        row.insertCell().textContent = formatDate(race.data);
        
        // 2. EVENTO (Con Link a dettaglio.html)
        const eventCell = row.insertCell();
        const eventLink = document.createElement('a');
        eventLink.href = `dettaglio.html?id=${race.ID}`; 
        eventLink.textContent = race.evento; 
        eventCell.appendChild(eventLink);
        
        // 3. TIPO
        row.insertCell().textContent = race.tipo;

        // 4. DISTANZA
        row.insertCell().textContent = race.distanza;

        // 5. CITTÀ
        row.insertCell().textContent = race.citta;
        
        // 6. REGIONE
        row.insertCell().textContent = race.regione;

        // 7. OBIETTIVO
        row.insertCell().textContent = race.obiettivo || '';

        // 8. RISULTATO (TempoFinale) - Mostra solo se gara passata
        const resultCell = row.insertCell();
        resultCell.textContent = (isPastRace && race.tempoFinale) ? race.tempoFinale : '';

        // 9. PB (Personal Best)
        const pbCell = row.insertCell();
        pbCell.textContent = (race.pb && isPastRace) ? '⭐️' : ''; 
        pbCell.style.textAlign = 'center';

        // 10. SITO WEB (Come Link Cliccabile)
        const webCell = row.insertCell();
        if (race.sitoWeb) {
            const webLink = document.createElement('a');
            webLink.href = race.sitoWeb;
            webLink.textContent = 'Link';
            webLink.target = '_blank';
            webCell.appendChild(webLink);
        } else {
            webCell.textContent = '';
        }
        
        // 11. STATO
        const stato = isPastRace ? (race.tempoFinale ? 'Completata' : 'Ritirata') : 'In Programma';
        row.insertCell().textContent = stato;
    });
}


document.addEventListener('DOMContentLoaded', () => {
    loadDataFromSheet();
    searchInput.addEventListener('keyup', filterRaces);
    filterSelect.addEventListener('change', filterRaces); 
});

