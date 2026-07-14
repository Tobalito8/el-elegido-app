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
