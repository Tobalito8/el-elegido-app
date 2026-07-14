import { useState, useRef } from "react";

export default function SecuenciaGame({ onFinish }) {
  const startRef = useRef(Date.now());
  const order = useRef(
    [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5),
  ).current;
  const [next, setNext] = useState(1);
  const [wrong, setWrong] = useState(null);
  const tapNum = (n) => {
    if (n === next) {
      if (n === 6) {
        onFinish(Date.now() - startRef.current);
        return;
      }
      setNext(next + 1);
    } else {
      setWrong(n);
      setTimeout(() => setWrong(null), 250);
    }
  };
  return (
    <div className="space-y-4 w-full">
      <div className="go-signal bg-amber-400 text-amber-900 text-2xl font-black py-3 rounded-2xl title-font shadow-[0_0_30px_rgba(251,191,36,.5)]">
        Toca del 1 al 6 en orden — vas en el {next}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {order.map((n) => (
          <button
            key={n}
            onPointerDown={() => tapNum(n)}
            disabled={n < next}
            className={`h-20 rounded-2xl text-3xl font-black title-font transition-all active:scale-90
                            ${n < next ? "bg-emerald-800/40 text-emerald-500 border-2 border-emerald-700" : wrong === n ? "bg-red-600 text-white border-2 border-red-400" : "bg-amber-600 hover:bg-amber-500 text-amber-50 border-2 border-amber-400"}`}
          >
            {n < next ? "✓" : n}
          </button>
        ))}
      </div>
    </div>
  );
}
