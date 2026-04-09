import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../lib/auth-client";
import { UserRole } from "../../../server/src/enums";

export default function AdminRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="loading">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.Admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
