import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, signInSchema, forgotPasswordSchema, SignUpInput, SignInInput, ForgotPasswordInput } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Eye, EyeOff, Gift } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { signUp, signIn, resetPassword, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Redirect if already authenticated (but not if resetting password)
  useEffect(() => {
    if (user && !isResettingPassword) {
      navigate('/dashboard');
    }
  }, [user, navigate, isResettingPassword]);

  // Check for password reset flow
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        setActiveTab('reset');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Store referral code in localStorage if present
    if (referralCode) {
      localStorage.setItem('referral_code', referralCode);
      // Switch to signup tab if coming from referral link
      setActiveTab('signup');
    }
  }, [referralCode]);

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const resetPasswordForm = useForm<{ password: string; confirmPassword: string }>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handleSignUp = async (data: SignUpInput) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Account already exists',
          description: 'Please sign in or use a different email.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Success!',
        description: 'Please check your email to confirm your account.',
      });
      navigate('/onboarding/welcome');
    }
  };

  const handleSignIn = async (data: SignInInput) => {
    setLoading(true);
    
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        console.error('Sign in error:', error);
        
        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = (error as any)?.code || '';
        
        // Check for email not confirmed - often disguised as invalid credentials
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('confirm your email') ||
            errorCode === 'email_not_confirmed') {
          toast({
            title: 'Email Not Confirmed',
            description: 'Please check your email and click the confirmation link before signing in.',
            variant: 'destructive',
          });
        } 
        // Check for invalid credentials
        else if (errorMessage.includes('invalid login credentials') || 
                 errorMessage.includes('invalid email or password') ||
                 errorCode === 'invalid_credentials') {
          toast({
            title: 'Sign In Failed',
            description: 'Invalid email or password. If you just signed up, please confirm your email first. You can also try resetting your password.',
            variant: 'destructive',
          });
        }
        // Catch-all for other errors
        else {
          toast({
            title: 'Sign In Failed',
            description: error.message || 'Unable to sign in. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        // Success - show toast and navigation will happen in AuthContext
        toast({
          title: 'Welcome back!',
          description: 'Signing you in...',
        });
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordInput) => {
    setLoading(true);
    const { error } = await resetPassword(data.email);
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Password reset email sent. Please check your inbox.',
      });
      setActiveTab('signin');
    }
  };

  const handleResetPassword = async (data: { password: string; confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (data.password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password Updated!',
          description: 'Your password has been successfully reset.',
        });
        setIsResettingPassword(false);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">E</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {activeTab === 'reset' ? 'Reset Password' : activeTab === 'forgot' ? 'Forgot Password' : 'Welcome to ExHub'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'reset' ? 'Enter your new password below' : activeTab === 'forgot' ? 'We\'ll send you a reset link' : 'Your AI-powered learning companion'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activeTab !== 'forgot' && activeTab !== 'reset' && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    {...signInForm.register('email')}
                  />
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...signInForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => setActiveTab('forgot')}
                >
                  Forgot your password?
                </Button>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <LoadingSpinner /> : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              {referralCode && (
                <Alert className="bg-primary/10 border-primary">
                  <Gift className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    You're signing up with a referral code! You'll get <strong>100 bonus AI credits</strong> when you subscribe.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    {...signUpForm.register('fullName')}
                  />
                  {signUpForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    {...signUpForm.register('email')}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...signUpForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <PasswordStrength password={signUpForm.watch('password')} />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    {...signUpForm.register('confirmPassword')}
                  />
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={signUpForm.watch('agreeToTerms')}
                    onCheckedChange={(checked) => signUpForm.setValue('agreeToTerms', checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm leading-none">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
                {signUpForm.formState.errors.agreeToTerms && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.agreeToTerms.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <LoadingSpinner /> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}

          {activeTab === 'forgot' && (
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  {...forgotPasswordForm.register('email')}
                />
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{forgotPasswordForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <LoadingSpinner /> : 'Send Reset Link'}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setActiveTab('signin')}
              >
                Back to Sign In
              </Button>
            </form>
          )}

          {activeTab === 'reset' && (
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...resetPasswordForm.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <PasswordStrength password={resetPasswordForm.watch('password')} />
                {resetPasswordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{resetPasswordForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm">Confirm New Password</Label>
                <Input
                  id="reset-confirm"
                  type="password"
                  placeholder="••••••••"
                  {...resetPasswordForm.register('confirmPassword')}
                />
                {resetPasswordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <LoadingSpinner /> : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
