import { useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth-client";

export default function Navbar() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <span className="navbar-title">Ticket System</span>
      <div className="navbar-right">
        <span className="navbar-user">{session?.user?.name}</span>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
