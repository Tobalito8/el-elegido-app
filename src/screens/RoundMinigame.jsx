import { useState, useEffect, useRef } from "react";
import { STALL_TIMEOUT_MS, PENALTY_RT_CLIENT } from "../constants";
import ReaccionGame from "../components/minigames/ReaccionGame";
import SecuenciaGame from "../components/minigames/SecuenciaGame";
import MemoriaGame from "../components/minigames/MemoriaGame";

export default function RoundMinigame({
  myId,
  isHost,
  roomData,
  alive,
  getName,
  triggerRoundGo,
  recordRoundTap,
  finishRoundMinigame,
  autoCompleteRoundMissing,
}) {
  const [localCountdown, setLocalCountdown] = useState(3);
  const [hasTapped, setHasTapped] = useState(false);
  const mj = roomData.roundMinigame || {};
  const phase = mj.phase;
  const type = mj.type || "reaccion";
  const taps = mj.taps || {};
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
          triggerRoundGo();
        }, delay);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, mj.startedAt, isHost]);
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

  // Watchdog so this round game can never get the screen stuck.
  useEffect(() => {
    if (phase !== "go" || !isHost || allTapped || !mj.goTime) return;
    const remaining = STALL_TIMEOUT_MS - (Date.now() - mj.goTime);
    const t = setTimeout(
      () => {
        autoCompleteRoundMissing();
      },
      Math.max(0, remaining),
    );
    return () => clearTimeout(t);
  }, [phase, isHost, allTapped, mj.goTime, taps]);

  // As soon as results are in, the host finalizes immunity automatically (once).
  const finishedRef = useRef(false);
  useEffect(() => {
    if (allTapped && isHost && !finishedRef.current) {
      finishedRef.current = true;
      finishRoundMinigame();
    }
    if (!allTapped) finishedRef.current = false;
  }, [allTapped, isHost]);
  const handleFinish = (rt) => {
    if (hasTapped || taps[myId] !== undefined) return;
    setHasTapped(true);
    recordRoundTap(rt);
  };
  const displayCount = isHost ? localCountdown : nonHostCount;
  const typeLabel = {
    reaccion: "⚡ REACCIÓN",
    secuencia: "🔢 SECUENCIA",
    memoria: "🧠 MEMORIA",
  }[type];
  const results = allTapped
    ? alive
        .map((p) => ({
          id: p.id,
          name: getName(p.id),
          rt: taps[p.id],
        }))
        .sort((a, b) => a.rt - b.rt)
    : [];
  const winnerId =
    results.length && results[0].rt < PENALTY_RT_CLIENT ? results[0].id : null;
  return (
    <div className="fade-in flex flex-col items-center gap-4 pt-2 pb-6 text-center bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
      <h3 className="text-xl font-black text-amber-300 title-font">
        {typeLabel}{" "}
        <span className="text-xs text-slate-500 font-normal">
          (quien gane queda inmune)
        </span>
      </h3>
      {phase === "countdown" && (
        <div className="space-y-4">
          <div className="w-28 h-28 mx-auto rounded-full border-4 border-amber-700 bg-amber-900/20 flex items-center justify-center">
            <span
              className="text-5xl font-black text-amber-300 title-font countdown-num"
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
      {phase === "go" && !hasTapped && taps[myId] === undefined && (
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
      {phase === "go" &&
        !allTapped &&
        (hasTapped || taps[myId] !== undefined) && (
          <div className="bg-emerald-900/30 border border-emerald-700 p-4 rounded-2xl w-full">
            <p className="text-emerald-300 font-black">
              ✅ ¡Listo! Esperando a los demás...
            </p>
            <div className="flex justify-center gap-2 mt-3 flex-wrap">
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
        <div className="w-full space-y-2">
          {results.map((r, i) => (
            <div
              key={r.id}
              className={`p-3 rounded-xl border flex justify-between items-center ${r.id === winnerId ? "border-amber-500 bg-amber-900/20" : "border-slate-700 bg-slate-800/40"}`}
            >
              <span
                className={`font-bold ${r.id === myId ? "text-amber-300" : "text-slate-300"}`}
              >
                {r.id === winnerId ? "👑 " : ""}
                {r.name}
                {r.id === myId ? " (Tú)" : ""}
              </span>
              <span className="text-xs text-slate-500">
                {r.rt >= PENALTY_RT_CLIENT ? "sin respuesta" : `${r.rt}ms`}
              </span>
            </div>
          ))}
          {!winnerId && (
            <p className="text-slate-500 text-sm italic">
              Nadie completó el reto a tiempo — nadie queda inmune esta ronda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
