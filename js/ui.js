// ===============================
// Toggle Mobile Menu (kode awalmu)
// ===============================
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

// ===============================
// Modal Wallet
// ===============================
function openModal() {
  document.getElementById("walletModal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("walletModal").classList.add("hidden");
}

// ===============================
// Page navigation
// ===============================
function showPage(pageId) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
}

// Default tampil halaman home
if (document.querySelector("main")) {
  showPage("home");
}

// ===============================
// Tab Navigation (Swap / Buy / Liquidity)
// ===============================
const tabButtons = document.querySelectorAll(".tabBtn");
const tabContents = document.querySelectorAll(".tabContent");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabId = btn.getAttribute("data-tab");

    // reset all
    tabButtons.forEach(b => b.classList.remove("border-yellow-500", "text-yellow-600"));
    tabContents.forEach(c => c.classList.add("hidden"));

    // aktifkan yang dipilih
    btn.classList.add("border-yellow-500", "text-yellow-600");
    document.getElementById(`tab-${tabId}`).classList.remove("hidden");
  });
});

// ===============================
// PancakeSwap Router Setup
// ===============================
const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Pancake v2 mainnet
const ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let router;
if (typeof window.ethereum !== "undefined") {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
}

// Token Address Map (BSC mainnet contoh)
const TOKENS = {
  BNB: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // pseudo native
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  USDC: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
  KNC: CONFIG.token.contractAddress
};

// ===============================
// Swap & Buy Kalkulasi
// ===============================
async function updateSwapOutput() {
  const fromToken = document.getElementById("swapFromToken").value;
  const toToken = document.getElementById("swapToToken").value;
  const amountIn = document.getElementById("swapFromAmount").value;

  if (!amountIn || isNaN(amountIn)) {
    document.getElementById("swapToAmount").value = "0.0";
    return;
  }

  try {
    const decimals = 18;
    const amountInWei = ethers.utils.parseUnits(amountIn, decimals);

    const path = [TOKENS[fromToken], TOKENS[toToken]];
    const amounts = await router.getAmountsOut(amountInWei, path);

    const out = ethers.utils.formatUnits(amounts[1], decimals);
    document.getElementById("swapToAmount").value = out;
  } catch (err) {
    console.error("Swap Error:", err);
    document.getElementById("swapToAmount").value = "Error";
  }
}

async function updateBuyOutput() {
  const fromToken = document.getElementById("buyFromToken").value;
  const amountIn = document.getElementById("buyAmount").value;

  if (!amountIn || isNaN(amountIn)) {
    document.getElementById("buyReceive").value = "0.0";
    return;
  }

  try {
    const decimals = 18;
    const amountInWei = ethers.utils.parseUnits(amountIn, decimals);

    const path = [TOKENS[fromToken], TOKENS.KNC];
    const amounts = await router.getAmountsOut(amountInWei, path);

    const out = ethers.utils.formatUnits(amounts[1], decimals);
    document.getElementById("buyReceive").value = out;
  } catch (err) {
    console.error("Buy Error:", err);
    document.getElementById("buyReceive").value = "Error";
  }
}
