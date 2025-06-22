import { http, createConfig } from "wagmi";
import { mainnet, sepolia, Chain } from "wagmi/chains";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";

const projectId = "<WALLETCONNECT_PROJECT_ID>";

const hardhat = {
  id: 31337, // chain id
  name: "Hardhat Localhost",
  //do not need network prop
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
    },
  },
} as const satisfies Chain;

export const config = createConfig({
  // chains
  chains: [hardhat],
  //wallet connectors
  connectors: [injected(), walletConnect({ projectId }), metaMask(), safe()],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});
