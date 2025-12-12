// =========================================================================
// CONFIGURAZIONE
// =========================================================================

// URL del tuo foglio Google, esportato come CSV.
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

// =========================================================================
// VARIABILI GLOBALI E FUNZIONI UTILITY
// =========================================================================

// Ottiene i riferimenti agli elementi HTML
const tableBody = document.getElementById('racesTableBody');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const tabButtons = document.querySelectorAll('.tab-button');

let raceData = [];
let currentStatusFilter = 'Tutti'; // Stato di default per i tab


/**
 * Normalizza la data della gara in un oggetto Date UTC (Mezzanotte) per confronto sicuro.
 * Implementa un FIX specifico per il formato italiano GG/MM/AAAA dal foglio Google,
 * convertendolo nel formato ISO (AAAA-MM-GG) riconosciuto universalmente da new Date().
 * * @param {string} dateString La stringa della data dal CSV (es: "13/09/2015").
 * @returns {Date} L'oggetto Date normalizzato in UTC.
 */
function parseDateObject(dateString) {
    if (!dateString) return new Date(0); 
    
    let cleanedString = dateString.trim();

    // 1. Rimuove il giorno della settimana se presente (es. "Sab 29/11/2025")
    // (Nel tuo CSV non sembra esserci, ma è una sicurezza)
    cleanedString = cleanedString.replace(/^[A-Za-z]+\s+/, '').trim(); 
    
    // 2. Controllo e conversione da GG/MM/AAAA a AAAA-MM-GG (Formato ISO)
    const parts = cleanedString.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        // Ricrea la stringa come AAAA-MM-GG. Se non è un formato GG/MM/AAAA, lo salta.
        cleanedString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    try {
        // new Date() con formato AAAA-MM-GG è robusto.
        const date = new Date(cleanedString);
        
        if (isNaN(date.getTime())) { 
            return new Date(0); // Data Non Valida
        }
        
        // Normalizza all'inizio del giorno (00:00:00) in UTC per confronto sicuro
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    } catch (e) {
        return new Date(0);
    }
}

/**
 * Formatta la data in GG/MM/AAAA per la visualizzazione.
 * @param {string} dateString La stringa della data dal CSV.
 * @returns {string} La data formattata.
 */
function formatDate(dateString) {
    const date = parseDateObject(dateString);
    if (date.getTime() === new Date(0).getTime()) return '';
    
    return date.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}


// =========================================================================
// LOGICA DEI DATI E FILTRAGGIO (Nessuna modifica, è già stabile)
// =========================================================================

function populateFilterSelect(data) {
    const types = new Set();
    data.forEach(race => {
        if (race.tipo) {
            types.add(race.tipo);
        }
    });

    filterSelect.innerHTML = '<option value="Tutti">Tutti i Tipi</option>';
    Array.from(types).sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        filterSelect.appendChild(option);
    });
}

function filterByStatus(event) {
    const newStatusFilter = event.target.getAttribute('data-status-filter');
    
    currentStatusFilter = newStatusFilter;

    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');

    renderTable(raceData);
}

function filterRaces() {
    renderTable(raceData);
}


