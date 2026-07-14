import { useState, useRef, useEffect } from "react";

export default function MemoriaGame({ onFinish }) {
  const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
  const seq = useRef(
    Array.from(
      {
        length: 4,
      },
      () => Math.floor(Math.random() * 4),
    ),
  ).current;
  const [showing, setShowing] = useState(true);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [input, setInput] = useState([]);
  const [wrong, setWrong] = useState(false);
  const startRef = useRef(null);
  useEffect(() => {
    let i = 0;
    const step = () => {
      setFlashIdx(seq[i]);
      setTimeout(() => {
        setFlashIdx(-1);
        i++;
        if (i < seq.length) setTimeout(step, 300);
        else
          setTimeout(() => {
            setShowing(false);
            startRef.current = Date.now();
          }, 500);
      }, 550);
    };
    step();
  }, []);
  const tapColor = (idx) => {
    if (showing) return;
    const pos = input.length;
    if (seq[pos] === idx) {
      const newInput = [...input, idx];
      setInput(newInput);
      if (newInput.length === seq.length) {
        onFinish(Date.now() - startRef.current);
      }
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 250);
      // penalty: small time added by pushing start back, keeps it fair but not punishing
      startRef.current -= 400;
    }
  };
  return (
    <div className="space-y-4 w-full">
      <div className="go-signal bg-amber-400 text-amber-900 text-lg font-black py-3 rounded-2xl title-font">
        {showing
          ? "Memoriza la secuencia..."
          : `Repítela (${input.length}/${seq.length})`}
      </div>
      <div className={`grid grid-cols-2 gap-3 ${wrong ? "opacity-60" : ""}`}>
        {COLORS.map((c, idx) => (
          <button
            key={idx}
            onPointerDown={() => tapColor(idx)}
            disabled={showing}
            className="h-24 rounded-2xl border-4 transition-all active:scale-90"
            style={{
              background: c,
              borderColor: flashIdx === idx ? "white" : "transparent",
              opacity: flashIdx === idx ? 1 : showing ? 0.5 : 1,
            }}
          />
        ))}
      </div>
      {wrong && (
        <p className="text-red-400 text-sm font-bold">
          ¡Incorrecto! Sigue intentando.
        </p>
      )}
    </div>
  );
}
