// Toggle Mobile Menu
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// Tutup menu setelah pilih link (mobile)
document.querySelectorAll("#mobileMenu a").forEach(link => {
  link.addEventListener("click", () => {
    mobileMenu.classList.add("hidden");
  });
});

// Modal
function openModal() {
  document.getElementById("walletModal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("walletModal").classList.add("hidden");
}

// Page navigation + highlight menu + fade + slide
function showPage(pageId) {
  const sections = document.querySelectorAll("main section");

  sections.forEach(sec => {
    if (sec.id === pageId) {
      // target page masuk (slide in + fade in)
      sec.classList.remove("hidden", "opacity-0", "-translate-x-10", "translate-x-10");
      sec.classList.add("opacity-100", "translate-x-0", "transition", "duration-500");
    } else {
      // page keluar (slide out + fade out)
      if (!sec.classList.contains("hidden")) {
        sec.classList.add("opacity-0", "-translate-x-10", "transition", "duration-500");
        setTimeout(() => {
          sec.classList.add("hidden");
          sec.classList.remove("-translate-x-10");
        }, 400);
      }
    }
  });

  // Reset highlight semua link (desktop + mobile)
  document.querySelectorAll("nav a, #mobileMenu a").forEach(a => {
    a.classList.remove("text-yellow-500", "font-bold");
  });

  // Highlight link yang sesuai
  document.querySelectorAll(`nav a, #mobileMenu a`).forEach(a => {
    if (a.getAttribute("onclick") && a.getAttribute("onclick").includes(pageId)) {
      a.classList.add("text-yellow-500", "font-bold");
    }
  });
}

// Default tampil halaman home setelah DOM siap
window.addEventListener("load", () => {
  showPage("home");
});
