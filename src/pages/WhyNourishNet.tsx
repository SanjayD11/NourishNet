import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart, Shield, Users, Utensils, MapPin, Star, TrendingUp,
  CheckCircle, Globe, Leaf, ArrowRight, HeartPulse, Droplets, Activity, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { useLanguage } from '@/providers/LanguageProvider';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';

// Lightweight animation presets — GPU-friendly, no springs
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  viewport: { once: true, margin: '-40px' },
});

const WhyNourishNet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats: liveStats, loading: statsLoading } = useStats();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const trustFeatures = [
    { icon: Shield, title: 'Verified Users', description: 'All community members go through verification to ensure safety and authenticity.' },
    { icon: Star, title: 'Ratings & Reviews', description: 'Transparent feedback system helps maintain high standards and build trust.' },
    { icon: CheckCircle, title: 'Reporting & Moderation', description: 'Active moderation and reporting tools keep the community safe and respectful.' },
    { icon: Heart, title: 'Food Safety Approach', description: 'Guidelines and best practices ensure food shared is safe and of good quality.' },
  ];

  const differentiators = [
    { icon: MapPin, title: 'Location-Based Sharing', description: 'Find and share food in your immediate neighborhood with GPS-powered discovery.' },
    { icon: Users, title: 'No Middlemen', description: 'Direct peer-to-peer connections without intermediaries or complicated processes.' },
    { icon: Globe, title: 'Transparent & Community-First', description: 'Open platform built by and for the community with complete transparency.' },
    { icon: Leaf, title: 'Free & Sustainable', description: 'Always free to use, focused on sustainability and environmental impact.' },
  ];

  const audiences = [
    { icon: Users, title: 'Families', description: 'Share surplus from parties, events, or simply extra cooking.' },
    { icon: Utensils, title: 'Students', description: 'Access affordable food and reduce waste in student communities.' },
    { icon: TrendingUp, title: 'Event Organizers', description: 'Donate leftover food from weddings, conferences, and gatherings.' },
    { icon: Heart, title: 'Individuals in Need', description: 'Access nutritious food from caring community members.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-shimmer hero-title">
              {t('home.whyNourishNet') || 'Why NourishNet?'}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
              Building a world where good food is never wasted and no one goes hungry.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why NourishNet Exists */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 section-title">Why NourishNet Exists</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto px-2">
              Every year, India wastes over 74 million tonnes of food while millions go hungry.
              NourishNet was born to bridge this gap through community-driven action.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: 'The Food Waste Crisis', description: 'India wastes enough food to feed 100 million people annually. This waste ends up in landfills, contributing to climate change.', icon: TrendingUp },
              { title: 'Community-Driven Solution', description: 'Instead of relying on complex systems, we enable neighbors to share directly with neighbors, creating real impact at the grassroots level.', icon: Users },
              { title: 'India-Focused Relevance', description: 'Built specifically for Indian communities, understanding local food culture, festivals, and the spirit of sharing that defines us.', icon: Globe },
            ].map((item, index) => (
              <motion.div key={item.title} {...fadeUp(index * 0.08)}>
                <Card className="glass-card border-0 h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6 sm:p-8">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                      <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 section-title">Trust & Safety</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto px-2">
              Your safety is our priority. We've built multiple layers of protection into the platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trustFeatures.map((feature, index) => (
              <motion.div key={feature.title} {...fadeUp(index * 0.06)}>
                <Card className="glass-card border-0 h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Community Impact */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-shimmer section-title">
              {t('stats.impact')}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto px-2">
              {t('stats.impactSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { labelKey: 'stats.mealsRescued', value: liveStats.mealsRescued, suffix: '+', color: 'text-red-500' },
              { labelKey: 'stats.foodItemsShared', value: liveStats.foodItemsShared, suffix: '+', color: 'text-green-500' },
              { labelKey: 'stats.requestsFulfilled', value: liveStats.requestsFulfilled, suffix: '+', color: 'text-purple-500' },
              { labelKey: 'stats.communityMembers', value: liveStats.communityMembers, suffix: '+', color: 'text-blue-500' },
            ].map((stat, index) => (
              <motion.div key={stat.labelKey} {...fadeUp(index * 0.06)}>
                <Card className="glass-card border-0 text-center p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <div className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 ${stat.color}`}>
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

      {/* What Makes NourishNet Different */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 section-title">What Makes NourishNet Different</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto px-2">
              We're not just another app. We're a movement built on transparency, community, and impact.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {differentiators.map((item, index) => (
              <motion.div key={item.title} {...fadeUp(index * 0.06)}>
                <Card className="glass-card border-0 h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Health Advisor Highlight */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-rose-500/5 via-pink-500/5 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full mb-4 sm:mb-5 shadow-lg shadow-rose-500/25">
              <HeartPulse className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-shimmer-rose section-title">
              {t('healthAdvisor.title')}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto px-2">
              {t('healthAdvisor.desc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Droplets, title: 'Diabetic Risk', desc: 'Know your blood sugar risk at a glance.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: HeartPulse, title: 'Cholesterol Impact', desc: 'Understand heart health implications.', color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { icon: Activity, title: 'Weight Gain %', desc: 'Visual risk bar for weight gain potential.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { icon: Sparkles, title: 'AI Suggestions', desc: 'Personalized health tips from AI.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((item, index) => (
              <motion.div key={item.title} {...fadeUp(index * 0.06)}>
                <Card className="glass-card border-0 h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
                      <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} />
                    </div>
                    <h3 className="text-sm sm:text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4 sm:mt-6">
            AI-generated insights. Not a medical diagnosis.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 section-title">Who It's For</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto px-2">
              NourishNet is for everyone who believes in sharing, sustainability, and community care.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {audiences.map((audience, index) => (
              <motion.div key={audience.title} {...fadeUp(index * 0.06)}>
                <Card className="glass-card border-0 h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <audience.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{audience.title}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{audience.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 text-shimmer section-title">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              Join thousands of community members who are already reducing food waste and helping their neighbors.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
              <Button
                size="lg"
                className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 hover:scale-[1.03] transition-transform duration-200 shadow-xl bg-gradient-to-r from-primary to-primary/90 group"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
              >
                <MapPin className="w-5 h-5 mr-2" />
                Explore Food
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 hover:scale-[1.03] transition-transform duration-200 border-2 shadow-md group"
                onClick={() => navigate(user ? '/post-food' : '/auth')}
              >
                <Utensils className="w-5 h-5 mr-2" />
                {t('home.shareFoodNow')}
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

export default WhyNourishNet;
