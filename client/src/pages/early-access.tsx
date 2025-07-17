import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import lendiblLogo from "@assets/lendibl_logo1_1750383971030.png";

const earlyAccessSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type EarlyAccessFormData = z.infer<typeof earlyAccessSchema>;

export default function EarlyAccess() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<EarlyAccessFormData>({
    resolver: zodResolver(earlyAccessSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: EarlyAccessFormData) => 
      apiRequest("POST", "/api/early-access-signup", data),
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Welcome to early access!",
        description: "Thank you for joining our early access list. We'll be in touch soon!",
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to sign up. Please try again.";
      toast({
        title: "Sign up failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EarlyAccessFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      {/* Header with centered logo */}
      <header className="w-full py-8 flex justify-center">
        <img 
          src={lendiblLogo} 
          alt="lendibl logo" 
          className="h-12 md:h-16"
        />
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            It all starts Friday,
            <br />
            <span className="text-blue-600">July 18th</span>
          </h1>

          {/* Form card */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
            <CardContent className="p-8">
              {!isSubmitted ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">First Name *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter your first name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Last Name *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter your last name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Email Address *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter your email address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={signupMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg transition-colors"
                    >
                      {signupMutation.isPending ? "Joining..." : "Join us"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    You're in!
                  </h2>
                  <p className="text-gray-600">
                    Thank you for joining our early access list. We'll notify you as soon as lendibl launches!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom section with large logo and LinkedIn */}
      <footer className="w-full py-12 flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-6">
          <img 
            src={lendiblLogo} 
            alt="lendibl logo" 
            className="h-20 md:h-24"
          />
          <a 
            href="https://www.linkedin.com/company/lendibl/?viewAsMember=true"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            aria-label="Visit lendibl on LinkedIn"
          >
            <svg 
              className="w-6 h-6" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}