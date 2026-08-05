import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { router } from "./routes";
import { queryClient } from "./lib/queryClient";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Mode for devs as it only affects development and checks unsafe code */}
    
    <QueryClientProvider client={queryClient}>
      {/* Every page can use this query client for querying pages */}
      
      <RouterProvider router={router} />
      {/* Here is where all routes live  they are essentiall react middle wares */}
      
    </QueryClientProvider>
  </StrictMode>
);
