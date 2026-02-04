import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  Users,
  Wallet
} from 'lucide-react';
import { useStore } from '@/store/useStore';

export function Home() {
  const { isAuthenticated } = useStore();

  const features = [
    {
      icon: TrendingUp,
      title: 'Trade on Anything',
      description: 'Predict outcomes on sports, politics, finance, and more.',
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'All trades are recorded on blockchain for full transparency.',
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'Get paid immediately when markets resolve.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Data',
      description: 'Live price charts and order books for informed trading.',
    },
  ];

  const stats = [
    { label: 'Active Markets', value: '50+', icon: BarChart3 },
    { label: 'Total Volume', value: '৳10M+', icon: Wallet },
    { label: 'Traders', value: '5,000+', icon: Users },
    { label: 'Markets Resolved', value: '200+', icon: CheckCircle2 },
  ];

  const categories = [
    { name: 'Sports', count: 15, image: 'https://images.unsplash.com/photo-1461896836934- voices-1e3f5e3c3d9a?w=400' },
    { name: 'Politics', count: 8, image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400' },
    { name: 'Finance', count: 12, image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400' },
    { name: 'Technology', count: 10, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400' },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200')] opacity-10 bg-cover bg-center" />
        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm mb-6">
              <Zap className="h-4 w-4" />
              Now Live in Bangladesh
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Trade on the Future.
              <br />
              <span className="text-white/80">Profit from Your Predictions.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
              Polymarket BD is the leading prediction market platform in Bangladesh. 
              Trade on sports, politics, finance, and more with transparent odds and instant settlements.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link to="/markets">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Start Trading
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" variant="secondary" className="gap-2">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/markets">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      Explore Markets
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-40 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-0 shadow-md bg-gradient-to-br from-card to-muted">
                <CardContent className="p-6 text-center">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Trade on Polymarket BD?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the most advanced prediction market platform with cutting-edge features 
            designed for Bangladeshi traders.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Popular Categories</h2>
            <p className="text-muted-foreground">Explore markets by category</p>
          </div>
          <Link to="/markets">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.name} to={`/markets?category=${category.name}`}>
              <Card className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} markets</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of traders on Polymarket BD. Create your account in minutes 
              and start profiting from your predictions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {isAuthenticated ? (
                <Link to="/markets">
                  <Button size="lg" className="gap-2">
                    Browse Markets
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="gap-2">
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline">
                      Already have an account?
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
