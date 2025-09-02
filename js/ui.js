// ui.js
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- Modal ----
  function openModal() { $("#walletModal")?.classList.remove("hidden"); }
  function closeModal() { $("#walletModal")?.classList.add("hidden"); }

  // ---- Highlight menu aktif ----
  function highlight(pageId) {
    $$("#mobileMenu a, nav a").forEach(a => {
      a.classList.remove("text-yellow-500", "font-bold");
      const on = a.getAttribute("onclick") || "";
      if (on.includes(`'${pageId}'`) || on.includes(`("${pageId}")`)) {
        a.classList.add("text-yellow-500", "font-bold");
      }
    });
  }

  // ---- Navigasi halaman + animasi ----
  function showPage(pageId) {
    const sections = $$("main section");
    sections.forEach(sec => {
      // pastikan base class transisi ada
      sec.classList.add("transition", "duration-500", "transform");

      if (sec.id === pageId) {
        sec.classList.remove("hidden", "opacity-0", "-translate-x-10");
        sec.classList.add("opacity-100", "translate-x-0");
      } else {
        if (!sec.classList.contains("hidden")) {
          sec.classList.remove("opacity-100", "translate-x-0");
          sec.classList.add("opacity-0", "-translate-x-10");
          setTimeout(() => sec.classList.add("hidden"), 400);
        }
      }
    });
    highlight(pageId);
  }

  // Dipakai oleh menu mobile
  function navigate(pageId) {
    showPage(pageId);
    $("#mobileMenu")?.classList.add("hidden");
  }

  // ---- Init setelah DOM siap ----
  window.addEventListener("DOMContentLoaded", () => {
    // Toggle mobile menu
    $("#menuBtn")?.addEventListener("click", () => {
      $("#mobileMenu")?.classList.toggle("hidden");
    });

    // Set semua section kondisi awal (hidden + siap animasi)
    $$("main section").forEach(sec => {
      sec.classList.add("hidden", "opacity-0", "-translate-x-10", "transition", "duration-500", "transform");
    });

    // Halaman default
    showPage("home");
  });

  // Ekspor ke global (untuk dipanggil dari HTML onclick)
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.showPage = showPage;
  window.navigate = navigate;
})();
