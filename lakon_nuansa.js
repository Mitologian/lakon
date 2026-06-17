/* ═══════════════════════════════════════════════════════════════
   LAKON™ — MESIN NUANSA  v2 (portable: app.js & Code.gs/Apps Script)

   v2: dedupe pintar (near-duplicate). Mencegah profesi yang
   "mirip" muncul di daftar dominan DAN sekunder sekaligus — bukan
   hanya yang persis sama. Mis. "Management Consultant" vs
   "Management Consultant (process/systems)" dianggap kembar.

   Aturan terkunci:
   - Nuansa = Kelompok ke-2, Watak SAMA. Kelompok dominan tidak diubah.
   - Daftar (karir/studi): 5 inti + 2 nuansa (additive, ditandai) + sekunder.
   - Peran (8 baris): tukar 2 fit-terlemah dgn 2 peran nuansa + sekunder.
   - Tidak ada Kelompok ke-2 → tanpa blend, tanpa sekunder.
   - Dominan & sekunder dijamin tidak kembar (persis maupun mirip).
═══════════════════════════════════════════════════════════════ */
var LakonNuansa = (function () {
  "use strict";

  function norm(s){ return String(s==null?"":s).trim().toLowerCase(); }

  // kata generik yang tidak menandakan kesamaan profesi
  var GENERIC = {manager:1,senior:1,lead:1,head:1,director:1,officer:1,
    specialist:1,associate:1,coordinator:1,executive:1,staff:1,assistant:1,
    junior:1,chief:1,principal:1,deputy:1};

  function sigWords(s){
    var arr = norm(s).split(/[^a-z]+/), set={}, out=[], i, w;
    for(i=0;i<arr.length;i++){ w=arr[i];
      if(w.length>3 && !GENERIC[w] && !set[w]){ set[w]=1; out.push(w); } }
    return out;
  }
  // mirip = identik, ATAU berbagi >=2 kata signifikan
  function isSimilar(a,b){
    if(norm(a)===norm(b)) return true;
    var wa=sigWords(a), wb=sigWords(b), sh=0, i;
    for(i=0;i<wa.length;i++) if(wb.indexOf(wa[i])>=0) sh++;
    return sh>=2;
  }
  function similarToAny(s,list){
    for(var i=0;i<list.length;i++) if(isSimilar(s,list[i])) return true;
    return false;
  }
  function nameHas(list,nama){
    for(var i=0;i<list.length;i++) if(norm(list[i].nama)===norm(nama)) return true;
    return false;
  }
  function nuansaLabel(k2,lang){ if(!k2) return ""; return (lang==="en"?"Nuance ":"Nuansa ")+k2; }
  function wrap(r,isN){ return {nama:r.nama,level:r.level,fit:r.fit,peran:r.peran,isNuansa:!!isN}; }

  /* ---- DAFTAR (karir / studi) : 5 inti + 2 nuansa + sekunder ---- */
  function blendList(primary, nuansa, kelompok2, lang, opts){
    opts=opts||{};
    var keep=opts.keep||5, add=opts.add||2, secN=opts.secondary||4;
    var label=nuansaLabel(kelompok2,lang);
    var shown=[], items=[], i;

    for(i=0;i<(primary?primary.length:0) && shown.length<keep;i++){
      if(!similarToAny(primary[i],shown)){ shown.push(primary[i]); items.push({text:primary[i],isNuansa:false}); }
    }
    if(!kelompok2) return {items:items,secondary:[],label:label};

    var nuList=[];
    for(i=0;i<(nuansa?nuansa.length:0);i++){
      if(!similarToAny(nuansa[i],shown) && !similarToAny(nuansa[i],nuList)) nuList.push(nuansa[i]);
    }
    var mix=nuList.slice(0,add);
    for(i=0;i<mix.length;i++){ items.push({text:mix[i],isNuansa:true}); shown.push(mix[i]); }
    var secondary=nuList.slice(add, add+secN);
    return {items:items, secondary:secondary, label:label};
  }

  /* ---- PERAN : tukar 2 fit-terlemah dgn 2 peran nuansa + sekunder ---- */
  function blendPeran(primaryPosisi, nuansaPosisi, kelompok2, lang, opts){
    opts=opts||{};
    var swap=opts.swap||2, secN=opts.secondary||2;
    var label=nuansaLabel(kelompok2,lang);
    var rows=(primaryPosisi||[]).slice();

    if(!kelompok2 || !nuansaPosisi || !nuansaPosisi.length){
      return {rows:rows.map(function(p){return wrap(p,false);}), secondary:[], label:label};
    }

    var shown=rows.map(function(p){return p.nama;});
    var cand=[], i;
    for(i=0;i<nuansaPosisi.length;i++)
      if(norm(nuansaPosisi[i].fit)==="ideal" && !similarToAny(nuansaPosisi[i].nama,shown) && !nameHas(cand,nuansaPosisi[i].nama)) cand.push(nuansaPosisi[i]);
    for(i=0;i<nuansaPosisi.length;i++)
      if(norm(nuansaPosisi[i].fit)==="cocok" && !similarToAny(nuansaPosisi[i].nama,shown) && !nameHas(cand,nuansaPosisi[i].nama)) cand.push(nuansaPosisi[i]);
    var insert=cand.slice(0,swap);

    var removed=0;
    for(i=rows.length-1;i>=0 && removed<insert.length;i--){ if(norm(rows[i].fit)==="bisa"){ rows.splice(i,1); removed++; } }
    for(i=rows.length-1;i>=0 && removed<insert.length;i--){ if(norm(rows[i].fit)==="cocok"){ rows.splice(i,1); removed++; } }

    var out=rows.map(function(p){return wrap(p,false);});
    var shown2=out.map(function(p){return p.nama;});
    for(i=0;i<insert.length;i++){ out.push(wrap(insert[i],true)); shown2.push(insert[i].nama); }

    var sec=[];
    for(i=0;i<nuansaPosisi.length && sec.length<secN;i++){
      if(!similarToAny(nuansaPosisi[i].nama,shown2) && !nameHas(sec,nuansaPosisi[i].nama)){ sec.push(nuansaPosisi[i]); shown2.push(nuansaPosisi[i].nama); }
    }
    return {rows:out, secondary:sec, label:label};
  }

  return { nuansaLabel:nuansaLabel, blendList:blendList, blendPeran:blendPeran, _isSimilar:isSimilar };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = LakonNuansa; }
