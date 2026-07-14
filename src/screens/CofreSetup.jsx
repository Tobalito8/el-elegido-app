import { useState } from "react";
import ChestSVG from "../components/ChestSVG";

export default function CofreSetup({
  myId,
  isHost,
  roomData,
  alive,
  getName,
  setChestTurnOrder,
  startMinijuego,
}) {
  const [mode, setMode] = useState(null); // 'manual' | 'minijuego'
  const [order, setOrder] = useState([]);
  const togglePlayer = (id) => {
    if (order.includes(id)) setOrder(order.filter((x) => x !== id));
    else setOrder([...order, id]);
  };
  if (!isHost) {
    return (
      <div className="fade-in flex flex-col items-center gap-6 pt-10 text-center">
        <ChestSVG open={true} hasMoney={false} revealed={false} size={90} />
        <h2 className="text-3xl font-black text-amber-300 title-font">
          RONDA DEL TESORO
        </h2>
        <p className="text-slate-400 italic">
          El anfitrión está configurando la ronda...
        </p>
        <div className="animate-pulse text-amber-400 text-4xl">⏳</div>
      </div>
    );
  }
  return (
    <div className="fade-in space-y-6 pt-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-3">
          <ChestSVG open={true} hasMoney={false} revealed={false} size={80} />
        </div>
        <h2 className="text-3xl font-black text-amber-300 title-font">
          RONDA DEL TESORO
        </h2>
        <p className="text-slate-400 italic text-sm">
          ¿Cómo se decide el orden en que eligen cofre?
        </p>
      </div>
      <div className="bg-amber-900/10 border border-amber-800/30 p-3 rounded-xl text-xs text-amber-200/70 italic text-center">
        🏴 El Elegido comienza con el dinero. Nadie sabe qué cofre es cuál. El
        primero en elegir puede intercambiar con alguien, y así sucesivamente.
      </div>
      {!mode && (
        <div className="grid gap-4 mt-4">
          <button
            onClick={() => setMode("minijuego")}
            className="p-6 rounded-2xl border-2 border-amber-700 bg-amber-900/20 text-center active:scale-95 transition-all hover:border-amber-500"
          >
            <div className="text-3xl mb-2">⚡</div>
            <p className="font-black text-amber-200 text-lg title-font">
              MINIJUEGO
            </p>
            <p className="text-slate-400 text-sm italic mt-1">
              Se elige al azar entre reacción, memoria o secuencia. El perdedor
              elige primero, el ganador elige último
            </p>
          </button>
          <button
            onClick={() => setMode("manual")}
            className="p-6 rounded-2xl border-2 border-slate-700 bg-slate-800/40 text-center active:scale-95 transition-all hover:border-slate-500"
          >
            <div className="text-3xl mb-2">📋</div>
            <p className="font-black text-slate-200 text-lg title-font">
              MANUAL
            </p>
            <p className="text-slate-400 text-sm italic mt-1">
              El anfitrión decide el orden de los turnos
            </p>
          </button>
        </div>
      )}
      {mode === "minijuego" && (
        <div className="space-y-4">
          <button
            onClick={() => setMode(null)}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            ← Volver
          </button>
          <div className="bg-amber-900/20 border border-amber-700/40 p-5 rounded-2xl text-center space-y-3">
            <div className="text-4xl">⚡</div>
            <p className="font-black text-amber-200 text-lg title-font">
              MINIJUEGO SORPRESA
            </p>
            <p className="text-slate-300 text-sm italic">
              Se elige al azar uno de estos: reacción, memoria de secuencia, o
              tocar números en orden. ¡No sabrás cuál hasta empezar!
            </p>
            <div className="text-xs text-slate-500 space-y-1 pt-2">
              <p>
                🥇 Mejor desempeño → elige{" "}
                <span className="text-amber-400 font-bold">ÚLTIMO</span>{" "}
                (ventaja)
              </p>
              <p>
                🥉 Peor desempeño → elige{" "}
                <span className="text-red-400 font-bold">PRIMERO</span>
              </p>
              <p className="pt-1">
                Si alguien no responde, el juego sigue solo después de unos
                segundos.
              </p>
            </div>
          </div>
          <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40">
            <button
              onClick={startMinijuego}
              className="w-full bg-amber-600 hover:bg-amber-500 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 title-font transition-colors"
            >
              ⚡ INICIAR MINIJUEGO
            </button>
          </div>
        </div>
      )}
      {mode === "manual" && (
        <div className="space-y-4">
          <button
            onClick={() => setMode(null)}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            ← Volver
          </button>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Toca los jugadores en orden de turno
          </p>
          <p className="text-slate-400 text-sm italic">
            El primero que toques será el primero en elegir.
          </p>
          <div className="flex gap-2 flex-wrap min-h-[44px] bg-slate-800/40 rounded-xl p-3 border border-slate-700">
            {order.length === 0 && (
              <span className="text-slate-600 text-sm italic">
                Selecciona jugadores...
              </span>
            )}
            {order.map((id, i) => (
              <div
                key={id}
                className="bg-amber-800/60 border border-amber-700/50 px-3 py-1 rounded-full text-xs font-bold text-amber-200 flex items-center gap-1"
              >
                <span className="text-amber-400">{i + 1}.</span> {getName(id)}
                <button
                  onClick={() => setOrder(order.filter((x) => x !== id))}
                  className="ml-1 text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            {alive.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                disabled={order.includes(p.id)}
                className={`p-4 rounded-xl border-2 font-bold transition-all text-left flex justify-between items-center ${order.includes(p.id) ? "border-amber-700/50 bg-amber-900/20 text-amber-500 opacity-60" : "border-slate-700 bg-slate-800/50 text-amber-100 hover:border-amber-700"}`}
              >
                <span>
                  {p.name}
                  {p.id === myId ? " (Tú)" : ""}
                </span>
                {order.includes(p.id) && (
                  <span className="text-amber-400 text-sm">
                    #{order.indexOf(p.id) + 1}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40">
            <button
              onClick={() => setChestTurnOrder(order)}
              disabled={order.length !== alive.length}
              className="w-full bg-amber-700 hover:bg-amber-600 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 disabled:opacity-40 title-font transition-colors"
            >
              INICIAR RONDA DE COFRES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
