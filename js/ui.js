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
const ROUTER_ADDRESS = CONFIG.dex.routerAddress;
const ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactETHForTokens",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "payable",
    "type": "function"
  },
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
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountTokenDesired", "type": "uint256" },
      { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" },
      { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "addLiquidityETH",
    "outputs": [
      { "internalType": "uint256", "name": "amountToken", "type": "uint256" },
      { "internalType": "uint256", "name": "amountETH", "type": "uint256" },
      { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

let provider, signer, router;
if (typeof window.ethereum !== "undefined") {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
  router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
}

// ===============================
// Token Address Map
// ===============================
const TOKENS = {
  BNB: CONFIG.dex.wbnb, // WBNB (BNB harus dibungkus)
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  USDC: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
  KN: CONFIG.token.contractAddress
};

// Helper decimals
function getDecimals(symbol) {
  if (symbol === "KN") return CONFIG.token.decimals; // 6
  return 18; // default stable/BNB
}

// ===============================
// Kalkulasi Output
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
    const amountInWei = ethers.utils.parseUnits(amountIn, getDecimals(fromToken));
    const path = [TOKENS[fromToken], TOKENS[toToken]];
    const amounts = await router.getAmountsOut(amountInWei, path);
    const out = ethers.utils.formatUnits(amounts[1], getDecimals(toToken));
    document.getElementById("swapToAmount").value = parseFloat(out).toFixed(6);
  } catch (err) {
    console.error("Swap Kalkulasi Error:", err);
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
    const amountInWei = ethers.utils.parseUnits(amountIn, getDecimals(fromToken));
    const path = [TOKENS[fromToken], TOKENS.KN];
    const amounts = await router.getAmountsOut(amountInWei, path);
    const out = ethers.utils.formatUnits(amounts[1], CONFIG.token.decimals);
    document.getElementById("buyReceive").value = parseFloat(out).toFixed(6);
  } catch (err) {
    console.error("Buy Kalkulasi Error:", err);
    document.getElementById("buyReceive").value = "Error";
  }
}

// ===============================
// Eksekusi Swap
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
    const amountInWei = ethers.utils.parseUnits(amountIn, getDecimals(fromToken));
    const path = [TOKENS[fromToken], TOKENS[toToken]];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    const userAddr = await signer.getAddress();

    if (fromToken === "BNB") {
      const tx = await router.swapExactETHForTokens(
        0,
        path,
        userAddr,
        deadline,
        { value: amountInWei }
      );
      alert("✅ Swap sukses! Tx Hash: " + tx.hash);
    } else {
      const contract = new ethers.Contract(TOKENS[fromToken], CONFIG.token.abi, signer);
      await contract.approve(ROUTER_ADDRESS, amountInWei);
      const tx = await router.swapExactTokensForTokens(amountInWei, 0, path, userAddr, deadline);
      alert("✅ Swap sukses! Tx Hash: " + tx.hash);
    }
  } catch (err) {
    console.error("Swap Error:", err);
    alert("❌ Gagal swap: " + err.message);
  }
}

// ===============================
// Eksekusi Buy (BNB → KN)
// ===============================
async function doBuy() {
  const amountIn = document.getElementById("buyAmount").value;
  if (!amountIn || isNaN(amountIn)) {
    alert("Masukkan jumlah valid");
    return;
  }

  try {
    const amountInWei = ethers.utils.parseUnits(amountIn, 18); // BNB selalu 18
    const path = [TOKENS.BNB, TOKENS.KN];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    const userAddr = await signer.getAddress();

    const tx = await router.swapExactETHForTokens(
      0,
      path,
      userAddr,
      deadline,
      { value: amountInWei }
    );
    alert("✅ Buy sukses! Tx Hash: " + tx.hash);
  } catch (err) {
    console.error("Buy Error:", err);
    alert("❌ Buy gagal: " + err.message);
  }
}

// ===============================
// Add Liquidity (BNB–KN pool)
// ===============================
async function doAddLiquidity() {
  const amountBNB = document.getElementById("liqFromAmount").value;
  const amountKN = document.getElementById("liqKNC").value;

  if (!amountBNB || !amountKN || isNaN(amountBNB) || isNaN(amountKN)) {
    alert("Masukkan jumlah valid");
    return;
  }

  try {
    const amountBNBWei = ethers.utils.parseUnits(amountBNB, 18);
    const amountKNWei = ethers.utils.parseUnits(amountKN, CONFIG.token.decimals);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    const userAddr = await signer.getAddress();

    // Approve KN token
    const knContract = new ethers.Contract(TOKENS.KN, CONFIG.token.abi, signer);
    await knContract.approve(ROUTER_ADDRESS, amountKNWei);

    const tx = await router.addLiquidityETH(
      TOKENS.KN,
      amountKNWei,
      0,
      0,
      userAddr,
      deadline,
      { value: amountBNBWei }
    );

    alert("✅ Liquidity sukses! Tx Hash: " + tx.hash);
  } catch (err) {
    console.error("Liquidity Error:", err);
    alert("❌ Gagal add liquidity: " + err.message);
  }
}
