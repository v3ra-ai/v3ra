"use client";

import { Navbar } from "@/components/shared/navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, Users, Mail, Calendar, AlertCircle } from "lucide-react";

export default function PrivacyPage() {
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

  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Account information (email address, username)",
        "Authentication data (encrypted passwords)",
        "Query history and prediction data",
        "V3RA token balances and transaction history",
        "Usage analytics and performance metrics"
      ]
    },
    {
      icon: Shield,
      title: "How We Protect Your Data",
      content: [
        "End-to-end encryption for sensitive data",
        "Secure authentication via Supabase",
        "Regular security audits and updates",
        "Distributed storage across multiple nodes",
        "Anonymized data for AI model training"
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "To provide and improve V3RA services",
        "To process predictions and distribute rewards",
        "To detect and prevent fraud or abuse",
        "To communicate important updates",
        "To analyze and optimize platform performance"
      ]
    },
    {
      icon: Users,
      title: "Information Sharing",
      content: [
        "We never sell your personal data",
        "Aggregated statistics may be shared publicly",
        "Law enforcement requests handled per legal requirements",
        "Third-party services used only for core functionality",
        "You control visibility of your predictions and stakes"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar userPoints={userPoints} />
      
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
                LAST UPDATED: JULY 2025
              </Badge>
              <h1 className="text-4xl font-bold text-zinc-100 mb-4 font-orbitron">Privacy Policy</h1>
              <p className="text-lg text-zinc-400">
                Your privacy is fundamental to V3RA's mission. This policy explains how we collect, 
                use, and protect your information.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-cyan-500/10 rounded-lg">
                  <Lock className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100 mb-2">Our Commitment</h2>
                  <p className="text-zinc-300">
                    V3RA is built on principles of transparency and user empowerment. We believe you should 
                    have complete control over your data and understand exactly how it's being used.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800 p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <section.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-100">{section.title}</h2>
                </div>
                <ul className="space-y-3 ml-14">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}

          {/* Data Rights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-cyan-600/10 to-purple-600/10 border-cyan-500/30 p-8">
              <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-cyan-400" />
                Your Data Rights
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-zinc-200 mb-2">You have the right to:</h3>
                  <ul className="space-y-2 text-zinc-300">
                    <li>• Access all data we have about you</li>
                    <li>• Request correction of inaccurate data</li>
                    <li>• Delete your account and associated data</li>
                    <li>• Export your data in a portable format</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200 mb-2">We will never:</h3>
                  <ul className="space-y-2 text-zinc-300">
                    <li>• Sell your personal information</li>
                    <li>• Use your data for targeted advertising</li>
                    <li>• Share data without your consent</li>
                    <li>• Store unencrypted sensitive information</li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Cookies & Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800 p-8">
              <h2 className="text-2xl font-bold text-zinc-100 mb-4">Cookies & Tracking</h2>
              <p className="text-zinc-300 mb-4">
                V3RA uses minimal cookies necessary for functionality:
              </p>
              <ul className="space-y-2 text-zinc-300">
                <li>• Authentication tokens to keep you logged in</li>
                <li>• Session data for security purposes</li>
                <li>• Performance analytics (anonymized)</li>
                <li>• User preferences (theme, display settings)</li>
              </ul>
              <p className="text-zinc-400 mt-4 text-sm">
                We do not use third-party tracking cookies or sell data to advertisers.
              </p>
            </Card>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-lg">
                  <Mail className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100 mb-2">Questions or Concerns?</h2>
                  <p className="text-zinc-300 mb-4">
                    If you have any questions about this privacy policy or how we handle your data, 
                    please don't hesitate to reach out.
                  </p>
                  <p className="text-zinc-400">
                    Email: <span className="text-cyan-400">privacy@v3ra.network</span>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Updates */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center text-zinc-500 text-sm"
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            This privacy policy was last updated on July 6, 2025. We will notify users of any material changes.
          </motion.div>
        </div>
      </div>
    </div>
  );
}