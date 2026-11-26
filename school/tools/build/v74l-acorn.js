// v74l · lấy bộ phân tích cú pháp acorn: gói 'acorn' nếu đã cài, nếu không thì bản acorn có sẵn bên trong Node
// (cần chạy node với --expose-internals; build.js / v74l-cover.js tự chạy lại chính nó với cờ này khi cần).
module.exports = function(){
  try { return require('acorn'); } catch(e){}
  try { return require('internal/deps/acorn/acorn/dist/acorn'); } catch(e){}
  return null;
};
// chạy lại tiến trình hiện tại với --expose-internals nếu chưa có acorn (trả về true nếu đã chạy lại → bên gọi phải dừng)
module.exports.respawn = function(){
  if(module.exports() || process.execArgv.includes('--expose-internals') || process.env.V74L_NO_RESPAWN) return false;
  const r = require('child_process').spawnSync(process.execPath, ['--expose-internals', ...process.execArgv, process.argv[1], ...process.argv.slice(2)], {stdio:'inherit', env:Object.assign({}, process.env, {V74L_NO_RESPAWN:'1'})});
  process.exitCode = r.status == null ? 1 : r.status; return true;
};
// các khai báo function cấp trên cùng (không async/generator) của một file: [{name, start, end, idEnd}]
module.exports.topFns = function(acorn, src){
  const ast = acorn.parse(src, {ecmaVersion:'latest', sourceType:'script', allowReturnOutsideFunction:true, allowHashBang:true});
  return ast.body.filter(n => n.type === 'FunctionDeclaration' && !n.async && !n.generator).map(n => ({name:n.id.name, start:n.start, end:n.end, idEnd:n.id.end}));
};
