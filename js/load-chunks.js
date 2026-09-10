(async function () {
  const base = new URL('.', location.href);
  let manifest;
  try {
    const res = await fetch(new URL('assets/chunks/manifest.json', base));
    if (!res.ok) return;
    manifest = await res.json();
  } catch (_) {
    return;
  }

  async function loadPage(key) {
    const meta = manifest[key];
    if (!meta) return null;
    const folder = key.replace(/\.jpg$/i, '');
    const parts = [];
    for (let i = 0; i < meta.parts; i++) {
      const name = 'part-' + String(i).padStart(4, '0') + '.txt';
      const r = await fetch(new URL('assets/chunks/' + folder + '/' + name, base));
      if (!r.ok) throw new Error('missing ' + name);
      parts.push(await r.text());
    }
    const b64 = parts.join('').replace(/\s+/g, '');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: meta.mime || 'image/jpeg' }));
  }

  const imgs = Array.from(document.querySelectorAll('img[src*="assets/page-"]'));
  const cache = new Map();
  await Promise.all(
    imgs.map(async (img) => {
      const m = (img.getAttribute('src') || '').match(/assets\/(page-\d{2}\.jpg)/i);
      if (!m) return;
      const key = m[1].toLowerCase();
      try {
        if (!cache.has(key)) cache.set(key, loadPage(key));
        const url = await cache.get(key);
        if (url) {
          img.src = url;
          const btn = img.closest('button[data-gallery]');
          if (btn) btn.dataset.full = url;
        }
      } catch (e) {
        console.warn('chunk load failed', key, e);
      }
    })
  );
})();
