import { useState } from "react";
import ChestSVG from "../components/ChestSVG";
import { EyeOffIcon, EyeIcon } from "../icons";

export default function CofreNotify({
  myId,
  isHost,
  roomData,
  amIChosen,
  roomCode,
  onReady,
  onProceed,
}) {
  const [revealing, setRevealing] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);
  const handlePointerDown = () => {
    setRevealing(true);
  };
  const handlePointerUp = () => {
    setRevealing(false);
    if (!hasSeen) setHasSeen(true);
  };
  return (
    <div className="fade-in flex flex-col items-center gap-6 pt-6 text-center">
      <div className="flex justify-center">
        <ChestSVG open={true} hasMoney={false} revealed={false} size={80} />
      </div>
      <h2 className="text-3xl font-black text-amber-300 title-font">
        RONDA FINAL
      </h2>
      <p className="text-slate-400 italic text-sm max-w-xs mx-auto">
        Quedan 3 jugadores. Antes de la ronda del cofre, el Elegido debe conocer
        su rol.
      </p>
      {amIChosen ? (
        <div className="w-full space-y-4">
          <div className="bg-amber-900/20 border border-amber-700/40 p-3 rounded-xl text-sm text-amber-200/80 italic">
            Mantén presionado el botón para ver tu rol en privado. Luego
            confirma que ya viste.
          </div>
          <div
            className={`p-8 rounded-[2rem] border-2 cursor-pointer select-none transition-all ${revealing ? "border-red-500 bg-red-900/30" : "border-slate-700 bg-slate-800/60"}`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {revealing ? (
              <div className="fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border-2 border-red-500 elegido-pulse flex items-center justify-center">
                  <EyeOffIcon c="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-black text-red-400 title-font">
                  ERES EL ELEGIDO
                </h3>
                <p className="text-slate-300 text-sm mt-2 italic">
                  Tu cofre tiene el dinero al comenzar.
                  <br />
                  ¡Pero los demás intentarán robártelo!
                </p>
              </div>
            ) : (
              <div>
                <EyeIcon c="mx-auto text-slate-500 mb-4 w-12 h-12" />
                <p className="text-slate-300 font-black">MANTÉN PRESIONADO</p>
                <p className="text-slate-500 text-sm mt-1 italic">
                  Para ver tu rol en secreto
                </p>
              </div>
            )}
          </div>
          {hasSeen && !roomData.cofreElegidoReady && (
            <button
              onClick={onReady}
              className="w-full bg-emerald-700 hover:bg-emerald-600 p-4 rounded-2xl font-black active:scale-95 title-font transition-colors"
            >
              ✓ YA VI MI ROL
            </button>
          )}
          {roomData.cofreElegidoReady && (
            <div className="bg-emerald-900/30 border border-emerald-700/50 p-3 rounded-xl text-emerald-300 font-bold text-sm">
              ✓ Listo. Esperando al anfitrión...
            </div>
          )}
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div
            className={`p-6 rounded-2xl border-2 text-center transition-all ${roomData.cofreElegidoReady ? "border-emerald-600/50 bg-emerald-900/20" : "border-slate-700 bg-slate-800/40"}`}
          >
            {roomData.cofreElegidoReady ? (
              <>
                <div className="text-3xl mb-2">✅</div>
                <p className="text-emerald-300 font-black">
                  El Elegido ya vio su rol
                </p>
                <p className="text-slate-400 text-sm italic mt-1">
                  El anfitrión puede continuar
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2 animate-pulse">🔒</div>
                <p className="text-slate-300 font-bold">
                  El Elegido está viendo su rol...
                </p>
                <p className="text-slate-500 text-sm italic mt-1">
                  Espera a que confirme
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {isHost && roomData.cofreElegidoReady && (
        <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40">
          <button
            onClick={onProceed}
            className="w-full bg-amber-700 hover:bg-amber-600 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 title-font transition-colors"
          >
            CONTINUAR → COFRES
          </button>
        </div>
      )}
      {!isHost && !amIChosen && (
        <p className="text-slate-500 animate-pulse font-bold text-sm">
          Esperando al anfitrión...
        </p>
      )}
    </div>
  );
}
