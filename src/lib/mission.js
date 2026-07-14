export function buildNewMission(players) {
  const dead = players.filter((p) => !p.isAlive);
  if (dead.length === 0) return null;
  const assigner = dead[Math.floor(Math.random() * dead.length)];
  return {
    assignerId: assigner.id,
    assignerName: assigner.name,
    text: null,
    reward: null,
    penalty: null,
    status: "waiting_text",
  };
}
