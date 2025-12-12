// =========================================================================
// CONFIGURAZIONE
// =========================================================================

// URL del tuo foglio Google, esportato come CSV.
// Questo URL è un placeholder. Assicurati di usare l'URL di esportazione CSV corretto.
// Se l'ID è '1c7Q_gJ5K-Y4P3dJ7F9rV7aY7sX5zY6c4b2aW3e1dZ0', l'URL corretto dovrebbe essere:
const sheetUrl = "https://docs.google.com/spreadsheets/d/1c7Q_gJ5K-Y4P3dJ7F9rV7aY7sX5zY6c4b2aW3e1dZ0/gviz/tq?tqx=out:csv&sheet=Foglio1";


// =========================================================================
// VARIABILI GLOBALI E FUNZIONI UTILITY
// =========================================================================

const tableBody = document.getElementById('racesTableBody');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const tabButtons = document.querySelectorAll('.tab-button');

let raceData = [];
let currentStatusFilter = 'Tutti'; // Stato di default, si collega ai tab

/**
 * Normalizza la data della gara in un oggetto Date UTC per evitare problemi di fuso orario.
 * @param {string} dateString La stringa della data dal CSV (es: "Sab 29 Nov 2025").
 * @returns {Date} L'oggetto Date normalizzato.
 */
function parseDateObject(dateString) {
    if (!dateString) return new Date(0); // Data minima se mancante
    
    // PapaParse dovrebbe gestire la conversione, ma la normalizziamo a mezzanotte UTC
    // per garantire coerenza con il confronto "todayUTC"
    try {
        const date = new Date(dateString);
        // Normalizza all'inizio del giorno (00:00:00) in UTC per confronto sicuro
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    } catch (e) {
        console.error("Errore nel parsing della data:", dateString, e);
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
    
    // Usa toLocaleDateString per la formattazione italiana (formato locale)
    return date.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}


// =========================================================================
// LOGICA DEI DATI E FILTRAGGIO
// =========================================================================

/**
 * Popola il dropdown del filtro Tipo con tutti i valori unici.
 * @param {Array<Object>} data I dati completi delle gare.
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
 * @param {Event} event L'evento di click.
 */
function filterByStatus(event) {
    const newStatusFilter = event.target.getAttribute('data-status-filter');
    
    // Aggiorna la variabile globale
    currentStatusFilter = newStatusFilter;

    // Rimuovi la classe 'active' da tutti i pulsanti e aggiungila al pulsante cliccato
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');

    // Rirenderizza la tabella con il nuovo filtro
    renderTable(raceData);
}


// ... (Tutto il codice precedente rimane uguale) ...

/**
 * Funzione principale per disegnare la tabella applicando tutti i filtri e l'ordinamento.
 * @param {Array<Object>} data I dati completi delle gare.
 */
function renderTable(data) {
    tableBody.innerHTML = '';
    
    // 1. Ottieni i valori attuali dei filtri
    const searchTerm = searchInput.value.toLowerCase().trim();
    const typeFilter = filterSelect.value;
    const statusFilter = currentStatusFilter; // Ottenuto dalla variabile globale aggiornata da filterByStatus

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
            ? (race.tempoFinale ? 'Completata' : 'Ritirata') 
            : 'In Programma';
        
        // A. Filtro Ricerca Testuale
        const searchMatch = !searchTerm || 
            race.evento.toLowerCase().includes(searchTerm) || 
            race.citta.toLowerCase().includes(searchTerm) || 
            (race.distanza && race.distanza.toLowerCase().includes(searchTerm)) ||
            (race.regione && race.regione.toLowerCase().includes(searchTerm));

        // B. Filtro Tipo Gara (Dropdown)
        const typeMatch = typeFilter === 'Tutti' || race.tipo === typeFilter;
        
        // C. Filtro Stato (Tabs) <--- QUESTO È IL FILTRO STATO!
        const statusMatch = statusFilter === 'Tutti' || stato === statusFilter;

        return searchMatch && typeMatch && statusMatch;
    });

    // 4. Ordinamento: Data più recente in cima (ordine decrescente)
    filteredData.sort((a, b) => {
        const dateA = parseDateObject(a.data);
        const dateB = parseDateObject(b.data);
        
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
        // ... (Il resto della logica di creazione righe e celle è corretto) ...
        
        const row = tableBody.insertRow(); 

        const raceDateObject = parseDateObject(race.data);
        const isPastRace = raceDateObject <= todayUTC; 
        
        // Calcolo finale dello STATO
        const stato = isPastRace 
            ? (race.tempoFinale ? 'Completata' : 'Ritirata') 
            : 'In Programma';
        
        // Aggiunge la classe di colore per il TIPO di gara (es: race-ultra)
        if (race.tipo) {
            const typeClass = race.tipo.toLowerCase().replace(/\s/g, ''); 
            if (typeClass.includes('maratona') || typeClass.includes('running')) {
                row.classList.add('race-running');
            } else if (typeClass.includes('ultra')) {
                row.classList.add('race-ultra');
            } else if (typeClass.includes('triathlon') || typeClass.includes('ironman')) {
                row.classList.add('race-triathlon');
            } else {
                 row.classList.add(`race-${typeClass}`);
            }
        }
        
        // Aggiunge la classe di colore per lo STATO della gara
        if (stato === 'Ritirata') {
            row.classList.add('status-ritirata');
        } else if (stato === 'Completata') {
            row.classList.add('status-completata');
        }
        
        // Aggiunge la classe per le gare passate (per opacità generale)
        if (isPastRace) {
            row.classList.add('past-race');
        }
        
        // 1. DATA (Formattata)
        row.insertCell().textContent = formatDate(race.data);
        
        // 2. EVENTO (Con Link a dettaglio.html, se implementato)
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

        // 8. RISULTATO (TempoFinale) - Mostra solo se gara Completata
        const resultCell = row.insertCell();
        resultCell.textContent = (stato === 'Completata' && race.tempoFinale) ? race.tempoFinale : '';

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
        
        // 11. STATO (la colonna che indica lo stato)
        row.insertCell().textContent = stato;
    });
}


