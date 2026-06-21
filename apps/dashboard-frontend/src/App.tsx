import type { App } from "app";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router";
import { Signin } from "./pages/auth/Signin";
import { Signup } from "./pages/auth/Signup";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Credits } from "./pages/dashboard/Credits";
import { ApiKeys } from "./pages/dashboard/ApiKeys";
import { Chat } from "./pages/playground/Chat";
import { Sdks } from "./pages/dashboard/Sdks";
import { Analytics } from "./pages/dashboard/Analytics";
import { Landing } from "./pages/marketing/Landing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ElysiaClientContextProvider } from "./providers/Eden";
import { treaty } from "@elysiajs/eden";

import { ManageModels } from "./pages/admin/Models";
import { ManageProviders } from "./pages/admin/Providers";
import { ManageCompanies } from "./pages/admin/Companies";
import { PlatformStats } from "./pages/admin/Stats";
import { AdminUsers } from "./pages/admin/Users";

import { ThemeProvider } from "@/providers/ThemeProvider";

const API_URL = process.env.API_URL || "http://localhost:3000";
const client = treaty<App>(API_URL, {
  fetch: {
    credentials: 'include'
  }
});

const queryClient = new QueryClient()

export function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <ElysiaClientContextProvider value={client}>
            <BrowserRouter>
              <Routes>
                <Route path={"/"} element={<Landing />} /> 
                <Route path={"/signup"} element={<Signup />} /> 
                <Route path={"/signin"} element={<Signin />} /> 
                <Route path={"/dashboard"} element={<Dashboard />} /> 
                <Route path={"/credits"} element={<Credits />} /> 
                <Route path={"/api-keys"} element={<ApiKeys />} /> 
                <Route path={"/analytics"} element={<Analytics />} /> 
                <Route path={"/playground"} element={<Chat />} /> 
                <Route path={"/sdks"} element={<Sdks />} /> 
                
                {/* Admin Routes */}
                <Route path={"/admin/models"} element={<ManageModels />} /> 
                <Route path={"/admin/providers"} element={<ManageProviders />} /> 
                <Route path={"/admin/stats"} element={<PlatformStats />} /> 
                <Route path={"/admin/companies"} element={<ManageCompanies />} />
                <Route path={"/admin/users"} element={<AdminUsers />} />
              </Routes>
            </BrowserRouter>
        </ElysiaClientContextProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
