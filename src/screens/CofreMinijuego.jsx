import { useState, useEffect } from "react";
import { STALL_TIMEOUT_MS, PENALTY_RT_CLIENT } from "../constants";
import ReaccionGame from "../components/minigames/ReaccionGame";
import SecuenciaGame from "../components/minigames/SecuenciaGame";
import MemoriaGame from "../components/minigames/MemoriaGame";

export default function CofreMinijuego({
  myId,
  isHost,
  roomData,
  alive,
  getName,
  triggerGo,
  recordTap,
  finishMinijuego,
  autoCompleteMissing,
}) {
  const [localCountdown, setLocalCountdown] = useState(3);
  const [hasTapped, setHasTapped] = useState(false);
  const [myReactionTime, setMyReactionTime] = useState(null);
  const mj = roomData.cofreMinijuego || {};
  const phase = mj.phase;
  const type = mj.type || "reaccion";
  const taps = mj.taps || {};

  // Countdown on host side, then GO at a random delay
  useEffect(() => {
    if (phase !== "countdown" || !isHost || !mj.startedAt) return;
    let count = 3;
    setLocalCountdown(3);
    const iv = setInterval(() => {
      count--;
      setLocalCountdown(count);
      if (count <= 0) {
        clearInterval(iv);
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => {
          triggerGo();
        }, delay);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, mj.startedAt, isHost]);

  // Non-host countdown sync (visual only)
  const [nonHostCount, setNonHostCount] = useState(3);
  useEffect(() => {
    if (phase !== "countdown" || isHost || !mj.startedAt) return;
    const elapsed = Date.now() - mj.startedAt;
    let startCount = Math.max(1, 3 - Math.floor(elapsed / 1000));
    setNonHostCount(startCount);
    let c = startCount;
    const iv = setInterval(() => {
      c--;
      setNonHostCount(c);
      if (c <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, mj.startedAt, isHost]);
  const allTapped = alive.every((p) => taps[p.id] !== undefined);

  // Watchdog: the host quietly fills in a penalty time for anyone stuck/disconnected
  // after STALL_TIMEOUT_MS, so the round can always move on.
  useEffect(() => {
    if (phase !== "go" || !isHost || allTapped || !mj.goTime) return;
    const remaining = STALL_TIMEOUT_MS - (Date.now() - mj.goTime);
    const t = setTimeout(
      () => {
        autoCompleteMissing();
      },
      Math.max(0, remaining),
    );
    return () => clearTimeout(t);
  }, [phase, isHost, allTapped, mj.goTime, taps]);
  const handleFinish = (rt) => {
    if (hasTapped || taps[myId] !== undefined) return;
    setHasTapped(true);
    setMyReactionTime(rt);
    recordTap(rt);
  };
  const displayCount = isHost ? localCountdown : nonHostCount;
  const results = alive
    .map((p) => ({
      id: p.id,
      name: getName(p.id),
      rt: taps[p.id] ?? null,
    }))
    .sort((a, b) => (a.rt ?? Infinity) - (b.rt ?? Infinity));
  const typeLabel = {
    reaccion: "⚡ REACCIÓN",
    secuencia: "🔢 SECUENCIA",
    memoria: "🧠 MEMORIA",
  }[type];
  return (
    <div className="fade-in flex flex-col items-center gap-6 pt-6 text-center">
      <h2 className="text-3xl font-black text-amber-300 title-font">
        {typeLabel}
      </h2>
      {phase === "countdown" && (
        <div className="space-y-6">
          <p className="text-slate-400 italic text-sm">
            {type === "reaccion" &&
              "Prepárate... ¡toca cuando aparezca la señal!"}
            {type === "secuencia" &&
              "Prepárate... ¡vas a tocar números en orden lo más rápido posible!"}
            {type === "memoria" &&
              "Prepárate... ¡vas a memorizar una secuencia de botones!"}
          </p>
          <div
            className="w-40 h-40 mx-auto rounded-full border-4 border-amber-700 bg-amber-900/20 flex items-center justify-center"
            style={{
              boxShadow: "0 0 30px rgba(217,119,6,.3)",
            }}
          >
            <span
              className="text-7xl font-black text-amber-300 title-font countdown-num"
              key={displayCount}
            >
              {displayCount > 0 ? displayCount : "..."}
            </span>
          </div>
          <p className="text-slate-500 text-sm italic animate-pulse">
            Espera la señal...
          </p>
        </div>
      )}
      {phase === "go" && !allTapped && !hasTapped && (
        <>
          {type === "reaccion" && (
            <ReaccionGame onFinish={handleFinish} />
          )}
          {type === "secuencia" && (
            <SecuenciaGame onFinish={handleFinish} />
          )}
          {type === "memoria" && (
            <MemoriaGame onFinish={handleFinish} />
          )}
        </>
      )}
      {phase === "go" && !allTapped && hasTapped && (
        <div className="bg-emerald-900/30 border border-emerald-700 p-6 rounded-2xl w-full">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-emerald-300 font-black text-xl">¡Listo!</p>
          <p className="text-slate-400 text-sm italic mt-1">
            Esperando a los demás...
          </p>
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            {alive.map((p) => (
              <div
                key={p.id}
                className={`px-3 py-1 rounded-full text-xs font-bold ${taps[p.id] !== undefined ? "bg-emerald-900/50 border border-emerald-700 text-emerald-300" : "bg-slate-800 border border-slate-700 text-slate-500 animate-pulse"}`}
              >
                {getName(p.id)} {taps[p.id] !== undefined ? "✓" : "..."}
              </div>
            ))}
          </div>
        </div>
      )}
      {allTapped && (
        <div className="w-full space-y-4">
          <p className="text-amber-300 font-black text-xl title-font">
            RESULTADOS
          </p>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div
                key={r.id}
                className={`result-row p-4 rounded-xl border-2 flex justify-between items-center ${i === 0 ? "border-amber-500 bg-amber-900/20" : i === results.length - 1 ? "border-red-500/50 bg-red-900/10" : "border-slate-700 bg-slate-800/40"}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </span>
                  <span
                    className={`font-bold text-lg ${r.id === myId ? "text-amber-300" : "text-slate-200"}`}
                  >
                    {r.name}
                    {r.id === myId ? " (Tú)" : ""}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-200">
                    {r.rt >= PENALTY_RT_CLIENT ? "sin respuesta" : `${r.rt}ms`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {i === 0
                      ? "→ elige último"
                      : i === results.length - 1
                        ? "→ elige primero"
                        : "→ elige segundo"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {isHost && (
            <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40">
              <button
                onClick={finishMinijuego}
                className="w-full bg-amber-700 hover:bg-amber-600 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 title-font transition-colors"
              >
                CONTINUAR → ELEGIR COFRES
              </button>
            </div>
          )}
          {!isHost && (
            <p className="text-slate-500 animate-pulse font-bold pb-10">
              Esperando al anfitrión...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
