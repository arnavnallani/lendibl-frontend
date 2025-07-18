import { useState, useEffect } from "react";
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
import { motion } from "framer-motion";
import lendiblLogo from "@assets/lendibl_logo1_1750383971030.png";

const earlyAccessSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type EarlyAccessFormData = z.infer<typeof earlyAccessSchema>;

export default function EarlyAccess() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { toast } = useToast();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Track mouse movement for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Subtle animated gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.8) 25%, rgba(15, 23, 42, 0.9) 50%, rgba(15, 23, 42, 1) 100%)`
        }}
      />

      {/* Subtle floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: 0
            }}
            animate={{ 
              y: [null, -100, -200],
              scale: [0, 1, 0],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 12 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 12,
            }}
          />
        ))}
      </div>

      {/* Header with animated logo */}
      <motion.header 
        className="w-full py-8 flex justify-center relative z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <motion.img 
          src={lendiblLogo} 
          alt="lendibl logo" 
          className="h-12 md:h-16 filter drop-shadow-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
      </motion.header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <motion.div 
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Main heading with enhanced readability */}
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-12 relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <motion.span 
              className="font-black leading-tight"
              style={{
                color: '#fbbf24',
                textShadow: '3px 3px 0px rgba(0,0,0,1), 6px 6px 12px rgba(0,0,0,0.8)'
              }}
              animate={{ 
                color: ['#fbbf24', '#f59e0b', '#fbbf24'],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              The wait is almost over...
            </motion.span>
            
            {/* Subtle glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-yellow-400/10 to-blue-500/5 blur-2xl -z-10"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.h1>

          {/* Form card with enhanced glass morphism */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Card className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white">
              <CardContent className="p-8">
                {!isSubmitted ? (
                  <Form {...form}>
                    <motion.form 
                      onSubmit={form.handleSubmit(onSubmit)} 
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 1 }}
                    >
                      <div className="space-y-6">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 1.1 }}
                        >
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-800 font-semibold text-sm">
                                  First Name *
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500 transition-all duration-300 font-medium"
                                    placeholder="Enter your first name"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600 font-medium" />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 1.2 }}
                        >
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-800 font-semibold text-sm">
                                  Last Name *
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500 transition-all duration-300 font-medium"
                                    placeholder="Enter your last name"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600 font-medium" />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 1.3 }}
                        >
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-800 font-semibold text-sm">
                                  Email Address *
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="email"
                                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500 transition-all duration-300 font-medium"
                                    placeholder="Enter your email address"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600 font-medium" />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.4 }}
                      >
                        <Button 
                          type="submit" 
                          disabled={signupMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <motion.span
                            animate={signupMutation.isPending ? { opacity: [1, 0.7, 1] } : {}}
                            transition={signupMutation.isPending ? { duration: 1, repeat: Infinity } : {}}
                          >
                            {signupMutation.isPending ? "Joining the revolution..." : "Join the revolution"}
                          </motion.span>
                        </Button>
                      </motion.div>
                    </motion.form>
                  </Form>
                ) : (
                  <motion.div 
                    className="text-center space-y-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div 
                      className="text-8xl mb-6"
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🚀
                    </motion.div>
                    <motion.h2 
                      className="text-3xl font-bold text-gray-800 mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Welcome aboard!
                    </motion.h2>
                    <motion.p 
                      className="text-gray-700 text-lg leading-relaxed font-medium"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      You're now part of the lendibl revolution. Get ready to transform how the world shares!
                    </motion.p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom section with enhanced logo and LinkedIn */}
      <motion.footer 
        className="w-full py-16 flex flex-col items-center space-y-8 relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.6 }}
      >
        <motion.div 
          className="flex items-center space-x-8"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.img 
            src={lendiblLogo} 
            alt="lendibl logo" 
            className="h-24 md:h-32 filter drop-shadow-2xl"
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.a 
            href="https://www.linkedin.com/company/lendibl/?viewAsMember=true"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 text-white rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl group relative overflow-hidden"
            aria-label="Visit lendibl on LinkedIn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.svg 
              className="w-8 h-8 relative z-10" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </motion.svg>
            
            {/* LinkedIn button glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400/50 via-blue-300/50 to-blue-400/50 blur-lg -z-10"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.a>
        </motion.div>

        {/* Clear tagline */}
        <motion.p
          className="text-white text-center text-sm font-medium tracking-wide"
          style={{
            textShadow: '2px 2px 0px rgba(0,0,0,1), 4px 4px 8px rgba(0,0,0,0.8)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          The future of renting starts here
        </motion.p>

        {/* Hidden launch trigger - only visible to developers */}
        <div className="fixed bottom-4 right-4 opacity-10 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => {
              // Trigger marketplace launch
              window.dispatchEvent(new CustomEvent('launchMarketplace'));
              window.history.pushState({}, '', '/?launch=marketplace');
            }}
            className="text-xs text-white/50 hover:text-white bg-black/20 hover:bg-black/40 px-2 py-1 rounded border border-white/20"
          >
            Launch Marketplace
          </button>
        </div>
      </motion.footer>
    </div>
  );
}