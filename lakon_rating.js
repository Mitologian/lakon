/* ═══════════════════════════════════════════════════════════════
   LAKON™ — FIELD AKURASI (1–5) + CONSENT
   Tujuan: kumpulkan face-validity ("seberapa akurat hasilnya")
   sebagai data validasi + sinyal worth-to-buy.

   Cara pakai (di app.js):
   1) <script src="lakon_rating.js"></script> sebelum app.js
   2) Di akhir showResult(), tambahkan:
        mountRating(kelompok1, watak, serverResult);

   Mengirim POST { action:'rate', ... } ke endpoint Apps Script yang
   sama. Tambahkan handler `rate` di Code.gs (lihat panduan).
═══════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  // Endpoint sama dengan submit utama (publik, sudah ada di app.js).
  const RATING_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbwZ4Yez1bc5K-COQCgCnqZWJGwHm6vx2n9tmyd25kBO9PcjqG6y1orDVxbRh64vysFv/exec";

  const AMBER = "#C17A3C", INK = "#2C2416", MID = "#7A6A52",
        LINE = "#E4D8C8", CREAM = "#FBF7F1", STAR_OFF = "#D8CCB8";

  function t(id, en) { return (global.lang === "id" ? id : en); }

  function postRating(payload) {
    try {
      // keepalive: tetap terkirim walau user pindah halaman
      fetch(RATING_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } catch (e) { /* diam: jangan ganggu user */ }
  }

  function thankYou(box) {
    box.innerHTML =
      '<div style="font-family:var(--serif,\'Lora\',Georgia,serif);font-style:italic;' +
      'font-size:20px;color:' + INK + ';">' +
      t("Terima kasih atas masukanmu 🙏", "Thank you for your feedback 🙏") +
      "</div>";
  }

  function mountRating(kelompok1, watak, serverResult) {
    // sekali saja
    if (document.getElementById("paraga-rating-block")) return;

    const paraga = kelompok1 + " " + watak;
    const email  = (document.getElementById("f-email") || {}).value || "";
    const batch  = global.URL_BATCH || "";
    const respId =
      (serverResult && (serverResult.response_id || serverResult.id ||
                        serverResult.responseId)) || "";

    const box = document.createElement("div");
    box.id = "paraga-rating-block";
    box.style.cssText =
      "max-width:520px;margin:1.5rem auto;padding:1.6rem 1.4rem;text-align:center;" +
      "background:" + CREAM + ";border:1px solid " + LINE + ";border-radius:16px;";

    box.innerHTML =
      '<div style="font-family:var(--serif,\'Lora\',Georgia,serif);font-size:19px;' +
        'font-style:italic;color:' + INK + ';margin:0 0 2px;">' +
        t("Seberapa akurat hasil ini menggambarkan kamu?",
          "How accurately does this describe you?") +
      "</div>" +
      '<div style="font-size:13px;color:' + MID + ';margin:0 0 14px;">' +
        t("Ketuk bintang — jawabanmu membantu kami menyempurnakan Lakon.",
          "Tap a star — your answer helps us refine Lakon.") +
      "</div>" +
      '<div id="lk-stars" style="font-size:38px;line-height:1;letter-spacing:6px;' +
        'cursor:pointer;user-select:none;color:' + STAR_OFF + ';margin-bottom:14px;">' +
        [1,2,3,4,5].map(function (i) {
          return '<span data-v="' + i + '" role="button" aria-label="' + i +
                 '" style="transition:color .12s;">\u2605</span>';
        }).join("") +
      "</div>" +
      '<label style="display:inline-flex;align-items:center;gap:8px;font-size:12.5px;' +
        'color:' + MID + ';cursor:pointer;justify-content:center;">' +
        '<input type="checkbox" id="lk-consent" checked ' +
          'style="width:16px;height:16px;accent-color:' + AMBER + ';margin:0;">' +
        "<span>" +
          t("Boleh pakai jawabanku (anonim) untuk pengembangan Lakon.",
            "You may use my (anonymous) responses to improve Lakon.") +
        "</span>" +
      "</label>";

    // sisip sebelum bagian terkunci pertama; fallback sebelum paywall
    const anchor = document.querySelector(".result-blurred") ||
                   document.querySelector(".upsell-section");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(box, anchor);
    } else {
      (document.querySelector(".result-body") || document.body).appendChild(box);
    }

    const stars = box.querySelectorAll("#lk-stars span");
    function paint(v) {
      stars.forEach(function (s) {
        s.style.color = (+s.getAttribute("data-v") <= v) ? AMBER : STAR_OFF;
      });
    }
    stars.forEach(function (s) {
      const v = +s.getAttribute("data-v");
      s.addEventListener("mouseenter", function () { paint(v); });
      s.addEventListener("click", function () {
        paint(v);
        const consent = !!(box.querySelector("#lk-consent") || {}).checked;
        postRating({
          action: "rate",
          response_id: respId,
          participant_email: email,
          paraga: paraga,
          kelompok: kelompok1,
          watak: watak,
          rating: v,
          consent: consent,
          batch_id: batch,
        });
        thankYou(box);
      });
    });
    box.querySelector("#lk-stars").addEventListener("mouseleave", function () {
      paint(0);
    });
  }

  global.mountRating = mountRating;
  global.LakonRating = { mountRating: mountRating };
})(window);
