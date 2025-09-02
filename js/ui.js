// ==============================
// UI Control
// ==============================

// Page Switching
function showPage(pageId) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.remove("hidden");
  }
}

// Mobile Menu auto close
document.querySelectorAll("#mobileMenu a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("mobileMenu").classList.add("hidden");
  });
});

// Modal Control
function openModal() {
  document.getElementById("walletModal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("walletModal").classList.add("hidden");
}

// Update UI when connected
function updateUIConnected() {
  const connectBtn = document.getElementById("connectBtn");
  connectBtn.innerText = "🔌 Disconnect Wallet";
  connectBtn.onclick = disconnectWallet;
  connectBtn.classList.remove("bg-yellow-500", "hover:bg-yellow-600");
  connectBtn.classList.add("bg-red-500", "hover:bg-red-600");
}

// Update UI when disconnected
function updateUIDisconnected() {
  const connectBtn = document.getElementById("connectBtn");
  connectBtn.innerText = "Connect Wallet";
  connectBtn.onclick = openModal;
  connectBtn.classList.remove("bg-red-500", "hover:bg-red-600");
  connectBtn.classList.add("bg-yellow-500", "hover:bg-yellow-600");
}

// Default Page
document.addEventListener("DOMContentLoaded", () => {
  showPage("home");
});
