import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Plus,
  Eye
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'

export function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    {
      label: 'Reputation Score',
      value: user?.reputation.score || 0,
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Verification Level',
      value: user?.verification.verificationLevel || 'None',
      icon: CheckCircle,
      color: 'text-blue-400',
    },
    {
      label: 'Total Verifications',
      value: user?.activity.totalVerifications || 0,
      icon: Users,
      color: 'text-purple-400',
    },
    {
      label: 'Success Rate',
      value: user?.activity.totalVerifications 
        ? `${Math.round((user.activity.successfulVerifications / user.activity.totalVerifications) * 100)}%`
        : '0%',
      icon: Eye,
      color: 'text-yellow-400',
    },
  ]

  const quickActions = [
    {
      title: 'Create Identity',
      description: 'Set up your decentralized identity',
      icon: Shield,
      href: '/identity',
      color: 'bg-blue-600',
    },
    {
      title: 'Add Credential',
      description: 'Add new credentials to your identity',
      icon: FileText,
      href: '/credentials',
      color: 'bg-green-600',
    },
    {
      title: 'Request Verification',
      description: 'Verify your identity with services',
      icon: CheckCircle,
      href: '/verification',
      color: 'bg-purple-600',
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'verification',
      title: 'Identity Verified',
      description: 'Your identity was successfully verified by Service X',
      timestamp: '2 hours ago',
      status: 'completed',
    },
    {
      id: 2,
      type: 'credential',
      title: 'Credential Added',
      description: 'New employment credential added',
      timestamp: '1 day ago',
      status: 'completed',
    },
    {
      id: 3,
      type: 'verification',
      title: 'Verification Request',
      description: 'Pending verification from Service Y',
      timestamp: '2 days ago',
      status: 'pending',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.profile.firstName || 'User'}!
          </h1>
          <p className="text-gray-300">
            Manage your identity and credentials from your dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="glass-dark border-gray-800 hover:border-purple-600 transition-colors">
                <div className="p-6">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                  <p className="text-gray-300 text-sm mb-4">{action.description}</p>
                  <Link to={action.href}>
                    <Button variant="ghost" size="sm" className="p-0">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Identity Status */}
          <div className="lg:col-span-2">
            <Card className="glass-dark border-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Identity Status</h2>
                  <Link to="/identity">
                    <Button variant="ghost" size="sm">
                      View Details
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Identity Hash</p>
                        <p className="text-gray-400 text-sm">
                          {user?.identityHash ? `${user.identityHash.slice(0, 10)}...${user.identityHash.slice(-10)}` : 'Not created'}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user?.identityHash ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {user?.identityHash ? 'Active' : 'Not Created'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">Verification Status</p>
                        <p className="text-gray-400 text-sm">
                          {user?.verification.isVerified ? 'Verified' : 'Not Verified'}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user?.verification.isVerified ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {user?.verification.verificationLevel}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white font-medium">Reputation Level</p>
                        <p className="text-gray-400 text-sm">
                          {user?.reputation.level} with {user?.reputation.score} points
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user?.reputation.level === 'Platinum' ? 'bg-purple-600/20 text-purple-400' :
                      user?.reputation.level === 'Gold' ? 'bg-yellow-600/20 text-yellow-400' :
                      user?.reputation.level === 'Silver' ? 'bg-gray-600/20 text-gray-400' :
                      'bg-orange-600/20 text-orange-400'
                    }`}>
                      {user?.reputation.level}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="glass-dark border-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{activity.title}</p>
                        <p className="text-gray-400 text-xs">{activity.description}</p>
                        <p className="text-gray-500 text-xs mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-800">
                  <Link to="/activity">
                    <Button variant="ghost" size="sm" className="w-full">
                      View All Activity
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="mt-8">
          <Card className="glass-dark border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Privacy Settings</h2>
                <Link to="/settings">
                  <Button variant="ghost" size="sm">
                    Manage Settings
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Data Sharing</p>
                    <p className="text-gray-400 text-sm">Control data sharing preferences</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    user?.privacy.dataSharing ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Marketing</p>
                    <p className="text-gray-400 text-sm">Marketing communications</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    user?.privacy.marketingConsent ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Analytics</p>
                    <p className="text-gray-400 text-sm">Help improve our services</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    user?.privacy.analyticsConsent ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
