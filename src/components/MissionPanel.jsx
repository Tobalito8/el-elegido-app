import { useState } from "react";

export default function MissionPanel({
  roomData,
  myId,
  amIChosen,
  onSubmitMission,
  onValidateMission,
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const mission = roomData?.mission;
  if (!mission) return null;

  const amIAssigner = mission.assignerId === myId;
  const st = mission.status;
  const statusDot =
    st === "success"
      ? "bg-emerald-500"
      : st === "failure"
        ? "bg-red-500"
        : st === "active"
          ? "bg-amber-400 animate-pulse"
          : "bg-slate-600";
  const statusLabel =
    st === "success"
      ? "Completada ✅"
      : st === "failure"
        ? "Fallida ❌"
        : st === "active"
          ? "En curso ⚡"
          : "Esperando misión...";

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-amber-800/40 mission-panel mission-tab-glow">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📜</span>
          <div className="text-left">
            <p className="font-black text-amber-200 text-sm title-font tracking-wide">
              MISIÓN SECRETA
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
              <p className="text-xs text-slate-400">{statusLabel}</p>
            </div>
          </div>
        </div>
        <span className="text-slate-500 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-amber-900/40 p-4 space-y-4">
          {amIAssigner && st === "waiting_text" && (
            <div className="space-y-3 fade-in">
              <div className="bg-amber-900/20 border border-amber-700/30 p-3 rounded-xl">
                <p className="text-amber-300 font-black text-sm">
                  ⚡ ¡Tú asignas la misión!
                </p>
                <p className="text-slate-400 text-xs italic mt-1">
                  Escribe una misión para el Elegido. Tú decides si la
                  cumplió o no.
                </p>
              </div>
              <textarea
                placeholder="Ej: Haz reír a alguien sin que lo noten, menciona la palabra 'pato' 3 veces..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500 resize-none"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                onClick={() => onSubmitMission(text)}
                disabled={!text.trim()}
                className="w-full bg-amber-700 hover:bg-amber-600 p-3 rounded-xl font-black text-sm active:scale-95 disabled:opacity-50 transition-colors title-font"
              >
                ASIGNAR MISIÓN
              </button>
            </div>
          )}

          {amIAssigner && st === "active" && (
            <div className="space-y-3 fade-in">
              <div className="bg-slate-800/60 p-3 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                  Misión asignada
                </p>
                <p className="text-amber-100 text-sm italic">
                  "{mission.text}"
                </p>
              </div>
              <p className="text-slate-400 text-xs italic text-center">
                ¿El Elegido cumplió la misión?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onValidateMission("success")}
                  className="bg-emerald-900/50 border-2 border-emerald-600 p-3 rounded-xl font-black text-emerald-300 text-sm active:scale-95 hover:bg-emerald-900/70 transition-colors"
                >
                  ✅ LOGRADA
                </button>
                <button
                  onClick={() => onValidateMission("failure")}
                  className="bg-red-900/40 border-2 border-red-700/60 p-3 rounded-xl font-black text-red-300 text-sm active:scale-95 hover:bg-red-900/60 transition-colors"
                >
                  ❌ FALLIDA
                </button>
              </div>
            </div>
          )}

          {amIAssigner && (st === "success" || st === "failure") && (
            <div
              className={`p-4 rounded-xl text-center border-2 fade-in ${st === "success" ? "bg-emerald-900/20 border-emerald-600/50" : "bg-red-900/20 border-red-700/50"}`}
            >
              <p
                className={`font-black text-lg ${st === "success" ? "text-emerald-300" : "text-red-300"}`}
              >
                {st === "success"
                  ? "✅ Marcaste como LOGRADA"
                  : "❌ Marcaste como FALLIDA"}
              </p>
              <p className="text-slate-400 text-xs italic mt-1">
                Los efectos se aplicarán al contar votos
              </p>
            </div>
          )}

          {amIChosen && st !== "waiting_text" && (
            <div className="space-y-3 fade-in">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-amber-800/30">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">
                  Tu misión secreta
                </p>
                <p className="text-amber-100 italic text-sm leading-relaxed">
                  "{mission.text}"
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Asignada por:{" "}
                  <span className="text-slate-400 font-bold">
                    {mission.assignerName}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-900/20 border border-emerald-700/40 p-3 rounded-xl">
                  <p className="text-xs font-black text-emerald-400 uppercase mb-2">
                    🎁 SI LA CUMPLES
                  </p>
                  <p className="text-emerald-200 text-xs leading-relaxed">
                    {mission.reward?.emoji} {mission.reward?.label}
                  </p>
                </div>
                <div className="bg-red-900/20 border border-red-700/40 p-3 rounded-xl">
                  <p className="text-xs font-black text-red-400 uppercase mb-2">
                    💀 SI FALLAS
                  </p>
                  <p className="text-red-200 text-xs leading-relaxed">
                    {mission.penalty?.emoji} {mission.penalty?.label}
                  </p>
                </div>
              </div>
              {(st === "success" || st === "failure") && (
                <div
                  className={`p-3 rounded-xl text-center border fade-in ${st === "success" ? "border-emerald-600 bg-emerald-900/30" : "border-red-600/50 bg-red-900/20"}`}
                >
                  <p
                    className={`font-black text-sm ${st === "success" ? "text-emerald-300" : "text-red-300"}`}
                  >
                    {st === "success"
                      ? "✅ El asignador dice: ¡LOGRADA!"
                      : "❌ El asignador dice: FALLIDA"}
                  </p>
                  <p className="text-xs text-slate-400 italic mt-1">
                    {st === "success"
                      ? mission.reward?.label
                      : mission.penalty?.label}
                  </p>
                </div>
              )}
            </div>
          )}

          {!amIAssigner && !amIChosen && (
            <div className="text-center py-6 fade-in">
              <div className="text-4xl mb-2">🔒</div>
              <p className="text-slate-500 text-sm italic">
                {st === "waiting_text"
                  ? "Esperando que se escriba la misión..."
                  : "Contenido visible solo para el Elegido"}
              </p>
              <p className="text-slate-600 text-xs mt-2">
                Asignada por:{" "}
                <span className="text-slate-500">{mission.assignerName}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
