let web3;
let currentAccount = null;

// =======================
// SWITCH NETWORK
// =======================
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

// =======================
// CONNECT WALLET
// =======================
async function selectWallet(type) {
  if (!window.ethereum) {
    alert("❌ Wallet extension tidak terdeteksi. Gunakan MetaMask/TrustWallet.");
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

    // 🚀 Ambil saldo setelah connect
    loadBalances();
  } catch (error) {
    console.error("❌ Wallet connection failed:", error);
  }
}

function disconnectWallet() {
  currentAccount = null;
  web3 = null;
  updateUIDisconnected();
  showPage("contact");

  document.getElementById("bnbBalance").innerText = "0 BNB";
  document.getElementById("tokenBalance").innerText = "0 " + CONFIG.token.symbol;
}

// =======================
// LOAD BALANCES
// =======================
async function loadBalances() {
  if (!web3 || !currentAccount) return;

  try {
    // BNB Balance
    const balanceBNB = await web3.eth.getBalance(currentAccount);
    const formattedBNB = web3.utils.fromWei(balanceBNB, "ether");
    document.getElementById("bnbBalance").innerText = `${parseFloat(formattedBNB).toFixed(4)} BNB`;

    // Token Balance
    const token = new web3.eth.Contract(CONFIG.token.abi, CONFIG.token.contractAddress);
    const balanceKNC = await token.methods.balanceOf(currentAccount).call();
    const formattedKNC = balanceKNC / 10 ** CONFIG.token.decimals;
    document.getElementById("tokenBalance").innerText = `${formattedKNC.toFixed(2)} ${CONFIG.token.symbol}`;
  } catch (err) {
    console.error("❌ Gagal ambil saldo:", err);
  }
}

// =======================
// BUY TOKEN via PancakeSwap Router
// =======================
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

    const router = new web3.eth.Contract(CONFIG.routerAbi, CONFIG.routerAddress);
    const amountOutMin = 0; // bisa tambahkan slippage tolerance
    const path = ["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", CONFIG.token.contractAddress]; // WBNB → KNC
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 menit

    const tx = await router.methods.swapExactETHForTokens(
      amountOutMin,
      path,
      currentAccount,
      deadline
    ).send({
      from: currentAccount,
      value: web3.utils.toWei(amountBNB, "ether")
    });

    console.log("✅ Buy sukses:", tx);
    alert("✅ Buy sukses! Tx Hash: " + tx.transactionHash);
    loadBalances();
  } catch (err) {
    console.error("❌ Buy gagal:", err);
    alert("❌ Buy gagal: " + err.message);
  }
}

// =======================
// SWAP TOKEN → BNB
// =======================
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

    const router = new web3.eth.Contract(CONFIG.routerAbi, CONFIG.routerAddress);
    const token = new web3.eth.Contract(CONFIG.token.abi, CONFIG.token.contractAddress);

    const amountIn = web3.utils.toWei(amount, "ether");
    const amountOutMin = 0; // bisa atur slippage tolerance
    const path = [CONFIG.token.contractAddress, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"]; // KNC → WBNB
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    // Approve token dulu
    await token.methods.approve(CONFIG.routerAddress, amountIn).send({ from: currentAccount });

    const tx = await router.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      path,
      currentAccount,
      deadline
    ).send({ from: currentAccount });

    console.log("✅ Swap sukses:", tx);
    alert("✅ Swap sukses! Tx Hash: " + tx.transactionHash);
    loadBalances();
  } catch (err) {
    console.error("❌ Swap gagal:", err);
    alert("❌ Swap gagal: " + err.message);
  }
}

// =======================
// HANDLE ACCOUNT CHANGE
// =======================
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
