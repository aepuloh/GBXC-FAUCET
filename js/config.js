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
    contractAddress: "0x0000000000000000000000000000000000000000" // ganti address token asli
  }
};
