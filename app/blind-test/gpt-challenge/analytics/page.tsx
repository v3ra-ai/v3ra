'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Trophy, TrendingUp, Users, Clock, ChevronLeft, Brain, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ModelStats {
  model_id: string
  total_wins: number
  total_losses: number
  overall_win_rate: number
  avg_decision_time: number
}

export default function GPTChallengeAnalytics() {
  const router = useRouter()
  const [stats, setStats] = useState<ModelStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/blind-test/gpt-challenge')
      if (!response.ok) throw new Error('Failed to fetch statistics')
      
      const data = await response.json()
      setStats(data.statistics || [])
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const gpt4oStats = stats.find(s => s.model_id === 'gpt-4o') || {
    total_wins: 0,
    total_losses: 0,
    overall_win_rate: 0,
    avg_decision_time: 0
  }

  const gpt5Stats = stats.find(s => s.model_id === 'gpt-5') || {
    total_wins: 0,
    total_losses: 0,
    overall_win_rate: 0,
    avg_decision_time: 0
  }

  // Calculate total completed tests from total votes (each test has multiple questions)
  // Since we're showing head-to-head stats, the total comparisons represents individual votes
  // not full test sessions. We need to fetch the actual completed session count.
  const [completedTests, setCompletedTests] = useState(0)
  
  useEffect(() => {
    // Fetch actual completed test count
    const fetchCompletedTests = async () => {
      try {
        const response = await fetch('/api/blind-test/gpt-challenge/stats')
        if (response.ok) {
          const data = await response.json()
          setCompletedTests(data.completedTests || 0)
        }
      } catch (error) {
        console.error('Error fetching test count:', error)
      }
    }
    fetchCompletedTests()
  }, [])

  const totalTests = completedTests || Math.floor((gpt4oStats.total_wins + gpt5Stats.total_wins) / 5)

  const chartData = [
    {
      name: 'GPT-4o',
      wins: gpt4oStats.total_wins,
      winRate: (gpt4oStats.overall_win_rate * 100).toFixed(1),
      avgTime: Math.round(gpt4oStats.avg_decision_time / 1000)
    },
    {
      name: 'GPT-5',
      wins: gpt5Stats.total_wins,
      winRate: (gpt5Stats.overall_win_rate * 100).toFixed(1),
      avgTime: Math.round(gpt5Stats.avg_decision_time / 1000)
    }
  ]

  const pieData = [
    { name: 'GPT-4o', value: gpt4oStats.total_wins, color: '#3b82f6' },
    { name: 'GPT-5', value: gpt5Stats.total_wins, color: '#a855f7' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/10 to-black">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push('/blind-test/gpt-challenge')}
                className="text-gray-400 hover:text-white mb-4"
              >
                <ChevronLeft className="mr-2 w-4 h-4" />
                Back to Test
              </Button>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                GPT-4o vs GPT-5 Analytics
              </h1>
              <p className="text-gray-400 mt-2">
                Real-time blind test results from the community
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-black/50 border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-400">Total Tests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">{totalTests}</div>
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-black/50 border-blue-500/30">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-400">GPT-4o Win Rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-blue-400">
                      {(gpt4oStats.overall_win_rate * 100).toFixed(1)}%
                    </div>
                    <Zap className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-black/50 border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-400">GPT-5 Win Rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-purple-400">
                      {(gpt5Stats.overall_win_rate * 100).toFixed(1)}%
                    </div>
                    <Brain className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-black/50 border-yellow-500/30">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-400">Current Leader</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-yellow-400">
                      {gpt5Stats.total_wins > gpt4oStats.total_wins ? 'GPT-5' : 
                       gpt4oStats.total_wins > gpt5Stats.total_wins ? 'GPT-4o' : 'Tied'}
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Win Comparison */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-black/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Head-to-Head Wins</CardTitle>
                  <CardDescription>Total wins in blind preference tests</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="wins" fill="#a855f7" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Win Rate Pie Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-black/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Overall Preference Distribution</CardTitle>
                  <CardDescription>Percentage of users preferring each model</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          `${name}: ${(percent * 100).toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Decision Time Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-black/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Average Decision Time</CardTitle>
                <CardDescription>
                  How long users take to choose between responses (in seconds)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#888" />
                    <YAxis type="category" dataKey="name" stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                      formatter={(value) => `${value}s`}
                    />
                    <Bar dataKey="avgTime" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-300">
                  {gpt5Stats.total_wins > gpt4oStats.total_wins && (
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      GPT-5 is currently preferred by {((gpt5Stats.overall_win_rate * 100).toFixed(1))}% of users in blind tests
                    </li>
                  )}
                  {gpt4oStats.total_wins > gpt5Stats.total_wins && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      GPT-4o is currently preferred by {((gpt4oStats.overall_win_rate * 100).toFixed(1))}% of users in blind tests
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    Users take an average of {Math.round((gpt4oStats.avg_decision_time + gpt5Stats.avg_decision_time) / 2000)} seconds to decide between responses
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    {totalTests} blind comparison tests have been completed by the community
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              onClick={() => router.push('/blind-test/gpt-challenge')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Take the Blind Test
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Add your preferences to the community data
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}