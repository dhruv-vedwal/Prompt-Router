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
import { API_URL } from "./config";
import { RequireAuth, RequireAdmin } from "./components/auth/RouteGuards";

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
                <Route path={"/dashboard"} element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path={"/credits"} element={<RequireAuth><Credits /></RequireAuth>} />
                <Route path={"/api-keys"} element={<RequireAuth><ApiKeys /></RequireAuth>} />
                <Route path={"/analytics"} element={<RequireAuth><Analytics /></RequireAuth>} />
                <Route path={"/playground"} element={<RequireAuth><Chat /></RequireAuth>} />
                <Route path={"/sdks"} element={<RequireAuth><Sdks /></RequireAuth>} />

                <Route path={"/admin/models"} element={<RequireAdmin><ManageModels /></RequireAdmin>} />
                <Route path={"/admin/providers"} element={<RequireAdmin><ManageProviders /></RequireAdmin>} />
                <Route path={"/admin/stats"} element={<RequireAdmin><PlatformStats /></RequireAdmin>} />
                <Route path={"/admin/companies"} element={<RequireAdmin><ManageCompanies /></RequireAdmin>} />
                <Route path={"/admin/users"} element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
                <Route path={"*"} element={<Landing />} />
              </Routes>
            </BrowserRouter>
        </ElysiaClientContextProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
