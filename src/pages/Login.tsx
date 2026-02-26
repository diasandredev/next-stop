import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';


// Custom airplane SVG for better aesthetics
const AirplaneSvg = ({ size, opacity }: { size: number; opacity: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ opacity }}
  >
    <path
      d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      fill="rgba(255, 255, 255, 0.6)"
    />
  </svg>
);

// 🎅 Santa Sleigh SVG for Christmas Easter egg
const SantaSleighSvg = ({ size, opacity }: { size: number; opacity: number }) => (
  <svg
    width={size * 3}
    height={size * 1.5}
    viewBox="0 0 120 50"
    fill="none"
    style={{ opacity: opacity * 1.5 }}
  >
    {/* Reindeer antlers */}
    <path d="M8 18 L5 10 L3 14 M8 18 L11 10 L13 14" stroke="rgba(160,120,60,0.9)" strokeWidth="1" fill="none" />
    {/* Reindeer body */}
    <ellipse cx="10" cy="22" rx="6" ry="4" fill="rgba(160,120,60,0.8)" />
    {/* Reindeer legs */}
    <line x1="6" y1="26" x2="5" y2="31" stroke="rgba(160,120,60,0.7)" strokeWidth="1" />
    <line x1="14" y1="26" x2="15" y2="31" stroke="rgba(160,120,60,0.7)" strokeWidth="1" />
    {/* Rudolph's red nose */}
    <circle cx="4" cy="20" r="1.5" fill="rgba(255,50,50,0.9)" />
    {/* Nose glow */}
    <circle cx="4" cy="20" r="3" fill="rgba(255,50,50,0.2)" />
    {/* Reins */}
    <path d="M16 22 Q30 18 40 25" stroke="rgba(200,180,100,0.5)" strokeWidth="0.8" fill="none" />
    {/* Second reindeer (behind) */}
    <ellipse cx="22" cy="20" rx="5" ry="3.5" fill="rgba(140,100,50,0.6)" />
    <path d="M20 14 L17 8 L15 11 M20 14 L23 8 L25 11" stroke="rgba(140,100,50,0.7)" strokeWidth="0.8" fill="none" />
    {/* Sleigh body */}
    <path d="M38 22 Q36 22 36 28 L38 32 Q40 34 75 34 L78 32 Q80 28 78 25 Z" fill="rgba(180,30,30,0.85)" />
    {/* Sleigh runner */}
    <path d="M36 34 Q34 36 36 37 L80 37 Q82 36 80 34" fill="rgba(200,170,50,0.7)" stroke="rgba(220,190,70,0.8)" strokeWidth="0.5" />
    {/* Gift boxes */}
    <rect x="60" y="22" width="6" height="6" rx="0.5" fill="rgba(220,50,50,0.8)" />
    <line x1="63" y1="22" x2="63" y2="28" stroke="rgba(255,215,0,0.8)" strokeWidth="0.8" />
    <line x1="60" y1="25" x2="66" y2="25" stroke="rgba(255,215,0,0.8)" strokeWidth="0.8" />
    <rect x="67" y="24" width="5" height="5" rx="0.5" fill="rgba(50,180,50,0.8)" />
    <line x1="69.5" y1="24" x2="69.5" y2="29" stroke="rgba(255,215,0,0.7)" strokeWidth="0.7" />
    {/* Santa body */}
    <ellipse cx="50" cy="22" rx="6" ry="8" fill="rgba(200,30,30,0.9)" />
    {/* Belt */}
    <rect x="44" y="24" width="12" height="2" fill="rgba(30,30,30,0.8)" />
    <rect x="49" y="23.5" width="3" height="3" rx="0.5" fill="rgba(255,215,0,0.8)" />
    {/* Santa head */}
    <circle cx="50" cy="13" r="4" fill="rgba(255,210,170,0.9)" />
    {/* Santa hat */}
    <path d="M46 13 Q46 8 50 6 Q54 8 54 13" fill="rgba(200,30,30,0.9)" />
    <path d="M50 6 Q52 4 55 5" stroke="rgba(200,30,30,0.9)" strokeWidth="2" fill="none" />
    <circle cx="55" cy="5" r="1.5" fill="rgba(255,255,255,0.9)" />
    {/* Hat brim */}
    <rect x="45" y="12" width="10" height="2" rx="1" fill="rgba(255,255,255,0.85)" />
    {/* Santa beard */}
    <path d="M47 15 Q50 20 53 15" fill="rgba(255,255,255,0.85)" />
  </svg>
);

