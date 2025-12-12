// Contenuto Completo e Definitivo per script.js (Versione Funzionante)

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

const tableBody = document.getElementById('racesTableBody');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
let raceData = [];

// Funzione per formattare la data da GG-MM-AAAA a GG/MM/AAAA (per la visualizzazione)
function formatDate(dateString) {
    if (!dateString) return '';
    // Sostituisce trattini e slash con gli slash per la visualizzazione
    return dateString.replace(/[\/-]/g, '/'); 
}

// Funzione per convertire la data (Lettura GG-MM-AAAA con normalizzazione separatore)
function parseDateObject(dateString) {
    // Data di default FUTURA (Anno 2099) per garantire lo stato 'In Programma' in caso di errore
    const FUTURE_DEFAULT = new Date(Date.UTC(2099, 0, 1)); 

    if (!dateString || dateString.length < 10) return FUTURE_DEFAULT;
    
    // PASSO CRITICO: Normalizza il separatore (sia / che -)
    const cleanedString = dateString.replace(/[\/-]/g, '-'); 
    const parts = cleanedString.split('-');
    
    if (parts.length === 3) {
        // LEGGERE IL TUO FORMATO ITALIANO: GG-MM-AAAA
        const day = parseInt(parts[0], 10);      
        const month = parseInt(parts[1], 10) - 1; // Mese è 0-based
        const year = parseInt(parts[2], 10);     
        
        // Verifica la validità dei componenti numerici
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return FUTURE_DEFAULT;
        }

        // Creiamo l'oggetto Data in UTC. L'ordine è AAAA, MM, GG
        const dateObj = new Date(Date.UTC(year, month, day));
        
        // Verifica se l'oggetto Date è valido (es. evita 31 Febbraio)
        if (isNaN(dateObj.getTime())) {
            return FUTURE_DEFAULT;
        }
        
        return dateObj;
    }
    return FUTURE_DEFAULT; 
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

// All'inizio della funzione renderTable
function renderTable(data) {
    tableBody.innerHTML = '';
    
    // LOGICA DI ORDINAMENTO (Usa parseDateObject corretto)
    data.sort((a, b) => {
        const dateA = parseDateObject(a.data);
        const dateB = parseDateObject(b.data);
        
        if (dateA > dateB) return -1; // Ordine Decrescente (date future prima)
        if (dateA < dateB) return 1;  
        return 0;
    }); 

    // NUOVO OGGETTO TODAY: Creato in modo sicuro in UTC (dalla stringa AAAA-MM-GG)
    const now = new Date();
    // Questo previene i problemi di fuso orario/cache sul confronto
    const dateString = now.toISOString().split('T')[0]; 
    const todayUTC = new Date(dateString); 
    
    data.forEach(race => {
        // CORREZIONE 1: Definizione della riga mancante (risolve ReferenceError)
        const row = tableBody.insertRow(); 

        const raceDateObject = parseDateObject(race.data);
        
        // CONFRONTO AFFIDABILE: Data Gara <= Oggi (entrambi in UTC)
        const isPastRace = raceDateObject <= todayUTC; 
        
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
        // Logica di stato basata sul confronto affidabile tra oggetti Date
        const stato = isPastRace 
            ? (race.tempoFinale ? 'Completata' : 'Ritirata') 
            : 'In Programma';
        row.insertCell().textContent = stato;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromSheet();
    searchInput.addEventListener('keyup', filterRaces);
    filterSelect.addEventListener('change', filterRaces); 
});
