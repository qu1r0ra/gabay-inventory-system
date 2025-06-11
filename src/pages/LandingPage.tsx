import { useState } from "react";
import "../Layout.css";
import LoginForm from "../components/LoginForm";
import SignUpForm from "../components/SignUpForm";

function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const toggleForm = () => setIsLogin(!isLogin);

  return (
    <div className="flex">
      <main>
        <h2>Main Content</h2>
        {isLogin ? <LoginForm /> : <SignUpForm />}
        <button onClick={toggleForm}>
          {isLogin
            ? "Don't have an account? Sign up."
            : "Already have an account? Login."}
        </button>
        <br />
      </main>

      <div>
        <p>Insert image of Gabay or tagline.</p>
      </div>
    </div>
  );
}

export default LandingPage;
