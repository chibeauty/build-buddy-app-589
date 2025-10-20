import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap, Sparkles, Star } from 'lucide-react';

export default function CreditPackages() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching credit packages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load credit packages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: { packageId },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize payment',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageIcon = (index: number) => {
    const icons = [Zap, Sparkles, Star, Star];
    const Icon = icons[index] || Zap;
    return <Icon className="h-6 w-6" />;
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[250px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Buy AI Credits</h3>
        <p className="text-sm text-muted-foreground">
          Top up your AI credits to continue using premium features
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg, index) => (
          <Card key={pkg.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            {index === 1 && (
              <Badge className="absolute top-4 right-4 bg-primary">Best Value</Badge>
            )}
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {getPackageIcon(index)}
                </div>
                <div>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription className="text-xs">{pkg.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ₦{Number(pkg.price).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {pkg.credits.toLocaleString()} AI credits
                </p>
              </div>

              <Button
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing === pkg.id}
                className="w-full"
                variant={index === 1 ? 'default' : 'outline'}
              >
                {purchasing === pkg.id ? 'Processing...' : 'Buy Now'}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                ≈ ₦{(Number(pkg.price) / pkg.credits).toFixed(2)} per credit
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
