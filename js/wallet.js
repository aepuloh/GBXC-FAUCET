let web3;
let currentAccount = null;

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

async function selectWallet(type) {
  if (!window.ethereum) {
    alert("❌ Wallet extension tidak terdeteksi.");
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

  // Reset saldo di UI
  document.getElementById("bnbBalance").innerText = "0 BNB";
  document.getElementById("tokenBalance").innerText = "0 " + CONFIG.token.symbol;
}

// UI update
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

// 🚀 Fungsi ambil saldo BNB & Token
async function loadBalances() {
  if (!web3 || !currentAccount) return;

  try {
    // Ambil saldo BNB
    const balanceBNB = await web3.eth.getBalance(currentAccount);
    const formattedBNB = web3.utils.fromWei(balanceBNB, "ether");
    document.getElementById("bnbBalance").innerText = `${parseFloat(formattedBNB).toFixed(4)} BNB`;

    // Ambil saldo token KNC (ERC20 standard)
    const tokenAbi = [
      {
        "constant": true,
        "inputs": [{ "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
      }
    ];
    const token = new web3.eth.Contract(tokenAbi, CONFIG.token.contractAddress);
    const balanceKNC = await token.methods.balanceOf(currentAccount).call();
    const formattedKNC = balanceKNC / 10 ** CONFIG.token.decimals;
    document.getElementById("tokenBalance").innerText = `${formattedKNC.toFixed(2)} ${CONFIG.token.symbol}`;
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
      to: CONFIG.token.contractAddress, // kontrak token (pastikan ada fungsi receive BNB → mint KNC)
      value: web3.utils.toWei(amountBNB, "ether"),
    });

    console.log("✅ Buy berhasil:", tx);
    alert("✅ Buy sukses! Tx Hash: " + tx.transactionHash);
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
  } catch (err) {
    console.error("❌ Swap gagal:", err);
    alert("❌ Swap gagal: " + err.message);
  }
}
