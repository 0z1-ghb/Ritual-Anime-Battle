import { http, createConfig } from "wagmi";
import { RITUAL_CHAIN } from "./config";

export const config = createConfig({
  chains: [RITUAL_CHAIN],
  transports: {
    [RITUAL_CHAIN.id]: http(),
  },
});
