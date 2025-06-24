import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, User, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface SavedAccount {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  lastUsed: string;
}

interface AccountSwitcherProps {
  currentUser: any;
  onAccountSwitch: (token: string) => void;
  onLogout: () => void;
}

export function AccountSwitcher({ currentUser, onAccountSwitch, onLogout }: AccountSwitcherProps) {
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  // Load saved accounts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lendibl_saved_accounts');
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved accounts:', error);
      }
    }
  }, []);

  // Save accounts to localStorage
  const saveAccountsToStorage = (accounts: SavedAccount[]) => {
    localStorage.setItem('lendibl_saved_accounts', JSON.stringify(accounts));
    setSavedAccounts(accounts);
  };

  // Add current account to saved accounts if not already there
  const saveCurrentAccount = () => {
    if (!currentUser) return;
    
    const currentToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!currentToken) return;

    const existing = savedAccounts.find(acc => acc.email === currentUser.email);
    if (existing) {
      // Update existing account
      const updated = savedAccounts.map(acc => 
        acc.email === currentUser.email 
          ? { ...acc, token: currentToken, lastUsed: new Date().toISOString() }
          : acc
      );
      saveAccountsToStorage(updated);
    } else {
      // Add new account
      const newAccount: SavedAccount = {
        id: currentUser.id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        token: currentToken,
        lastUsed: new Date().toISOString()
      };
      saveAccountsToStorage([...savedAccounts, newAccount]);
    }
  };

  // Switch to different account
  const switchAccount = (account: SavedAccount) => {
    // Update last used timestamp
    const updated = savedAccounts.map(acc => 
      acc.id === account.id 
        ? { ...acc, lastUsed: new Date().toISOString() }
        : acc
    );
    saveAccountsToStorage(updated);

    // Switch to the account
    localStorage.setItem('auth_token', account.token);
    localStorage.setItem('token', account.token);
    onAccountSwitch(account.token);
    
    toast({
      title: "Account Switched",
      description: `Now logged in as ${account.firstName} ${account.lastName}`,
    });
  };

  // Remove account from saved list
  const removeAccount = (accountId: number) => {
    const updated = savedAccounts.filter(acc => acc.id !== accountId);
    saveAccountsToStorage(updated);
    
    toast({
      title: "Account Removed",
      description: "Account removed from saved accounts",
    });
  };

  // Add new account through login
  const handleAddAccount = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLogging(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Get user details
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${data.token}`,
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Add to saved accounts
          const newAccount: SavedAccount = {
            id: userData.user.id,
            email: userData.user.email,
            firstName: userData.user.firstName,
            lastName: userData.user.lastName,
            token: data.token,
            lastUsed: new Date().toISOString()
          };
          
          // Check if account already exists
          const existing = savedAccounts.find(acc => acc.email === newAccount.email);
          if (existing) {
            // Update existing
            const updated = savedAccounts.map(acc => 
              acc.email === newAccount.email ? newAccount : acc
            );
            saveAccountsToStorage(updated);
          } else {
            // Add new
            saveAccountsToStorage([...savedAccounts, newAccount]);
          }
          
          setShowAddAccount(false);
          setLoginForm({ email: "", password: "" });
          
          toast({
            title: "Account Added",
            description: `${userData.user.firstName} ${userData.user.lastName} added to account list`,
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Unable to add account",
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  // Auto-save current account when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      saveCurrentAccount();
    }
  }, [currentUser]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatLastUsed = (lastUsed: string) => {
    const date = new Date(lastUsed);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="w-80">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Account Switcher</p>
              <p className="text-xs leading-none text-muted-foreground">
                Switch between saved accounts
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Current Account */}
          <DropdownMenuItem className="flex items-center space-x-2 p-3 cursor-default">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {getInitials(currentUser.firstName, currentUser.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser.email}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Current
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Saved Accounts */}
          {savedAccounts
            .filter(account => account.email !== currentUser.email)
            .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
            .map((account) => (
              <DropdownMenuItem
                key={account.id}
                className="flex items-center space-x-2 p-3 cursor-pointer"
                onClick={() => switchAccount(account)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-600 text-white text-xs">
                    {getInitials(account.firstName, account.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {account.firstName} {account.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {account.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatLastUsed(account.lastUsed)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAccount(account.id);
                    }}
                  >
                    ×
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          
          <DropdownMenuSeparator />
          
          {/* Add Account */}
          <DropdownMenuItem
            className="flex items-center space-x-2 p-3 cursor-pointer"
            onClick={() => setShowAddAccount(true)}
          >
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Plus className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Add Account</p>
              <p className="text-xs text-muted-foreground">Login to another account</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Navigation Links */}
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/my-profile" className="flex items-center space-x-2 p-3 cursor-pointer">
              <User className="h-4 w-4" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center space-x-2 p-3 cursor-pointer">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Logout */}
          <DropdownMenuItem
            className="flex items-center space-x-2 p-3 cursor-pointer text-destructive"
            onClick={() => {
              onLogout();
              toast({
                title: "Logged Out",
                description: "You have been logged out of all accounts",
              });
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout All</span>
          </DropdownMenuItem>
        </div>

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLogging) {
                    handleAddAccount();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddAccount(false);
                  setLoginForm({ email: "", password: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAccount}
                disabled={isLogging || !loginForm.email || !loginForm.password}
              >
                {isLogging ? "Adding..." : "Add Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}