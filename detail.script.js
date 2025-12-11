// ... (codice iniziale, URL)

function renderDetails(race) {
    document.getElementById('detail-title').textContent = race.Evento;
    document.getElementById('detail-date').textContent = `${formatDate(race.Data)}`; 
    
    // NUOVI CAMPI LUOGO
    document.getElementById('detail-luogo').innerHTML = `**Luogo:** ${race.Città}, ${race.Regione}`;
    document.getElementById('detail-tipo').innerHTML = `**Tipo di Gara:** ${race.Tipo} (${race.Distanza})`;
    
    // Logica Stato/Obiettivo/Risultato
    const isPastRace = race.Data && race.Data < new Date().toISOString().split('T')[0];
    let statoFinale = isPastRace ? (race['Tempo Finale'] ? 'Completata' : 'Ritirata') : 'In Programma';
    let obiettivoRisultato = isPastRace ? (race['Tempo Finale'] || 'Tempo non registrato') : (race.Obiettivo || 'Obiettivo non definito');
    
    // Aggiungi marcatore PB se presente
    if (isPastRace && race.PB === 'X') { // Assumendo che 'X' sia il marcatore di PB nel foglio
        obiettivoRisultato += ' ⭐️ (Personal Best)';
    }

    document.getElementById('detail-stato').innerHTML = `**Stato:** ${statoFinale}`;
    document.getElementById('detail-obiettivo').innerHTML = `**${isPastRace ? 'Tempo Finale' : 'Obiettivo'}:** ${obiettivoRisultato}`;
    
    // ... (Logica SitoWeb e Protocollo Gara invariata)
}
// ... (il resto del codice rimane invariato)
