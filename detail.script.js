// =========================================================================
// CONFIGURAZIONE
// =========================================================================
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv';


// =========================================================================
// UTILITY PER DATE E TEMPI
// =========================================================================

// Helper: Normalizza la data 
function parseDateObject(dateString) {
    if (!dateString) return new Date(0);
    let cleanedString = dateString.trim().replace(/^[A-Za-z]+\s+/, '').trim();
    const parts = cleanedString.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        cleanedString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    try {
        const date = new Date(cleanedString);
        if (isNaN(date.getTime())) return new Date(0);
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    } catch (e) {
        return new Date(0);
    }
}
function formatDate(dateString) {
    const date = parseDateObject(dateString);
    if (date.getTime() === new Date(0).getTime()) return '';
    return date.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Helper: Converte il tempo in secondi (H:M:S) per un facile confronto
function timeToSeconds(timeString) {
    if (!timeString) return Infinity;
    const parts = timeString.split(':').map(p => parseFloat(p.trim()));
    if (parts.length === 3) { // H:M:S
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) { // M:S
        return parts[0] * 60 + parts[1];
    }
    return Infinity;
}

// Helper: Converte i secondi nel formato H:M:S o M:S
function secondsToTime(totalSeconds) {
    if (totalSeconds === Infinity || totalSeconds === 0) return 'N/D';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.round(totalSeconds % 60);
    const pad = (num) => String(num).padStart(2, '0');
    if (h > 0) {
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    } else {
        return `${pad(m)}:${pad(s)}`;
    }
}


// =========================================================================
// LOGICA DI ANALISI E RENDERING
// =========================================================================

/**
 * Calcola e visualizza le statistiche chiave per l'evento storico (PB, Media).
 * @param {Array} eventHistory - Array di tutte le gare relative a quell'evento.
 */
function displayStatistics(eventHistory) {
    const statsSummary = document.getElementById('stats-summary');
    const completedRaces = eventHistory.filter(r => r.tempoFinale && r.tempoFinale.trim() !== '');
    
    const validTimesInSeconds = completedRaces
        .map(r => timeToSeconds(r.tempoFinale))
        .filter(t => t !== Infinity);

    if (validTimesInSeconds.length === 0) {
        statsSummary.innerHTML = '<p>Nessun tempo completato registrato per l\'analisi storica di questo evento.</p>';
        return;
    }

    // Calcolo Statistiche
    const bestTimeSeconds = Math.min(...validTimesInSeconds);
    const totalSeconds = validTimesInSeconds.reduce((a, b) => a + b, 0);
    const averageTimeSeconds = totalSeconds / validTimesInSeconds.length;
    const pbCount = eventHistory.filter(r => r.pb).length;

    // Visualizzazione nella dashboard (sezione 📊 Analisi Evento)
    statsSummary.innerHTML = `
        <div class="stat-item">
            <p class="stat-label">Tempo Migliore Storico</p>
            <p class="stat-value">${secondsToTime(bestTimeSeconds)}</p>
        </div>
        <div class="stat-item">
            <p class="stat-label">Tempo Medio Gare</p>
            <p class="stat-value">${secondsToTime(averageTimeSeconds)}</p>
        </div>
        <div class="stat-item">
            <p class="stat-label">Totale Gare Completate</p>
            <p class="stat-value">${completedRaces.length}</p>
        </div>
        <div class="stat-item">
            <p class="stat-label">Record Personali (PB)</p>
            <p class="stat-value">${pbCount} ⭐️</p>
        </div>
    `;
}

/**
 * Popola la tabella con la storia delle gare per questo evento, ordinate per risultato crescente.
 * Colonne: Data, Evento, Città, Risultato/Obiettivo.
 * @param {Array} eventHistory - Array di tutte le gare relative a questo evento.
 */
function renderHistoryTable(eventHistory) {
    const historyTableBody = document.getElementById('historyTableBody');
    historyTableBody.innerHTML = '';
    
    // 1. ASSEGNAZIONE E ORDINAMENTO
    eventHistory.forEach(race => {
        let timeString = null;
        if (race.stato === 'Completata' && race.tempoFinale) {
            timeString = race.tempoFinale;
        } else if (race.stato === 'In Programma' && race.obiettivo) {
            // Estrae il tempo totale dall'Obiettivo (es. "3:00:00 ⟹ 4:15 / km")
            timeString = race.obiettivo.split('⟹')[0].trim();
        }
        
        // Calcola il valore in secondi per l'ordinamento
        race.sortValueSeconds = timeToSeconds(timeString);
    });

    // Ordina: Crescente (tempo più veloce = più basso)
    eventHistory.sort((a, b) => {
        // Mettiamo i tempi Infinity (ritiri/non completati) in fondo
        if (a.sortValueSeconds === Infinity) return 1;
        if (b.sortValueSeconds === Infinity) return -1;
        return a.sortValueSeconds - b.sortValueSeconds;
    });
    
    
    if (eventHistory.length === 0) {
        historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nessuna gara trovata per questo evento.</td></tr>';
        return;
    }
    
    // 2. RENDERING DELLE COLONNE RICHIESTE
    eventHistory.forEach(race => {
        const row = historyTableBody.insertRow();
        
        // Opzionale: aggiunge classe per stile/colore basato sullo stato
        if (race.stato === 'Ritirata') row.classList.add('status-ritirata');
        if (race.stato === 'Completata') row.classList.add('status-completata');

        // Colonna 1: Data
        row.insertCell().textContent = formatDate(race.data);
        
        // Colonna 2: Evento
        row.insertCell().textContent = race.evento;
        
        // Colonna 3: Città
        row.insertCell().textContent = race.citta || '-';
        
        // Colonna 4: Risultato / Obiettivo
        let resultText;
        if (race.stato === 'Completata') {
            resultText = race.tempoFinale;
            if (race.pb) resultText += ' ⭐️'; // Aggiunge l'indicatore PB
        } else if (race.stato === 'Ritirata') {
            resultText = 'DNF/DNS';
        } else {
            resultText = race.obiettivo || '-';
        }
        row.insertCell().textContent = resultText;
    });
}


/**
 * Funzione principale: carica i dati, identifica la gara, filtra la cronologia e renderizza tutto.
 */
function loadRaceDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const raceId = urlParams.get('id');
    
    // DEBUG 1: Controlla cosa cerchiamo dalla URL
    console.log("DEBUG: ID Gara cercato (dalla URL):", raceId); 

    if (!raceId) {
        document.getElementById('detail-title').textContent = 'ID Gara non trovato.';
        return;
    }

    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: function(results) {
            
            const rawData = results.data.slice(1);
            
            const allRaceData = rawData
                .filter(row => row[1] && row[2]) 
                .map(row => {
                    
                    // Aggiungiamo .trim() alle parti usate per l'ID, essenziale per il match!
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

            // DEBUG 2: Controlla il primo ID generato (per un confronto rapido)
            if (allRaceData.length > 0) {
                 console.log("DEBUG: Primo ID generato dal CSV:", allRaceData[0].ID);
            }
            
            const currentRace = allRaceData.find(race => race.ID === raceId);
            
            if (!currentRace) {
                // DEBUG 3: Errore se non trova corrispondenza
                console.error("ERRORE DI MATCH: La gara con ID " + raceId + " non è stata trovata.");
                document.getElementById('detail-title').textContent = 'Dettagli della gara non trovati.';
                return;
            }
            
            // DEBUG 4: Successo
            console.log("DEBUG: Trovata la gara:", currentRace.evento);

            // 1. Renderizza i dettagli della singola gara
            renderSingleRaceDetails(currentRace);
            
            // 2. Filtra lo storico dell'evento (stesso nome evento)
            const eventHistory = allRaceData.filter(race => 
                race.evento === currentRace.evento
            );

            // 3. Renderizza statistiche e tabella storica
            displayStatistics(eventHistory);
            renderHistoryTable(eventHistory);

        },
        error: function(error) {
            document.getElementById('detail-title').textContent = 'ERRORE: Impossibile caricare i dati.';
        }
    });
}
function renderSingleRaceDetails(race) {
    // Rimuoviamo la logica del protocollo Maratona da qui
    
    const isPastRace = race.stato === 'Completata' || race.stato === 'Ritirata';
    
    let obiettivoRisultato = race.stato === 'Completata' 
        ? race.tempoFinale 
        : (race.stato === 'Ritirata' ? 'Ritirata' : race.obiettivo);

    // Estrazione Pace e Tempo Totale per il display
    const targetPace = race.obiettivo ? (race.obiettivo.match(/⟹\s*([0-9:.\s]+\s*\/ km)/) || [null, 'N/D'])[1].trim() : 'N/D';
    
    // 1. POPOLAMENTO CAMPI FISSI
    document.getElementById('detail-title').textContent = race.evento;
    document.getElementById('detail-date').textContent = `Data: ${formatDate(race.data)} | Distanza: ${race.distanza}`;
    
    document.getElementById('detail-luogo').innerHTML = `<strong>Luogo:</strong> ${race.citta}, ${race.regione}`;
    document.getElementById('detail-tipo').innerHTML = `<strong>Tipo di Gara:</strong> ${race.tipo ? race.tipo.charAt(0).toUpperCase() + race.tipo.slice(1) : 'N/D'}`;
    
    document.getElementById('detail-stato').innerHTML = `<strong>Stato:</strong> ${race.stato}`;
    
    let obiettivoHTML = `<strong>${isPastRace && race.stato === 'Completata' ? 'Tempo Finale' : (isPastRace ? 'Esito' : 'Obiettivo')}:</strong> ${obiettivoRisultato}`;
    
    if (!isPastRace) {
        obiettivoHTML += ` (Pace target: ${targetPace})`;
    }
    
    if (race.pb) { 
        obiettivoHTML += ' ⭐️ (Personal Best)';
    }
    document.getElementById('detail-obiettivo').innerHTML = obiettivoHTML;
    
    // Link Sito Web
    const webCell = document.getElementById('detail-sitoweb');
    if (race.sitoWeb) {
        webCell.innerHTML = `<strong>Sito Ufficiale:</strong> <a href="${race.sitoWeb}" target="_blank">Vai al Sito</a>`;
    } else {
        webCell.innerHTML = '';
    }

    // Pulisci il vecchio contenitore del protocollo Maratona, se esiste
    const protocolloContainer = document.getElementById('protocollo-container');
    if (protocolloContainer) {
        protocolloContainer.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', loadRaceDetails);



