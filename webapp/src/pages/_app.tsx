import type { AppProps } from "next/app";
import { Layout } from "@/components/layout";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "../wagmi";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
          <Toaster />
        </Layout>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
