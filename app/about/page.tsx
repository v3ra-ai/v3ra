"use client";

import { Navbar } from "@/components/shared/navbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Brain, 
  Network, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  Users,
  Zap,
  Target
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { motion } from "framer-motion";

export default function AboutPage() {
  const [userPoints, setUserPoints] = useState(0);
  
  useEffect(() => {
    loadUserPoints();
  }, []);
  
  const loadUserPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch(`/api/user/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.balance || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
    }
  };

  const features = [
    {
      icon: Brain,
      title: "AI Consensus Network",
      description: "Multiple AI models work together to verify facts and predict outcomes with unprecedented accuracy."
    },
    {
      icon: Shield,
      title: "Truth Verification",
      description: "Every claim is cross-referenced across multiple sources and validated by our distributed AI network."
    },
    {
      icon: Network,
      title: "Decentralized Validation",
      description: "No single point of failure. Our network ensures reliability through distributed consensus mechanisms."
    },
    {
      icon: Sparkles,
      title: "Prediction Markets",
      description: "Stake V3RA tokens on future outcomes and earn rewards for accurate predictions."
    }
  ];

  const stats = [
    { label: "Active Validators", value: "12+", icon: Users },
    { label: "Predictions Made", value: "10K+", icon: Target },
    { label: "Consensus Rate", value: "94%", icon: CheckCircle2 },
    { label: "Avg Response Time", value: "<3s", icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar userPoints={userPoints} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-purple-600/20 to-pink-600/20 opacity-30" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                DISTRIBUTED TRUTH VERIFICATION
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-bold text-zinc-100 mb-6 font-orbitron">
                About V3RA
              </h1>
              
              <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
                V3RA is a revolutionary AI consensus network that combines the power of multiple language models 
                to verify facts, predict outcomes, and create a more truthful digital ecosystem.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Link href="/ask/truth-market-simple">
                  <Button size="lg" className="bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/20">
                    Try Truth Market
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/predictions">
                  <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                    View Predictions
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-zinc-100 mb-4 font-orbitron">Our Mission</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                In an era of information overload and AI-generated content, distinguishing truth from fiction 
                has become increasingly challenging. V3RA addresses this critical need by creating a 
                decentralized network of AI validators that work together to verify information and predict 
                future outcomes.
              </p>
              <p className="text-zinc-300 leading-relaxed">
                By leveraging the collective intelligence of multiple AI models and incentivizing accurate 
                predictions through our token economy, we're building a more reliable and transparent 
                information ecosystem for everyone.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-zinc-100 mb-12 font-orbitron"
          >
            How V3RA Works
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800 p-6 hover:border-cyan-500/30 transition-all duration-300 h-full">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-lg">
                      <feature.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-100 mb-2">{feature.title}</h3>
                      <p className="text-zinc-400">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800 p-6 text-center hover:border-purple-500/30 transition-all duration-300">
                  <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-zinc-100 mb-1">{stat.value}</div>
                  <div className="text-sm text-zinc-500">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 rounded-2xl p-12 border border-cyan-500/30"
          >
            <h2 className="text-3xl font-bold text-zinc-100 mb-4 font-orbitron">
              Join the Truth Revolution
            </h2>
            <p className="text-lg text-zinc-300 mb-8">
              Start verifying facts and making predictions with V3RA today. 
              Earn rewards for contributing to a more truthful internet.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-lg">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}