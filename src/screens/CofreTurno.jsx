import ChestSVG from "../components/ChestSVG";

export default function CofreTurno({
  myId,
  isHost,
  roomData,
  alive,
  getName,
  isMyChestTurn,
  currentTurnPlayerId,
  keepChest,
  swapChest,
  selectingSwapTarget,
  setSelectingSwapTarget,
}) {
  const totalTurns = roomData.chestTurnOrder?.length || 0;
  const currentIdx = roomData.chestCurrentTurnIndex || 0;
  return (
    <div className="fade-in space-y-6 pt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
          Turno {currentIdx + 1} de {totalTurns}
        </p>
        <div className="flex gap-1">
          {Array.from({
            length: totalTurns,
          }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-1.5 rounded-full ${i < currentIdx ? "bg-amber-600" : i === currentIdx ? "bg-amber-400" : "bg-slate-700"}`}
            />
          ))}
        </div>
      </div>
      <div
        className={`text-center p-4 rounded-2xl border-2 ${isMyChestTurn ? "border-amber-500 bg-amber-900/20 turn-indicator" : "border-slate-700 bg-slate-800/40"}`}
      >
        {isMyChestTurn ? (
          <>
            <p className="text-amber-400 font-black text-xl title-font">
              ¡ES TU TURNO!
            </p>
            <p className="text-slate-300 text-sm italic mt-1">
              ¿Guardas tu cofre o lo intercambias?
            </p>
          </>
        ) : (
          <>
            <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">
              Turno de
            </p>
            <p className="text-amber-200 font-black text-2xl title-font">
              {getName(currentTurnPlayerId)}
            </p>
          </>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Cofres actuales
        </p>
        <div className="grid grid-cols-3 gap-3">
          {roomData.chestOwners?.map((ownerId, chestIdx) => {
            const isMyChest = ownerId === myId;
            const isSwapTarget =
              selectingSwapTarget && ownerId !== myId && isMyChestTurn;
            return (
              <button
                key={chestIdx}
                onClick={() => {
                  if (isSwapTarget) swapChest(ownerId);
                }}
                disabled={!isSwapTarget}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all
                                    ${isMyChest ? "border-amber-500 bg-amber-900/20" : ""}
                                    ${isSwapTarget ? "border-emerald-500 bg-emerald-900/20 hover:scale-105 cursor-pointer" : ""}
                                    ${!isMyChest && !isSwapTarget ? "border-slate-700 bg-slate-800/40" : ""}
                                `}
              >
                <ChestSVG
                  open={false}
                  hasMoney={false}
                  revealed={false}
                  size={64}
                />
                <div className="text-center">
                  <p
                    className={`text-xs font-bold truncate max-w-full ${isMyChest ? "text-amber-300" : "text-slate-300"}`}
                  >
                    {getName(ownerId)}
                  </p>
                  {isMyChest && (
                    <p className="text-[10px] text-amber-500">
                      TÚ
                    </p>
                  )}
                  {isSwapTarget && (
                    <p className="text-[10px] text-emerald-400 font-bold">
                      INTERCAMBIAR
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {isMyChestTurn && !selectingSwapTarget && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={keepChest}
            className="bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 p-4 rounded-2xl text-center transition-all active:scale-95"
          >
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-sm font-black text-slate-200">CONSERVAR</div>
            <div className="text-[10px] text-slate-400 italic">
              Quédate con tu cofre
            </div>
          </button>
          <button
            onClick={() => setSelectingSwapTarget(true)}
            className="bg-amber-800/60 hover:bg-amber-700/60 border-2 border-amber-700 p-4 rounded-2xl text-center transition-all active:scale-95"
          >
            <div className="text-2xl mb-1">🔄</div>
            <div className="text-sm font-black text-amber-200">
              INTERCAMBIAR
            </div>
            <div className="text-[10px] text-amber-400/70 italic">
              Cambia con alguien
            </div>
          </button>
        </div>
      )}
      {isMyChestTurn && selectingSwapTarget && (
        <div className="space-y-2 text-center">
          <p className="text-emerald-400 font-bold text-sm">
            Toca el cofre con quien quieres intercambiar
          </p>
          <button
            onClick={() => setSelectingSwapTarget(false)}
            className="text-slate-500 text-sm hover:text-slate-300 py-2"
          >
            Cancelar
          </button>
        </div>
      )}
      <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Orden de turnos
        </p>
        <div className="space-y-2">
          {roomData.chestTurnOrder?.map((pid, i) => (
            <div
              key={pid}
              className={`flex items-center gap-3 text-sm ${i === currentIdx ? "text-amber-300 font-black" : i < currentIdx ? "text-slate-600 line-through" : "text-slate-400"}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i === currentIdx ? "bg-amber-600 text-white" : i < currentIdx ? "bg-slate-700 text-slate-500" : "bg-slate-800 text-slate-500"}`}
              >
                {i + 1}
              </span>
              {getName(pid)}
              {pid === myId ? " (Tú)" : ""}
              {i < currentIdx && (
                <span className="text-slate-600">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
