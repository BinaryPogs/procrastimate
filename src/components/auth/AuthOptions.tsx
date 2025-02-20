'use client'

import { useState } from 'react'
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FcGoogle } from "react-icons/fc"
import { MdEmail } from "react-icons/md"
import { FaGithub } from "react-icons/fa"
import { toast } from 'sonner'
import { 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from '@/lib/validations/auth'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Eye, EyeOff } from 'lucide-react'
import { Progress } from "@/components/ui/progress"

type AuthMode = 'email' | 'credentials' | null

function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength += 25
  if (/[A-Z]/.test(password)) strength += 25
  if (/[a-z]/.test(password)) strength += 25
  if (/[0-9@$!%*?&]/.test(password)) strength += 25
  return strength
}

interface AuthError {
  message: string;
}

export default function AuthOptions() {
  const [authMode, setAuthMode] = useState<AuthMode>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SignUpInput | SignInInput>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(isSignUp && { name: '' }),
    },
  })

  const onSubmit = async (values: SignUpInput | SignInInput) => {
    setIsLoading(true)
    try {
      if (isSignUp) {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error)
        }
      }

      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          form.setError("password", { 
            message: "Invalid email or password" 
          })
          return
        }
        throw new Error(result.error)
      }

      if (result?.ok) {
        window.location.href = '/'
      }
    } catch (error: unknown) {
      const authError = error as AuthError
      toast.error(authError.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }
    await signIn('email', { email })
  }

  if (authMode === 'email') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Sign in with Email</DialogTitle>
          <DialogDescription>
            We&apos;ll send you a magic link to sign in
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAuthMode(null)}>
            Back
          </Button>
          <Button onClick={handleEmailLogin}>
            Send Link
          </Button>
        </div>
      </>
    )
  }

  if (authMode === 'credentials') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</DialogTitle>
          <DialogDescription>
            {isSignUp 
              ? 'Enter your details to create a new account'
              : 'Enter your credentials to sign in'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isSignUp && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="space-y-2">
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    {isSignUp && field.value && (
                      <div className="space-y-2">
                        <Progress 
                          value={getPasswordStrength(field.value)} 
                          className="h-2"
                        />
                        <ul className="text-sm text-muted-foreground">
                          <li className={field.value.length >= 8 ? "text-green-600" : ""}>
                            • At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(field.value) ? "text-green-600" : ""}>
                            • One uppercase letter
                          </li>
                          <li className={/[a-z]/.test(field.value) ? "text-green-600" : ""}>
                            • One lowercase letter
                          </li>
                          <li className={/[@$!%*?&]/.test(field.value) ? "text-green-600" : ""}>
                            • One special character
                          </li>
                        </ul>
                      </div>
                    )}
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
              <Button variant="ghost" onClick={() => setAuthMode(null)}>
                Back
              </Button>
            </div>
          </form>
        </Form>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Welcome</DialogTitle>
        <DialogDescription>
          Create an account or sign in to continue
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 py-4">
        {/* Sign Up Section */}
        <h3 className="text-sm font-medium">New to the app?</h3>
        <Button 
          variant="default" 
          className="w-full" 
          onClick={() => {
            setAuthMode('credentials')
            setIsSignUp(true)
          }}
        >
          <MdEmail className="mr-2" />
          Create Account with Email
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign in with
            </span>
          </div>
        </div>

        {/* Sign In Section */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => signIn('google')}
        >
          <FcGoogle className="mr-2" />
          Continue with Google
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => signIn('github')}
        >
          <FaGithub className="mr-2" />
          Continue with GitHub
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => {
            setAuthMode('credentials')
            setIsSignUp(false)
          }}
        >
          <MdEmail className="mr-2" />
          Sign in with Email
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => setAuthMode('email')}
        >
          <MdEmail className="mr-2" />
          Sign in with Magic Link
        </Button>
      </div>
    </>
  )
} 