/**
 * Funzione per gestire la ricerca testuale o il filtro per tipo.
 * (Ora chiama semplicemente renderTable per riapplicare tutti i filtri)
 */
function filterRaces() {
    renderTable(raceData);
}

// ... (Il resto del codice da qui in poi rimane invariato, inclusa l'inizializzazione) ...


/**
 * Carica i dati dal Google Sheet tramite Papa Parse.
 */
function loadDataFromSheet() {
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: (results) => {
            // Filtraggio base per eliminare righe vuote o senza data
            raceData = results.data.filter(row => row.Data && row.Evento);
            
            // Mappatura dei nomi delle colonne per coerenza (es. 'Data' -> 'data')
            raceData = raceData.map(row => ({
                ID: row['ID'] || Date.now() + Math.random(), // Aggiungi un ID se manca
                data: row['Data'],
                evento: row['Evento'],
                tipo: row['Ruolo Strategico'] ? row['Ruolo Strategico'].split(' ')[0].replace('OBIETTIVO', '').trim() : row['Ruolo Strategico'],
                distanza: row['Distanza'] || '',
                citta: row['Città'] || '',
                regione: row['Regione'] || '',
                obiettivo: row['Pace Target / Obiettivo'] || '',
                tempoFinale: row['Tempo Finale'] || '', // Nuovo campo da CSV
                pb: row['PB'] === 'Si',
                sitoWeb: row['Sito Web'] || '',
                // Aggiungi qui altre colonne se necessario
            }));
            
            populateFilterSelect(raceData);
            renderTable(raceData);
        },
        error: (error) => {
            console.error("Errore nel caricamento del CSV:", error);
            tableBody.innerHTML = '<tr><td colspan="11" style="color: red; text-align: center;">Errore nel caricamento del calendario. Controlla l\'URL del CSV.</td></tr>';
        }
    });
}


// =========================================================================
// INIZIALIZZAZIONE
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carica e disegna i dati
    loadDataFromSheet();
    
    // 2. Aggiunge listener per i filtri classici
    searchInput.addEventListener('keyup', filterRaces);
    filterSelect.addEventListener('change', filterRaces);
    
    // 3. Aggiunge listener per i NUOVI filtri di stato (i tab)
    tabButtons.forEach(button => {
        button.addEventListener('click', filterBy

