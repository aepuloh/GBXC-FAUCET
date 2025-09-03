// ===============================
// Toggle Mobile Menu
// ===============================
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

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
// Page Navigation
// ===============================
function showPage(pageId) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
}

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
    tabButtons.forEach(b => b.classList.remove("border-yellow-500", "text-yellow-600"));
    tabContents.forEach(c => c.classList.add("hidden"));
    btn.classList.add("border-yellow-500", "text-yellow-600");
    document.getElementById(`tab-${tabId}`).classList.remove("hidden");
  });
});

// ===============================
// PancakeSwap Router Setup
// ===============================
const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Pancake v2
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

// ===============================
// Token Address Map (BSC mainnet)
// ===============================
const TOKENS = {
  BNB: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  USDC: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
  KNC: CONFIG.token.contractAddress
};

// ===============================
// Kalkulasi Swap & Buy
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
    const amountInWei = ethers.utils.parseUnits(amountIn, 18);
    const path = [TOKENS[fromToken], TOKENS[toToken]];
    const amounts = await router.getAmountsOut(amountInWei, path);
    const out = ethers.utils.formatUnits(amounts[1], 18);
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
    const amountInWei = ethers.utils.parseUnits(amountIn, 18);
    const path = [TOKENS[fromToken], TOKENS.KNC];
    const amounts = await router.getAmountsOut(amountInWei, path);
    const out = ethers.utils.formatUnits(amounts[1], 18);
    document.getElementById("buyReceive").value = out;
  } catch (err) {
    console.error("Buy Error:", err);
    document.getElementById("buyReceive").value = "Error";
  }
}

// ===============================
// Fungsi Eksekusi Swap
// ===============================
async function doSwap() {
  const fromToken = document.getElementById("swapFromToken").value;
  const toToken = document.getElementById("swapToToken").value;
  const amountIn = document.getElementById("swapFromAmount").value;

  if (!amountIn || isNaN(amountIn)) {
    alert("Masukkan jumlah valid");
    return;
  }

  try {
    const amountInWei = ethers.utils.parseUnits(amountIn, 18);
    const path = [TOKENS[fromToken], TOKENS[toToken]];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(ROUTER_ADDRESS, [
      {
        "inputs": [
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
          { "internalType": "address[]", "name": "path", "type": "address[]" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactTokensForTokens",
        "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ], signer);

    const userAddr = await signer.getAddress();
    const tx = await contract.swapExactTokensForTokens(amountInWei, 0, path, userAddr, deadline);

    console.log("Swap TX:", tx.hash);
    alert("Swap berhasil! Tx Hash: " + tx.hash);
  } catch (err) {
    console.error("Swap Error:", err);
    alert("Gagal swap: " + err.message);
  }
}

// ===============================
// Fungsi Eksekusi Buy (to KNC)
// ===============================
async function doBuy() {
  const fromToken = document.getElementById("buyFromToken").value;
  const amountIn = document.getElementById("buyAmount").value;

  if (!amountIn || isNaN(amountIn)) {
    alert("Masukkan jumlah valid");
    return;
  }

  try {
    const amountInWei = ethers.utils.parseUnits(amountIn, 18);
    const path = [TOKENS[fromToken], TOKENS.KNC];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(ROUTER_ADDRESS, [
      {
        "inputs": [
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
          { "internalType": "address[]", "name": "path", "type": "address[]" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactTokensForTokens",
        "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ], signer);

    const userAddr = await signer.getAddress();
    const tx = await contract.swapExactTokensForTokens(amountInWei, 0, path, userAddr, deadline);

    console.log("Buy TX:", tx.hash);
    alert("Buy berhasil! Tx Hash: " + tx.hash);
  } catch (err) {
    console.error("Buy Error:", err);
    alert("Gagal buy: " + err.message);
  }
}

// ===============================
// Fungsi Add Liquidity
// ===============================
async function doAddLiquidity() {
  const tokenA = document.getElementById("liqTokenA").value;
  const tokenB = document.getElementById("liqTokenB").value;
  const amountA = document.getElementById("liqAmountA").value;
  const amountB = document.getElementById("liqAmountB").value;

  if (!amountA || !amountB || isNaN(amountA) || isNaN(amountB)) {
    alert("Masukkan jumlah valid");
    return;
  }

  try {
    const amountAWei = ethers.utils.parseUnits(amountA, 18);
    const amountBWei = ethers.utils.parseUnits(amountB, 18);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(ROUTER_ADDRESS, [
      {
        "inputs": [
          { "internalType": "address", "name": "tokenA", "type": "address" },
          { "internalType": "address", "name": "tokenB", "type": "address" },
          { "internalType": "uint256", "name": "amountADesired", "type": "uint256" },
          { "internalType": "uint256", "name": "amountBDesired", "type": "uint256" },
          { "internalType": "uint256", "name": "amountAMin", "type": "uint256" },
          { "internalType": "uint256", "name": "amountBMin", "type": "uint256" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "addLiquidity",
        "outputs": [
          { "internalType": "uint256", "name": "amountA", "type": "uint256" },
          { "internalType": "uint256", "name": "amountB", "type": "uint256" },
          { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ], signer);

    const userAddr = await signer.getAddress();
    const tx = await contract.addLiquidity(
      TOKENS[tokenA],
      TOKENS[tokenB],
      amountAWei,
      amountBWei,
      0,
      0,
      userAddr,
      deadline
    );

    console.log("Liquidity TX:", tx.hash);
    alert("Liquidity berhasil! Tx Hash: " + tx.hash);
  } catch (err) {
    console.error("Liquidity Error:", err);
    alert("Gagal add liquidity: " + err.message);
  }
}