function renderTable(data) {
    tableBody.innerHTML = '';
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const typeFilter = filterSelect.value;
    const statusFilter = currentStatusFilter; 

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())); 
    
    let filteredData = data.filter(race => {
        const raceDateObject = parseDateObject(race.data);
        const isDateValid = raceDateObject.getTime() !== new Date(0).getTime();

        const isPastRace = isDateValid && raceDateObject <= todayUTC; 
        
        const stato = !isDateValid 
            ? 'Data Non Valida' 
            : (isPastRace 
                ? (race.tempoFinale && race.tempoFinale.trim() !== '' ? 'Completata' : 'Ritirata') 
                : 'In Programma');
        
        const searchMatch = !searchTerm || 
            race.evento.toLowerCase().includes(searchTerm) || 
            race.citta.toLowerCase().includes(searchTerm) || 
            (race.distanza && race.distanza.toLowerCase().includes(searchTerm)) ||
            (race.regione && race.regione.toLowerCase().includes(searchTerm));

        const typeMatch = typeFilter === 'Tutti' || race.tipo === typeFilter;
        const statusMatch = statusFilter === 'Tutti' || stato === statusFilter; 

        return searchMatch && typeMatch && statusMatch;
    });

    filteredData.sort((a, b) => {
        const dateA = parseDateObject(a.data);
        const dateB = parseDateObject(b.data);
        
        if (dateA.getTime() === new Date(0).getTime() && dateB.getTime() !== new Date(0).getTime()) return 1;
        if (dateA.getTime() !== new Date(0).getTime() && dateB.getTime() === new Date(0).getTime()) return -1;
        
        if (dateA > dateB) return -1; 
        if (dateA < dateB) return 1;  
        return 0;
    }); 

    if (filteredData.length === 0) {
        const row = tableBody.insertRow();
        row.insertCell().colSpan = 11;
        row.cells[0].textContent = "Nessuna gara trovata con i filtri selezionati.";
        row.cells[0].style.textAlign = 'center';
        return;
    }

    filteredData.forEach(race => {
        const row = tableBody.insertRow(); 

        const raceDateObject = parseDateObject(race.data);
        const isDateValid = raceDateObject.getTime() !== new Date(0).getTime();
        const isPastRace = isDateValid && raceDateObject <= todayUTC; 
        
        const stato = !isDateValid 
            ? 'Data Non Valida' 
            : (isPastRace 
                ? (race.tempoFinale && race.tempoFinale.trim() !== '' ? 'Completata' : 'Ritirata') 
                : 'In Programma');
        
        if (race.tipo) {
            const typeClass = race.tipo.toLowerCase().replace(/\s/g, ''); 
            
            if (typeClass.includes('maratona') || typeClass.includes('running')) {
                row.classList.add('race-running');
            } else if (typeClass.includes('ultra')) {
                row.classList.add('race-ultra');
            } else if (typeClass.includes('triathlon') || typeClass.includes('ironman')) {
                row.classList.add('race-triathlon');
            }
        }
        
        if (stato === 'Ritirata') {
            row.classList.add('status-ritirata');
        } else if (stato === 'Completata') {
            row.classList.add('status-completata');
        } else if (stato === 'Data Non Valida') {
             row.classList.add('status-invalid-date');
        }
        
        if (isPastRace) {
             row.classList.add('past-race');
        }

        // 1. DATA
        row.insertCell().textContent = isDateValid ? formatDate(race.data) : `[${race.data}] - Data Non Valida`;
        
        // 2. EVENTO (Con Link a dettaglio.html)
        const eventCell = row.insertCell();
        const eventLink = document.createElement('a');
        eventLink.href = `dettaglio.html?id=${race.ID}`; 
        eventLink.textContent = race.evento; 
        eventCell.appendChild(eventLink);
        
        // 3. TIPO
        row.insertCell().textContent = race.tipo || '';

        // 4. DISTANZA
        row.insertCell().textContent = race.distanza || '';

        // 5. CITTÀ
        row.insertCell().textContent = race.citta || '';
        
        // 6. REGIONE
        row.insertCell().textContent = race.regione || '';

        // 7. OBIETTIVO
        row.insertCell().textContent = race.obiettivo || '';

        // 8. RISULTATO
        const resultCell = row.insertCell();
        resultCell.textContent = (stato === 'Completata' && race.tempoFinale) ? race.tempoFinale : '';

        // 9. PB
        const pbCell = row.insertCell();
        pbCell.textContent = (race.pb && isPastRace) ? '⭐️' : ''; 
        pbCell.style.textAlign = 'center';

        // 10. SITO WEB
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
        row.insertCell().textContent = stato;
    });
}


function loadDataFromSheet() {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        complete: (results) => {
            if (!results.data || results.data.length === 0) {
                 tableBody.innerHTML = '<tr><td colspan="11" style="color: blue; text-align: center;">Dati caricati, ma il foglio è vuoto.</td></tr>';
                 return;
            }

            const fields = results.meta.fields || [];
            
            const tempoFinaleKey = fields.find(f => f && f.toLowerCase().includes('tempo') && f.toLowerCase().includes('finale')) || 'Tempo Finale';

            raceData = results.data
                .filter(row => row.Data && row.Evento)
                .map(row => ({
                    ID: row['ID'] || (row['Data'] + row['Evento'] + row['Città'] + row['Distanza']), 
                    data: row['Data'],
                    evento: row['Evento'],
                    tipo: row['Ruolo Strategico'] ? row['Ruolo Strategico'].split(' ')[0].replace('OBIETTIVO', '').trim() : '', 
                    distanza: row['Distanza'] || '',
                    citta: row['Città'] || '',
                    regione: row['Regione'] || '',
                    obiettivo: row['Pace Target / Obiettivo'] || '',
                    tempoFinale: row[tempoFinaleKey] || row['Tempo Finale'] || '', 
                    pb: row['PB'] === 'Si',
                    sitoWeb: row['Sito Web'] || '',
                }));
            
            populateFilterSelect(raceData);
            renderTable(raceData);
        },
        error: (error) => {
            console.error("Errore nel caricamento del CSV:", error);
            tableBody.innerHTML = '<tr><td colspan="11" style="color: red; text-align: center;">ERRORE: Impossibile caricare il calendario. Controlla l\'URL CSV e la connessione.</td></tr>';
        }
    });
}


// =========================================================================
// INIZIALIZZAZIONE
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (tableBody) {
        loadDataFromSheet();
        
        searchInput.addEventListener('keyup', filterRaces);
        filterSelect.addEventListener('change', filterRaces);
        
        tabButtons.forEach(button => {
            button.addEventListener('click', filterByStatus);
        });
    }
});
