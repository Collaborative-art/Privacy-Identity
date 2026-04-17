import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Lock, Eye, CheckCircle, Users, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export function HomePage() {
  const { isAuthenticated, connectWallet } = useAuth()

  const features = [
    {
      icon: Shield,
      title: 'Self-Sovereign Identity',
      description: 'Take complete control of your digital identity with decentralized management.',
    },
    {
      icon: Lock,
      title: 'Zero-Knowledge Proofs',
      description: 'Verify your identity without revealing sensitive personal information.',
    },
    {
      icon: Eye,
      title: 'Privacy-First Design',
      description: 'Your data stays private with end-to-end encryption and selective disclosure.',
    },
    {
      icon: CheckCircle,
      title: 'Instant Verification',
      description: 'Get verified instantly with blockchain-based credential validation.',
    },
    {
      icon: Users,
      title: 'Reputation System',
      description: 'Build trust through a transparent reputation scoring mechanism.',
    },
    {
      icon: Globe,
      title: 'Global Access',
      description: 'Access services worldwide with your universally recognized digital identity.',
    },
  ]

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="glass-dark border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold gradient-text">X-Ray Protocol</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link to="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link to="/#about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="primary">Dashboard</Button>
                </Link>
              ) : (
                <Button onClick={handleConnectWallet} variant="primary">
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Privacy & Identity</span>
            <br />
            <span className="text-white">Reimagined</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            The X-Ray Protocol Era brings you complete control over your digital identity. 
            Verify yourself without compromising privacy, manage credentials seamlessly, 
            and interact with services on your terms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <Button onClick={handleConnectWallet} variant="primary" size="lg">
                Get Started
              </Button>
            )}
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Powerful Features</span>
          </h2>
          <p className="text-xl text-gray-300">
            Everything you need for secure, private identity management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-dark rounded-xl p-6 card-hover border border-gray-800"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-600/20 rounded-lg mr-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">How It Works</span>
          </h2>
          <p className="text-xl text-gray-300">
            Simple steps to get started with X-Ray Protocol
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              step: '1',
              title: 'Connect Wallet',
              description: 'Connect your Ethereum wallet to get started.',
            },
            {
              step: '2',
              title: 'Create Identity',
              description: 'Create your decentralized digital identity.',
            },
            {
              step: '3',
              title: 'Add Credentials',
              description: 'Securely add and manage your credentials.',
            },
            {
              step: '4',
              title: 'Verify & Share',
              description: 'Verify identity and share credentials selectively.',
            },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-300">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass-dark rounded-2xl p-8 border border-gray-800">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-gray-300">Active Identities</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">50K+</div>
              <div className="text-gray-300">Credentials Issued</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">150+</div>
              <div className="text-gray-300">Partner Services</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Ready to Take Control?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users who have already embraced privacy-first identity management.
          </p>
          {!isAuthenticated ? (
            <Button onClick={handleConnectWallet} variant="primary" size="lg">
              Start Your Journey
            </Button>
          ) : (
            <Link to="/dashboard">
              <Button variant="primary" size="lg">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-dark border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold">X-Ray Protocol</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Privacy-first identity management for the decentralized web.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/api" className="hover:text-white transition-colors">API</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/compliance" className="hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 X-Ray Protocol. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
