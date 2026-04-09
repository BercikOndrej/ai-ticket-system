import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div>
      <Navbar />
      <main className="py-8 px-6">
        <Outlet />
      </main>
    </div>
  );
}
