import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StarknetConfig, publicProvider } from '@starknet-react/core';
import { sepolia } from '@starknet-react/chains';
import { ControllerConnector } from '@cartridge/connector';
import Index from "./pages/Index";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RPS_CONTRACT_ADDRESS = "0x0638e6d45d476e71044f8e8d7119f6158748bf5bd56018e2f9275c96499c52b9";

// Cartridge Controller configuration for Sepolia testnet
const cartridgeConnector = new ControllerConnector({
  policies: [
    {
      target: RPS_CONTRACT_ADDRESS,
      method: "join_queue",
    },
    {
      target: RPS_CONTRACT_ADDRESS,
      method: "commit_move",
    },
    {
      target: RPS_CONTRACT_ADDRESS,
      method: "reveal_move",
    },
    {
      target: RPS_CONTRACT_ADDRESS,
      method: "claim_prize",
    }
  ]
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StarknetConfig
      chains={[sepolia]}
      provider={publicProvider()}
      connectors={[cartridgeConnector]}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/game" element={<Game />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </StarknetConfig>
  </QueryClientProvider>
);

export default App;
