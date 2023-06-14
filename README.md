# Padelhub

## Informazioni per l'utilizzo della piattaforma.

### Per il login utilizzare:
- Per l’utente circolo utilizzare: - ipsn@gmail.com password: circolo123
- Per l’utente giocatore utilizzare: giovanna@giova.na password: 123456


Questi utenti sono utilizzabili per fruire della piattaforma. Si consiglia comunque di utilizzare le funzioni di registrazione (con email funzionanti per la conferma e onboarding) per fruire della piattaforma in maniera completa.

### Per il pagamento delle prenotazioni tramite la piattaforma Stripe
Il sistema di pagamento estreno Stripe è impostato in modalità di test (https://stripe.com/docs/test-mode) per poter simulare sessioni di pagamento senza inserire dati di fatturazione reali e testare la piattaforma e l'iterazioene dei pagamenti con essa.

In fase di pagamento inserire questi dati di pagamento: (per altre informazioni o metodi di pagamento di test consultare https://stripe.com/docs/testing?locale=it-IT)
- numero di carta: 4242424242424242
- cvc: 3 cifre qualsiasi
- data di scadenza: qualsiasi data futura
- Gli altri dati richiesti nel form non sono validati da Stripe.

Sulla portale di Stripe è impostato i un link di backend di padelhub (https://padelhub-back.onrender.com/api/v1/pagamenti/webhook) che è preposto a ricevere gli eventi da Stripe per gestire gli avvenuti pagamenti e collegarli ai link generati.
![https://ibb.co/dG3K2qG](https://ibb.co/dG3K2qG)
