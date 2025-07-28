import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import Input from "../components/General/Input";
import Button from "../components/General/Button";
import { Heading } from "../components/General/Heading";
import { useAuth } from "../lib/db/db.auth";
import Toast from "../components/General/Toast"; // adjust import path if needed

function SignUp() {
  const { register, registering } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSignUp = async () => {
    if (!username.trim()) return triggerToast("Username is required.", "error");
    if (username.trim().length < 3) return triggerToast("Username must be at least 3 characters long.", "error");
    if (username.trim().length > 50) return triggerToast("Username must be at most 50 characters long.", "error");
    if (!password.trim()) return triggerToast("Password is required.", "error");
    if (password.trim().length < 6)
      return triggerToast(
        "Password is too short (min. 6 characters).",
        "error"
      );
    if (password.trim().length > 128) return triggerToast("Password is too long (max. 128 characters).", "error");
    if (!confirmPassword.trim())
      return triggerToast("Confirm Password is required.", "error");
    if (password.trim() !== confirmPassword.trim())
      return triggerToast("Password does not match confirmation.", "error");

    try {
      const success = await register(username, password, false);
      if (success) {
        triggerToast("Successfully registered account!", "success");
        setTimeout(() => navigate("/login"), 1500); // delay navigation to let toast show
      } else {
        triggerToast("Username already exists. Please choose a different username.", "error");
      }
    } catch (err: any) {
      triggerToast("Registration failed. Please try again.", "error");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="relative w-[1000px] h-[600px] max-w-full border border-border rounded-lg shadow-lg flex flex-col items-center justify-center px-6 md:px-12 bg-white">
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

          <Button
            type="button"
            size="sm"
            className="w-[550px] max-w-full"
            disabled={registering}
            onClick={handleSignUp}
          >
            {registering ? "Signing up..." : "Sign Up"}
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

        {/* Toast at bottom */}
        {showToast && (
          <div className="absolute bottom-6">
            <Toast
              message={toastMessage}
              type={toastType}
              onClose={() => setShowToast(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SignUp;
