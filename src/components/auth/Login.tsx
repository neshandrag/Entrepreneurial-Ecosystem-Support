import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { Building2 } from 'lucide-react';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.emailOrUsername) {
      setErrors({ emailOrUsername: 'Email or username is required' });
      return;
    }
    if (!formData.password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    try {
      const result = await login(formData.emailOrUsername, formData.password);
      
      // Navigate to the backend-provided redirectUrl or fall back to role-based routing
      if (result.redirectUrl) {
        navigate(result.redirectUrl);
      } else {
        // Fallback navigation based on user role (shouldn't normally happen)
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Invalid credentials';
      setErrors({ general: errorMessage });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full space-y-10">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Building2 className="h-12 w-12 text-cyan-400" />
            <h1 className="text-5xl font-bold text-white">CITBIF</h1>
          </div>
          <h2 className="text-2xl text-gray-300 font-semibold">Welcome back</h2>
          <p className="text-base text-gray-400 mt-3">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <Card className="p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {errors.general && (
              <div className="bg-red-900/20 border border-red-600/30 text-red-400 px-6 py-4 rounded-lg text-base">
                {errors.general}
              </div>
            )}

            <Input
              label="Email or Username"
              name="emailOrUsername"
              type="text"
              value={formData.emailOrUsername}
              onChange={handleChange}
              error={errors.emailOrUsername}
              placeholder="Enter your email or username"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-lg py-4"
              isLoading={isLoading}
            >
              Sign In
            </Button>

            <div className="text-center text-base">
              <span className="text-gray-400">Don't have an account? </span>
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </Card>

      </div>
    </div>
  );
};

export default Login;