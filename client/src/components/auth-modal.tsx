import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

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
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [verificationError, setVerificationError] = useState<string>('');
  const { toast } = useToast();
  const { login, register } = useAuth();

  // Check for reset token in URL parameters when modal opens
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('reset-token');
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
        setShowForgotPassword(true);
        resetPasswordForm.setValue('token', tokenFromUrl);
        // Clean up URL parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('reset-token');
        window.history.replaceState({}, document.title, newUrl.toString());
      }
    }
  }, [isOpen]);

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
      phone: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      onClose();
      loginForm.reset();
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
    setVerificationState('verifying');
    setVerificationError('');
    
    try {
      // Simulate AI verification delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 1: Instant email verification (no email sending required)
      const emailResponse = await apiRequest('POST', '/api/auth/verify-email-instant', {
        email: data.email,
      });
      
      const emailResult = await emailResponse.json();
      
      if (!emailResult.success || !emailResult.valid) {
        throw new Error(emailResult.message || 'Email verification failed');
      }
      
      // Step 2: Instant phone verification (no SMS required)
      const phoneResponse = await apiRequest('POST', '/api/auth/verify-instant', {
        phoneNumber: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      
      const phoneResult = await phoneResponse.json();
      
      if (!phoneResult.success || !phoneResult.valid) {
        throw new Error(phoneResult.message || 'Phone number verification failed');
      }
      
      // Step 3: Complete registration with verified email and phone
      await register({
        email: emailResult.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        phone: phoneResult.phoneNumber,
        phoneVerified: true,
        emailVerified: true,
      });
      
      // Show success state
      setVerificationState('success');
      
      // Wait a moment to show success, then close
      setTimeout(() => {
        toast({
          title: 'Welcome to lendibl!',
          description: 'Your account has been created successfully with verified email and phone.',
        });
        
        // Reset state and close modal
        setVerificationState('idle');
        onClose();
        registerForm.reset();
      }, 1500);
      
    } catch (error) {
      setVerificationState('failed');
      setVerificationError('Verification Failed. Would you like to edit your registration information and try again?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRegistration = () => {
    setVerificationState('idle');
    setVerificationError('');
  };

  // Removed old verification functions - now using instant verification

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/forgot-password', { email: data.email });
      const result = await response.json();
      
      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions.',
      });
      
      setShowForgotPassword(false);
      forgotPasswordForm.reset();
    } catch (error) {
      toast({
        title: 'Failed to send reset email',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token: data.token,
        password: data.password,
      });
      
      toast({
        title: 'Password reset successful',
        description: 'Your password has been updated. You can now log in.',
      });
      
      setResetToken('');
      setShowForgotPassword(false);
      resetPasswordForm.reset();
    } catch (error) {
      toast({
        title: 'Password reset failed',
        description: error instanceof Error ? error.message : 'Invalid or expired token',
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

              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    const currentEmail = loginForm.getValues('email');
                    if (currentEmail) {
                      forgotPasswordForm.setValue('email', currentEmail);
                    }
                    setShowForgotPassword(true);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot your password?
                </button>
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
              
              <p className="text-xs text-gray-500 text-center mt-4">
                By logging in, you agree to lendibl's{' '}
                <a 
                  href="/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            {verificationState === 'verifying' ? (
              // AI Verification Screen
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">Verifying with AI...</h3>
                </div>
              </div>
            ) : verificationState === 'success' ? (
              // Success Screen
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-green-600">Verified!</h3>
                  <p className="text-gray-600">
                    Your account has been successfully created and verified.
                  </p>
                </div>
              </div>
            ) : verificationState === 'failed' ? (
              // Failed Screen
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <XCircle className="w-16 h-16 text-red-500" />
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold text-red-600">Verification Failed</h3>
                  <p className="text-gray-600">
                    {verificationError || 'Would you like to edit your registration info?'}
                  </p>
                  <button
                    onClick={handleBackToRegistration}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Back to registration
                  </button>
                </div>
              </div>
            ) : (
              // Registration Form
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
                <Label htmlFor="register-phone">Phone Number</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...registerForm.register('phone')}
                  className="rounded-xl"
                />
                {registerForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.phone.message}</p>
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
              
              <p className="text-xs text-gray-500 text-center mt-4">
                By creating an account, you agree to lendibl's{' '}
                <a 
                  href="/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </form>
            )}
          </TabsContent>
        </Tabs>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="absolute inset-0 bg-white rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgotPassword(false)}
                  className="p-0 h-auto mr-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">Reset Password</h2>
              </div>

              {!resetToken ? (
                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="your@email.com"
                      {...forgotPasswordForm.register('email')}
                      className="rounded-xl"
                    />
                    {forgotPasswordForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{forgotPasswordForm.formState.errors.email.message}</p>
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
                        Sending...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Enter your reset token and new password.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reset-token">Reset Token</Label>
                    <Input
                      id="reset-token"
                      placeholder="Enter the token from your email"
                      {...resetPasswordForm.register('token')}
                      className="rounded-xl"
                    />
                    {resetPasswordForm.formState.errors.token && (
                      <p className="text-sm text-red-500">{resetPasswordForm.formState.errors.token.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        {...resetPasswordForm.register('password')}
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
                    {resetPasswordForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{resetPasswordForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-confirmPassword">Confirm New Password</Label>
                    <Input
                      id="reset-confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      {...resetPasswordForm.register('confirmPassword')}
                      className="rounded-xl"
                    />
                    {resetPasswordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
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
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setResetToken(resetToken ? '' : 'show-form')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {resetToken ? 'Back to email step' : 'Already have a reset token?'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}