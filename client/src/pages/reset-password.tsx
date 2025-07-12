import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Debug logging
    console.log('Reset password page loaded');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset-token');
    
    console.log('Reset token found:', resetToken);
    
    if (resetToken) {
      setToken(resetToken);
      // Validate token immediately
      validateToken(resetToken);
    } else {
      console.log('No reset token found, redirecting to home');
      toast({
        title: "Invalid Link",
        description: "This password reset link is invalid or has expired.",
        variant: "destructive",
      });
      setTimeout(() => setLocation('/'), 2000);
    }
  }, [setLocation, toast]);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch(`/api/test/verify-token/${tokenToValidate}`);
      const data = await response.json();
      
      if (!data.valid) {
        toast({
          title: "Invalid Token",
          description: "This password reset link has expired or is invalid.",
          variant: "destructive",
        });
        setTimeout(() => setLocation('/'), 3000);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // Don't show error for token validation - just log it
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. You can now log in with your new password.",
        });
        
        // Redirect to home page after 3 seconds
        setTimeout(() => {
          setLocation('/');
        }, 3000);
      } else {
        toast({
          title: "Reset Failed",
          description: data.message || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">Password Reset Complete</CardTitle>
            <CardDescription className="text-gray-600">
              Your password has been successfully reset. You will be redirected to the home page shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => setLocation('/')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Home Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Reset Your Password</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your new password below to complete the reset process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && password.length < 6 && (
                <p className="text-sm text-red-600">Password must be at least 6 characters long</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword || password.length < 6}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                onClick={() => setLocation('/')}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Back to Home
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}