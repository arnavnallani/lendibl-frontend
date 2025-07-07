import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
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
  message?: string;
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', message }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, register } = useAuth();

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
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      username: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    // Capture current scroll position before login
    const currentScrollPosition = window.scrollY;
    localStorage.setItem('authScrollPosition', currentScrollPosition.toString());
    
    try {
      await login(data.email, data.password);
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      onClose();
      loginForm.reset();
      
      // Restore scroll position after successful login with multiple attempts
      const restoreScroll = () => {
        const savedPosition = localStorage.getItem('authScrollPosition');
        if (savedPosition) {
          window.scrollTo(0, parseInt(savedPosition));
          localStorage.removeItem('authScrollPosition');
        }
      };
      
      setTimeout(restoreScroll, 0);
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 100);
      setTimeout(restoreScroll, 200);
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    // Capture current scroll position before registration
    const currentScrollPosition = window.scrollY;
    localStorage.setItem('authScrollPosition', currentScrollPosition.toString());
    
    try {
      await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      });
      toast({
        title: 'Welcome to Lendibl!',
        description: 'Your account has been created successfully.',
      });
      onClose();
      registerForm.reset();
      
      // Restore scroll position after successful registration with multiple attempts
      const restoreScroll = () => {
        const savedPosition = localStorage.getItem('authScrollPosition');
        if (savedPosition) {
          window.scrollTo(0, parseInt(savedPosition));
          localStorage.removeItem('authScrollPosition');
        }
      };
      
      setTimeout(restoreScroll, 0);
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 100);
      setTimeout(restoreScroll, 200);
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-dark">Welcome to lendibl</DialogTitle>
        </DialogHeader>

        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm font-medium text-center">{message}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  {...loginForm.register('email')}
                  className="rounded-xl"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...loginForm.register('password')}
                    className="rounded-xl pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-medium" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-medium" />
                    )}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary text-white font-semibold py-3 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-firstName">First Name</Label>
                  <Input
                    id="register-firstName"
                    placeholder="John"
                    {...registerForm.register('firstName')}
                    className="rounded-xl"
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-lastName">Last Name</Label>
                  <Input
                    id="register-lastName"
                    placeholder="Doe"
                    {...registerForm.register('lastName')}
                    className="rounded-xl"
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  placeholder="johndoe"
                  {...registerForm.register('username')}
                  className="rounded-xl"
                />
                {registerForm.formState.errors.username && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  {...registerForm.register('email')}
                  className="rounded-xl"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    {...registerForm.register('password')}
                    className="rounded-xl pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-medium" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-medium" />
                    )}
                  </Button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirmPassword">Confirm Password</Label>
                <Input
                  id="register-confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...registerForm.register('confirmPassword')}
                  className="rounded-xl"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary text-white font-semibold py-3 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}