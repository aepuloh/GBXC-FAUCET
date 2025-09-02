// Toggle Mobile Menu
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// Tutup menu setelah pilih link
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

// Page navigation
function showPage(pageId) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
}

// Default tampil halaman contact sampai wallet connect
if (document.querySelector("main")) {
  showPage("contact");
}
