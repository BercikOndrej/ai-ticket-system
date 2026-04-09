import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../lib/auth-client";

export default function AdminRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="loading">Loading...</div>;
  }

  if (!session || session.user.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
