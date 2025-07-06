"use client";

import { Navbar } from "@/components/shared/navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { motion } from "framer-motion";
import { 
  ScrollText, 
  Scale, 
  AlertTriangle, 
  Ban, 
  Coins, 
  Shield, 
  FileText,
  CheckCircle,
  Info
} from "lucide-react";

export default function TermsPage() {
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
      icon: CheckCircle,
      title: "1. Acceptance of Terms",
      content: `By accessing or using V3RA (the "Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service. V3RA reserves the right to update these terms at any time, with notice provided through the platform.`
    },
    {
      icon: FileText,
      title: "2. Service Description",
      content: `V3RA is a distributed AI consensus network that provides:
      • Truth verification through multiple AI validators
      • Prediction markets for future events
      • Q&A services powered by AI consensus
      • V3RA token rewards for accurate predictions
      
      The Service is provided "as is" and V3RA makes no warranties about the accuracy of AI-generated content.`
    },
    {
      icon: Shield,
      title: "3. User Responsibilities",
      content: `As a user of V3RA, you agree to:
      • Provide accurate information during registration
      • Maintain the security of your account credentials
      • Not attempt to manipulate prediction markets or consensus mechanisms
      • Not use the Service for illegal or harmful purposes
      • Respect intellectual property rights
      • Not reverse engineer or exploit the Service`
    },
    {
      icon: Coins,
      title: "4. V3RA Tokens and Rewards",
      content: `V3RA tokens are utility tokens used within the platform:
      • Tokens have no guaranteed monetary value
      • Rewards are distributed based on prediction accuracy
      • V3RA reserves the right to adjust reward mechanisms
      • Tokens cannot be exchanged for fiat currency through the platform
      • Tax obligations for token rewards are the user's responsibility`
    },
    {
      icon: Ban,
      title: "5. Prohibited Uses",
      content: `The following activities are strictly prohibited:
      • Creating multiple accounts to manipulate rewards
      • Using automated systems to game predictions
      • Submitting false or misleading information
      • Attempting to hack or disrupt the Service
      • Harassing other users or V3RA staff
      • Using the Service for illegal gambling where prohibited`
    },
    {
      icon: Scale,
      title: "6. Intellectual Property",
      content: `• All V3RA platform code, design, and content are proprietary
      • User-generated queries and predictions remain the user's property
      • V3RA may use anonymized data for improving the Service
      • Third-party AI models retain their respective rights
      • Users grant V3RA license to display their public predictions`
    },
    {
      icon: AlertTriangle,
      title: "7. Disclaimers and Limitations",
      content: `• V3RA is not financial advice - make predictions at your own risk
      • AI-generated content may contain errors or biases
      • Service availability is not guaranteed
      • V3RA is not liable for losses from incorrect predictions
      • Maximum liability is limited to tokens earned in past 30 days`
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
                EFFECTIVE DATE: JULY 6, 2025
              </Badge>
              <h1 className="text-4xl font-bold text-zinc-100 mb-4 font-orbitron">Terms of Service</h1>
              <p className="text-lg text-zinc-400">
                Please read these terms carefully before using the V3RA platform.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Alert className="bg-cyan-500/10 border-cyan-500/30">
              <Info className="w-4 h-4 text-cyan-400" />
              <AlertDescription className="text-zinc-300">
                V3RA is currently in beta. Features, tokens, and rewards are subject to change. 
                Participation is voluntary and at your own risk.
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800 p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <section.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-100">{section.title}</h2>
                </div>
                <div className="ml-14 text-zinc-300 whitespace-pre-line">
                  {section.content}
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Additional Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/30 p-8">
              <h2 className="text-2xl font-bold text-zinc-100 mb-4">8. Additional Provisions</h2>
              <div className="space-y-4 text-zinc-300">
                <div>
                  <h3 className="font-semibold text-zinc-200 mb-2">Dispute Resolution</h3>
                  <p>Any disputes will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200 mb-2">Governing Law</h3>
                  <p>These terms are governed by the laws of Delaware, USA, without regard to conflict of law principles.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200 mb-2">Severability</h3>
                  <p>If any provision is found unenforceable, the remaining provisions will continue in full force and effect.</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Termination */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="bg-zinc-900/50 border-red-500/30 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100 mb-2">9. Account Termination</h2>
                  <p className="text-zinc-300 mb-4">
                    V3RA reserves the right to terminate or suspend accounts that violate these terms. 
                    Users may delete their accounts at any time through account settings.
                  </p>
                  <p className="text-zinc-400 text-sm">
                    Upon termination, access to the Service will cease immediately. V3RA tokens may be 
                    forfeited if termination is due to terms violations.
                  </p>
                </div>
              </div>
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
              <h2 className="text-2xl font-bold text-zinc-100 mb-4">Questions About These Terms?</h2>
              <p className="text-zinc-300 mb-4">
                If you have questions or concerns about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-zinc-400">
                <p>Email: <span className="text-cyan-400">legal@v3ra.network</span></p>
                <p>Response time: Within 48 hours</p>
              </div>
            </Card>
          </motion.div>

          {/* Agreement */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card className="bg-zinc-900/50 border-cyan-500/30 p-6">
              <ScrollText className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <p className="text-zinc-300">
                By using V3RA, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}