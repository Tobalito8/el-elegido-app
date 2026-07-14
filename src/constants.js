export const GS = {
  INICIO: "inicio",
  LOBBY: "lobby",
  JUGANDO: "jugando",
  VOTACION: "votacion",
  RESULTADOS: "resultados",
  COFRE_NOTIFY: "cofre_notify",
  // elegido ve su rol antes de cofres
  COFRE_SETUP: "cofre_setup",
  // host elige orden manual o minijuego
  COFRE_MINIJUEGO: "cofre_minijuego",
  // juego de reacción para el orden
  COFRE_TURNO: "cofre_turno",
  COFRE_FINAL: "cofre_final",
};

// si alguien no termina en este tiempo, se le pone penalización y se sigue
export const STALL_TIMEOUT_MS = 9000;

// Penalty time given to anyone who never finishes, so the game never gets stuck waiting forever.
export const PENALTY_RT_CLIENT = 999999;

// Mission secreta: rewards/penalties applied around vote-counting depending on
// whether the assigning ghost marks the Elegido's mission a success or failure.
export const REWARDS = [
  {
    id: "double_vote",
    emoji: "⚡",
    label: "Tu voto valdrá por 2 en la votación",
  },
  {
    id: "cancel_vote",
    emoji: "🛡️",
    label: "1 voto en tu contra será anulado",
  },
  {
    id: "reassign_chosen",
    emoji: "🎲",
    label: "El Elegido será reasignado al azar al terminar la ronda",
  },
  {
    id: "tiebreak",
    emoji: "⚖️",
    label: "En caso de empate, si tu voto apunta a alguien, ese será eliminado",
  },
  {
    id: "extra_elim",
    emoji: "💀",
    label: "Puedes eliminar a alguien más (si sobrevives a la votación)",
  },
];

export const PENALTIES = [
  {
    id: "two_votes_against",
    emoji: "🗡️",
    label: "Recibirás 2 votos extra en tu contra",
  },
  {
    id: "no_vote",
    emoji: "🚫",
    label: "Tu voto no contará en la votación",
  },
  {
    id: "swap_dead",
    emoji: "☠️",
    label: "Quedarás eliminado y un jugador muerto revivirá",
  },
  {
    id: "one_vote_reassign",
    emoji: "💢",
    label: "1 voto extra en tu contra Y el Elegido será reasignado",
  },
];
