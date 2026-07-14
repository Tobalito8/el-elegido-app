import { useState } from "react";
import ChestSVG from "../components/ChestSVG";

export default function CofreFinal({ myId, isHost, roomData, getName, backToLobby }) {
  const [revealed, setRevealed] = useState(false);
  const [animating, setAnimating] = useState(false);
  const winnerId = roomData.chestWinnerId;
  const winnerName = getName(winnerId);
  const isWinner = winnerId === myId;
  const handleReveal = () => {
    setAnimating(true);
    setTimeout(() => {
      setRevealed(true);
      setAnimating(false);
    }, 800);
  };
  return (
    <div className="fade-in flex flex-col items-center gap-6 pt-6 text-center">
      <h2 className="text-3xl font-black text-amber-300 title-font">
        MOMENTO DE LA VERDAD
      </h2>
      <p className="text-slate-400 italic text-sm">
        Los intercambios han terminado. ¿Quién tiene el dinero?
      </p>
      {!revealed ? (
        <>
          <div className="grid grid-cols-3 gap-4 w-full my-4">
            {roomData.chestOwners?.map((ownerId, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 ${animating ? "border-amber-500 bg-amber-900/20 chest-reveal" : "border-slate-700 bg-slate-800/40"}`}
              >
                <ChestSVG
                  open={animating}
                  hasMoney={false}
                  revealed={false}
                  size={68}
                />
                <p className="text-xs font-bold text-slate-300 truncate w-full text-center">
                  {getName(ownerId)}
                </p>
                {ownerId === myId && (
                  <p className="text-[10px] text-amber-400 font-bold">
                    TÚ
                  </p>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleReveal}
            disabled={animating}
            className="w-full bg-amber-600 hover:bg-amber-500 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 title-font transition-colors disabled:opacity-70"
          >
            {animating ? "✨ Revelando..." : "🔓 REVELAR COFRES"}
          </button>
        </>
      ) : (
        <>
          <div
            className={`relative text-center p-6 rounded-[2rem] border-2 w-full ${isWinner ? "border-amber-400 bg-amber-900/30 chest-glow-gold" : "border-slate-700 bg-slate-800/40"}`}
          >
            <div className="winner-rays absolute inset-0 rounded-[2rem] pointer-events-none opacity-60" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              ¡EL GANADOR ES!
            </p>
            <h3 className="text-4xl font-black text-amber-300 title-font mb-2">
              {winnerName}
            </h3>
            {isWinner && (
              <p className="text-amber-200 italic text-lg">
                ¡¡ERES TÚ!! 🎉
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            {roomData.chestOwners?.map((ownerId, i) => {
              const hasMoney = i === roomData.chestMoneyIndex;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 ${hasMoney ? "border-amber-400 bg-amber-900/30 chest-glow-gold" : "border-slate-700 bg-slate-800/40"}`}
                >
                  <ChestSVG
                    open={true}
                    hasMoney={hasMoney}
                    revealed={true}
                    size={68}
                  />
                  <p
                    className={`text-xs font-bold truncate w-full text-center ${hasMoney ? "text-amber-300" : "text-slate-400"}`}
                  >
                    {getName(ownerId)}
                  </p>
                  {hasMoney && (
                    <p className="text-[10px] text-amber-400 font-black">
                      💰 DINERO
                    </p>
                  )}
                  {!hasMoney && (
                    <p className="text-[10px] text-slate-600">
                      vacío
                    </p>
                  )}
                  {ownerId === myId && (
                    <p className="text-[10px] text-blue-400 font-bold">
                      TÚ
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {isHost ? (
            <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40">
              <button
                onClick={backToLobby}
                className="w-full bg-amber-700 hover:bg-amber-600 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 title-font transition-colors"
              >
                VOLVER AL LOBBY
              </button>
            </div>
          ) : (
            <p className="text-slate-500 animate-pulse font-bold pb-20">
              Esperando al anfitrión...
            </p>
          )}
        </>
      )}
    </div>
  );
}
