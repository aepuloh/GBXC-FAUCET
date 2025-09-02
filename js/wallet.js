let web3;
let currentAccount = null;

// Utility: deteksi mobile sederhana
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// BSC network switch/add
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
    } else {
      console.error("switchNetwork error:", switchError);
    }
  }
}

// Connect handler dari modal
async function selectWallet(type) {
  // Jika tidak ada provider (Chrome HP biasa), coba buka MetaMask app dengan deep link ke situs ini
  if (!window.ethereum) {
    if (isMobile()) {
      const cleanHost = location.host; // mydomain.com
      const path = location.pathname.startsWith("/") ? location.pathname.slice(1) : location.pathname;
      // Akan membuka situs kamu di in-app browser MetaMask → window.ethereum tersedia
      window.location.href = `https://metamask.app.link/dapp/${cleanHost}/${path}`;
    } else {
      alert("❌ Wallet extension tidak terdeteksi. Silakan install MetaMask / Binance Wallet.");
    }
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

    // Ambil saldo setelah connect
    loadBalances();
  } catch (error) {
    console.error("❌ Wallet connection failed:", error);
    alert("❌ Gagal connect wallet: " + (error?.message || error));
  }
}

function disconnectWallet() {
  currentAccount = null;
  web3 = null;
  updateUIDisconnected();
  // Reset saldo di UI
  const bnbEl = document.getElementById("bnbBalance");
  const kncEl = document.getElementById("tokenBalance");
  if (bnbEl) bnbEl.innerText = "0 BNB";
  if (kncEl) kncEl.innerText = "0 " + CONFIG.token.symbol;
  showPage("contact");
}

// UI update
function updateUIConnected() {
  const connectBtn = document.getElementById("connectBtn");
  if (!connectBtn) return;
  connectBtn.innerText = "🔌 Disconnect Wallet";
  connectBtn.onclick = disconnectWallet;
  connectBtn.classList.remove("bg-yellow-500", "hover:bg-yellow-600");
  connectBtn.classList.add("bg-red-500", "hover:bg-red-600");
}

function updateUIDisconnected() {
  const connectBtn = document.getElementById("connectBtn");
  if (!connectBtn) return;
  connectBtn.innerText = "Connect Wallet";
  connectBtn.onclick = openModal;
  connectBtn.classList.remove("bg-red-500", "hover:bg-red-600");
  connectBtn.classList.add("bg-yellow-500", "hover:bg-yellow-600");
}

// Ambil saldo BNB & Token
async function loadBalances() {
  if (!web3 || !currentAccount) return;

  try {
    // Saldo BNB
    const balanceBNB = await web3.eth.getBalance(currentAccount);
    const formattedBNB = web3.utils.fromWei(balanceBNB, "ether");
    const bnbText = `${parseFloat(formattedBNB).toFixed(4)} BNB`;
    const bnbEl = document.getElementById("bnbBalance");
    if (bnbEl) bnbEl.innerText = bnbText;

    // Saldo token KNC (pakai balanceOf minimal ABI)
    const tokenAbi = [
      {
        constant: true,
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        type: "function",
      },
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function",
      },
      {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        type: "function",
      },
    ];
    const token = new web3.eth.Contract(tokenAbi, CONFIG.token.contractAddress);
    const [balanceKNC, decimals, symbol] = await Promise.all([
      token.methods.balanceOf(currentAccount).call(),
      token.methods.decimals().call().catch(() => CONFIG.token.decimals),
      token.methods.symbol().call().catch(() => CONFIG.token.symbol),
    ]);
    const formattedKNC = Number(balanceKNC) / 10 ** Number(decimals || CONFIG.token.decimals);
    const kncEl = document.getElementById("tokenBalance");
    if (kncEl) kncEl.innerText = `${formattedKNC.toFixed(2)} ${symbol || CONFIG.token.symbol}`;
  } catch (err) {
    console.error("❌ Gagal ambil saldo:", err);
  }
}

// Auto handle disconnect / ganti akun
if (window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      currentAccount = accounts[0];
      loadBalances();
    }
  });
  window.ethereum.on("chainChanged", () => {
    // refresh balance saat ganti chain
    loadBalances();
  });
}

// =======================
// BUY TOKEN (contoh: kirim BNB ke kontrak)
// =======================
async function buyToken() {
  if (!web3 || !currentAccount) {
    alert("❌ Wallet belum connect.");
    openModal();
    return;
  }
  try {
    const amountBNB = document.getElementById("buyAmount")?.value;
    if (!amountBNB || amountBNB <= 0) {
      alert("Masukkan jumlah BNB yang valid.");
      return;
    }

    const tx = await web3.eth.sendTransaction({
      from: currentAccount,
      to: CONFIG.token.contractAddress, // Pastikan kontrak menerima BNB untuk mekanisme buy/mint
      value: web3.utils.toWei(String(amountBNB), "ether"),
    });

    console.log("✅ Buy berhasil:", tx);
    alert("✅ Buy sukses!\nTx Hash: " + tx.transactionHash);
    loadBalances();
  } catch (err) {
    console.error("❌ Buy gagal:", err);
    alert("❌ Buy gagal: " + (err?.message || err));
  }
}

// =======================
// SWAP TOKEN (contoh: panggil fungsi swap di kontrak token-mu)
// =======================
async function swapToken() {
  if (!web3 || !currentAccount) {
    alert("❌ Wallet belum connect.");
    openModal();
    return;
  }
  try {
    const amount = document.getElementById("swapAmount")?.value;
    if (!amount || amount <= 0) {
      alert("Masukkan jumlah token yang valid.");
      return;
    }

    const contract = new web3.eth.Contract(CONFIG.token.abi, CONFIG.token.contractAddress);

    // Pastikan kontrak punya fungsi swap(uint256 amount)
    const tx = await contract.methods
      .swap(web3.utils.toWei(String(amount), "ether"))
      .send({ from: currentAccount });

    console.log("✅ Swap berhasil:", tx);
    alert("✅ Swap sukses!\nTx Hash: " + tx.transactionHash);
    loadBalances();
  } catch (err) {
    console.error("❌ Swap gagal:", err);
    alert("❌ Swap gagal: " + (err?.message || err));
  }
}
