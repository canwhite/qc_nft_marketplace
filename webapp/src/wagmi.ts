import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { Chain } from "wagmi/chains";

const hardhat = {
  id: 31337, // chain id
  name: "Hardhat Localhost",
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
  chains: [mainnet, sepolia],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});
