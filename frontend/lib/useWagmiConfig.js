import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { RITUAL_CHAIN } from "./config";

export const config = createConfig({
  chains: [RITUAL_CHAIN],
  connectors: [injected()],
  transports: {
    [RITUAL_CHAIN.id]: http(),
  },
});
