import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { signOut, useSession } from "../lib/auth-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "../../../server/src/enums";

export default function Navbar() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      <nav className="flex justify-between items-center px-6 h-14 bg-background">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 transition-transform duration-200 hover:scale-105">
            <Logo />
            <span className="text-base font-semibold">SimpleTickets</span>
          </Link>
          {session?.user?.role === UserRole.Admin && (
            <Link
              to="/users"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Users
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session?.user?.name}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </nav>
      <Separator />
    </>
  );
}