// 🎈 Hot Air Balloon SVG
const HotAirBalloonSvg = ({ size, opacity }: { size: number; opacity: number }) => (
  <svg
    width={size}
    height={size * 1.4}
    viewBox="0 0 60 84"
    fill="none"
    style={{ opacity }}
  >
    {/* Balloon envelope */}
    <path
      d="M30 2 C12 2 2 18 2 32 C2 44 12 52 22 56 L24 58 L36 58 L38 56 C48 52 58 44 58 32 C58 18 48 2 30 2Z"
      fill="url(#balloonGrad)"
    />
    {/* Balloon stripes */}
    <path d="M20 4 Q16 16 16 32 Q16 44 22 54" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
    <path d="M30 2 Q30 16 30 32 Q30 44 30 56" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
    <path d="M40 4 Q44 16 44 32 Q44 44 38 54" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
    {/* Ropes */}
    <line x1="24" y1="58" x2="22" y2="70" stroke="rgba(200,180,120,0.6)" strokeWidth="0.8" />
    <line x1="36" y1="58" x2="38" y2="70" stroke="rgba(200,180,120,0.6)" strokeWidth="0.8" />
    <line x1="28" y1="57" x2="26" y2="70" stroke="rgba(200,180,120,0.5)" strokeWidth="0.6" />
    <line x1="32" y1="57" x2="34" y2="70" stroke="rgba(200,180,120,0.5)" strokeWidth="0.6" />
    {/* Basket */}
    <rect x="21" y="70" width="18" height="10" rx="2" fill="rgba(160,120,60,0.8)" stroke="rgba(130,95,45,0.9)" strokeWidth="0.8" />
    {/* Basket weave pattern */}
    <line x1="25" y1="70" x2="25" y2="80" stroke="rgba(130,95,45,0.5)" strokeWidth="0.5" />
    <line x1="30" y1="70" x2="30" y2="80" stroke="rgba(130,95,45,0.5)" strokeWidth="0.5" />
    <line x1="35" y1="70" x2="35" y2="80" stroke="rgba(130,95,45,0.5)" strokeWidth="0.5" />
    <line x1="21" y1="75" x2="39" y2="75" stroke="rgba(130,95,45,0.5)" strokeWidth="0.5" />
    {/* Flame */}
    <ellipse cx="30" cy="60" rx="2" ry="3" fill="rgba(255,160,30,0.7)" />
    <ellipse cx="30" cy="59" rx="1" ry="2" fill="rgba(255,220,80,0.8)" />
    {/* Gradient definition */}
    <defs>
      <linearGradient id="balloonGrad" x1="0" y1="0" x2="60" y2="60">
        <stop offset="0%" stopColor="rgba(220,60,60,0.85)" />
        <stop offset="33%" stopColor="rgba(255,165,0,0.85)" />
        <stop offset="66%" stopColor="rgba(255,215,0,0.85)" />
        <stop offset="100%" stopColor="rgba(220,60,60,0.85)" />
      </linearGradient>
    </defs>
  </svg>
);

