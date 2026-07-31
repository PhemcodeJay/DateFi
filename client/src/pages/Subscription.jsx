import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { paymentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const Subscription = () => {
  const [plans, setPlans] = useState([
    {
      name: 'premium',
      price: 9.99,
      features: ['Unlimited messages', 'See who liked you', 'Advanced filters', 'Ad-free experience'],
      popular: true
    },
    {
      name: 'vip',
      price: 19.99,
      features: ['All Premium features', 'Profile boost', 'Priority support', 'Exclusive badges', 'See who viewed you'],
      popular: false
    }
  ]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { user } = useAuth();

  const handlePayment = async (plan) => {
    setPaymentLoading(true);
    try {
      const res = await paymentsAPI.createPayment(plan);
      
      // Open payment URL in a new tab or redirect
      if (res.data.paymentUrl) {
        window.open(res.data.paymentUrl, '_blank');
      }
      
      toast.success('Payment created! Complete the payment in the new tab.');
    } catch (error) {
      toast.error('Failed to create payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Upgrade Your Experience
          </h1>
          <p className="text-xl text-gray-600">Unlock premium features with crypto</p>
        </div>

        {/* User's Current Plan */}
        {user && user.subscription && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-12">
            <h3 className="text-xl font-semibold mb-2">Current Plan</h3>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full font-semibold ${
                user.subscription.plan === 'free' ? 'bg-gray-200 text-gray-700' :
                user.subscription.plan === 'premium' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {user.subscription.plan.toUpperCase()}
              </span>
              {user.subscription.endDate && (
                <span className="text-gray-600">
                  Active until {new Date(user.subscription.endDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                plan.popular ? 'ring-2 ring-pink-500 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-center mb-2">
                {plan.name === 'premium' ? 'Premium' : 'VIP'}
              </h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePayment(plan.name)}
                disabled={paymentLoading}
                className={`w-full py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {paymentLoading ? 'Processing...' : `Upgrade to ${plan.name === 'premium' ? 'Premium' : 'VIP'}`}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💰 Crypto Payments
          </h3>
          <p className="text-blue-700 mb-4">
            Secure payments powered by NowPayments. We accept Bitcoin, Ethereum, USDT, SOL, and 100+ cryptocurrencies.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['BTC', 'ETH', 'USDT', 'SOL', 'BNB'].map((crypto) => (
              <span key={crypto} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {crypto}
              </span>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="font-semibold text-lg mb-2">How does crypto payment work?</h3>
              <p className="text-gray-600">When you click upgrade, you'll be redirected to NowPayments where you can pay with your preferred cryptocurrency. Your subscription will be activated automatically once payment is confirmed.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="font-semibold text-lg mb-2">Is my payment secure?</h3>
              <p className="text-gray-600">Yes! All payments are processed through NowPayments, a secure and trusted crypto payment processor with industry-standard security.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="font-semibold text-lg mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;