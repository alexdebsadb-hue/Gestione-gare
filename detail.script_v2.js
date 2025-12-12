const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE9iZeaiotFKvkb3Vc3dvq9BzmwuFcS414j4f3Ijt4laUQB5qmIjnqzxuk9waD4hv_OgvkMtj7I55b/pub?gid=1426636998&single=true&output=csv'; 

function getRaceIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function loadDetails() {
    const raceId = getRaceIdFromUrl();
    if (!raceId) {
        document.getElementById('detail-title').textContent = "ID Gara non trovato.";
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
                document.getElementById('detail-title').textContent = "Gara non trovata.";
            }
        },
        error: function(error) {
            console.error("Errore nel caricamento del foglio di calcolo:", error);
            document.getElementById('detail-title').textContent = "Errore nel caricamento dei dati.";
        }
    });
}

function formatDate(dateString) {
    if (!dateString || dateString.length < 10) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function renderDetails(race) {
    document.getElementById('detail-title').textContent = race.Evento;
    document.getElementById('detail-date').textContent = `${formatDate(race.Data)}`; 
    
    // CAMPI LUOGO (Aggiornato con Citta senza accento e TempoFinale tutto attaccato)
    document.getElementById('detail-luogo').innerHTML = `**Luogo:** ${race.Citta}, ${race.Regione}`;
    document.getElementById('detail-tipo').innerHTML = `**Tipo di Gara:** ${race.Tipo} (${race.Distanza})`;
    
    // Logica Stato/Obiettivo/Risultato
    const today = new Date().toISOString().split('T')[0];
    const isPastRace = race.Data && race.Data < today;
    let statoFinale = isPastRace ? (race.TempoFinale ? 'Completata' : 'Ritirata') : 'In Programma';
    let obiettivoRisultato = isPastRace ? (race.TempoFinale || 'Tempo non registrato') : (race.Obiettivo || 'Obiettivo non definito');
    
    // Aggiungi marcatore PB
    if (isPastRace && race.PB === 'X') { 
        obiettivoRisultato += ' ⭐️ (Personal Best)';
    }

    document.getElementById('detail-stato').innerHTML = `**Stato:** ${statoFinale}`;
    document.getElementById('detail-obiettivo').innerHTML = `**${isPastRace ? 'Tempo Finale' : 'Obiettivo'}:** ${obiettivoRisultato}`;
    
    // Logica Protocollo Gara
    const protocolloContainer = document.getElementById('detail-protocollo');
    protocolloContainer.innerHTML = ''; // Pulisce il contenuto precedente

    if (race.SitoWeb && race.SitoWeb.startsWith('http')) {
        protocolloContainer.innerHTML += `
            <p><strong>Sito Web Ufficiale:</strong> <a href="${race.SitoWeb}" target="_blank">${race.SitoWeb}</a></p>
        `;
    }

    // Carica il Protocollo Gara MARATONA (dal tuo ricordo) solo se l'evento è una maratona
    if (race.Tipo === 'Maratona' && !isPastRace && race.Obiettivo === '3:16:00 ⟹ 4:39 / km' ) {
        protocolloContainer.innerHTML += '<h3>📋 Protocollo Gara Maratona (Protocollo Gara)</h3>';
        protocolloContainer.innerHTML += `
            <p><strong>⚠ Dati Ricordati:</strong> Maratona di Reggio Emilia, 14 Dic 2025, Obiettivo 3:16:00 ⟹ 4:39 / km.</p>
            <h4>La sera prima (Carico Glicogeno)</h4>
            <ul>
                <li>Cena: 90 g Riso Basmati (o 350 g Patate), 220 g Carne Bianca Magra, max 200 g Verdure Cotte (poco fibrose), e 250 g Frutta.</li>
            </ul>
            <h4>Giorno G (Colazione e Avvicinamento)</h4>
            <ul>
                <li>**3 ore pre-start (Colazione Solida):** Porridge completo (80 g Avena, 170 g Yogurt Greco 0%, 10 g Miele, 10 g Cacao) + 50 g Pan Bauletto con Marmellata.</li>
                <li>**1 ora pre-start (Booster Liquido):** Borraccia con 50 g IRON EDGE Syform + 15 g Bicarbonato (da sorseggiare lentamente per tutto il tempo, niente cibo solido).</li>
                <li>**15 min pre-start (Carico Finale):** 1 Gel prima di entrare in griglia.</li>
            </ul>
            <h4>Integrazione in Gara</h4>
            <ul>
                <li>**Carburante Fisso (4Endurance Gel 45g):** 0:40 (8 km) Gel 1, 1:20 (17 km) Gel 2, 2:00 (26 km) Gel 3 (Caffeina), 2:40 (34 km) Gel 4.</li>
                <li>**Idratazione:** Bere acqua ad ogni ristoro (500-600 ml all'ora) per facilitare l'assorbimento dei gel concentrati.</li>
                <li>**Sali:** Capsule Aptonia (da assumere reattivamente o ogni 45-60 minuti se fa caldo o sudi molto).</li>
                <li>**Crampi:** Shot Zumub Anti-Crampi (da usare immediatamente ai primi segnali di spasmo muscolare).</li>
            </ul>
        `;
    } else if (race.Tipo === 'Ultra') {
        protocolloContainer.innerHTML += '<h3>⚠ Protocollo Ultra in Preparazione...</h3>';
    }
}

document.addEventListener('DOMContentLoaded', loadDetails);
