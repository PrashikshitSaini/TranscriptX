import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { FaEnvelope, FaLock, FaUser, FaSpinner } from "react-icons/fa";
import TranscriptIllustration from "./TranscriptIllustration";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: var(--bg-primary);
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FormSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  animation: ${fadeIn} 0.8s ease;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const IllustrationSection = styled.div`
  flex: 1;
  background-color: var(--accent-color);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    display: none;
  }

  &::before {
    content: "";
    position: absolute;
    width: 150%;
    height: 150%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(0, 0, 0, 0) 70%
    );
    top: -25%;
    left: -25%;
  }

  &::after {
    content: "";
    position: absolute;
    width: 150%;
    height: 150%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(0, 0, 0, 0) 60%
    );
    bottom: -25%;
    right: -25%;
  }
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 28px;
    color: var(--accent-color);
    margin: 0;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 6px 0 0 0;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid var(--bg-tertiary);
  border-radius: 8px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 16px;
  transition: all 0.3s;

  &:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 18px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: var(--accent-color);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 8px;

  &:hover {
    background-color: #3a76d8;
  }

  &:disabled {
    background-color: #5c93e5;
    cursor: not-allowed;
  }
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color, #3c3c3c);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background-color: var(--bg-secondary);
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  color: var(--text-secondary);

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid var(--border-color, #3c3c3c);
  }

  span {
    padding: 0 10px;
    font-size: 14px;
  }
`;

const ToggleForm = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 14px;
  color: var(--text-secondary);

  button {
    background: none;
    border: none;
    color: var(--accent-color);
    cursor: pointer;
    font-weight: bold;
    padding: 0 4px;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(234, 67, 53, 0.1);
  color: var(--danger-color);
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 1rem;
`;

const ForgotPassword = styled.button`
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  font-size: 14px;
  text-align: right;
  padding: 4px 0;
  margin-top: -8px;
  align-self: flex-end;
`;

const Spinner = styled(FaSpinner)`
  animation: ${spin} 1s linear infinite;
`;

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    login,
    signup,
    signInWithGoogle,
    error: authError,
    clearError,
    updateUserProfile,
  } = useAuth();

  useEffect(() => {
    // Clear any previous auth errors when component mounts
    clearError();
  }, [clearError]);

  useEffect(() => {
    // Set local error state if there's an auth error
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setLocalError("");
    clearError();
  };

  const validateForm = () => {
    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return false;
    }

    if (!isLogin && !name) {
      setLocalError("Please enter your name");
      return false;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        // Login
        await login(email, password);
      } else {
        // Signup with email and update profile
        await signup(email, password, name);
      }
    } catch (error) {
      console.error("Authentication error:", error.message);
      setLocalError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      clearError();
      setLocalError("");
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google auth error:", error.message);
      setLocalError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Implement password reset functionality here
    alert("Password reset functionality will be implemented soon.");
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <Container>
      <FormSection>
        <FormContainer>
          <Logo>
            <h1>TranscriptX</h1>
            <p>Record, Transcribe, and Generate Smart Notes</p>
          </Logo>

          {localError && <ErrorMessage>{localError}</ErrorMessage>}

          <Form onSubmit={handleEmailAuth}>
            {!isLogin && (
              <InputGroup>
                <InputIcon>
                  <FaUser />
                </InputIcon>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </InputGroup>
            )}

            <InputGroup>
              <InputIcon>
                <FaEnvelope />
              </InputIcon>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </InputGroup>

            <InputGroup>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </InputGroup>

            {isLogin && (
              <ForgotPassword
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
              </ForgotPassword>
            )}

            <SubmitButton type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner /> Processing...
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </SubmitButton>
          </Form>

          <Divider>
            <span>OR</span>
          </Divider>

          <GoogleButton
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <FcGoogle size={20} />
            Continue with Google
          </GoogleButton>

          <ToggleForm>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={toggleForm} disabled={loading}>
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </ToggleForm>
        </FormContainer>
      </FormSection>

      <IllustrationSection>
        <TranscriptIllustration />
      </IllustrationSection>
    </Container>
  );
}

export default Login;
