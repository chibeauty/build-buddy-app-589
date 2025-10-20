import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Gift, Copy, Check, Share2, TrendingUp, DollarSign, Award, Calendar } from 'lucide-react';

export default function Referrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalEarned: 0,
    pendingRewards: 0,
    thisMonth: 0,
    thisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      // Fetch referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (codeError) throw codeError;
      setReferralCode(codeData);

      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*, profiles!referrals_referred_id_fkey(full_name)')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;
      setReferrals(referralsData || []);

      // Calculate statistics
      const totalEarned = referralsData?.filter(r => r.reward_status === 'paid').length * 100 || 0;
      const pendingRewards = referralsData?.filter(r => r.reward_status === 'pending').length * 100 || 0;
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const thisWeek = referralsData?.filter(r => 
        new Date(r.created_at) >= weekAgo && r.reward_status === 'paid'
      ).length * 100 || 0;
      
      const thisMonth = referralsData?.filter(r => 
        new Date(r.created_at) >= monthAgo && r.reward_status === 'paid'
      ).length * 100 || 0;

      setStats({ totalEarned, pendingRewards, thisMonth, thisWeek });
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/signup?ref=${referralCode?.code}`;
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;

    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share this link to earn rewards',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (platform: string) => {
    const link = getReferralLink();
    const text = `Join me on ExHub and we both get 100 AI credits! Use my referral link:`;
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      whatsapp: `https://web.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + link)}`,
    };

    if (urls[platform]) {
      const anchor = document.createElement('a');
      anchor.href = urls[platform];
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[150px]" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Invite friends to join ExHub and earn AI credits when they subscribe
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{referralCode?.total_referrals || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Award className="h-4 w-4" />
                Credits Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalEarned.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Paid rewards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.thisMonth.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Credits earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pendingRewards.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Credits pending</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Share Your Referral Link</CardTitle>
                <CardDescription>
                  Get 100 AI credits for every friend who subscribes using your link
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <Share2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono font-semibold">{referralCode?.code}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={getReferralLink()}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={handleCopyCode} variant="outline" className="shrink-0">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Share on social media:</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShare('linkedin')}
                  className="flex items-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShare('whatsapp')}
                  className="flex items-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Gift className="h-4 w-4" />
                How it works:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                  <span>Share your unique referral link with friends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                  <span>They sign up and subscribe to any paid plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                  <span>You both get 100 bonus AI credits as a reward instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">∞</span>
                  <span>There's no limit to how many friends you can refer!</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>Track your successful referrals and rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({referrals.length})</TabsTrigger>
                <TabsTrigger value="paid">
                  Paid ({referrals.filter(r => r.reward_status === 'paid').length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({referrals.filter(r => r.reward_status === 'pending').length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="space-y-3">
                  {referrals.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No referrals yet. Start sharing your link!
                      </p>
                    </div>
                  ) : (
                    referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {referral.profiles?.full_name || 'Anonymous User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined {formatDate(referral.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={referral.reward_status === 'paid' ? 'default' : 'secondary'}
                          >
                            {referral.reward_status === 'paid' ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                100 Credits
                              </>
                            ) : (
                              'Pending'
                            )}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="paid" className="mt-4">
                <div className="space-y-3">
                  {referrals.filter(r => r.reward_status === 'paid').length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No paid rewards yet
                      </p>
                    </div>
                  ) : (
                    referrals
                      .filter(r => r.reward_status === 'paid')
                      .map((referral) => (
                        <div
                          key={referral.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                              <Check className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {referral.profiles?.full_name || 'Anonymous User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Earned on {formatDate(referral.paid_at || referral.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600">+100</p>
                            <p className="text-xs text-muted-foreground">Credits</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <div className="space-y-3">
                  {referrals.filter(r => r.reward_status === 'pending').length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No pending rewards
                      </p>
                    </div>
                  ) : (
                    referrals
                      .filter(r => r.reward_status === 'pending')
                      .map((referral) => (
                        <div
                          key={referral.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                              <Calendar className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {referral.profiles?.full_name || 'Anonymous User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Waiting for subscription
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}