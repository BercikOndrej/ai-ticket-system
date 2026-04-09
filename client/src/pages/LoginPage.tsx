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
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-gray-500">
        Loading...
      </div>
    );
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

  const inputBase =
    "w-full px-3 py-2.5 border rounded-md text-[0.95rem] transition-colors focus:outline-none focus:ring-[3px]";

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-[400px]">
        <h1 className="text-2xl mb-1">Ticket System</h1>
        <p className="text-gray-500 mb-6">Sign in to your account</p>
        {serverError && (
          <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-md text-sm mb-4">
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="admin@example.com"
            className={`${inputBase} ${
              errors.email
                ? "border-red-600 mb-1 focus:border-red-600 focus:ring-red-600/10"
                : "border-gray-300 mb-4 focus:border-blue-600 focus:ring-blue-600/10"
            }`}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-600 text-xs mb-3">{errors.email.message}</p>
          )}
          <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            className={`${inputBase} ${
              errors.password
                ? "border-red-600 mb-1 focus:border-red-600 focus:ring-red-600/10"
                : "border-gray-300 mb-4 focus:border-blue-600 focus:ring-blue-600/10"
            }`}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-red-600 text-xs mb-3">{errors.password.message}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 text-white border-none rounded-md text-[0.95rem] font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:bg-[#93b4f5] disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
