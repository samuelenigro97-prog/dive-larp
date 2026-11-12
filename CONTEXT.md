# CONTEXT.md — DIVE LARP Companion System

Glossario e modello di dominio condiviso per l'applicazione companion del Live Action Roleplay (LARP) Cyberpunk **DIVE**.

---

## 1. Ruoli & Archetipi Giocanti

- **Solo / Mercenario**: Specialista nel combattimento fisico ed esecuzione dei contratti operativi sul campo.
- **Netrunner / Hacker**: Specialista nell'intrusione cibernetica, furto di crediti, estrazione datashard e violazione terminali.
- **Media / Giornalista**: Reporter e influencer della rete. Unico archetipo autorizzato a gestire post ufficiali, apporre la spunta verificata, pinnare annunci o diffondere leak anonimi tramite l'impianto Ghost Protocol.
- **Corpo / Agente Aziendale**: Dirigenti e agenti di sicurezza delle megacorporazioni. Gestiscono capitali elevati, contratti e sistemi di difesa ICE avanzati.
- **Fixer / Broker**: Intermediario del mercato nero, fornitore di gig e trafficante di coordinate bancarie e codici identificativi segreti dei bersagli.
- **Techie / Ripperdoc**: Chirurgo cibernetico clandestino, addetto alla cura di ferite critiche, installazione cromo e stabilizzazione neurale.
- **Master / Admin**: Regia dell'evento e arbitri di scena con accesso alla schermata di supervisione omnicomprensiva.

---

## 2. Meccaniche di Gioco

- **Chiamata Vocale Combat ("OVERRIDE [COMANDO]!")**:
  - Utilizzata durante il combattimento dal vivo per immediatezza.
  - Regola di validità temporale: **5 secondi tassativi**.
  - Comandi standard:
    - `OVERRIDE FERMO!`: Blocco motorio degli arti e delle articolazioni cibernetiche (5s).
    - `OVERRIDE AL BUIO!`: Sovraccarico ottico/Kiroshi, il bersaglio chiude gli occhi o si volta (5s).
    - `OVERRIDE BUTTALA!`: Spasmo neurale dell'arto armato, rilascio immediato dell'arma di scena a terra.

- **Hacking Off-Fight (Silenzioso via Web App)**:
  - Operazione condotta nell'ombra senza sparatorie.
  - Richiede il puntamento del bersaglio tramite:
    1. Scansione del **QR Code Personale** del giocatore.
    2. Oppure digitazione del suo **Codice Identificativo Univoco a 5 caratteri** (es. `#V-7842`), ottenuto tramite spionaggio o acquistato dal PNG Fixer.
  - Permette di drenare EuroDollari (€$), estrarre file riservati o sabotare impianti.
  - **ICE (Firewall)**: Contromisura difensiva che blocca e neutralizza il primo tentativo di intrusione.

- **Codici QR di Scena (Color Coded)**:
  - 🟢 **Verde (Impianti & Cromo)**: Schede tecniche di impianti reperibili sul campo o presso il Ripperdoc.
  - 🔵 **Blu (Terminali Hackerabili)**: Punti di accesso corporativi da violare per ottenere ricompense in crediti e log di trama.
  - 🔴 **Rosso (ICE & Casseforti)**: Dispositivi ad alta sicurezza con contromisure e allarmi.
  - 🪪 **Personale (Sistema Operativo & IBAN)**: Codice QR univoco generato nell'app di ciascun giocatore per pagamenti rapidi o targeting.

- **Economia EuroDollari (€$) & Fama**:
  - Moneta scambiabile istantaneamente tra giocatori tramite scansione QR o digitazione Callsign.
  - **Fama (Street Cred)**: Grado di influenza (1-5) fisso per la serata.
  - **I Like del Social Media**: I voti ricevuti sui post aumentano la visibilità; i Master o le Corporation pagano compensi in €$ ai Media proporzionalmente all'impatto dei loro scoop per stimolare la circolazione della valuta.

- **Biomonitor, Traumi e Cyberpsicosi**:
  - **Integrità Fisica (HP)**: 0% - 100%. A 0% il giocatore è in flatline/svenuto.
  - **Traumi**: Danni fisici o neurali permanenti rimovibili solo presso la Sedia del Ripperdoc.
  - **Cyberpsicosi**: Livello di sovraccarico neurale (0% - 100%). Aumenta con l'accumulo di impianti scadenti, shock emotivi drammatici o l'assunzione del farmaco/droga illegale inalabile/iniettabile diffusa nel club/privé. Gestita e monitorata dalla Regia Master.

- **Architettura Locale (No-Internet Ready)**:
  - L'applicazione opera in modalità offline-first (salvataggio locale persistente) ed è progettata per essere servita da un PC Master su rete Wi-Fi locale isolata (router dedicato senza SIM), garantendo la continuità operativa in qualsiasi location priva di connettività cellulare.
