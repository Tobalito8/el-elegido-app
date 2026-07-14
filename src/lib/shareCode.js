export function shareCode(code) {
  const url = `${window.location.href.split("?")[0]}?sala=${code}`;
  const msg = `¡Únete a mi sala de El Elegido!
Código: ${code}
${url}`;
  if (navigator.share) {
    navigator
      .share({
        title: "El Elegido",
        text: msg,
      })
      .catch(() => {});
  } else {
    navigator.clipboard
      .writeText(msg)
      .then(() => alert("¡Código copiado al portapapeles!"))
      .catch(() => alert(`Código: ${code}`));
  }
}
