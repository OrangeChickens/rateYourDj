function getDJId(options) {
  let raw = options.id;
  if (!raw && options.scene) {
    let scene; try { scene = decodeURIComponent(options.scene); } catch (_) { return null; }
    const match = /^d=([1-9]\d*)$/.exec(scene);
    if (!match) return null;
    raw = match[1];
  }
  return /^[1-9]\d*$/.test(String(raw)) && Number.isSafeInteger(Number(raw)) ? Number(raw) : null;
}
module.exports = { getDJId };
