let web3;
let currentAccount = null;

// =======================
// GANTI / SWITCH NETWORK
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
  try {
    // ==== MetaMask & Binance ====
    if (type === "metamask" || type === "binance") {
      if (!window.ethereum) {
        alert("❌ Wallet tidak terdeteksi.");
        return;
      }
      if (type === "metamask" && !window.ethereum.isMetaMask) {
        alert("❌ MetaMask tidak ditemukan.");
        return;
      }
      if (type === "binance" && !window.ethereum.isBinance) {
        alert("❌ Binance Wallet tidak ditemukan.");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      currentAccount = accounts[0];
      web3 = new Web3(window.ethereum);
      await switchNetwork();

      updateUIConnected();
      closeModal();
      showPage("wallet");
      loadBalances();
    }

    // ==== Coinbase ====
    else if (type === "coinbase") {
      if (typeof CoinbaseWalletSDK === "undefined") {
        alert("❌ Coinbase Wallet SDK belum dimuat.");
        return;
      }
      const coinbaseWallet = new CoinbaseWalletSDK({
        appName: "KenariCoin Dashboard",
        appLogoUrl: "img/logo.png",
        darkMode: false
      });
      const provider = coinbaseWallet.makeWeb3Provider(CONFIG.network.rpcUrls[0], parseInt(CONFIG.network.chainId, 16));
      web3 = new Web3(provider);

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      currentAccount = accounts[0];

      updateUIConnected();
      closeModal();
      showPage("wallet");
      loadBalances();
    }

    // ==== Bitget ====
    else if (type === "bitget") {
      if (!window.bitkeep && !window.bitget) {
        alert("❌ Bitget Wallet tidak terdeteksi.");
        return;
      }
      const provider = window.bitkeep?.ethereum || window.bitget?.ethereum;
      web3 = new Web3(provider);

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      currentAccount = accounts[0];

      updateUIConnected();
      closeModal();
      showPage("wallet");
      loadBalances();
    }

    // ==== OKX ====
    else if (type === "okx") {
      if (!window.okxwallet) {
        alert("❌ OKX Wallet tidak terdeteksi.");
        return;
      }
      web3 = new Web3(window.okxwallet);

      const accounts = await window.okxwallet.request({ method: "eth_requestAccounts" });
      currentAccount = accounts[0];

      updateUIConnected();
      closeModal();
      showPage("wallet");
      loadBalances();
    }
  } catch (error) {
    console.error("❌ Wallet connection failed:", error);
    alert("❌ Gagal connect: " + error.message);
  }
}

// =======================
// DISCONNECT WALLET
// =======================
function disconnectWallet() {
  currentAccount = null;
  web3 = null;
  updateUIDisconnected();
  showPage("contact");

  // Reset saldo di UI
  document.getElementById("bnbBalance").innerText = "0 BNB";
  document.getElementById("tokenBalance").innerText = "0 " + CONFIG.token.symbol;
}

// =======================
// UPDATE UI
// =======================
function updateUIConnected() {
  const connectBtn = document.getElementById("connectBtn");
  connectBtn.innerText = "🔌 Disconnect Wallet";
  connectBtn.onclick = disconnectWallet;
  connectBtn.classList.remove("bg-yellow-500", "hover:bg-yellow-600");
  connectBtn.classList.add("bg-red-500", "hover:bg-red-600");
}

function updateUIDisconnected() {
  const connectBtn = document.getElementById("connectBtn");
  connectBtn.innerText = "Connect Wallet";
  connectBtn.onclick = openModal;
  connectBtn.classList.remove("bg-red-500", "hover:bg-red-600");
  connectBtn.classList.add("bg-yellow-500", "hover:bg-yellow-600");
}

// =======================
// AMBIL SALDO
// =======================
async function loadBalances() {
  if (!web3 || !currentAccount) return;

  try {
    // Ambil saldo BNB
    const balanceBNB = await web3.eth.getBalance(currentAccount);
    const formattedBNB = web3.utils.fromWei(balanceBNB, "ether");
    document.getElementById("bnbBalance").innerText = `${parseFloat(formattedBNB).toFixed(4)} BNB`;

    // Ambil saldo token KNC (ERC20 standard)
    const token = new web3.eth.Contract(CONFIG.token.abi, CONFIG.token.contractAddress);
    const balanceKNC = await token.methods.balanceOf(currentAccount).call();
    const formattedKNC = balanceKNC / 10 ** CONFIG.token.decimals;
    document.getElementById("tokenBalance").innerText = `${formattedKNC.toFixed(2)} ${CONFIG.token.symbol}`;
  } catch (err) {
    console.error("❌ Gagal ambil saldo:", err);
  }
}

// =======================
// AUTO HANDLE EVENTS
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

// =======================
// BUY TOKEN
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

    const tx = await web3.eth.sendTransaction({
      from: currentAccount,
      to: CONFIG.token.contractAddress, // kontrak token (pastikan support menerima BNB)
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

// =======================
// SWAP TOKEN
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

    const contract = new web3.eth.Contract(CONFIG.token.abi, CONFIG.token.contractAddress);

    // pastikan kontrak token punya fungsi swap()
    const tx = await contract.methods.swap(
      web3.utils.toWei(amount, "ether")
    ).send({ from: currentAccount });

    console.log("✅ Swap berhasil:", tx);
    alert("✅ Swap sukses! Tx Hash: " + tx.transactionHash);
    loadBalances();
  } catch (err) {
    console.error("❌ Swap gagal:", err);
    alert("❌ Swap gagal: " + err.message);
  }
}
