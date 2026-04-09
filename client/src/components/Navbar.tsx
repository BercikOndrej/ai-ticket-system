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
    <nav className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200">
      <span className="text-lg font-semibold">Ticket System</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{session?.user?.name}</span>
        <button
          className="px-3 py-1.5 bg-transparent border border-gray-300 rounded-md text-sm cursor-pointer transition-colors hover:bg-gray-100"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
