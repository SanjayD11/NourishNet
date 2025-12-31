import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, 
  Shield, 
  Users, 
  Utensils, 
  MapPin, 
  Star, 
  TrendingUp,
  CheckCircle,
  Globe,
  Leaf,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';

const WhyNourishNet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats: liveStats, loading: statsLoading } = useStats();

  const trustFeatures = [
    {
      icon: Shield,
      title: 'Verified Users',
      description: 'All community members go through verification to ensure safety and authenticity.',
    },
    {
      icon: Star,
      title: 'Ratings & Reviews',
      description: 'Transparent feedback system helps maintain high standards and build trust.',
    },
    {
      icon: CheckCircle,
      title: 'Reporting & Moderation',
      description: 'Active moderation and reporting tools keep the community safe and respectful.',
    },
    {
      icon: Heart,
      title: 'Food Safety Approach',
      description: 'Guidelines and best practices ensure food shared is safe and of good quality.',
    },
  ];

  const differentiators = [
    {
      icon: MapPin,
      title: 'Location-Based Sharing',
      description: 'Find and share food in your immediate neighborhood with GPS-powered discovery.',
    },
    {
      icon: Users,
      title: 'No Middlemen',
      description: 'Direct peer-to-peer connections without intermediaries or complicated processes.',
    },
    {
      icon: Globe,
      title: 'Transparent & Community-First',
      description: 'Open platform built by and for the community with complete transparency.',
    },
    {
      icon: Leaf,
      title: 'Free & Sustainable',
      description: 'Always free to use, focused on sustainability and environmental impact.',
    },
  ];

  const audiences = [
    {
      icon: Users,
      title: 'Families',
      description: 'Share surplus from parties, events, or simply extra cooking.',
    },
    {
      icon: Utensils,
      title: 'Students',
      description: 'Access affordable food and reduce waste in student communities.',
    },
    {
      icon: TrendingUp,
      title: 'Event Organizers',
      description: 'Donate leftover food from weddings, conferences, and gatherings.',
    },
    {
      icon: Heart,
      title: 'Individuals in Need',
      description: 'Access nutritious food from caring community members.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_60%)]" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1 }}
            >
              Why NourishNet?
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Building a world where good food is never wasted and no one goes hungry.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Why NourishNet Exists */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why NourishNet Exists</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Every year, India wastes over 74 million tonnes of food while millions go hungry. 
              NourishNet was born to bridge this gap through community-driven action.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'The Food Waste Crisis',
                description: 'India wastes enough food to feed 100 million people annually. This waste ends up in landfills, contributing to climate change.',
                icon: TrendingUp,
              },
              {
                title: 'Community-Driven Solution',
                description: 'Instead of relying on complex systems, we enable neighbors to share directly with neighbors, creating real impact at the grassroots level.',
                icon: Users,
              },
              {
                title: 'India-Focused Relevance',
                description: 'Built specifically for Indian communities, understanding local food culture, festivals, and the spirit of sharing that defines us.',
                icon: Globe,
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card border-0 h-full hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trust & Safety</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Your safety is our priority. We've built multiple layers of protection into the platform.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card border-0 h-full hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Community Impact */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Real Community Impact</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Together, our community is making a measurable difference every single day.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Meals Rescued', value: liveStats.mealsRescued, suffix: '+', color: 'text-red-500' },
              { label: 'Food Items Shared', value: liveStats.foodItemsShared, suffix: '+', color: 'text-green-500' },
              { label: 'Requests Fulfilled', value: liveStats.requestsFulfilled, suffix: '+', color: 'text-purple-500' },
              { label: 'Community Members', value: liveStats.communityMembers, suffix: '+', color: 'text-blue-500' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card border-0 text-center p-6 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-0">
                    <div className={`text-3xl md:text-4xl font-bold mb-2 ${stat.color}`}>
                      {statsLoading ? (
                        <div className="animate-pulse bg-muted rounded h-8 w-16 mx-auto" />
                      ) : (
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes NourishNet Different */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Makes NourishNet Different</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              We're not just another app. We're a movement built on transparency, community, and impact.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentiators.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card border-0 h-full hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who It's For</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              NourishNet is for everyone who believes in sharing, sustainability, and community care.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((audience, index) => (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card border-0 h-full hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <audience.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{audience.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{audience.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of community members who are already reducing food waste and helping their neighbors.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="text-lg px-10 py-7 hover:scale-105 transition-all duration-300 shadow-xl bg-gradient-to-r from-primary to-primary/90 group"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
              >
                <MapPin className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Explore Food
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 hover:scale-105 transition-all duration-300 border-2 shadow-lg group"
                onClick={() => navigate(user ? '/post-food' : '/auth')}
              >
                <Utensils className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Share Food Now
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
