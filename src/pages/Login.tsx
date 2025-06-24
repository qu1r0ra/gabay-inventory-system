import logo from "../assets/Logo.png";
import Input from "../components/Input";
import Button from "../components/Button";
import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/db/db.auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    // Fields are missing
    if (username.trim() === "" || password.trim() === "") {
      console.log("Login failed: Please enter both username and password.");
      alert("Please enter both username and password to log in.");
      return;
    }

    // Validate creds
    const success = await login(username, password);
    if (!success) return;
    navigate("dashboard");
  };

  return (
    <div className="flex w-screen min-h-screen overflow-hidden">
      <div className="w-1/2 bg-white flex flex-col items-center justify-start">
        <img src={logo} className="w-[200px] h-[200px] mt-12"></img>
        <h1 className="font-Poppins text-secondary font-bold mt-2 text-3xl">
          GABAY
        </h1>

        <form onSubmit={handleLogin} className="mt-8 w-[75%] px-4">
          <Input
            label="Username"
            id="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button size="md" type="submit" className="mt-8 mx-auto block">
            LOGIN
          </Button>
        </form>

        <p className="font-Work-Sans mt-2">
          Don’t have an account?{" "}
          <span className="text-primary underline">Sign up.</span>
        </p>
      </div>
      <div className="w-1/2 bg-primary flex items-center justify-center">
        Right Half Content (e.g., Branding or Image)
      </div>
    </div>
  );
}

export default Login;
