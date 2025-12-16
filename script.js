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

// RIFERIMENTI CORRETTI:
const typeFilterButtonsContainer = document.getElementById('typeFilterButtonsContainer');
const eventFilterSelect = document.getElementById('eventFilterSelect');

const tabButtons = document.querySelectorAll('.tab-button'); // Pulsanti Stato

let raceData = [];
let currentStatusFilter = 'Tutti';
let currentTypeFilter = 'Tutti'; // Stato per il filtro Tipo Gara (ora pulsanti)
let currentEventFilter = 'Tutti'; // Stato per il filtro Evento (nuovo select)


/**
 * Normalizza la data della gara in un oggetto Date UTC per confronto sicuro,
 * gestendo il formato italiano GG/MM/AAAA.
 */
function parseDateObject(dateString) {
    if (!dateString) return new Date(0);
    
    let cleanedString = dateString.trim();

    // Rimuove il giorno della settimana se presente (es. "Sab 29/11/2025")
    cleanedString = cleanedString.replace(/^[A-Za-z]+\s+/, '').trim();
    
    // Controllo e conversione da GG/MM/AAAA a AAAA-MM-GG (Formato ISO)
    const parts = cleanedString.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        cleanedString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    try {
        const date = new Date(cleanedString);
        
        if (isNaN(date.getTime())) {
            return new Date(0); // Data Non Valida
        }
        
        // Normalizza all'inizio del giorno (00:00:00) in UTC
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    } catch (e) {
        return new Date(0);
    }
}

/**
 * Formatta la data in GG/MM/AAAA per la visualizzazione.
 */
function formatDate(dateString) {
    const date = parseDateObject(dateString);
    if (date.getTime() === new Date(0).getTime()) return '';
    
    return date.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}


// =========================================================================
// LOGICA DEI DATI E FILTRAGGIO
// =========================================================================

/**
 * Popola il select filtro con tutti i nomi degli eventi unici.
 */
function populateEventFilterSelect(data) {
    const events = new Set();
    data.forEach(race => {
        if (race.evento) {
            events.add(race.evento); // race.evento è già pulito dalla loadData
        }
    });

    eventFilterSelect.innerHTML = '<option value="Tutti">Filtra per Evento</option>';
    Array.from(events).sort().forEach(event => {
        const option = document.createElement('option');
        option.value = event;
        option.textContent = event;
        eventFilterSelect.appendChild(option);
    });
}

/**
 * Crea e gestisce i pulsanti per il filtro Tipo Gara (sostituisce il vecchio select).
 */
