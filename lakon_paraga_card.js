/* ═══════════════════════════════════════════════════════════════
   LAKON™ — KARTU PARAGA: RENDER + SHARE  (v2 — motif final)
   Dependency: muat lakon_paraga_card_content.js LEBIH DULU
   (menyediakan PARAGA_CARD, KELOMPOK_COLOR, WATAK_TAGLINE)

   Cara pakai (di app.js):
   1) <script src="lakon_paraga_card_content.js"></script> sebelum file ini
   2) Di akhir showResult(), tambahkan:  mountResultCard(kelompok1, watak);

   SISTEM MOTIF:
   - Bentuk + warna  = Kelompok  (6 bentuk: SHAPE)
   - Treatment       = Watak     (4 treatment: TREAT, selalu warna utama)
   ZONA HERO swappable: untuk ganti ke ilustrasi karakter (v2), ganti
   `shape` di getHeroMotif dengan <image href="char/${kelompok}.png" .../>.
═══════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  const CREAM = "#FAF7F2", INK = "#2C2416", INK2 = "#4A3E2E";
  const SAGE = "#4A7C6B", LINE = "#E4D8C8", MID = "#7A6A52";
  const HERO_CX = 340, HERO_CY = 360;

  // ── helper warna: derive 3 nada dari 1 warna Kelompok ─────────
  const f = n => Math.round(n * 10) / 10;
  function hexToRgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  function rgbToHex(a){return "#"+a.map(v=>Math.round(v).toString(16).padStart(2,"0")).join("");}
  function mix(hex,target,amt){const a=hexToRgb(hex),b=hexToRgb(target);return rgbToHex(a.map((v,i)=>v+(b[i]-v)*amt));}
  const tint  = (hex,amt=0.45)=>mix(hex,CREAM,amt);     // lebih terang
  const shade = (hex,amt=0.30)=>mix(hex,"#000000",amt); // lebih gelap (teks)

  // ── 6 BENTUK KELOMPOK (di-author pada pusat 120,120) ──────────
  const SHAPE = {
    Yasa:(cM,cL)=>`<rect x="62" y="140" width="56" height="34" rx="5" fill="${cM}"/><rect x="122" y="140" width="56" height="34" rx="5" fill="${cL}"/><rect x="92" y="104" width="56" height="34" rx="5" fill="${cM}"/>`,
    Nalar:(cM,cL)=>`<circle cx="120" cy="120" r="72" fill="none" stroke="${cL}" stroke-width="6"/><circle cx="120" cy="120" r="30" fill="${cM}"/><circle cx="171" cy="69" r="11" fill="${cM}"/>`,
    Karya:(cM,cL)=>`<polygon points="120,46 192,120 120,194 48,120" fill="none" stroke="${cM}" stroke-width="7" stroke-linejoin="round"/><polygon points="120,46 120,194 48,120" fill="${cL}" opacity="0.6"/><line x1="120" y1="46" x2="120" y2="194" stroke="${cM}" stroke-width="4"/><line x1="48" y1="120" x2="192" y2="120" stroke="${cM}" stroke-width="4"/>`,
    Bakti:(cM,cL)=>`<line x1="120" y1="156" x2="120" y2="188" stroke="${cM}" stroke-width="4" stroke-linecap="round"/><path d="M0,0 Q26,-45 0,-90 Q-26,-45 0,0 Z" fill="${cL}" transform="translate(120,134)"/><path d="M0,0 Q26,-45 0,-90 Q-26,-45 0,0 Z" fill="${cL}" transform="translate(102,142) rotate(-36) scale(0.58)"/><path d="M0,0 Q26,-45 0,-90 Q-26,-45 0,0 Z" fill="${cL}" transform="translate(138,142) rotate(36) scale(0.58)"/>`,
    Karsa:(cM,cL)=>`<circle cx="120" cy="120" r="62" fill="none" stroke="${cL}" stroke-width="5"/><polygon points="120,58 133,120 107,120" fill="${cM}"/><polygon points="120,182 133,120 107,120" fill="${cL}"/><circle cx="120" cy="120" r="9" fill="${cM}"/>`,
    Tata:(cM,cL)=>{const F=(x,y,fill)=>`<rect x="${x}" y="${y}" width="26" height="26" rx="5" ${fill?`fill="${cM}"`:`fill="none" stroke="${cL}" stroke-width="5"`}/>`;return F(67,67,1)+F(107,67,0)+F(147,67,0)+F(67,107,0)+F(107,107,1)+F(147,107,0)+F(67,147,0)+F(107,147,0)+F(147,147,1);},
  };

  // ── 4 TREATMENT WATAK (membungkus bentuk; selalu warna utama) ─
  const TREAT = {
    Reka:(cM)=>{let s="";for(let i=0;i<8;i++){const a=i*45*Math.PI/180;s+=`<line x1="${f(120+94*Math.cos(a))}" y1="${f(120+94*Math.sin(a))}" x2="${f(120+110*Math.cos(a))}" y2="${f(120+110*Math.sin(a))}"/>`;}return `<g stroke="${cM}" stroke-width="6" stroke-linecap="round">${s}</g>`;},
    Logika:(cM,cL)=>{const p=[45,135,225,315].map(d=>{const a=d*Math.PI/180;return [120+88*Math.cos(a),120+88*Math.sin(a)];});let ln="";for(let i=0;i<4;i++){const A=p[i],B=p[(i+1)%4];ln+=`<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(B[0])}" y2="${f(B[1])}"/>`;}let dt="";p.forEach(q=>{dt+=`<circle cx="${f(q[0])}" cy="${f(q[1])}" r="8" fill="${cM}"/>`;});return `<g stroke="${cL}" stroke-width="3">${ln}</g>${dt}`;},
    Jaga:(cM)=>`<rect x="36" y="36" width="168" height="168" rx="18" fill="none" stroke="${cM}" stroke-width="7"/>`,
    Guna:(cM)=>`<g stroke="${cM}" stroke-width="7" stroke-linecap="round"><line x1="150" y1="92" x2="172" y2="74"/><line x1="160" y1="112" x2="182" y2="94"/><line x1="168" y1="134" x2="190" y2="116"/></g>`,
  };

  // ★ ZONA HERO = bentuk Kelompok + treatment Watak, warna Kelompok.
  function getHeroMotif(kelompok,watak,cMain,cLight){
    const shape = (SHAPE[kelompok]||SHAPE.Karya)(cMain,cLight);
    const treat = (TREAT[watak]||TREAT.Reka)(cMain,cLight);
    return `<g transform="translate(${HERO_CX},${HERO_CY}) scale(1.4) translate(-120,-120)"><g opacity="0.95">${treat}${shape}</g></g>`;
    // Versi karakter (v2): const shape = `<image href="char/${kelompok}.png" x="..." .../>`;
  }

  // ── word wrap untuk esensi (maks 2 baris) ─────────────────────
  function wrap(str,max){const w=str.split(" ");const out=[];let c="";w.forEach(x=>{if((c+" "+x).trim().length>max){out.push(c.trim());c=x;}else c+=" "+x;});if(c.trim())out.push(c.trim());return out.slice(0,2);}

  // ── BUILD SVG KARTU (Versi A — bersih) ────────────────────────
  function buildParagaCardSVG(kelompok,watak){
    const key = `${kelompok}|${watak}`;
    const card = (global.PARAGA_CARD||{})[key] || {esensi:"",kata_kunci:[]};
    const cMain = (global.KELOMPOK_COLOR||{})[kelompok] || "#C17A3C";
    const cLight = tint(cMain), cDark = shade(cMain);
    const tagline = ((global.WATAK_TAGLINE||{})[watak] || "").toUpperCase();

    const lines = wrap(card.esensi||"", 30);
    const eY = lines.length>1 ? [793,833] : [808];
    const essence = lines.map((ln,i)=>`<text class="lk-serif" x="340" y="${eY[i]}" text-anchor="middle" font-size="29" font-style="italic" fill="${INK2}">${esc(ln)}</text>`).join("");

    const kw = card.kata_kunci||[]; const gap=16,h=52,y=912;
    const widths = kw.map(w=>Math.max(96, w.length*12 + 44));
    const total = widths.reduce((a,b)=>a+b,0) + gap*Math.max(0,kw.length-1);
    let x=(680-total)/2, chips="";
    kw.forEach((w,i)=>{const cw=widths[i];chips+=`<rect x="${f(x)}" y="${y}" width="${cw}" height="${h}" rx="26" fill="none" stroke="${cLight}" stroke-width="2"/><text x="${f(x+cw/2)}" y="${y+33}" text-anchor="middle" font-size="20" font-weight="600" fill="${cDark}">${esc(w)}</text>`;x+=cw+gap;});

    return `<svg width="100%" viewBox="0 0 680 1209" role="img" xmlns="http://www.w3.org/2000/svg">
<title>Kartu Paraga ${esc(kelompok)} ${esc(watak)}</title>
<defs><style>@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap');
text{font-family:'Plus Jakarta Sans',system-ui,sans-serif}.lk-serif{font-family:'Lora',Georgia,serif}</style></defs>
<rect x="0" y="0" width="680" height="1209" fill="${CREAM}"/>
<rect x="0" y="0" width="680" height="14" fill="${cMain}"/>
<rect x="0" y="1195" width="680" height="14" fill="${SAGE}"/>
<text class="lk-serif" x="340" y="96" text-anchor="middle" font-size="32" font-style="italic" font-weight="600" fill="${INK}">Lakon<tspan font-size="16" dy="-10">™</tspan></text>
<text x="340" y="170" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="4" fill="${cDark}">PARAGA-KU</text>
${getHeroMotif(kelompok,watak,cMain,cLight)}
<text class="lk-serif" x="340" y="660" text-anchor="middle" font-size="86" font-weight="600"><tspan fill="${cDark}">${esc(kelompok)}</tspan> <tspan fill="${INK}">${esc(watak)}</tspan></text>
<text x="340" y="716" text-anchor="middle" font-size="24" font-weight="700" letter-spacing="3" fill="${SAGE}">${esc(tagline)}</text>
${essence}
${chips}
<line x1="200" y1="1048" x2="480" y2="1048" stroke="${LINE}" stroke-width="2"/>
<text class="lk-serif" x="340" y="1102" text-anchor="middle" font-size="27" font-style="italic" fill="${INK}">Temukan Paraga-mu</text>
<text x="340" y="1140" text-anchor="middle" font-size="22" font-weight="700" letter-spacing="1" fill="${cDark}">lakon.mitologiinspira.com</text>
<text x="340" y="1172" text-anchor="middle" font-size="17" font-weight="500" letter-spacing="2" fill="${MID}">24 PARAGA · GRATIS · ~15 MENIT</text>
</svg>`;
  }
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

  // ── SVG → PNG (1080×1920) ─────────────────────────────────────
  const FONT_FACE_CSS = ""; // opsional: @font-face base64 untuk kepastian Lora di PNG
  function svgToPng(svgStr,w=1080,h=1920){
    if(FONT_FACE_CSS) svgStr = svgStr.replace("</style>", FONT_FACE_CSS+"</style>");
    return new Promise((resolve,reject)=>{
      const blob=new Blob([svgStr],{type:"image/svg+xml;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const img=new Image();
      img.onload=()=>{const c=document.createElement("canvas");c.width=w;c.height=h;
        const ctx=c.getContext("2d");ctx.fillStyle=CREAM;ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
        URL.revokeObjectURL(url);c.toBlob(b=>b?resolve(b):reject(new Error("toBlob null")),"image/png",0.95);};
      img.onerror=e=>{URL.revokeObjectURL(url);reject(e);};
      img.src=url;
    });
  }

  function buildCaption(kelompok,watak){
    const card=(global.PARAGA_CARD||{})[`${kelompok}|${watak}`]||{};
    const tag=(global.WATAK_TAGLINE||{})[watak]||"";
    return `Ternyata aku ${kelompok} ${watak} — ${tag}. ${card.esensi||""} Cari tahu Paraga-mu: lakon.mitologiinspira.com`;
  }

  async function shareParaga(kelompok,watak){
    const L = global.lang==='id', btn=document.getElementById("btn-share-paraga");
    try{
      if(btn){btn.disabled=true;btn.textContent=L?"Menyiapkan...":"Preparing...";}
      if(document.fonts&&document.fonts.ready){try{await document.fonts.ready;}catch(e){}}
      const blob=await svgToPng(buildParagaCardSVG(kelompok,watak));
      const caption=buildCaption(kelompok,watak);
      const file=new File([blob],`paraga-${kelompok}-${watak}.png`,{type:"image/png"});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],text:caption});
      }else{
        const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
        if(navigator.clipboard)navigator.clipboard.writeText(caption).catch(()=>{});
        if(typeof showToast==="function")showToast(L?"Kartu diunduh, caption tersalin":"Card downloaded, caption copied");
      }
    }catch(e){console.error("shareParaga:",e);if(typeof showToast==="function")showToast(L?"Gagal membuat kartu":"Failed to create card");}
    finally{if(btn){btn.disabled=false;btn.textContent=L?"Bagikan Paraga-ku":"Share my Paraga";}}
  }

  // ── MOUNT: isi slot hero + sisipkan blok share sebelum paywall ─
  function mountResultCard(kelompok,watak){
    const slot=document.querySelector(".result-illus-placeholder");
    if(slot){slot.innerHTML=buildParagaCardSVG(kelompok,watak);slot.style.padding="0";slot.style.background="transparent";}

    const upsell=document.querySelector(".upsell-section");
    if(upsell&&!document.getElementById("paraga-share-block")){
      const L=global.lang==='id';
      upsell.insertAdjacentHTML("beforebegin",
        `<div id="paraga-share-block" style="text-align:center;padding:2.5rem 1.5rem;border-top:1px solid ${LINE};">
          <p style="font-family:var(--serif,'Lora');font-style:italic;font-size:22px;color:${INK};margin:0 0 4px;">${L?`Bangga jadi ${kelompok} ${watak}?`:`Proud to be ${kelompok} ${watak}?`}</p>
          <p style="font-size:15px;color:${MID};margin:0 0 18px;">${L?"Bagikan Paraga-mu, ajak yang lain menemukan miliknya.":"Share your Paraga, invite others to find theirs."}</p>
          <button id="btn-share-paraga" class="btn-primary" type="button">${L?"Bagikan Paraga-ku":"Share my Paraga"}</button>
        </div>`);
      document.getElementById("btn-share-paraga").addEventListener("click",()=>shareParaga(kelompok,watak));
    }
  }

  global.LakonCard={buildParagaCardSVG,svgToPng,shareParaga,buildCaption,mountResultCard,getHeroMotif};
  global.mountResultCard=mountResultCard;
})(window);
