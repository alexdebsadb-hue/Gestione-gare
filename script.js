// Contenuto Completo e Corretto per detail_script.js
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

// Protocollo Gara Maratona salvato in memoria
const MARATHON_PROTOCOL = {
    caricoSeraPrima: 'Cena: 90 g Riso Basmati (o 350 g Patate), 220 g Carne Bianca Magra, max 200 g Verdure Cotte (poco fibrose), e 250 g Frutta.', //
    colazioneSolida: 'Porridge completo (80 g Avena, 170 g Yogurt Greco 0%, 10 g Miele, 10 g Cacao) + 50 g Pan Bauletto con Marmellata (3 ore pre-start).', //
    boosterLiquido: 'Borraccia con 50 g IRON EDGE Syform + 15 g Bicarbonato da sorseggiare lentamente (1 ora pre-start). NIENTE cibo solido.', //
    caricoFinale: '1 Gel prima di entrare in griglia (15 min pre-start).', //
    integrazioneGara: 'Carburante Fisso (4Endurance Gel 45g) a 0:40 (8 km, Gel 1), 1:20 (17 km, Gel 2), 2:00 (26 km, Gel 3 Caffeina), 2:40 (34 km, Gel 4).', //
    idratazione: 'Bere acqua ad ogni ristoro (500-600 ml all\'ora) per facilitare l\'assorbimento dei gel concentrati.', //
    reattivi: 'Sali: Capsule Aptonia (reattivamente o ogni 45-60 minuti se caldo/sudi molto). Crampi: Shot Zumub Anti-Crampi (ai primi segnali di spasmo).' //
};

function formatDate(dateString) {
    if (!dateString) return '';
    return dateString.replace(/-/g, '/');
}

function loadRaceDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const raceId = urlParams.get('id');
    if (!raceId) {
        document.getElementById('raceDetails').innerHTML = '<p>ID Gara non trovato.</p>';
        return;
    }

    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const race = results.data.find(row => row.ID === raceId);
            if (race) {
                renderDetails(race);
            } else {
                document.getElementById('raceDetails').innerHTML = '<p>Dettagli della gara non trovati.</p>';
            }
        },
        error: function(error) {
            document.getElementById('raceDetails').innerHTML = '<p style="color:red;">ERRORE: Impossibile caricare i dati.</p>';
        }
    });
}

function renderDetails(race) {
    const detailsDiv = document.getElementById('raceDetails');
    // Verifica se Distanza contiene 'Maratona' o '42.195' per mostrare il protocollo
    const isMarathon = race.Distanza.toLowerCase().includes('maratona') || race.Distanza.includes('42.195');
    
    // Estrae il ritmo target se presente, altrimenti 'Non definito'
    const paceMatch = race.Obiettivo ? race.Obiettivo.match(/⟹\s*([0-9:.\s]+\s*\/ km)/) : null;
    const targetPace = paceMatch ? paceMatch[1].trim() : 'N/D';

    // Se non trovo un tempo obiettivo specifico, uso il tempo totale
    const targetTime = race.Obiettivo ? race.Obiettivo.split('⟹')[0].trim() : 'N/D';


    detailsDiv.innerHTML = `
        <h2>${race.Evento} - ${formatDate(race.Data)}</h2>
        <p><strong>Distanza:</strong> ${race.Tipo} - ${race.Distanza}</p>
        <p><strong>Luogo:</strong> ${race.Citta} (${race.Regione})</p>
        ${race.Obiettivo ? `<p><strong>Obiettivo Tempo:</strong> ${targetTime} (Pace: ${targetPace})</p>` : ''}
        ${race.TempoFinale ? `<p><strong>Tempo Finale:</strong> ${race.TempoFinale}</p>` : ''}
        ${race.SitoWeb ? `<p><strong>Sito Ufficiale:</strong> <a href="${race.SitoWeb}" target="_blank">Vai al Sito</a></p>` : ''}
        
        <hr>
    `;

    // Protocollo Gara (solo se Maratona)
    if (isMarathon) {
        detailsDiv.innerHTML += `
            <h3>Protocollo Gara Maratona Personalizzato</h3>
            <p>Obiettivo gara: ${targetTime} a ${targetPace}.</p>
            
            <h4>La Sera Prima (Carico Glicogeno)</h4>
            <p>${MARATHON_PROTOCOL.caricoSeraPrima}</p>
            
            <h4>Il Giorno G: Colazione e Avvicinamento</h4>
            <ul>
                <li><strong>3 ore pre-start (Colazione Solida):</strong> ${MARATHON_PROTOCOL.colazioneSolida}</li>
                <li><strong>1 ora pre-start (Booster Liquido):</strong> ${MARATHON_PROTOCOL.boosterLiquido}</li>
                <li><strong>15 min pre-start (Carico Finale):</strong> ${MARATHON_PROTOCOL.caricoFinale}</li>
            </ul>
            
            <h4>Integrazione e Idratazione in Gara</h4>
            <p><strong>Carburante Fisso:</strong> ${MARATHON_PROTOCOL.integrazioneGara}</p>
            <p><strong>Idratazione:</strong> ${MARATHON_PROTOCOL.idratazione}</p>
            <p><strong>Reattivi (Sali/Crampi):</strong> ${MARATHON_PROTOCOL.reattivi}</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadRaceDetails);