// Animated balloon component - floating upward
const AnimatedBalloon = ({ left, delay, duration, size, opacity }: {
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}) => (
  <div
    className="animated-balloon"
    style={{
      position: 'absolute',
      left: `${left}%`,
      bottom: '-120px',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    <HotAirBalloonSvg size={size} opacity={opacity} />
  </div>
);

// Check if today is Christmas
const isChristmas = () => {
  const today = new Date();
  return today.getMonth() === 11 && today.getDate() === 25;
};

// Animated airplane component - flying left to right
const AnimatedPlane = ({ delay, top, duration, size, opacity, christmas }: {
  delay: number;
  top: number;
  duration: number;
  size: number;
  opacity: number;
  christmas: boolean;
}) => (
  <div
    className="animated-plane"
    style={{
      position: 'absolute',
      top: `${top}%`,
      left: '-60px',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    <div style={{ transform: christmas ? 'scaleX(-1)' : 'rotate(90deg)' }}>
      {christmas ? (
        <SantaSleighSvg size={size} opacity={opacity} />
      ) : (
        <AirplaneSvg size={size} opacity={opacity} />
      )}
    </div>
  </div>
);

// Animated cloud component - fluffy cloud design
const AnimatedCloud = ({ delay, top, duration, scale, opacity }: {
  delay: number;
  top: number;
  duration: number;
  scale: number;
  opacity: number;
}) => (
  <div
    className="animated-cloud"
    style={{
      position: 'absolute',
      top: `${top}%`,
      left: '-200px',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      transform: `scale(${scale})`,
      opacity: opacity,
    }}
  >
    <svg width="180" height="80" viewBox="0 0 180 80" fill="none">
      <path
        d="M30 60 Q10 60 10 45 Q10 30 30 30 Q35 15 55 15 Q75 15 80 30 Q85 20 105 20 Q125 20 130 35 Q145 30 160 40 Q175 50 160 60 Z"
        fill="rgba(255, 255, 255, 0.04)"
      />
    </svg>
  </div>
);

// Star component for night sky
const Star = ({ top, left, size, delay, twinkle }: {
  top: number;
  left: number;
  size: number;
  delay: number;
  twinkle: boolean;
}) => (
  <div
    className={twinkle ? "star twinkle" : "star"}
    style={{
      position: 'absolute',
      top: `${top}%`,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDelay: `${delay}s`,
    }}
  />
);

// Generate random planes - fewer with lower opacity
const generatePlanes = () => {
  const planes = [];
  for (let i = 0; i < 5; i++) {
    planes.push({
      id: i,
      delay: Math.random() * 25,
      top: 5 + Math.random() * 85,
      duration: 30 + Math.random() * 25,
      size: 18 + Math.random() * 16,
      opacity: 0.08 + Math.random() * 0.12,
    });
  }
  return planes;
};

// Generate random clouds - slower than planes
const generateClouds = () => {
  const clouds = [];
  for (let i = 0; i < 4; i++) {
    clouds.push({
      id: i,
      delay: Math.random() * 40,
      top: 10 + Math.random() * 70,
      duration: 80 + Math.random() * 60,
      scale: 0.8 + Math.random() * 1.5,
      opacity: 0.4 + Math.random() * 0.4,
    });
  }
  return clouds;
};

// Generate stars for night sky
const generateStars = () => {
  const stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 5,
      twinkle: Math.random() > 0.5,
    });
  }
  return stars;
};

// Generate balloon data (only if lucky — ~5% chance)
const generateBalloon = () => {
  if (Math.random() > 0.05) return null;
  return {
    left: 15 + Math.random() * 70,
    delay: 5 + Math.random() * 15,
    duration: 40 + Math.random() * 20,
    size: 30 + Math.random() * 20,
    opacity: 0.15 + Math.random() * 0.15,
  };
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [planes] = useState(generatePlanes);
  const [clouds] = useState(generateClouds);
  const [stars] = useState(generateStars);
  const christmas = useMemo(() => isChristmas(), []);
  const [balloon] = useState(generateBalloon);
  const { login, signup, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/board');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password);
        toast.success('Account created successfully!');
      } else {
        await login(email, password);
        toast.success('Login successful!');
      }
      navigate('/board');
    } catch (error: unknown) {
      console.error(error);
      let message = isSignUp ? 'Error creating account' : 'Login failed';
      const err = error as { code?: string };
      if (err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already in use';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/board');
      toast.success('Google login successful!');
    } catch (error: unknown) {
      console.error(error);
      toast.error('Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <SEO title="Login" />
      {/* Stars background - static twinkling */}

      <div className="stars-container">
        {stars.map((star) => (
          <Star key={star.id} {...star} />
        ))}
      </div>

      {/* Animated clouds - behind planes */}
      <div className="clouds-container">
        {clouds.map((cloud) => (
          <AnimatedCloud key={cloud.id} {...cloud} />
        ))}
      </div>

      {/* Animated planes (or Santa on Christmas!) */}
      <div className="planes-container">
        {planes.map((plane) => (
          <AnimatedPlane key={plane.id} {...plane} christmas={christmas} />
        ))}
      </div>

      {/* 🎈 Easter egg: rare hot air balloon */}
      {balloon && (
        <div className="balloon-container">
          <AnimatedBalloon {...balloon} />
        </div>
      )}

      {/* Subtle grid pattern overlay */}
      <div className="grid-overlay" />

      {/* Gradient orbs for depth */}
      <div className="gradient-orb orb-1" />
      <div className="gradient-orb orb-2" />

      {/* Login Card */}
      <div className="login-card">
        {/* Logo / Branding */}

        <div className="login-header">
          <img
            src="/logo.png"
            alt="Next Stop"
            className="login-logo"
          />
          <h1 className="brand-name">Next Stop</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Label htmlFor="email" className="input-label">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <Label htmlFor="password" className="input-label">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <div className="toggle-mode">
            <span className="toggle-text">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="toggle-button"
              disabled={isLoading}
            >
              {isSignUp ? 'Sign In' : 'Create one'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">or continue with</span>
          <div className="divider-line" />
        </div>

        {/* Google Button */}
        <Button
          variant="outline"
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
      </div>

      {/* CSS Styles */}
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0f1a 100%);
          position: relative;
          overflow: hidden;
          padding: 1rem;
        }

        /* Stars for night sky */
        .stars-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          opacity: 0.6;
        }

        .star.twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Animated planes */
        .planes-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .animated-plane {
          position: absolute;
          animation: flyAcross linear infinite;
        }

        @keyframes flyAcross {
          0% {
            transform: translateX(0) translateY(0);
          }
          100% {
            transform: translateX(calc(100vw + 120px)) translateY(-20px);
          }
        }

        /* Animated clouds - slower drift */
        .clouds-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .animated-cloud {
          position: absolute;
          animation: driftAcross linear infinite;
        }

        /* Hot air balloon floating up */
        .balloon-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .animated-balloon {
          position: absolute;
          animation: floatUp linear infinite;
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-25vh) translateX(15px);
          }
          50% {
            transform: translateY(-50vh) translateX(-10px);
          }
          75% {
            transform: translateY(-75vh) translateX(12px);
          }
          100% {
            transform: translateY(calc(-100vh - 150px)) translateX(-5px);
          }
        }

        @keyframes driftAcross {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(100vw + 300px));
          }
        }

        /* Grid overlay */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(232, 93, 4, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232, 93, 4, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Gradient orbs */
        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(232, 93, 4, 0.12) 0%, transparent 70%);
          top: -200px;
          right: -200px;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 186, 8, 0.08) 0%, transparent 70%);
          bottom: -150px;
          left: -150px;
        }

        /* Login card */
        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(15, 15, 20, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          position: relative;
          z-index: 10;
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 20px 50px -20px rgba(0, 0, 0, 0.5);
        }

        /* Header */
        .login-header {
          text-align: center;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .login-logo {
          width: 140px;
          height: 140px;
          border-radius: 28px;
          object-fit: cover;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .brand-name {
          font-family: 'Pacifico', cursive;
          font-size: 42px;
          background: linear-gradient(135deg, #FFBA08 0%, #E85D04 50%, #DC2F02 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, hsl(214 41% 32%) 0%, hsl(214 50% 25%) 100%);
          border-radius: 14px;
          color: white;
          box-shadow: 0 8px 20px -8px rgba(48, 77, 115, 0.5);
        }

        .logo-text {
          font-size: 32px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }

        .logo-highlight {
          color: hsl(214 60% 55%);
        }

        .tagline {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          font-weight: 400;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.3px;
        }

        .login-input {
          height: 48px;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: white !important;
          font-size: 15px;
          padding: 0 16px;
          transition: all 0.2s ease;
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .login-input:focus {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: #E85D04 !important;
          box-shadow: 0 0 0 3px rgba(232, 93, 4, 0.2);
          outline: none;
        }

        .submit-button {
          height: 48px;
          background: linear-gradient(135deg, #E85D04 0%, #DC2F02 100%) !important;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #F97316 0%, #E85D04 100%) !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px -8px rgba(232, 93, 4, 0.5);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toggle-mode {
          text-align: center;
          font-size: 14px;
        }

        .toggle-text {
          color: rgba(255, 255, 255, 0.5);
        }

        .toggle-button {
          background: none;
          border: none;
          color: #FFBA08;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .toggle-button:hover {
          color: #E85D04;
          text-decoration: underline;
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .divider-text {
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Google button */
        .google-button {
          height: 48px;
          width: 100%;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px;
          color: white !important;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .google-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }

        .google-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-icon {
          width: 18px;
          height: 18px;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-card {
            padding: 28px 24px;
            border-radius: 20px;
          }

          .logo-text {
            font-size: 26px;
          }

          .logo-icon {
            width: 42px;
            height: 42px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
