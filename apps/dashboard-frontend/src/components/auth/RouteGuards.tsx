import { Navigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useElysiaClient } from "@/providers/Eden";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--background)", color: "var(--foreground-3)" }}
    >
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

function useAuthProfile() {
  const elysiaClient = useElysiaClient();
  return useQuery({
    queryKey: ["auth-profile"],
    queryFn: async () => {
      const response = await elysiaClient.auth.profile.get();
      if (response.error) {
        throw new Error("Unauthorized");
      }
      return response.data;
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const profileQuery = useAuthProfile();

  if (profileQuery.isLoading) return <AuthLoading />;
  if (profileQuery.isError || !profileQuery.data) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const profileQuery = useAuthProfile();

  if (profileQuery.isLoading) return <AuthLoading />;
  if (profileQuery.isError || !profileQuery.data) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  if (profileQuery.data.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
