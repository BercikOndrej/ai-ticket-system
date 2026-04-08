import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/health")
      .then((res) => res.json())
      .then((data) => setMessage(data.status))
      .catch(() => setMessage("Failed to connect to server"));
  }, []);

  return (
    <div>
      <h1>Ticket System</h1>
      <p>Server status: {message || "Loading..."}</p>
    </div>
  );
}

export default App;
