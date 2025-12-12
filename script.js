// =========================================================================
// CONFIGURAZIONE
// =========================================================================

// URL del tuo foglio Google, esportato come CSV.
// *** ASSICURATI CHE QUESTO URL SIA CORRETTO E PUBBLICO ***
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
 * Normalizza la data della gara in un oggetto Date UTC (Mezzanotte) per evitare problemi di fuso orario.
 * @param {string} dateString La stringa della data dal CSV (es: "Sab 29 Nov 2025").
 * @returns {Date} L'oggetto Date normalizzato in UTC.
 */
function parseDateObject(dateString) {
    if (!dateString) return new Date(0); 
    
    try {
        const date = new Date(dateString);
        // Normalizza all'inizio del giorno (00:00:00) in UTC per confronto sicuro
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    } catch (e) {
        // Se il parsing fallisce, restituisce la data minima
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
// LOGICA DEI DATI E FILTRAGGIO
// =========================================================================

/**
 * Popola il dropdown del filtro Tipo con tutti i valori unici.
 */
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

/**
 * Gestisce il click sui tab di Stato.
 * Aggiorna la variabile globale e ridisegna la tabella.
 * @param {Event} event L'evento di click.
 */
function filterByStatus(event) {
    const newStatusFilter = event.target.getAttribute('data-status-filter');
    
    // Aggiorna la variabile globale
    currentStatusFilter = newStatusFilter;

    // Aggiorna l'aspetto dei pulsanti
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');

    // Rirenderizza la tabella, applicando il filtro aggiornato
    renderTable(raceData);
}

/**
 * Funzione per gestire la ricerca testuale o il filtro per tipo.
 * Chiama renderTable per riapplicare TUTTI i filtri, incluso lo stato.
 */
function filterRaces() {
    renderTable(raceData);
}


/**
 * Funzione principale per disegnare la tabella applicando tutti i filtri e l'ordinamento.
 * @param {Array<Object>} data I dati completi delle gare.
 */
function renderTable(data) {
    tableBody.innerHTML = '';
    
    // 1. Ottieni i valori attuali dei filtri
    const searchTerm = searchInput.value.toLowerCase().trim();
    const typeFilter = filterSelect.value;
    const statusFilter = currentStatusFilter; // Legge il valore aggiornato dal tab

    // 2. Normalizza 'oggi' in UTC per confronto (solo data, ore 00:00:00)
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; 
    const todayUTC = new Date(dateString); 
    
    // 3. Filtra i dati in base a TUTTI i criteri (Ricerca, Tipo, STATO)
    let filteredData = data.filter(race => {
        // Calcola lo stato della gara (necessario per il filtro dello Stato)
        const raceDateObject = parseDateObject(race.data);
        const isPastRace = raceDateObject <= todayUTC; 
        const stato = isPastRace 
            ? (race.tempoFinale && race.tempoFinale.trim() !== '' ? 'Completata' : 'Ritirata') 
            : 'In Programma';
        
        // A. Filtro Ricerca Testuale
        const searchMatch = !searchTerm || 
            race.evento.toLowerCase().includes(searchTerm) || 
            race.citta.toLowerCase().includes(searchTerm) || 
            (race.distanza && race.distanza.toLowerCase().includes(searchTerm)) ||
            (race.regione && race.regione.toLowerCase().includes(searchTerm));

        // B. Filtro Tipo Gara (Dropdown)
        const typeMatch = typeFilter === 'Tutti' || race.tipo === typeFilter;
        
        // C. Filtro Stato (Tabs)
        const statusMatch = statusFilter === 'Tutti' || stato === statusFilter; 

        return searchMatch && typeMatch && statusMatch;
    });

    // 4. Ordinamento: Data più recente in cima (ordine decrescente)
    filteredData.sort((a, b) => {
        const dateA = parseDateObject(a.data);
        const dateB = parseDateObject(b.data);
        
        // Ordine: data più recente/futura in cima (-1)
        if (dateA > dateB) return -1; 
        if (dateA < dateB) return 1;  
        return 0;
    }); 

    // 5. Renderizzazione
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
        const isPastRace = raceDateObject <= todayUTC; 
        
        // Calcolo finale dello STATO
        const stato = isPastRace 
            ? (race.tempoFinale && race.tempoFinale.trim() !== '' ? 'Completata' : 'Ritirata') 
            : 'In Programma';
        
        // 6. Assegnazione classi CSS per colore
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
        
        // Assegna la classe di colore basata sullo stato finale (ha la priorità)
        if (stato === 'Ritirata') {
            row.classList.add('status-ritirata');
        } else if (stato === 'Completata') {
            row.classList.add('status-completata');
        }
        
        // Aggiunge la classe di opacità per le gare passate
        if (isPastRace) {
             row.classList.add('past-race');
        }

        // 7. Popolamento delle 11 colonne
        
        // 1. DATA
        row.insertCell().textContent = formatDate(race.data);
        
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
        // Controlla se è un PB e se la gara è passata (altrimenti non ha senso)
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


/**
 * Carica i dati dal Google Sheet tramite Papa Parse.
 */
function loadDataFromSheet() {
    // Tentativo di caricamento sicuro
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        complete: (results) => {
            if (!results.data || results.data.length === 0) {
                 tableBody.innerHTML = '<tr><td colspan="11" style="color: blue; text-align: center;">Dati caricati, ma il foglio è vuoto.</td></tr>';
                 return;
            }

            const fields = results.meta.fields || [];
            
            // Trova la chiave esatta per "Tempo Finale" o usa il fallback
            const tempoFinaleKey = fields.find(f => f && f.toLowerCase().includes('tempo') && f.toLowerCase().includes('finale')) || 'Tempo Finale';

            // Filtraggio base e Mappatura
            raceData = results.data
                .filter(row => row.Data && row.Evento)
                .map(row => ({
                    ID: row['ID'] || Date.now() + Math.random(), 
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
    // 1. Carica e disegna i dati (solo se siamo sulla pagina principale che ha l'ID 'racesTableBody')
    if (tableBody) {
        loadDataFromSheet();
        
        // 2. Aggiunge listener per i filtri classici
        searchInput.addEventListener('keyup', filterRaces);
        filterSelect.addEventListener('change', filterRaces);
        
        // 3. Aggiunge listener per i filtri di stato (i tab)
        tabButtons.forEach(button => {
            button.addEventListener('click', filterByStatus);
        });
    }
    // NOTA: Se avessi una funzione loadRaceDetails, andrebbe qui con un controllo per la pagina dettaglio.
});
