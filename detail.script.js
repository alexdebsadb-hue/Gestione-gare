// Contenuto Completo e Definitivo per detail_script.js
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

// Protocollo Gara Maratona Personalizzato (estratto dalle tue preferenze)
const MARATHON_PROTOCOL = {
    caricoSeraPrima: 'Cena: 90 g Riso Basmati (o 350 g Patate), 220 g Carne Bianca Magra, max 200 g Verdure Cotte (poco fibrose), e 250 g Frutta.',
    colazioneSolida: 'Porridge completo (80 g Avena, 170 g Yogurt Greco 0%, 10 g Miele, 10 g Cacao) + 50 g Pan Bauletto con Marmellata (3 ore pre-start).',
    boosterLiquido: 'Borraccia con 50 g IRON EDGE Syform + 15 g Bicarbonato da sorseggiare lentamente (1 ora pre-start). NIENTE cibo solido.',
    caricoFinale: '1 Gel prima di entrare in griglia (15 min pre-start).',
    integrazioneGara: 'Carburante Fisso (4Endurance Gel 45g) a 0:40 (8 km, Gel 1), 1:20 (17 km, Gel 2), 2:00 (26 km, Gel 3 Caffeina), 2:40 (34 km, Gel 4).',
    idratazione: 'Bere acqua ad ogni ristoro (500-600 ml all\'ora) per facilitare l\'assorbimento dei gel concentrati.',
    reattivi: 'Sali: Capsule Aptonia (reattivamente o ogni 45-60 minuti se caldo/sudi molto). Crampi: Shot Zumub Anti-Crampi (ai primi segnali di spasmo).'
};

function formatDate(dateString) {
    if (!dateString) return '';
    return dateString.replace(/-/g, '/');
}

function loadRaceDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const raceId = urlParams.get('id');
    
    // Se non trova l'ID (es: pagina aperta senza link), scriviamo un errore in H1
    if (!raceId) {
        document.getElementById('detail-title').textContent = 'ID Gara non trovato.';
        return;
    }

    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // I nomi delle colonne nel risultato di Papa Parse sono le intestazioni del Foglio Google
            const race = results.data.find(row => row.ID === raceId);
            if (race) {
                renderDetails(race);
            } else {
                document.getElementById('detail-title').textContent = 'Dettagli della gara non trovati.';
            }
        },
        error: function(error) {
            document.getElementById('detail-title').textContent = 'ERRORE: Impossibile caricare i dati.';
        }
    });
}

function renderDetails(race) {
    
    // NOTA: Si usano i nomi delle colonne ESATTI dal Foglio Google (es. race.Data, race.TempoFinale)
    const today = new Date().toISOString().split('T')[0];
    const raceDateComparison = race.Data ? `${race.Data.split('-')[2]}-${race.Data.split('-')[1]}-${race.Data.split('-')[0]}` : '1900-01-01';
    const isPastRace = raceDateComparison < today;
    
    // Estrazione e logica dello Stato
    let statoFinale = isPastRace ? (race.TempoFinale ? 'Completata' : 'Ritirata') : 'In Programma';
    
    // Estrazione Pace e Tempo Totale per il display
    const paceMatch = race.Obiettivo ? race.Obiettivo.match(/⟹\s*([0-9:.\s]+\s*\/ km)/) : null;
    const targetPace = paceMatch ? paceMatch[1].trim() : 'N/D';
    const targetTime = race.Obiettivo ? race.Obiettivo.split('⟹')[0].trim() : 'N/D';
    
    // 1. POPOLAMENTO CAMPI FISSI
    document.getElementById('detail-title').textContent = race.Evento;
    document.getElementById('detail-date').textContent = `${formatDate(race.Data)}`;
    
    document.getElementById('detail-luogo').innerHTML = `<strong>Luogo:</strong> ${race.Citta}, ${race.Regione}`;
    document.getElementById('detail-tipo').innerHTML = `<strong>Tipo di Gara:</strong> ${race.Tipo} (${race.Distanza})`;
    
    document.getElementById('detail-stato').innerHTML = `<strong>Stato:</strong> ${statoFinale}`;
    
    let obiettivoRisultato = isPastRace ? (race.TempoFinale || 'Tempo non registrato') : targetTime;
    let obiettivoHTML = `<strong>${isPastRace ? 'Tempo Finale' : 'Obiettivo'}:</strong> ${obiettivoRisultato}`;
    
    if (!isPastRace) {
        obiettivoHTML += ` (Pace target: ${targetPace})`;
    }

    if (isPastRace && race.PB) { 
        obiettivoHTML += ' ⭐️ (Personal Best)';
    }
    document.getElementById('detail-obiettivo').innerHTML = obiettivoHTML;
    
    // Link Sito Web
    const webCell = document.getElementById('detail-sitoweb');
    if (race.SitoWeb) {
        webCell.innerHTML = `<strong>Sito Ufficiale:</strong> <a href="${race.SitoWeb}" target="_blank">Vai al Sito</a>`;
    } else {
        webCell.innerHTML = '';
    }
    
    // 2. PROTOCOLLO GARA (Solo se Maratona o Ultra)
    const protocolloContainer = document.getElementById('protocollo-container');
    const isMarathon = race.Distanza.toLowerCase().includes('maratona') || race.Distanza.includes('42.195');
    const isUltra = race.Tipo.toLowerCase().includes('ultra');

    if (isMarathon || isUltra) {
        protocolloContainer.innerHTML = `
            <div class="detail-box">
                <h2>📋 Protocollo Gara Personalizzato</h2>
                <p>Applicabile per ${race.Tipo} / ${race.Distanza}.</p>
                <p><strong>Obiettivo:</strong> Tempo ${targetTime} / Pace ${targetPace}.</p>
                
                <h4>La Sera Prima (Carico Glicogeno)</h4>
                <p>${MARATHON_PROTOCOL.caricoSeraPrima}</p>
                
                <h4>Il Giorno G: Colazione e Avvicinamento</h4>
                <ul>
                    <li><strong>3 ore pre-start (Colazione Solida):</strong> ${MARATHON_PROTOCOL.colazioneSolida}</li>
                    <li><strong>1 ora pre-start (Booster Liquido):</strong> ${MARATHON_PROTOCOL.boosterLiquido}</li>
                    <li><strong>15 min pre-start (Carico Finale):</strong> ${MARATHON_PROTOCOL.caricoFinale}</li>
                </ul>
                
                <h4>Integrazione e Idratazione in Gara</h4>
                <ul>
                    <li><strong>Carburante Fisso:</strong> ${MARATHON_PROTOCOL.integrazioneGara}</li>
                    <li><strong>Idratazione:</strong> ${MARATHON_PROTOCOL.idratazione}</li>
                    <li><strong>Reattivi (Sali/Crampi):</strong> ${MARATHON_PROTOCOL.reattivi}</li>
                </ul>
            </div>
        `;
    } else {
        protocolloContainer.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', loadRaceDetails);
