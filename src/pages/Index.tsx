import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Users, Utensils, ArrowRight, Star, TrendingUp, ChevronDown, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { checkAndExpirePosts } from '@/hooks/useFoodPostLifecycle';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats: liveStats, loading: statsLoading } = useStats();
  const howItWorksRef = useRef<HTMLElement>(null);

  useEffect(() => {
    checkAndExpirePosts();
  }, []);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const statsData = [
    {
      icon: Users,
      label: 'Community Members',
      value: liveStats.communityMembers,
      suffix: '+',
      color: 'text-blue-500',
    },
    {
      icon: Utensils,
      label: 'Food Items Shared',
      value: liveStats.foodItemsShared,
      suffix: '+',
      color: 'text-green-500',
    },
    {
      icon: Heart,
      label: 'Meals Rescued',
      value: liveStats.mealsRescued,
      suffix: '+',
      color: 'text-red-500',
    },
    {
      icon: TrendingUp,
      label: 'Requests Fulfilled',
      value: liveStats.requestsFulfilled,
      suffix: '+',
      color: 'text-purple-500',
    },
  ];

  const features = [
    {
      icon: MapPin,
      title: 'Location-Based Sharing',
      description: 'Find and share food in your immediate neighborhood with precise location tracking.',
    },
    {
      icon: Users,
      title: 'Community Network',
      description: 'Connect with verified community members who care about reducing food waste.',
    },
    {
      icon: Utensils,
      title: 'Smart Matching',
      description: 'Advanced filters help you find exactly what you need or share what you have.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,159,67,0.05),transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            >
              <Badge className="mb-8 px-6 py-3 text-sm shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse">
                <Heart className="w-4 h-4 mr-2 animate-pulse" />
                Reducing Food Waste Together
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              NourishNet
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Connect with your community to share surplus food, reduce waste, and nourish those in need.
              Every meal shared is a step towards a more sustainable future.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <Button
                size="lg"
                className="text-xl px-12 py-8 hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-3xl bg-gradient-to-r from-primary to-primary/90 relative overflow-hidden group"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
              >
                <span className="relative z-10">{user ? 'View Dashboard' : 'Get Started'}</span>
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="text-xl px-12 py-8 hover:scale-110 transition-all duration-500 border-2 hover:bg-primary/10 shadow-lg hover:shadow-xl relative overflow-hidden group"
                onClick={scrollToHowItWorks}
              >
                <ChevronDown className="w-6 h-6 mr-3 group-hover:translate-y-1 transition-transform duration-300 animate-bounce" />
                <span className="relative z-10">Learn More</span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-muted/20 to-muted/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_70%)]" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Making a Real Impact
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Our community is actively working together to reduce food waste and help those in need.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.15,
                  duration: 0.8,
                  type: 'spring',
                  bounce: 0.4,
                }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.08, y: -5 }}
              >
                <Card className="glass-card border-0 text-center p-8 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <stat.icon className={`w-12 h-12 mx-auto mb-4 ${stat.color} relative z-10`} />
                    </motion.div>
                    <div className="text-3xl md:text-4xl font-bold mb-2 relative z-10">
                      {statsLoading ? (
                        <div className="animate-pulse bg-muted rounded h-8 w-16 mx-auto" />
                      ) : (
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground relative z-10">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={howItWorksRef} className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,159,67,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(120,119,198,0.03),transparent_50%)]" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              How NourishNet Works
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Simple, secure, and sustainable food sharing in your community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.2,
                  duration: 0.8,
                  type: 'spring',
                  bounce: 0.3,
                }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className="glass-card border-0 p-10 h-full hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                  <CardContent className="p-0 text-center relative z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                      whileHover={{
                        scale: 1.1,
                        rotate: 360,
                        background:
                          'linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--secondary)/0.2))',
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    >
                      <feature.icon className="w-10 h-10 text-primary" />
                    </motion.div>

                    <h3 className="text-2xl font-semibold mb-6 relative z-10">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg relative z-10">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Problem – Food Waste is a Global Crisis
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Every year, billions of tons of perfectly good food ends up in landfills while millions go hungry. This waste contributes to climate change and economic loss.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              { label: 'Tonnes wasted yearly worldwide', value: '1.05B' },
              { label: 'Global food production wasted', value: '~19%' },
              { label: 'Tonnes wasted annually in India', value: '74M' },
              { label: 'Annual economic loss in India', value: '₹92K Cr' },
              { label: 'Food wasted per person/year in India', value: '50–55 kg' },
            ].map((item) => (
              <Card
                key={item.label}
                className="glass-card border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl flex flex-col justify-between"
              >
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{item.value}</div>
                  <p className="text-sm md:text-base text-muted-foreground leading-snug">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-6 bg-muted/40 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Solution</h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              NourishNet connects food donors with people in need through a community-driven platform.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Post Surplus Food',
                description: 'Share excess food from homes, restaurants, or events.',
                icon: Utensils,
              },
              {
                title: 'Request & Connect',
                description: 'Find nearby food and chat securely for pickup.',
                icon: Users,
              },
              {
                title: 'Track Impact',
                description: 'View meals saved and waste reduced.',
                icon: TrendingUp,
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Card className="glass-card border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl h-full">
                  <CardContent className="p-8 flex flex-col gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                      <card.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{card.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 px-6 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Platform Features</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Built with modern technology for safe and impactful food sharing.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Location-Based Discovery',
                description: 'GPS-powered nearby food search.',
                icon: MapPin,
              },
              {
                title: 'Verified Community',
                description: 'Ratings and reviews for trust.',
                icon: Heart,
              },
              {
                title: 'Sustainability Tracking',
                description: 'Monitor meals saved and impact.',
                icon: Star,
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="glass-card border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl h-full"
              >
                <CardContent className="p-8 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(255,159,67,0.1),transparent_70%)]" />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              Join the Movement Today
            </motion.h2>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
            >
              Be part of a community that's making a difference. Share food, reduce waste, and help nourish your neighbors.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Button
                size="lg"
                className="text-xl px-12 py-8 hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-3xl bg-gradient-to-r from-primary to-primary/90 relative overflow-hidden group"
                onClick={() => navigate(user ? '/post-food' : '/auth')}
              >
                <Utensils className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">{user ? 'Share Food Now' : 'Get Started'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="text-xl px-12 py-8 hover:scale-110 transition-all duration-500 border-2 hover:bg-primary/10 shadow-lg hover:shadow-xl relative overflow-hidden group"
                onClick={() => navigate('/why-nourishnet')}
              >
                <HelpCircle className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-500" />
                <span className="relative z-10">Why NourishNet?</span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
