"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.forgetPassword({
        email: data.email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setError(
          result.error.message ??
            "An unexpected error occurred. Please try again."
        );
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-6 shadow rounded-lg flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            We've sent a password reset link to your email address.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="space-y-3 w-full">
            <Button
              onClick={() => {
                setSuccess(false);
                form.reset();
              }}
              variant="outline"
              className="w-full"
            >
              Try again
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 shadow rounded-lg flex flex-col items-center gap-6">
      <div className="flex flex-col items-center w-full">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Forgot your password?
        </h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </Form>
      <div className="text-center">
        <Button variant="link" size="sm" asChild className="p-0 m-0">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
