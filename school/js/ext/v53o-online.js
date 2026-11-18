// ================= v53o · CHƠI CHUNG TRÊN ĐẢO TRÒN: vẽ người chơi online đang ở đường/cỏ của đảo =================
// Trước đây người chơi khác chỉ hiện khi đứng trong một khu cũ (lớp, sân…). Trên đường đảo (toạ độ raw) thì vô hình.
// File này vẽ thêm họ ở lớp raw, sau khi v46 vẽ người đi đường (gọi qua v47wWorld). Tên toàn cục tiền tố v53o.
function v53oRawPeers(){
  const all = (typeof ONLINE !== 'undefined' && ONLINE.peers) || []; if(!all.length) return;
  const raw = all.filter(p => p.presence && p.presence.x != null && v46Raw(+p.presence.x))
    .map(p => ({peer:'raw:' + p.peer, presence:Object.assign({}, p.presence, {x:+p.presence.x - V46E})}));
  if(!raw.length) return;
  const keep = ONLINE.peers, sp = []; ONLINE.peers = raw;
  try { onlineSprites(sp); } finally { ONLINE.peers = keep; }
  sp.sort((a, b) => a.y - b.y).forEach(s => { try { s.f(); } catch(e){} });
}
const v53oW0 = v47wWorld;
v47wWorld = function(VBn){ const r = v53oW0.apply(this, arguments); if(typeof V46 !== 'undefined' && V46.on && !V46.sky){ try { v53oRawPeers(); } catch(e){} } return r; };
