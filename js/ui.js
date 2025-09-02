// Toggle Mobile Menu
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Tutup menu setelah pilih link
  mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  });
}

// Modal
function openModal() {
  document.getElementById("walletModal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("walletModal").classList.add("hidden");
}

// Page navigation
function showPage(pageId) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  const target = document.getElementById(pageId);
  if (target) target.classList.remove("hidden");
}

// Default halaman
if (document.querySelector("main")) {
  showPage("home");
}
