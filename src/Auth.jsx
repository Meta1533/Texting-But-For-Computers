import { useState } from "react";
import { supabase } from "./supabase";

function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      username: username,
    },
  },
});

if (error) {
  setError(error.message);
  return;
}



      if (error) {
        setError(error.message);
        return;
      }

      setMessage("Account created! Check your email if confirmation is required.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      onLogin(data.user);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>Friend Chat</h1>

        <h2>{isSignUp ? "Create account" : "Welcome back"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {isSignUp && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={3}
            maxLength={20}
  />
)}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />

          <button type="submit">
            {isSignUp ? "Create account" : "Log in"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button
          className="switch-auth"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setMessage("");
          }}
        >
          {isSignUp
            ? "Already have an account? Log in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}

export default Auth;
