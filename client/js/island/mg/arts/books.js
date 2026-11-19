// books.js — Sách của thư viện 3D: truyện cổ tích, ngụ ngôn, lời dạy (data/books.js) + toàn văn sách lớn nén gzip
// (data/books-text.js, chỉ nạp khi mở sách lớn). Dữ liệu nằm trong island/data/ — không còn tải từ trò chơi 2D.
let P = null, TEXTS = null;
export function loadBooks() {
  if (P) return P;
  P = import('../../data/books.js').then(D => {
    const list = [];
    D.VN_TALES.forEach(([t, x], i) => list.push({ id: 'vt' + i, t, a: 'Truyện cổ tích Việt Nam · kể lại cho thiếu nhi', cat: 'Truyện cổ tích', text: x }));
    D.VN_FABLES.forEach(([t, x], i) => list.push({ id: 'vf' + i, t, a: 'Ngụ ngôn Aesop · bản kể tiếng Việt', cat: 'Ngụ ngôn', text: x }));
    D.VN_WISDOM.forEach(([t, x], i) => list.push({ id: 'vw' + i, t, a: 'Sách đạo đức cho thiếu nhi', cat: 'Lời dạy yêu thương', text: x }));
    D.TEXT_META.forEach(m => list.push({ id: m.id, t: m.t, a: m.a, cat: m.cat, big: true, lang: m.lang }));
    return list;
  }).catch(e => { console.warn('books', e); P = null; return []; });
  return P;
}
export async function bookText(b) {
  if (b.text) return b.text;
  if (!TEXTS) try {
    const gz = (await import('../../data/books-text.js')).TEXT_GZ;
    const bin = atob(gz), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    TEXTS = JSON.parse(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
  } catch (e) { TEXTS = {}; }
  return TEXTS[b.id] || null;
}
