// Devi inserire qui lo stesso URL CSV che usi in script.js
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

function getRaceIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function formatDate(dateString) {
    if (!dateString || dateString.length < 10) return "Data non disponibile";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function loadRaceDetails(raceId) {
    if (!raceId) {
        document.getElementById('detail-title').textContent = 'Errore: ID Gara non specificato.';
        return;
    }

    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // Trova la gara il cui campo 'ID' corrisponde all'ID nell'URL
            // Usa 'ID' come nome della colonna nel foglio Google
            const race = results.data.find(row => String(row.ID) === String(raceId));

            if (race) {
                renderDetails(race);
                loadProtocolloGara();
            } else {
                document.getElementById('detail-title').textContent = 'Gara non trovata.';
            }
        },
        error: function(error) {
            document.getElementById('detail-title').textContent = 'Errore nel caricamento dei dati.';
            console.error(error);
        }
    });
}

function renderDetails(race) {
    document.getElementById('detail-title').textContent = race.Evento;
    document.getElementById('detail-date').textContent = formatDate(race.Data);
    document.getElementById('detail-ruolo').innerHTML = `**Ruolo Strategico:** ${race['Ruolo Strategico']}`;
    document.getElementById('detail-obiettivo').innerHTML = `**Obiettivo:** ${race['Pace Target / Obiettivo']}`;

    const linkElement = document.getElementById('detail-sito');
    
    // Assumiamo che il link al sito sia nella colonna 'Sito Web'
    if (race['Sito Web']) {
        linkElement.href = race['Sito Web'];
        linkElement.textContent = `Apri il sito ufficiale di ${race.Evento}`;
    } else {
        linkElement.textContent = 'Link al sito non disponibile';
        linkElement.href = '#';
    }
}

function loadProtocolloGara() {
    const protocolloContent = document.getElementById('protocollo-gara-content');
    
    // Estratto e formattato il tuo Protocollo Gara salvato
    const protocollo = `
        <p>Questo è il Protocollo Gara standard da seguire per la Maratona:</p>
        
        <h3>La sera prima (Carico Glicogeno)</h3>
        <ul>
            <li>Cena: <strong>90 g Riso Basmati</strong> (o 350 g Patate)</li>
            <li><strong>220 g Carne Bianca Magra</strong></li>
            <li>max 200 g Verdure Cotte (poco fibrose)</li>
            <li>250 g Frutta</li>
        </ul>

        <h3>Il giorno G (Colazione e Avvicinamento)</h3>
        <ul>
            <li><strong>3 ore pre-start (Colazione Solida):</strong> Porridge completo (80g Avena, 170g Yogurt Greco 0%, 10g Miele, 10g Cacao) + 50g Pan Bauletto con Marmellata.</li>
            <li><strong>1 ora pre-start (Booster Liquido):</strong> Borraccia con <strong>50 g IRON EDGE Syform + 15 g Bicarbonato</strong>. Da sorseggiare lentamente (effetto tampone).</li>
            <li><strong>15 min pre-start (Carico Finale):</strong> <strong>1 Gel</strong> prima di entrare in griglia.</li>
        </ul>

        <h3>Integrazione in Gara</h3>
        <ul>
            <li><strong>Carburante Fisso (4Endurance Gel 45g):</strong> 0:40 (8 km) Gel 1, 1:20 (17 km) Gel 2, 2:00 (26 km) Gel 3 (Caffeina), 2:40 (34 km) Gel 4.</li>
            <li><strong>Idratazione:</strong> Bere acqua ad ogni ristoro (500-600 ml all'ora).</li>
            <li><strong>Sali:</strong> Capsule Aptonia reattivamente o ogni 45-60 minuti.</li>
            <li><strong>Crampi:</strong> Shot Zumub Anti-Crampi immediatamente.</li>
        </ul>
    `;
    protocolloContent.innerHTML = protocollo;
}

// Avvio:
document.addEventListener('DOMContentLoaded', () => {
    const raceId = getRaceIdFromUrl();
    loadRaceDetails(raceId);
});