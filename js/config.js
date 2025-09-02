// Config jaringan & token
const CONFIG = {
  network: {
    chainId: "0x38", // Hex string, BSC Mainnet
    chainName: "BNB Smart Chain",
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"],
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
  },
  token: {
    name: "KenariCoin",
    symbol: "KNC",
    decimals: 18,
    contractAddress: "0x1390f63AF92448c46368443496a2bfc1469558de",
    abi: [
      // ==== ABI minimal ERC20 ====
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          { "name": "_to", "type": "address" },
          { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "success", "type": "bool" }],
        "type": "function"
      }
    ]
  }
};
