import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to lendibl.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    try {
      await register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
      });
      toast({
        title: "Welcome to lendibl!",
        description: "Your account has been created successfully.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-white/95 backdrop-blur-lg border-2 border-gray-light rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-center text-gray-dark">
            Welcome to lendibl
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-light/50 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-sm font-medium text-gray-dark">
                    Email
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 rounded-xl border-2 focus:ring-2 focus:ring-primary-blue"
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="login-password" className="text-sm font-medium text-gray-dark">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 rounded-xl border-2 focus:ring-2 focus:ring-primary-blue"
                      {...loginForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-medium hover:text-gray-dark"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary text-white font-semibold py-3 rounded-xl hover-lift"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-dark">
                      First Name
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="pl-10 rounded-xl border-2 focus:ring-2 focus:ring-primary-blue"
                        {...registerForm.register('firstName')}
                      />
                    </div>
                    {registerForm.formState.errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-dark">
                      Last Name
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className="pl-10 rounded-xl border-2 focus:ring-2 focus:ring-primary-blue"
                        {...registerForm.register('lastName')}
                      />
                    </div>
                    {registerForm.formState.errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-email" className="text-sm font-medium text-gray-dark">
                    Email
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10 rounded-xl border-2 focus:ring-2 focus:ring-primary-blue"
                      {...registerForm.register('email')}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="username" className="text-sm font-medium text-gray-dark">
                    Username
                  </Label>
                  <div className="relative mt-1">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
                    <Input
                      id="username"
                      placeholder="johndoe"
                      className="pl-10 rounded-xl border-2 focus:ring-2 focus:ring-primary-blue"
                      {...registerForm.register('username')}
                    />
                  </div>
                  {registerForm.formState.errors.username && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-password" className="text-sm font-medium text-gray-dark">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="pl-10 pr-10 rounded-xl border-2 focus:ring-2 focus:ring-primary-blue"
                      {...registerForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-medium hover:text-gray-dark"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-dark">
                    Confirm Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10 rounded-xl border-2 focus:ring-2 focus:ring-primary-blue"
                      {...registerForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-medium hover:text-gray-dark"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary text-white font-semibold py-3 rounded-xl hover-lift"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}