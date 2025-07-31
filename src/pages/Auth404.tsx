import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Logo.png";
import { Heading } from "../components/General/Heading";
import Button from "../components/General/Button";

export const Auth404 = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="relative w-[1000px] h-[600px] max-w-full border border-border rounded-lg shadow-lg flex flex-col items-center justify-center px-6 md:px-12 bg-white">
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-12" />
          <Heading size="xl" className="text-black">
            GABAY
          </Heading>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 mt-8 w-full">
          <div className="text-5xl font-bold tracking-tight text-primary text-center">
            Wrong Link
          </div>

          <div className="text-lg text-black-600 text-center max-w-[550px] leading-relaxed">
            Hi! If you're trying to sign in or create a new account, please use
            one of the links the devs sent you!
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm font-Work-Sans text-center text-gray-500">
            Need help? Contact the development team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth404;
