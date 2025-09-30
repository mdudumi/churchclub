import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function NextStepLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    navigate("/kbbt/nextstep");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl font-semibold mb-4 text-center">NextStep Login</h2>
        <input className="border p-2 w-full mb-3" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 w-full mb-4" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="bg-green-600 text-white w-full py-2 rounded">Login</button>
      </form>
    </div>
  );
}
