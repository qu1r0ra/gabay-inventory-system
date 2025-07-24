import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Logo.png";
import Input from "../components/General/Input";
import Button from "../components/General/Button";
import { Heading } from "../components/General/Heading";

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-[1000px] h-[600px] max-w-full border border-border rounded-lg shadow-lg flex flex-col items-center justify-center px-6 md:px-12 bg-white">
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-12" />
          <Heading size="xl" className="text-black">
            GABAY
          </Heading>
        </div>

        <form className="flex flex-col items-center justify-center gap-6 mt-8 w-full">
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
            id="email"
            type="email"
            placeholder="Email"
            size="custom"
            className="w-[550px] max-w-full h-12"
            inputClassName="w-full h-full border-border bg-main"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirm Password"
            size="custom"
            className="w-[550px] max-w-full h-12"
            inputClassName="w-full h-full border-border bg-main"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" size="sm" className="w-[550px] max-w-full">
            Sign Up
          </Button>
        </form>

        <div className="mt-8">
          <p className="text-sm font-Work-Sans text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline cursor-pointer"
            >
              Log in.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
