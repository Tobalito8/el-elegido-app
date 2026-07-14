import { useRef } from "react";

export default function ReaccionGame({ onFinish }) {
  const startRef = useRef(Date.now());
  return (
    <div className="space-y-6 w-full">
      <div className="go-signal bg-amber-400 text-amber-900 text-5xl font-black py-6 rounded-2xl title-font shadow-[0_0_40px_rgba(251,191,36,.5)]">
        ¡¡YA!!
      </div>
      <button
        onPointerDown={() => onFinish(Date.now() - startRef.current)}
        className="tap-btn w-full h-40 bg-amber-600 hover:bg-amber-500 rounded-[2rem] text-3xl font-black title-font shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95"
        style={{
          boxShadow: "0 0 30px rgba(217,119,6,.4)",
        }}
      >
        <span className="text-5xl">👆</span>
        <span>¡TOCA!</span>
      </button>
    </div>
  );
}
