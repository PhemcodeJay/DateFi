import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Testimonials data
const testimonials = [
  {
    name: 'Sarah M.',
    age: 28,
    location: 'Nairobi, Kenya',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    text: 'I never thought I could find real connections on a dating app, but DateFi changed everything. I met my partner within two weeks and we\'re inseparable now!',
    rating: 5
  },
  {
    name: 'James K.',
    age: 31,
    location: 'Lagos, Nigeria',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    text: 'The crypto payments are genius. I can upgrade to premium without worrying about my card details being shared. Privacy-first dating is the future!',
    rating: 5
  },
  {
    name: 'Amara O.',
    age: 26,
    location: 'Accra, Ghana',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    text: 'The matches are incredibly accurate. I love how the app focuses on genuine compatibility instead of just looks. Found my best friend AND my soulmate!',
    rating: 5
  },
  {
    name: 'Daniel W.',
    age: 29,
    location: 'Cape Town, South Africa',
    image: 'https://randomuser.me/api/portraits/men/76.jpg',
    text: 'As someone who values privacy, DateFi\'s blockchain security is a game-changer. My data stays mine. Plus the community is full of amazing people.',
    rating: 5
  }
];

// FAQ data
const faqs = [
  {
    question: 'How does crypto payment work?',
    answer: 'Simply connect your crypto wallet and choose your preferred currency - USDT, BTC, ETH, or 20+ others. Payments are processed instantly with zero hidden fees.'
  },
  {
    question: 'Is my personal data secure?',
    answer: 'Absolutely. DateFi uses blockchain-level encryption and decentralized storage to ensure your data belongs to you and only you. We never sell or share your information.'
  },
  {
    question: 'How accurate are the matches?',
    answer: 'Our AI-powered matching engine analyzes over 100 compatibility factors - from lifestyle habits to communication styles - to find your ideal partner.'
  },
  {
    question: 'Can I try DateFi for free?',
    answer: 'Yes! You get 10 free daily swipes and basic messaging. Upgrade to Premium for unlimited swipes, verified profiles, and advanced filters.'
  }
];

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const statsRef = useRef(null);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animate stats on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Interactive hero background movement
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  // Animated counter component
  const Counter = ({ target, suffix = '' }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (statsVisible) {
        let start = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
        return () => clearInterval(timer);
      }
    }, [statsVisible, target]);

    return <span>{count.toLocaleString()}{suffix}</span>;
  };

  // Floating hearts background
  const hearts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${8 + Math.random() * 6}s`,
    size: `${16 + Math.random() * 24}px`
  }));

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Floating hearts animation */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {hearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute text-pink-300 opacity-30 animate-float-heart"
            style={{
              left: heart.left,
              animationDelay: heart.delay,
              animationDuration: heart.duration,
              fontSize: heart.size
            }}
          >
            💜
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div 
          className="text-center text-white mb-16 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-4 animate-fade-in-down">
            Date<span className="text-yellow-300">Fi</span>
          </h1>
          <p className="text-2xl mb-2 animate-fade-in-up">Connect. Match. Pay with Crypto.</p>
          <p className="text-lg opacity-90 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            The future of dating is decentralized 💎
          </p>
        </div>

        {/* Hero Image Showcase */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          <div className="transform hover:scale-105 transition-all duration-300 hover:rotate-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <img 
              src="https://randomuser.me/api/portraits/women/65.jpg" 
              alt="Happy couple profile" 
              className="w-full h-64 object-cover rounded-2xl shadow-2xl border-4 border-white/30"
            />
            <p className="text-white text-center mt-2 text-sm font-medium">💕 98% Match</p>
          </div>
          <div className="transform hover:scale-105 transition-all duration-300 hover:rotate-0 animate-fade-in-up mt-8" style={{ animationDelay: '0.5s' }}>
            <img 
              src="https://randomuser.me/api/portraits/men/45.jpg" 
              alt="Happy couple profile" 
              className="w-full h-64 object-cover rounded-2xl shadow-2xl border-4 border-white/30"
            />
            <p className="text-white text-center mt-2 text-sm font-medium">💎 Verified Member</p>
          </div>
          <div className="transform hover:scale-105 transition-all duration-300 hover:-rotate-2 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            <img 
              src="https://randomuser.me/api/portraits/women/47.jpg" 
              alt="Happy couple profile" 
              className="w-full h-64 object-cover rounded-2xl shadow-2xl border-4 border-white/30"
            />
            <p className="text-white text-center mt-2 text-sm font-medium">🔒 100% Private</p>
          </div>
        </div>

        {/* Animated Stats */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-4xl font-bold text-yellow-300">
              <Counter target={250} suffix="K+" />
            </div>
            <p className="text-white/80 mt-2">Active Members</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-4xl font-bold text-yellow-300">
              <Counter target={1} suffix="M+" />
            </div>
            <p className="text-white/80 mt-2">Matches Made</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-4xl font-bold text-yellow-300">
              <Counter target={180} suffix="+" />
            </div>
            <p className="text-white/80 mt-2">Countries</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-4xl font-bold text-yellow-300">
              <Counter target={97} suffix="%" />
            </div>
            <p className="text-white/80 mt-2">Success Rate</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">💕</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Find Your Match</h3>
            <p className="text-gray-600 mb-4">Swipe through profiles and connect with like-minded people</p>
            <div className="w-12 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto rounded-full group-hover:w-24 transition-all duration-300"></div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">🔒</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Secure & Private</h3>
            <p className="text-gray-600 mb-4">Your data is protected with blockchain-level security</p>
            <div className="w-12 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto rounded-full group-hover:w-24 transition-all duration-300"></div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">💰</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Crypto Payments</h3>
            <p className="text-gray-600 mb-4">Pay for premium features with USDT, BTC, ETH and more</p>
            <div className="w-12 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto rounded-full group-hover:w-24 transition-all duration-300"></div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center text-white mb-4 animate-fade-in">Success Stories 💕</h2>
          <p className="text-center text-white/80 mb-10">Real people. Real connections. Real love.</p>

          {/* Active testimonial */}
          <div className="max-w-2xl mx-auto">
            <div key={activeTestimonial} className="bg-white rounded-3xl p-8 shadow-2xl text-center animate-testimonial-in">
              <img 
                src={testimonials[activeTestimonial].image}
                alt={testimonials[activeTestimonial].name}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-pink-500 object-cover shadow-lg"
              />
              <div className="text-yellow-400 text-xl mb-4">
                {'⭐'.repeat(testimonials[activeTestimonial].rating)}
              </div>
              <p className="text-gray-700 text-lg italic mb-6">"{testimonials[activeTestimonial].text}"</p>
              <h4 className="font-bold text-gray-900 text-lg">{testimonials[activeTestimonial].name}</h4>
              <p className="text-gray-500 text-sm">
                {testimonials[activeTestimonial].age} • {testimonials[activeTestimonial].location}
              </p>
            </div>

            {/* Testimonial selector dots */}
            <div className="flex justify-center gap-3 mt-6">
              {testimonials.map((t, index) => (
                <button
                  key={t.name}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeTestimonial === index 
                      ? 'bg-yellow-300 w-8' 
                      : 'bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Show testimonial from ${t.name}`}
                />
              ))}
            </div>
          </div>

          {/* All testimonial avatars */}
          <div className="flex justify-center gap-4 mt-8">
            {testimonials.map((t, index) => (
              <button 
                key={t.name}
                onClick={() => setActiveTestimonial(index)}
                className={`transition-all duration-300 ${
                  activeTestimonial === index 
                    ? 'scale-125 ring-4 ring-yellow-300 rounded-full' 
                    : 'opacity-60 hover:opacity-100 hover:scale-110'
                }`}
              >
                <img 
                  src={t.image} 
                  alt={t.name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-white"
                />
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center text-white mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 ${
                  activeFaq === index ? 'bg-white/20' : 'hover:bg-white/15'
                }`}
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-white text-lg">{faq.question}</span>
                  <span 
                    className={`text-2xl text-yellow-300 transition-transform duration-300 ${
                      activeFaq === index ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    activeFaq === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-white/80">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Block */}
        <div className="text-center mb-20">
          {isAuthenticated ? (
            <Link to="/discover" className="btn-primary text-lg inline-block animate-bounce-slow">
              Start Matching 💘
            </Link>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="btn-primary text-lg inline-block animate-bounce-slow">
                Login 💜
              </Link>
              <Link 
                to="/register" 
                className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 hover:scale-105 transition-all transform inline-block shadow-lg"
              >
                Get Started Free ✨
              </Link>
            </div>
          )}
        </div>

        <div className="mt-10 text-center text-white/75">
          <p>© 2024 DateFi. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-yellow-300 transition-colors">Twitter</a>
            <a href="#" className="hover:text-yellow-300 transition-colors">Instagram</a>
            <a href="#" className="hover:text-yellow-300 transition-colors">Telegram</a>
            <a href="#" className="hover:text-yellow-300 transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;