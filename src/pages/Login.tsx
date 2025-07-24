import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/Logo.png";
import Input from "../components/General/Input";
import Button from "../components/General/Button";
import { Heading } from "../components/General/Heading";
import { useAuth } from "../lib/db/db.auth";

function Login() {
  const navigate = useNavigate();
  const { login, loggingIn } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (username.trim() === "" || password.trim() === "") {
      alert("Please enter both username and password to log in.");
      return;
    }

    const success = await login(username, password);
    if (!success) {
      alert("Login failed. Please check your credentials.");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-[1000px] h-[600px] max-w-full border border-border rounded-lg shadow-lg flex flex-col items-center justify-center px-6 md:px-12 bg-white">
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-12" />
          <Heading size="xl" className="text-black">
            GABAY
          </Heading>
        </div>

        <form
          onSubmit={handleLogin}
          className="flex flex-col items-center justify-center gap-10 mt-8 w-full"
        >
          <Input
            id="username"
            placeholder="Username"
            size="custom"
            className="w-[550px] max-w-full h-12"
            inputClassName="w-full h-full border-border bg-main"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            id="password"
            type="password"
            placeholder="Password"
            size="custom"
            className="w-[550px] max-w-full h-12"
            inputClassName="w-full h-full border-border bg-main"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            size="sm"
            className="w-[550px] max-w-full"
            disabled={loggingIn}
          >
            {loggingIn ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-8">
          <p className="text-sm font-Work-Sans text-center">
            Don&apos;t have an account?{" "}
            <Link
              to="/sign-up"
              className="text-primary hover:underline cursor-pointer"
            >
              Sign up.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
