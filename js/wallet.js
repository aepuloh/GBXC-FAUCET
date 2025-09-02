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
  } catch (error) {
    console.error("❌ Wallet connection failed:", error);
  }
}

function disconnectWallet() {
  currentAccount = null;
  web3 = null;
  updateUIDisconnected();
  showPage("contact");
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

// Auto handle disconnect dari wallet
if (window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      currentAccount = accounts[0];
    }
  });
}
