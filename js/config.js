// Config jaringan & token
const CONFIG = {
  network: {
    chainId: "0x38", // BSC Mainnet
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
    contractAddress: "0x1390f63AF92448c46368443496a2bfc1469558de" // ganti dgn address token asli
  }
};
