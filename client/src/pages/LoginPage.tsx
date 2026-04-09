import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router-dom";
import { signIn, useSession } from "../lib/auth-client";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  if (isPending) {
    return <div className="loading">Loading...</div>;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginFormValues) => {
    setServerError("");

    const { error: signInError } = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setServerError(signInError.message || "Invalid email or password");
      return;
    }

    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Ticket System</h1>
        <p className="login-subtitle">Sign in to your account</p>
        {serverError && <div className="error-message">{serverError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="admin@example.com"
            className={errors.email ? "input-error" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p className="field-error">{errors.email.message}</p>
          )}
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            className={errors.password ? "input-error" : ""}
            {...register("password")}
          />
          {errors.password && (
            <p className="field-error">{errors.password.message}</p>
          )}
          <button type="submit" className="btn-login" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
