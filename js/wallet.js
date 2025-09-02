let web3;
let currentAccount = null;

// PancakeSwap Router (v2)
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// ==========================
// Switch / Add Network
// ==========================
async function switchNetwork() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CONFIG.network.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [CONFIG.network],
      });
    }
  }
}

// ==========================
// Connect Wallet
// ==========================
async function selectWallet() {
  if (!window.ethereum) {
    alert("❌ Wallet tidak ditemukan.\n\nCoba buka di browser yang mendukung wallet (MetaMask / Trust Wallet / TokenPocket / Opera).");
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    currentAccount = accounts[0];
    web3 = new Web3(window.ethereum);
    await switchNetwork();

    updateUIConnected();
    closeModal();
    showPage("home");

    // Load saldo
    loadBalances();
  } catch (error) {
    console.error("❌ Wallet connection failed:", error);
    alert("❌ Gagal connect wallet.");
  }
}

// ==========================
// Disconnect Wallet
// ==========================
function disconnectWallet() {
  currentAccount = null;
  web3 = null;
  updateUIDisconnected();
  showPage("contact");

  document.getElementById("bnbBalance").innerText = "0 BNB";
  document.getElementById("tokenBalance").innerText = "0 " + CONFIG.token.symbol;
}

// ==========================
// Load Balances
// ==========================
async function loadBalances() {
  if (!web3 || !currentAccount) return;

  try {
    // BNB
    const balanceBNB = await web3.eth.getBalance(currentAccount);
    const formattedBNB = web3.utils.fromWei(balanceBNB, "ether");
    document.getElementById("bnbBalance").innerText = `${parseFloat(formattedBNB).toFixed(4)} BNB`;

    // Token
    const token = new web3.eth.Contract(CONFIG.token.abi, CONFIG.token.contractAddress);
    const balanceKNC = await token.methods.balanceOf(currentAccount).call();
    const formattedKNC = balanceKNC / 10 ** CONFIG.token.decimals;
    document.getElementById("tokenBalance").innerText = `${formattedKNC.toFixed(2)} ${CONFIG.token.symbol}`;
  } catch (err) {
    console.error("❌ Gagal ambil saldo:", err);
  }
}

// ==========================
// BUY TOKEN via PancakeSwap
// ==========================
async function buyToken() {
  if (!web3 || !currentAccount) {
    alert("❌ Wallet belum connect.");
    return;
  }
  try {
    const amountBNB = document.querySelector("#buy input").value;
    if (!amountBNB || amountBNB <= 0) {
      alert("Masukkan jumlah BNB yang valid.");
      return;
    }

    const router = new web3.eth.Contract(CONFIG.routerAbi, PANCAKE_ROUTER);

    const path = [CONFIG.network.nativeCurrency.symbol === "BNB" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : CONFIG.token.contractAddress, CONFIG.token.contractAddress];

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 menit

    const tx = await router.methods.swapExactETHForTokens(
      0,
      [CONFIG.network.nativeCurrency.symbol === "BNB" ? "0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" : CONFIG.token.contractAddress, CONFIG.token.contractAddress],
      currentAccount,
      deadline
    ).send({
      from: currentAccount,
      value: web3.utils.toWei(amountBNB, "ether"),
    });

    console.log("✅ Buy berhasil:", tx);
    alert("✅ Buy sukses! Tx Hash: " + tx.transactionHash);
    loadBalances();
  } catch (err) {
    console.error("❌ Buy gagal:", err);
    alert("❌ Buy gagal: " + err.message);
  }
}

// ==========================
// SWAP TOKEN via PancakeSwap
// ==========================
async function swapToken() {
  if (!web3 || !currentAccount) {
    alert("❌ Wallet belum connect.");
    return;
  }
  try {
    const amount = document.querySelector("#swap input[type='number']").value;
    if (!amount || amount <= 0) {
      alert("Masukkan jumlah token yang valid.");
      return;
    }

    const router = new web3.eth.Contract(CONFIG.routerAbi, PANCAKE_ROUTER);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    // Approve dulu token untuk router
    const token = new web3.eth.Contract(CONFIG.token.abi, CONFIG.token.contractAddress);
    await token.methods.approve(PANCAKE_ROUTER, web3.utils.toWei(amount, "ether")).send({ from: currentAccount });

    // Swap token ke BNB
    const tx = await router.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
      web3.utils.toWei(amount, "ether"),
      0,
      [CONFIG.token.contractAddress, "0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"],
      currentAccount,
      deadline
    ).send({ from: currentAccount });

    console.log("✅ Swap berhasil:", tx);
    alert("✅ Swap sukses! Tx Hash: " + tx.transactionHash);
    loadBalances();
  } catch (err) {
    console.error("❌ Swap gagal:", err);
    alert("❌ Swap gagal: " + err.message);
  }
}

// ==========================
// Handle Account Change
// ==========================
if (window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      currentAccount = accounts[0];
      loadBalances();
    }
  });
}
