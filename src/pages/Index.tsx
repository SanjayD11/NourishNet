import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Users, Utensils, ArrowRight, Star, TrendingUp, ChevronDown, HelpCircle, HeartPulse, Sparkles, Droplets, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { useLanguage } from '@/providers/LanguageProvider';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { checkAndExpirePosts } from '@/hooks/useFoodPostLifecycle';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';

// Lightweight animation presets — GPU-friendly, no springs
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  viewport: { once: true, margin: '-40px' },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  transition: { delay, duration: 0.4, ease: 'easeOut' },
  viewport: { once: true, margin: '-40px' },
});

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats: liveStats, loading: statsLoading } = useStats();
  const { t } = useLanguage();
  const howItWorksRef = useRef<HTMLElement>(null);

  useEffect(() => {
    checkAndExpirePosts();
  }, []);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const statsData = [
    { icon: Users, labelKey: 'stats.communityMembers', value: liveStats.communityMembers, suffix: '+', color: 'text-blue-500' },
    { icon: Utensils, labelKey: 'stats.foodItemsShared', value: liveStats.foodItemsShared, suffix: '+', color: 'text-green-500' },
    { icon: Heart, labelKey: 'stats.mealsRescued', value: liveStats.mealsRescued, suffix: '+', color: 'text-red-500' },
    { icon: TrendingUp, labelKey: 'stats.requestsFulfilled', value: liveStats.requestsFulfilled, suffix: '+', color: 'text-purple-500' },
  ];

  const features = [
    { icon: MapPin, titleKey: 'features.locationBased', descKey: 'features.locationBasedDesc' },
    { icon: Users, titleKey: 'features.communityNetwork', descKey: 'features.communityNetworkDesc' },
    { icon: Utensils, titleKey: 'features.smartMatching', descKey: 'features.smartMatchingDesc' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <Badge className="mb-6 sm:mb-8 px-5 py-2.5 text-sm shadow-md">
              <Heart className="w-4 h-4 mr-2" />
              {t('home.badge')}
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 sm:mb-8 text-shimmer hero-title"
            {...fadeUp(0.15)}
          >
            {t('home.title')}
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-2"
            {...fadeUp(0.25)}
          >
            {t('home.subtitle')}
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4" {...fadeUp(0.35)}>
            <Button
              size="lg"
              className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 hover:scale-[1.03] transition-transform duration-200 shadow-xl bg-gradient-to-r from-primary to-primary/90 group"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
            >
              <span>{user ? t('home.viewDashboard') : t('home.getStarted')}</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 hover:scale-[1.03] transition-transform duration-200 border-2 shadow-md group"
              onClick={scrollToHowItWorks}
            >
              <ChevronDown className="w-5 h-5 mr-2 animate-bounce" />
              {t('home.learnMore')}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-shimmer section-title">
              {t('stats.impact')}
            </h2>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed px-2">
              {t('stats.impactSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {statsData.map((stat, index) => (
              <motion.div key={stat.labelKey} {...fadeUp(index * 0.08)}>
                <Card className="glass-card border-0 text-center p-4 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <stat.icon className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${stat.color}`} />
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
                      {statsLoading ? (
                        <div className="animate-pulse bg-muted rounded h-8 w-16 mx-auto" />
                      ) : (
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{t(stat.labelKey)}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={howItWorksRef} className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-shimmer section-title">
              {t('features.howItWorks')}
            </h2>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed px-2">
              {t('features.howItWorksSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-10">
            {features.map((feature, index) => (
              <motion.div key={feature.titleKey} {...fadeUp(index * 0.1)}>
                <Card className="glass-card border-0 p-6 sm:p-10 h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                      <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">{t(feature.titleKey)}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">{t(feature.descKey)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 section-title">
              {t('problem.title')}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-2">
              {t('problem.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Tonnes wasted yearly worldwide', value: '1.05B' },
              { label: 'Global food production wasted', value: '~19%' },
              { label: 'Tonnes wasted annually in India', value: '74M' },
              { label: 'Annual economic loss in India', value: '₹92K Cr' },
              { label: 'Food wasted per person/year in India', value: '50–55 kg' },
            ].map((item) => (
              <Card key={item.label} className="glass-card border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-2xl">
                <CardContent className="p-4 sm:p-6 flex flex-col gap-2">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{item.value}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-snug">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 section-title">{t('solution.title')}</h2>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-2">
              {t('solution.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {[
              { titleKey: 'solution.postSurplus', descKey: 'solution.postSurplusDesc', icon: Utensils },
              { titleKey: 'solution.requestConnect', descKey: 'solution.requestConnectDesc', icon: Users },
              { titleKey: 'solution.trackImpact', descKey: 'solution.trackImpactDesc', icon: TrendingUp },
            ].map((card, index) => (
              <motion.div key={card.titleKey} {...fadeUp(index * 0.1)}>
                <Card className="glass-card border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-2xl h-full">
                  <CardContent className="p-6 sm:p-8 flex flex-col gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <card.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold">{t(card.titleKey)}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{t(card.descKey)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 section-title">{t('platform.title')}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto px-2">
              {t('platform.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {[
              { titleKey: 'platform.locationDiscovery', descKey: 'platform.locationDiscoveryDesc', icon: MapPin },
              { titleKey: 'platform.verifiedCommunity', descKey: 'platform.verifiedCommunityDesc', icon: Heart },
              { titleKey: 'platform.sustainabilityTracking', descKey: 'platform.sustainabilityTrackingDesc', icon: Star },
            ].map((feature) => (
              <Card key={feature.titleKey} className="glass-card border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-2xl h-full">
                <CardContent className="p-6 sm:p-8 flex flex-col gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{t(feature.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Health Advisor Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-rose-500/5 via-pink-500/5 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full mb-4 sm:mb-6 shadow-lg shadow-rose-500/25">
              <HeartPulse className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4 text-shimmer-rose section-title">
              {t('healthAdvisor.title')}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-2">
              {t('healthAdvisor.desc')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10">
            {[
              { icon: Droplets, title: 'Diabetic Risk Assessment', description: 'Instantly know if a food poses low, moderate, or high risk for blood sugar spikes.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: HeartPulse, title: 'Cholesterol & Heart Health', description: 'Understand how your food choices impact cholesterol levels and heart health.', color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { icon: Activity, title: 'Weight Gain Prediction', description: 'See the weight gain potential percentage with a visual risk indicator.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map((item, index) => (
              <motion.div key={item.title} {...fadeUp(index * 0.08)}>
                <Card className="glass-card border-0 h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6 sm:p-8">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-3 sm:mb-4`}>
                      <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color}`} />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeIn(0.2)} className="text-center">
            <Button
              size="lg"
              className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 hover:scale-[1.03] transition-transform duration-200 shadow-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white group"
              onClick={() => navigate(user ? '/food-scanner' : '/auth')}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Try AI Health Advisor
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3 sm:mt-4">
              AI-generated insights. Not a medical diagnosis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 sm:mb-8 text-shimmer section-title">
              {t('home.joinMovement')}
            </h2>

            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
              {t('home.joinSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
              <Button
                size="lg"
                className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 hover:scale-[1.03] transition-transform duration-200 shadow-xl bg-gradient-to-r from-primary to-primary/90 group"
                onClick={() => navigate(user ? '/post-food' : '/auth')}
              >
                <Utensils className="w-5 h-5 mr-2" />
                {user ? t('home.shareFoodNow') : t('home.getStarted')}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 hover:scale-[1.03] transition-transform duration-200 border-2 shadow-md group"
                onClick={() => navigate('/why-nourishnet')}
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                {t('home.whyNourishNet')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