function populateTypeFilterButtons(data) {
    const types = new Set();
    data.forEach(race => {
        // Usiamo il tipo già pulito e in minuscolo dalla loadDataFromSheet
        if (race.tipo) {
            types.add(race.tipo);
        }
    });

    // Per la visualizzazione, convertiamo la prima lettera in maiuscolo (se non vuoto)
    const formatTypeForDisplay = (type) => {
        if (type === 'Tutti') return 'Tutti i Tipi';
        if (!type) return '';
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const uniqueTypes = ['Tutti', ...Array.from(types).sort()];
    typeFilterButtonsContainer.innerHTML = '';
    
    uniqueTypes.forEach(type => {
        const button = document.createElement('button');
        button.textContent = formatTypeForDisplay(type);
        button.classList.add('tab-button'); // Usiamo la stessa classe dei tab di stato
        
        // Il value è il tipo in minuscolo/pulito per il confronto
        button.setAttribute('data-type-filter', type); 

        if (type === currentTypeFilter) {
             button.classList.add('active');
        }

        button.addEventListener('click', (event) => {
            const newTypeFilter = event.target.getAttribute('data-type-filter');
            currentTypeFilter = newTypeFilter;
            
            // Gestione della classe active
            document.querySelectorAll('#typeFilterButtonsContainer .tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            filterRaces(); // Ricarica la tabella
        });
        typeFilterButtonsContainer.appendChild(button);
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
    // Leggiamo i filtri dai nuovi stati globali
    const typeFilter = currentTypeFilter; 
    const statusFilter = currentStatusFilter;
    const eventFilter = currentEventFilter; // Filtro Evento
    
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
        
        // FILTRO RICERCA TESTUALE
        const searchMatch = !searchTerm ||
            race.evento.toLowerCase().includes(searchTerm) ||
            race.citta.toLowerCase().includes(searchTerm) ||
            (race.distanza && race.distanza.toLowerCase().includes(searchTerm)) ||
            (race.regione && race.regione.toLowerCase().includes(searchTerm));

        // FILTRO TIPO GARA
        const typeMatch = typeFilter === 'Tutti' || race.tipo === typeFilter;
        
        // FILTRO STATO
        const statusMatch = statusFilter === 'Tutti' || stato === statusFilter;
        
        // NUOVO FILTRO EVENTO (corrispondenza esatta)
        const eventMatch = eventFilter === 'Tutti' || race.evento === eventFilter;

        // COMBINAZIONE DEI FILTRI
        return searchMatch && typeMatch && statusMatch && eventMatch;
    });

    // Logica di ordinamento (dal più recente al più vecchio)
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
        row.insertCell().colSpan = 12; // 12 colonne totali
        row.cells[0].textContent = "Nessuna gara trovata con i filtri selezionati.";
        row.cells[0].style.textAlign = 'center';
        return;
    }

    let rowIndex = 0;
    
    filteredData.forEach(race => {
        const row = tableBody.insertRow();
        
        // Calcola lo stato per la colorazione della riga
        const raceDateObject = parseDateObject(race.data);
        const isDateValid = raceDateObject.getTime() !== new Date(0).getTime();
        const isPastRace = isDateValid && raceDateObject <= todayUTC;
        
        const stato = !isDateValid
            ? 'Data Non Valida'
            : (isPastRace
                ? (race.tempoFinale && race.tempoFinale.trim() !== '' ? 'Completata' : 'Ritirata')
                : 'In Programma');
        
        // Logica Classi CSS
        if (race.tipo) {
            const type = race.tipo; // type è già in minuscolo/pulito
            if (type === 'triathlon') {
                row.classList.add('race-triathlon');
            } else if (type === 'duathlon') {
                row.classList.add('race-duathlon');
            } else if (type === 'corsa') {
                row.classList.add('race-corsa');
            } else {
                 row.classList.add('race-default');
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

        // 0. N. progressivo
        rowIndex++;
        const numberCell = row.insertCell();
        numberCell.textContent = rowIndex;
        numberCell.style.textAlign = 'center';
        
        // 1. DATA
        row.insertCell().textContent = isDateValid ? formatDate(race.data) : `[${race.data}] - Data Non Valida`;
        
        // 2. EVENTO
        const eventCell = row.insertCell();
        const eventLink = document.createElement('a');
        eventLink.href = `dettaglio.html?id=${race.ID}`;
        eventLink.textContent = race.evento;
        eventCell.appendChild(eventLink);
        
        // 3. TIPO
        // Visualizza con la prima lettera maiuscola, se presente
        row.insertCell().textContent = race.tipo ? race.tipo.charAt(0).toUpperCase() + race.tipo.slice(1) : '';

        // 4. DISTANZA
        row.insertCell().textContent = race.distanza || '';

        // 5. CITTÀ
        row.insertCell().textContent = race.citta || '';
        
        // 6. REGIONE
        row.insertCell().textContent = race.regione || '';

        // 7. OBIETTIVO
        const obiettivoCell = row.insertCell();
        obiettivoCell.textContent = race.obiettivo || '';

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
    // PapaParse legge il CSV
    PaPapa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: false, // Leggiamo per indice per la mappatura
        skipEmptyLines: true,
        complete: function(results) {
            
            const rawData = results.data.slice(1);
            
            const allRaceData = rawData
                .filter(row => row[1] && row[2]) 
                .map(row => {
                    
                    // ESSENZIALE: Puliamo le stringhe per generare ID consistenti
                    const dataPart = row[1] ? String(row[1]).trim() : ''; 
                    const eventoPart = row[2] ? String(row[2]).trim() : '';
                    const cittaPart = row[4] ? String(row[4]).trim() : '';
                    const distanzaPart = row[6] ? String(row[6]).trim() : '';
                    
                    const generatedID = row[0] || (dataPart + eventoPart + cittaPart + distanzaPart);
                    
                    const raceDateObject = parseDateObject(row[1]);
                    const isDateValid = raceDateObject.getTime() !== new Date(0).getTime();
                    const now = new Date();
                    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
                    const isPastRace = isDateValid && raceDateObject <= todayUTC;

                    const stato = !isDateValid
                        ? 'Data Non Valida'
                        : (isPastRace
                            ? (row[7] && row[7].trim() !== '' ? 'Completata' : 'Ritirata')
                            : 'In Programma');
                    
                    return {
                        // Nuovo ID pulito
                        ID: generatedID, 
                        data: row[1],
                        evento: eventoPart, // Usiamo la versione pulita
                        tipo: row[3] ? row[3].trim().toLowerCase() : '',
                        distanza: row[6] || '',
                        citta: row[4] || '',
                        regione: row[5] || '',
                        obiettivo: row[9] || '',
                        tempoFinale: row[7] || '',
                        pb: row[8] && (String(row[8]).trim().toLowerCase() === 'x'),
                        sitoWeb: row[10] || '',
                        stato: stato 
                    }
                });           
            // Popola il menu a tendina per il filtro Evento
            populateEventFilterSelect(raceData);
            
            // Popola i pulsanti per il filtro Tipo Gara
            populateTypeFilterButtons(raceData);
            
            renderTable(raceData);
        },
        error: (error) => {
            console.error("Errore nel caricamento del CSV:", error);
            // Colspan corretto a 12
            tableBody.innerHTML = '<tr><td colspan="12" style="color: red; text-align: center;">ERRORE: Impossibile caricare il calendario. Controlla l\'URL CSV e la connessione.</td></tr>';
        }
    });
}

// =========================================================================
// INIZIALIZZAZIONE
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (tableBody) {
        loadDataFromSheet();
        
        // Event Listener per la ricerca testuale
        searchInput.addEventListener('keyup', filterRaces);
        
        // NUOVO Event Listener per il filtro Evento (Select)
        if (eventFilterSelect) {
            eventFilterSelect.addEventListener('change', (event) => {
                currentEventFilter = event.target.value;
                filterRaces();
            });
        }
        
        // L'Event Listener per il Tipo Gara è ora gestito all'interno di populateTypeFilterButtons
        
        // Event Listener per i filtri di stato (Pulsanti)
        tabButtons.forEach(button => {
            button.addEventListener('click', filterByStatus);
        });
    }
});




