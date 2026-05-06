"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as authService from "@/services/auth";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    rememberMe: boolean;
  }>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleInputChange = (key: string, value: unknown) => {
    setCredentials((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (value && value.toString().trim() !== "") {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const nextFieldErrors: { email?: string; password?: string } = {};
    const trimmedEmail = credentials.email.trim();
    if (!trimmedEmail) {
      nextFieldErrors.email = "Email is required";
    } else if (!isValidEmail(trimmedEmail)) {
      nextFieldErrors.email = "Enter a valid email";
    }
    if (!credentials.password) {
      nextFieldErrors.password = "Password is required";
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await authService.login(trimmedEmail, credentials.password);

      router.replace(next);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex items-center justify-center">
          <div className="w-full max-w-[80%] flex flex-col gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 mb-4">
                Welcome back
              </h1>
            </div>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                error={fieldErrors.email}
                value={credentials.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                type="email"
                placeholder="name@example.com"
              />

              <Input
                label="Password"
                error={fieldErrors.password}
                value={credentials.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                type="password"
                placeholder="••••••••"
              />

              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30"
                  checked={credentials.rememberMe}
                  onChange={(e) =>
                    handleInputChange("rememberMe", e.target.checked)
                  }
                />
                <label htmlFor="remember" className="text-xs text-gray-600">
                  Remember me
                </label>
              </div>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <Button
                className="w-full cursor-pointer"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </section>

        <section className="hidden bg-blue-600 lg:flex items-center justify-center">
          <div className="w-full flex flex-col justify-center text-white  max-w-[80%] gap-5">
            <div className="text-3xl font-semibold">ticktock</div>
            <p className="mt-6 text-sm leading-6 text-white/80">
              Introducing ticktock, our cutting-edge timesheet web application
              designed to revolutionize how you manage employee work hours. With
              ticktock, you can effortlessly track and monitor employee
              attendance and productivity from anywhere, anytime, using any
              internet-connected device.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
