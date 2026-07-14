import { useState, useEffect, useRef } from "react";
import { GS } from "./constants";
import {
  firestoreDb,
  docRef,
  setDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  onSnapshotCompat,
} from "./lib/firebase";
import { shareCode } from "./lib/shareCode";
import {
  LockIcon,
  ExitIcon,
  CrownIcon,
  AwardIcon,
  EyeOffIcon,
  UserIcon,
  EyeIcon,
  GhostIcon,
  MsgIcon,
  SendIcon,
  CheckIcon,
  ShareIcon,
} from "./icons";
import CofreNotify from "./screens/CofreNotify";
import CofreSetup from "./screens/CofreSetup";
import CofreMinijuego from "./screens/CofreMinijuego";
import RoundMinigame from "./screens/RoundMinigame";
import CofreTurno from "./screens/CofreTurno";
import CofreFinal from "./screens/CofreFinal";

export default function App() {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [gameState, setGameState] = useState(GS.INICIO);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [myId, setMyId] = useState("");
  const [error, setError] = useState("");
  const [ghostMessage, setGhostMessage] = useState("");
  const [taskText, setTaskText] = useState("");
  const [isRevealingRole, setIsRevealingRole] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [selectingSwapTarget, setSelectingSwapTarget] = useState(false);
  const chatEndRef = useRef(null);
  const [reconnecting, setReconnecting] = useState(false);
  // How many consecutive snapshots in a row found us missing from the player list
  // before we actually treat it as "removed". Avoids false-positives from stale/cached
  // snapshots firing right when the room doc is created or right after we join.
  const missingStreakRef = useRef(0);
  useEffect(() => {
    setIsFirebaseReady(true);
    let id = localStorage.getItem("playerId");
    if (!id) {
      id = Math.random().toString(36).substring(2, 10);
      localStorage.setItem("playerId", id);
    }
    setMyId(id);
    const saved = localStorage.getItem("playerName");
    if (saved) setPlayerName(saved);
    // Auto-fill code from URL (invite link)
    const params = new URLSearchParams(window.location.search);
    const sala = params.get("sala");
    const savedRoom = localStorage.getItem("roomCode");
    if (sala) {
      setRoomCodeInput(sala.toUpperCase());
    } else if (savedRoom) {
      // We were inside a room before (refresh / app went to background / tab killed).
      // Try to silently rejoin instead of dumping the player back at the start screen.
      setRoomCodeInput(savedRoom);
      setReconnecting(true);
    }
  }, []);

  // Auto-reconnect: once Firebase + name + saved room code are ready, rejoin automatically.
  useEffect(() => {
    if (!reconnecting || !isFirebaseReady || !playerName || !roomCodeInput)
      return;
    (async () => {
      const code = roomCodeInput.trim().toUpperCase();
      try {
        const snap = await getDocument(ref(code));
        if (snap.exists()) {
          const data = snap.data();
          let ps = [...data.players];
          if (!ps.find((p) => p.id === myId)) {
            ps.push({
              id: myId,
              name: playerName,
              isAlive: true,
            });
            await upd(
              {
                players: ps,
              },
              code,
            );
          }
          setRoomCode(code);
          setError("");
        } else {
          localStorage.removeItem("roomCode");
        }
      } catch (e) {
        /* ignore, user can join manually */
      }
      setReconnecting(false);
    })();
  }, [reconnecting, isFirebaseReady, playerName, roomCodeInput, myId]);
  useEffect(() => {
    if (roomCode) localStorage.setItem("roomCode", roomCode);
    else localStorage.removeItem("roomCode");
  }, [roomCode]);
  useEffect(() => {
    if (!isFirebaseReady || !roomCode || !db()) return;
    missingStreakRef.current = 0;
    const roomRef = docRef(roomCode);
    const unsub = onSnapshotCompat(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
        setGameState(data.status);
        if (!data.players.find((p) => p.id === myId)) {
          // Require two consecutive misses (debounced) before kicking the player out,
          // to survive transient/cached snapshots right after joining.
          missingStreakRef.current += 1;
          if (missingStreakRef.current >= 2) {
            setError("Fuiste desconectado de la sala.");
            localStorage.removeItem("roomCode");
            setRoomCode("");
            setRoomData(null);
            setGameState(GS.INICIO);
          }
        } else {
          missingStreakRef.current = 0;
        }
      } else {
        setError("La sala fue cerrada por el anfitrión.");
        localStorage.removeItem("roomCode");
        setRoomCode("");
        setRoomData(null);
        setGameState(GS.INICIO);
      }
    });
    return () => unsub();
  }, [roomCode, isFirebaseReady, myId]);
  const db = () => firestoreDb;
  const ref = (code) =>
    docRef(code || roomCode);
  const upd = (data, code) => updateDocument(ref(code), data);

  // ── Room actions ──────────────────────────────────────────────────────────
  const createRoom = async () => {
    if (!playerName || !isFirebaseReady) return;
    localStorage.setItem("playerName", playerName);
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const data = {
      code,
      hostId: myId,
      status: GS.LOBBY,
      players: [
        {
          id: myId,
          name: playerName,
          isAlive: true,
        },
      ],
      chosenHash: null,
      votes: {},
      lastResult: "",
      lastVictim: null,
      victimWasChosen: false,
      ghostMessages: [],
      taskAssignerId: null,
      currentTask: null,
      games: [],
      currentGame: null,
      roundWinner: null,
      immunePlayerId: null,
      roundGameMode: "app",
      roundMinigame: null,
      chestOwners: null,
      chestMoneyIndex: null,
      chestTurnOrder: null,
      chestCurrentTurnIndex: null,
      chestWinnerId: null,
      cofreElegidoReady: false,
      cofreMinijuego: null,
    };
    try {
      await setDocument(ref(code), data);
      setRoomCode(code);
      setError("");
    } catch (e) {
      setError("Error al crear sala.");
    }
  };
  const joinRoom = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!playerName || !code || !isFirebaseReady) return;
    localStorage.setItem("playerName", playerName);
    try {
      const snap = await getDocument(ref(code));
      if (snap.exists()) {
        const data = snap.data();
        if (
          data.status !== GS.LOBBY &&
          !data.players.find((p) => p.id === myId)
        ) {
          setError("La partida ya está en curso.");
          return;
        }
        let ps = [...data.players];
        if (!ps.find((p) => p.id === myId)) {
          ps.push({
            id: myId,
            name: playerName,
            isAlive: true,
          });
          await upd(
            {
              players: ps,
            },
            code,
          );
        }
        setRoomCode(code);
        setError("");
      } else {
        setError("Ese código de sala no existe.");
      }
    } catch (e) {
      setError("Error al conectarse.");
    }
  };
  const exitRoom = async () => {
    if (
      !window.confirm(
        "¿Seguro que deseas salir? Si eres el creador, la sala se cerrará para todos.",
      )
    )
      return;
    if (roomCode && roomData) {
      if (roomData.hostId === myId) await deleteDocument(ref());
      else
        await upd({
          players: roomData.players.filter((p) => p.id !== myId),
        });
    }
    setRoomCode("");
    setRoomData(null);
    setGameState(GS.INICIO);
  };
  const addGame = async () => {
    if (!newGameName.trim()) return;
    await upd({
      games: [...(roomData.games || []), newGameName.trim()],
    });
    setNewGameName("");
  };
  const removeGame = async (i) =>
    await upd({
      games: (roomData.games || []).filter((_, idx) => idx !== i),
    });
  const ROUND_MINIGAME_TYPES = ["reaccion", "secuencia", "memoria"];
  const setRoundGameMode = async (mode) =>
    await upd({
      roundGameMode: mode,
    });

  // Decides what game powers this round: either one of the built-in in-app
  // minigames, or one of the host's custom "play it outside the app" games.
  const pickRoundGame = () => {
    if (roomData.roundGameMode === "custom" && roomData.games?.length) {
      return {
        external:
          roomData.games[Math.floor(Math.random() * roomData.games.length)],
      };
    }
    const type =
      ROUND_MINIGAME_TYPES[
        Math.floor(Math.random() * ROUND_MINIGAME_TYPES.length)
      ];
    return {
      appGame: type,
    };
  };
  const startGame = async () => {
    const alive = roomData.players.filter((p) => p.isAlive);
    if (alive.length < 2) return;
    const chosenId = alive[Math.floor(Math.random() * alive.length)].id;
    const chosenHash = btoa(chosenId + roomCode);
    const game = pickRoundGame();
    await upd({
      status: GS.JUGANDO,
      chosenHash,
      votes: {},
      ghostMessages: [],
      taskAssignerId: null,
      currentTask: null,
      currentGame: game,
      roundWinner: null,
      immunePlayerId: null,
      roundMinigame: null,
    });
  };
  const startVoting = async () =>
    await upd({
      status: GS.VOTACION,
    });
  const castVote = async (targetId) => {
    if (roomData.votes?.[myId] === targetId) return;
    await upd({
      [`votes.${myId}`]: targetId,
    });
  };
  const sendGhostMessage = async () => {
    if (!ghostMessage.trim()) return;
    const msgs = [
      ...(roomData.ghostMessages || []),
      {
        sender: playerName,
        text: ghostMessage,
        time: Date.now(),
      },
    ];
    await upd({
      ghostMessages: msgs,
    });
    setGhostMessage("");
  };
  const assignTask = async () => {
    if (!taskText.trim()) return;
    if (roomData.taskAssignerId !== myId || roomData.currentTask) return;
    await upd({
      currentTask: taskText.trim(),
    });
    setTaskText("");
  };
  const finishVoting = async () => {
    const voteCounts = {};
    Object.values(roomData.votes || {}).forEach((id) => {
      voteCounts[id] = (voteCounts[id] || 0) + 1;
    });
    let maxV = 0,
      tiedIds = [];
    Object.entries(voteCounts).forEach(([id, c]) => {
      if (c > maxV) {
        maxV = c;
        tiedIds = [id];
      } else if (c === maxV) tiedIds.push(id);
    });
    let victimId = null,
      message = "",
      victimWasChosen = false;
    let nextHash = roomData.chosenHash,
      playersUpdate = roomData.players;
    if (Object.keys(voteCounts).length === 0) {
      message = "Nadie votó a tiempo.";
    } else if (tiedIds.length > 1) {
      message = "¡EMPATE! Las votaciones se anularon. Nadie eliminado.";
    } else {
      victimId = tiedIds[0];
      playersUpdate = roomData.players.map((p) =>
        p.id === victimId
          ? {
              ...p,
              isAlive: false,
            }
          : p,
      );
      victimWasChosen = btoa(victimId + roomCode) === roomData.chosenHash;
      if (victimWasChosen) {
        message = `¡LO DESCUBRIERON! era ${roomData.players.find((p) => p.id === victimId).name}. Se ha asignado un nuevo Elegido.`;
        const survivors = playersUpdate.filter((p) => p.isAlive);
        if (survivors.length > 0) {
          const newChosen =
            survivors[Math.floor(Math.random() * survivors.length)].id;
          nextHash = btoa(newChosen + roomCode);
        }
      } else {
        message = `EQUIVOCACIÓN. ${roomData.players.find((p) => p.id === victimId)?.name} fue eliminado pero NO era.`;
      }
    }
    await upd({
      status: GS.RESULTADOS,
      lastResult: message,
      players: playersUpdate,
      chosenHash: nextHash,
      lastVictim: victimId,
      victimWasChosen,
    });
  };
  const handleNextRound = async () => {
    const survivors = roomData.players.filter((p) => p.isAlive);
    if (survivors.length === 3) {
      // Assign chests: elegido gets money chest
      const chosenPlayer = survivors.find(
        (p) => btoa(p.id + roomCode) === roomData.chosenHash,
      );
      if (!chosenPlayer) return;
      const shuffled = [...survivors].sort(() => Math.random() - 0.5);
      const chestOwners = shuffled.map((p) => p.id);
      const moneyIdx = chestOwners.indexOf(chosenPlayer.id);
      // Go to COFRE_NOTIFY so the (re)assigned elegido sees their role
      await upd({
        status: GS.COFRE_NOTIFY,
        chestOwners,
        chestMoneyIndex: moneyIdx,
        chestTurnOrder: null,
        chestCurrentTurnIndex: 0,
        chestWinnerId: null,
        cofreElegidoReady: false,
        votes: {},
        immunePlayerId: null,
        cofreMinijuego: null,
      });
      return;
    }
    if (survivors.length <= 1) {
      await upd({
        status: GS.LOBBY,
        players: roomData.players.map((p) => ({
          ...p,
          isAlive: true,
        })),
        taskAssignerId: null,
        currentTask: null,
      });
    } else {
      const game = pickRoundGame();
      const ghosts = roomData.players.filter((p) => !p.isAlive);
      const taskAssignerId = ghosts.length
        ? ghosts[Math.floor(Math.random() * ghosts.length)].id
        : null;
      await upd({
        status: GS.JUGANDO,
        currentGame: game,
        votes: {},
        ghostMessages: [],
        taskAssignerId,
        currentTask: null,
        immunePlayerId: null,
        lastVictim: null,
        roundMinigame: null,
      });
    }
  };

  // ── Round in-app minigame actions ─────────────────────────────────────────
  // Host decides when the minigame actually pops up, so players who were just
  // eliminated get a moment to chat / dare the Elegido before it takes over.
  const startRoundMinigame = async () => {
    if (!roomData.currentGame?.appGame) return;
    await upd({
      roundMinigame: {
        type: roomData.currentGame.appGame,
        phase: "countdown",
        startedAt: Date.now(),
        goTime: null,
        taps: {},
      },
    });
  };
  const triggerRoundGo = async () =>
    await upd({
      "roundMinigame.phase": "go",
      "roundMinigame.goTime": Date.now(),
    });
  const recordRoundTap = async (rt) => {
    const goTime = roomData.roundMinigame?.goTime;
    if (!goTime) return;
    const finalRt = rt === undefined || rt === null ? Date.now() - goTime : rt;
    await upd({
      [`roundMinigame.taps.${myId}`]: finalRt,
    });
  };
  const autoCompleteRoundMissing = async () => {
    const alive = roomData.players.filter((p) => p.isAlive);
    const taps = {
      ...(roomData.roundMinigame?.taps || {}),
    };
    let changed = false;
    alive.forEach((p) => {
      if (taps[p.id] === undefined) {
        taps[p.id] = PENALTY_RT;
        changed = true;
      }
    });
    if (changed)
      await upd({
        "roundMinigame.taps": taps,
      });
  };
  const finishRoundMinigame = async () => {
    const taps = roomData.roundMinigame?.taps || {};
    const alive = roomData.players.filter((p) => p.isAlive);
    // If literally nobody managed to finish, nobody gets immunity — never force a pick.
    const finishers = alive.filter(
      (p) => taps[p.id] !== undefined && taps[p.id] < PENALTY_RT,
    );
    let winnerId = null;
    if (finishers.length > 0) {
      winnerId = finishers.reduce((best, p) =>
        taps[p.id] < taps[best.id] ? p : best,
      ).id;
    }
    await upd({
      immunePlayerId: winnerId,
      roundWinner: winnerId,
    });
  };

  // ── Chest round actions ───────────────────────────────────────────────────
  const elegidoConfirmReady = async () =>
    await upd({
      cofreElegidoReady: true,
    });
  const proceedToSetup = async () =>
    await upd({
      status: GS.COFRE_SETUP,
    });
  const setChestTurnOrder = async (order) => {
    await upd({
      chestTurnOrder: order,
      chestCurrentTurnIndex: 0,
      status: GS.COFRE_TURNO,
    });
  };
  const MINIGAME_TYPES = ["reaccion", "secuencia", "memoria"];
  const startMinijuego = async () => {
    const type =
      MINIGAME_TYPES[Math.floor(Math.random() * MINIGAME_TYPES.length)];
    await upd({
      status: GS.COFRE_MINIJUEGO,
      cofreMinijuego: {
        type,
        phase: "countdown",
        startedAt: Date.now(),
        goTime: null,
        taps: {},
      },
    });
  };
  const triggerGo = async () => {
    await upd({
      "cofreMinijuego.phase": "go",
      "cofreMinijuego.goTime": Date.now(),
    });
  };

  // rt: lower = better/faster. Each minigame variant computes its own rt and passes it in.
  const recordTap = async (rt) => {
    const goTime = roomData.cofreMinijuego?.goTime;
    if (!goTime) return;
    const finalRt = rt === undefined || rt === null ? Date.now() - goTime : rt;
    await upd({
      [`cofreMinijuego.taps.${myId}`]: finalRt,
    });
  };

  // Penalty time given to anyone who never finishes, so the game never gets stuck waiting forever.
  const PENALTY_RT = 999999;
  const autoCompleteMissing = async () => {
    const alive = roomData.players.filter((p) => p.isAlive);
    const taps = {
      ...(roomData.cofreMinijuego?.taps || {}),
    };
    let changed = false;
    alive.forEach((p) => {
      if (taps[p.id] === undefined) {
        taps[p.id] = PENALTY_RT;
        changed = true;
      }
    });
    if (changed)
      await upd({
        "cofreMinijuego.taps": taps,
      });
  };
  const finishMinijuego = async () => {
    const taps = roomData.cofreMinijuego?.taps || {};
    const alive = roomData.players.filter((p) => p.isAlive);
    // Sort by reaction time ascending (fastest = lowest RT = winner → last to pick)
    const sorted = alive
      .map((p) => ({
        id: p.id,
        rt: taps[p.id] ?? PENALTY_RT,
      }))
      .sort((a, b) => a.rt - b.rt);
    // loser (slowest) first, winner (fastest) last
    const order = sorted.map((p) => p.id).reverse();
    await upd({
      chestTurnOrder: order,
      chestCurrentTurnIndex: 0,
      status: GS.COFRE_TURNO,
    });
  };
  const keepChest = async () => {
    const nextIdx = (roomData.chestCurrentTurnIndex || 0) + 1;
    if (nextIdx >= roomData.chestTurnOrder.length) {
      await upd({
        status: GS.COFRE_FINAL,
        chestWinnerId: roomData.chestOwners[roomData.chestMoneyIndex],
      });
    } else {
      await upd({
        chestCurrentTurnIndex: nextIdx,
      });
    }
  };
  const swapChest = async (withPlayerId) => {
    const myIdx = roomData.chestOwners.indexOf(myId);
    const theirIdx = roomData.chestOwners.indexOf(withPlayerId);
    if (myIdx === -1 || theirIdx === -1) return;
    const newOwners = [...roomData.chestOwners];
    newOwners[myIdx] = withPlayerId;
    newOwners[theirIdx] = myId;
    const nextIdx = (roomData.chestCurrentTurnIndex || 0) + 1;
    setSelectingSwapTarget(false);
    if (nextIdx >= roomData.chestTurnOrder.length) {
      await upd({
        chestOwners: newOwners,
        status: GS.COFRE_FINAL,
        chestWinnerId: newOwners[roomData.chestMoneyIndex],
      });
    } else {
      await upd({
        chestOwners: newOwners,
        chestCurrentTurnIndex: nextIdx,
      });
    }
  };
  const backToLobby = async () => {
    await upd({
      status: GS.LOBBY,
      players: roomData.players.map((p) => ({
        ...p,
        isAlive: true,
      })),
      chestOwners: null,
      chestMoneyIndex: null,
      chestTurnOrder: null,
      chestCurrentTurnIndex: null,
      chestWinnerId: null,
      cofreElegidoReady: false,
      cofreMinijuego: null,
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  if (!isFirebaseReady)
    return (
      <div className="p-10 text-center animate-pulse text-amber-200">
        Conectando...
      </div>
    );
  if (gameState !== GS.INICIO && !roomData)
    return (
      <div className="p-10 text-center animate-pulse text-amber-200">
        Cargando...
      </div>
    );
  const amIAlive = roomData?.players.find((p) => p.id === myId)?.isAlive;
  const amIChosen = btoa(myId + roomCode) === roomData?.chosenHash;
  const isHost = roomData?.hostId === myId;
  const alive = roomData?.players.filter((p) => p.isAlive) || [];
  const getName = (id) =>
    roomData?.players.find((p) => p.id === id)?.name || "?";
  const currentTurnPlayerId =
    roomData?.chestTurnOrder?.[roomData?.chestCurrentTurnIndex];
  const isMyChestTurn = currentTurnPlayerId === myId;
  return (
    <div className="app-container ambient-bg">
      <div
        className="sticky top-0 p-4 border-b border-amber-900/30 flex justify-between items-center z-50"
        style={{
          background: "rgba(10,10,20,0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="bg-amber-800/60 p-1.5 rounded-lg">
            <LockIcon c="w-5 h-5 text-amber-400" />
          </div>
          <span
            className="font-black tracking-wider uppercase text-sm title-font text-amber-200"
            style={{
              letterSpacing: ".15em",
            }}
          >
            El Elegido
          </span>
        </div>
        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              onClick={() => shareCode(roomCode)}
              className="text-slate-400 hover:text-amber-400 p-2 rounded-lg transition-colors flex items-center gap-1"
            >
              <ShareIcon c="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">
                Compartir
              </span>
            </button>
          )}
          {roomCode && (
            <button
              onClick={exitRoom}
              className="text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors flex items-center gap-1"
            >
              <ExitIcon c="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 p-6 pb-28 overflow-y-auto">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}
        {gameState === GS.INICIO && (
          <div className="fade-in flex flex-col gap-8 pt-10">
            <div className="text-center">
              <h2 className="text-4xl font-black mb-2 text-amber-300 title-font">
                ¿Quién es?
              </h2>
              <p className="text-slate-400 text-lg italic">
                Un infiltrado entre nosotros...
              </p>
            </div>
            <input
              type="text"
              placeholder="Tu Apodo"
              className="w-full bg-slate-800/60 p-4 rounded-2xl border-2 border-amber-900/40 text-center text-xl font-bold outline-none focus:border-amber-500 transition-colors text-amber-100"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <div className="flex flex-col gap-3">
              <button
                onClick={createRoom}
                disabled={!playerName}
                className="bg-amber-700 hover:bg-amber-600 p-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 disabled:opacity-50 title-font text-amber-100 transition-colors"
              >
                CREAR NUEVA SALA
              </button>
              <div className="flex items-center gap-4 py-2 opacity-30">
                <div className="flex-1 h-px bg-amber-700" />
                <span className="text-xs text-amber-300">
                  O INGRESA CON CÓDIGO
                </span>
                <div className="flex-1 h-px bg-amber-700" />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CÓDIGO"
                  maxLength={4}
                  className="w-1/3 bg-slate-800/60 p-4 rounded-2xl border-2 border-slate-700 text-center font-black uppercase outline-none focus:border-emerald-500 text-white"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                />
                <button
                  onClick={joinRoom}
                  disabled={!playerName || roomCodeInput.length < 4}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 p-4 rounded-2xl font-black active:scale-95 disabled:opacity-50 transition-colors"
                >
                  UNIRSE A SALA
                </button>
              </div>
            </div>
          </div>
        )}
        {gameState === GS.LOBBY && roomData && (
          <div className="fade-in space-y-6">
            <div
              className="border border-amber-800/40 p-6 rounded-[2rem] text-center"
              style={{
                background: "rgba(120,80,10,.08)",
              }}
            >
              <p className="text-xs font-bold text-amber-500 uppercase mb-1 tracking-widest">
                Código de Sala
              </p>
              <p className="text-5xl font-black tracking-widest text-amber-100 title-font">
                {roomData.code}
              </p>
              <button
                onClick={() => shareCode(roomData.code)}
                className="mt-3 flex items-center gap-2 mx-auto text-amber-400 hover:text-amber-300 text-sm font-bold transition-colors"
              >
                <ShareIcon c="w-4 h-4" /> Compartir sala
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Jugadores ({roomData.players.length})
              </p>
              {roomData.players.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-800/40 p-4 rounded-2xl flex justify-between items-center border border-slate-700/50"
                >
                  <span className="font-bold flex items-center gap-2 text-amber-100">
                    {p.id === roomData.hostId && (
                      <CrownIcon c="w-4 h-4 text-amber-400" />
                    )}
                    {p.name} {p.id === myId ? "(Tú)" : ""}
                  </span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                </div>
              ))}
            </div>
            {isHost && (
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Juego de cada ronda
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRoundGameMode("app")}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${roomData.roundGameMode !== "custom" ? "border-amber-500 bg-amber-900/20 text-amber-200" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}
                  >
                    🎮 Minijuegos de la App
                  </button>
                  <button
                    onClick={() => setRoundGameMode("custom")}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${roomData.roundGameMode === "custom" ? "border-amber-500 bg-amber-900/20 text-amber-200" : "border-slate-700 bg-slate-800/50 text-slate-400"}`}
                  >
                    📋 Mis juegos (fuera de la app)
                  </button>
                </div>
                {roomData.roundGameMode !== "custom" ? (
                  <p className="text-xs text-slate-500 italic">
                    Cada ronda se jugará un minijuego al azar dentro de la app
                    (reacción, memoria o secuencia). Quien gane queda inmune a
                    la votación.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Cada ronda se elegirá al azar uno de tus juegos
                    personalizados, jugado por fuera, y tú elegirás manualmente
                    al ganador.
                  </p>
                )}
              </div>
            )}
            {isHost && roomData.roundGameMode === "custom" && (
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 space-y-3 mb-20">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Juegos de la Ronda
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Verdad o Reto"
                    className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm outline-none focus:border-amber-500 text-white"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addGame()}
                  />
                  <button
                    onClick={addGame}
                    className="bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded-xl font-bold active:scale-95 text-sm transition-colors"
                  >
                    Añadir
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(roomData.games || []).map((game, i) => (
                    <div
                      key={i}
                      className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 text-amber-200"
                    >
                      {game}
                      <button
                        onClick={() => removeGame(i)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3 h-3"
                        >
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {(roomData.games || []).length === 0 && (
                    <span className="text-slate-600 text-xs italic">
                      Agrega al menos uno, o el juego usará minijuegos de la app
                      por defecto.
                    </span>
                  )}
                </div>
              </div>
            )}
            {isHost && (
              <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40">
                <button
                  onClick={startGame}
                  disabled={roomData.players.length < 2}
                  className="w-full bg-amber-700 hover:bg-amber-600 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 disabled:opacity-50 title-font transition-colors"
                >
                  COMENZAR PARTIDA
                </button>
              </div>
            )}
          </div>
        )}
        {gameState === GS.JUGANDO && roomData && (
          <>
            {roomData.currentGame?.external && (
              <p className="text-center text-sm text-slate-400 mb-4">
                Juego:{" "}
                <span className="font-bold text-amber-200">
                  {roomData.currentGame.external}
                </span>
              </p>
            )}
            {isHost && roomData.currentGame?.external && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Ganador del juego (opcional, nadie queda inmune si no eliges a
                  alguien)
                </p>
                {alive.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      upd({
                        roundWinner: p.id,
                        immunePlayerId: p.id,
                      })
                    }
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${roomData.immunePlayerId === p.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"}`}
                  >
                    <span
                      className={`font-bold ${roomData.immunePlayerId === p.id ? "text-amber-300" : "text-slate-200"}`}
                    >
                      {p.name}
                    </span>
                    {roomData.immunePlayerId === p.id && (
                      <AwardIcon c="w-5 h-5 text-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {roomData.currentGame?.appGame &&
              roomData.roundMinigame &&
              amIAlive && (
              <RoundMinigame
                myId={myId}
                isHost={isHost}
                roomData={roomData}
                alive={alive}
                getName={getName}
                triggerRoundGo={triggerRoundGo}
                recordRoundTap={recordRoundTap}
                finishRoundMinigame={finishRoundMinigame}
                autoCompleteRoundMissing={autoCompleteRoundMissing}
              />
            )}
            <div className="fade-in space-y-8 py-4 flex flex-col items-center">
              {amIAlive ? (
                <div className="w-full">
                  <div
                    className="bg-slate-800/80 p-8 rounded-[2rem] border-2 border-slate-700 shadow-2xl text-center cursor-pointer select-none"
                    onPointerDown={() => setIsRevealingRole(true)}
                    onPointerUp={() => setIsRevealingRole(false)}
                    onPointerLeave={() => setIsRevealingRole(false)}
                  >
                    {isRevealingRole ? (
                      amIChosen ? (
                        <div className="fade-in">
                          <EyeOffIcon c="mx-auto text-red-500 mb-4 w-20 h-20 animate-pulse" />
                          <h2 className="text-3xl font-black text-red-400 title-font">
                            ERES EL ELEGIDO
                          </h2>
                          <p className="text-slate-300 mt-2 text-sm italic">
                            Finge inocencia. Engaña a todos.
                          </p>
                        </div>
                      ) : (
                        <div className="fade-in">
                          <UserIcon c="mx-auto text-blue-400 mb-4 w-20 h-20" />
                          <h2 className="text-3xl font-black text-blue-400 title-font">
                            ERES INOCENTE
                          </h2>
                          <p className="text-slate-300 mt-2 text-sm italic">
                            Observa y encuentra al culpable.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="py-6">
                        <EyeIcon c="mx-auto text-slate-500 mb-4 w-16 h-16" />
                        <h2 className="text-2xl font-black text-slate-200">
                          MANTÉN PRESIONADO
                        </h2>
                        <p className="text-slate-400 text-sm mt-2 italic">
                          Para ver tu rol en secreto
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 opacity-60 text-center">
                  <GhostIcon c="mx-auto text-slate-500 mb-4 w-20 h-20" />
                  <h2 className="text-3xl font-black title-font">
                    ESTÁS MUERTO
                  </h2>
                  <p className="text-slate-400 italic">
                    Usa el chat de fantasmas.
                  </p>
                </div>
              )}
              {(!amIAlive || (amIAlive && amIChosen)) &&
                roomData.taskAssignerId && (
                  <div className="bg-slate-900 border-2 border-amber-700/50 rounded-2xl p-4 w-full space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                      🎯 Tarea de la ronda
                    </p>
                    {roomData.currentTask ? (
                      <p className="text-amber-100 text-sm italic">
                        "{roomData.currentTask}"
                      </p>
                    ) : myId === roomData.taskAssignerId ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Asígnale una tarea al Elegido..."
                          className="flex-1 bg-slate-800 px-3 py-2 rounded-xl text-sm outline-none text-white"
                          value={taskText}
                          onChange={(e) => setTaskText(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && assignTask()
                          }
                        />
                        <button
                          onClick={assignTask}
                          className="bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                        >
                          Asignar
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs italic animate-pulse">
                        Un fantasma está eligiendo una tarea para el
                        Elegido...
                      </p>
                    )}
                  </div>
                )}
              {(!amIAlive || (amIAlive && amIChosen)) && (
                <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl flex flex-col h-[280px] w-full">
                  <div className="bg-slate-800 p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-slate-700">
                    <MsgIcon c="w-4 h-4" />
                    {amIChosen
                      ? "Mensajes del más allá (Solo tú los ves)"
                      : "Chat de Fantasmas"}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {roomData.ghostMessages?.map((m, i) => (
                      <div
                        key={i}
                        className="ghost-msg bg-slate-800/80 p-3 rounded-xl text-sm"
                      >
                        <span className="text-red-400 font-bold">
                          {m.sender}:{" "}
                        </span>
                        <span className="text-slate-200">{m.text}</span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  {!amIAlive && (
                    <div className="p-2 border-t border-slate-700 flex gap-2">
                      <input
                        type="text"
                        placeholder="Mensaje..."
                        className="flex-1 bg-slate-800 px-4 py-2 rounded-xl text-sm outline-none text-white"
                        value={ghostMessage}
                        onChange={(e) => setGhostMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && sendGhostMessage()
                        }
                      />
                      <button
                        onClick={sendGhostMessage}
                        className="bg-amber-700 px-4 py-2 rounded-xl"
                      >
                        <SendIcon c="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {isHost && (
                <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40 space-y-2">
                  {roomData.currentGame?.appGame && !roomData.roundMinigame && (
                    <button
                      onClick={startRoundMinigame}
                      className="w-full bg-amber-700 hover:bg-amber-600 p-4 rounded-2xl font-black text-lg shadow-2xl active:scale-95 title-font transition-colors"
                    >
                      ⚡ MOSTRAR MINIJUEGO
                    </button>
                  )}
                  <button
                    onClick={startVoting}
                    className="w-full bg-slate-200 text-slate-900 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 title-font"
                  >
                    INICIAR VOTACIÓN
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        {gameState === GS.VOTACION && roomData && (
          <div className="fade-in space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black title-font text-amber-100">
                ELIMINACIÓN
              </h2>
              <p className="text-slate-400 text-sm italic mt-1">
                ¿A quién vas a expulsar?
              </p>
            </div>
            <div className="grid gap-3 pb-20">
              {roomData.players
                .filter((p) => p.isAlive && p.id !== roomData.immunePlayerId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => castVote(p.id)}
                    disabled={!amIAlive}
                    className={`p-5 rounded-2xl border-2 transition-all flex justify-between items-center ${roomData.votes?.[myId] === p.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"}`}
                  >
                    <span className="font-bold text-lg text-amber-100">
                      {p.name}
                      {p.id === myId ? " (Tú)" : ""}
                    </span>
                    {roomData.votes?.[myId] === p.id && (
                      <CheckIcon c="w-5 h-5 text-amber-400" />
                    )}
                  </button>
                ))}
            </div>
            <div className="text-center text-slate-500 font-bold text-xs fixed bottom-24 left-0 right-0 z-30">
              VOTOS: {Object.keys(roomData.votes || {}).length} /{" "}
              {
                roomData.players.filter(
                  (p) => p.isAlive && p.id !== roomData.immunePlayerId,
                ).length
              }
            </div>
            {isHost && (
              <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40">
                <button
                  onClick={finishVoting}
                  className="w-full bg-emerald-700 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 title-font"
                >
                  CONTAR VOTOS
                </button>
              </div>
            )}
          </div>
        )}
        {gameState === GS.RESULTADOS && roomData && (
          <div className="fade-in text-center space-y-8 pt-10">
            <div className="bg-slate-800/80 p-8 rounded-[3rem] border border-slate-700 shadow-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                El pueblo ha decidido
              </p>
              <h2 className="text-2xl font-black leading-tight text-amber-100">
                {roomData.lastResult}
              </h2>
            </div>
            {alive.length === 3 && (
              <div className="bg-amber-900/20 border border-amber-700/50 p-4 rounded-2xl">
                <p className="text-amber-300 font-black text-lg title-font">
                  ⚠ RONDA FINAL
                </p>
                <p className="text-amber-200/70 text-sm mt-1 italic">
                  Quedan 3 jugadores. Se activará la Ronda del Cofre del Tesoro.
                </p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 pb-20">
              {roomData.players.map((p) => (
                <div
                  key={p.id}
                  className={`px-4 py-2 rounded-full text-xs font-bold border ${p.isAlive ? "bg-slate-800 border-slate-600 text-amber-100" : "bg-red-900/30 border-red-500/50 text-red-400 line-through"}`}
                >
                  {p.name}
                </div>
              ))}
            </div>
            {isHost ? (
              <div className="fixed bottom-6 left-0 right-0 px-4 max-w-[500px] mx-auto z-40">
                <button
                  onClick={handleNextRound}
                  className="w-full bg-amber-700 hover:bg-amber-600 p-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 title-font transition-colors"
                >
                  CONTINUAR
                </button>
              </div>
            ) : (
              <p className="text-slate-500 animate-pulse font-bold fixed bottom-10 left-0 right-0 text-center">
                Esperando al anfitrión...
              </p>
            )}
          </div>
        )}
        {gameState === GS.COFRE_NOTIFY && roomData && (
          <CofreNotify
            myId={myId}
            isHost={isHost}
            roomData={roomData}
            amIChosen={amIChosen}
            roomCode={roomCode}
            onReady={elegidoConfirmReady}
            onProceed={proceedToSetup}
          />
        )}
        {gameState === GS.COFRE_SETUP && roomData && (
          <CofreSetup
            myId={myId}
            isHost={isHost}
            roomData={roomData}
            alive={alive}
            getName={getName}
            setChestTurnOrder={setChestTurnOrder}
            startMinijuego={startMinijuego}
          />
        )}
        {gameState === GS.COFRE_MINIJUEGO && roomData && (
          <CofreMinijuego
            myId={myId}
            isHost={isHost}
            roomData={roomData}
            alive={alive}
            getName={getName}
            triggerGo={triggerGo}
            recordTap={recordTap}
            finishMinijuego={finishMinijuego}
            autoCompleteMissing={autoCompleteMissing}
          />
        )}
        {gameState === GS.COFRE_TURNO && roomData && (
          <CofreTurno
            myId={myId}
            isHost={isHost}
            roomData={roomData}
            alive={alive}
            getName={getName}
            isMyChestTurn={isMyChestTurn}
            currentTurnPlayerId={currentTurnPlayerId}
            keepChest={keepChest}
            swapChest={swapChest}
            selectingSwapTarget={selectingSwapTarget}
            setSelectingSwapTarget={setSelectingSwapTarget}
          />
        )}
        {gameState === GS.COFRE_FINAL && roomData && (
          <CofreFinal
            myId={myId}
            isHost={isHost}
            roomData={roomData}
            getName={getName}
            backToLobby={backToLobby}
          />
        )}
      </div>
    </div>
  );
}
