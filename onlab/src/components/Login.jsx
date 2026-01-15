import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            console.log('Authentication successful:', data);

            // Additional Check: Verify user exists in public.Users table
            const { data: userProfile, error: profileError } = await supabase
                .from('Users')
                .select('*')
                .eq('Email', formData.email) // Note: Using 'Email' as established in SignUp
                .single();

            if (profileError || !userProfile) {
                // Try lowercase fallback just in case
                const { data: userProfileLow, error: profileErrorLow } = await supabase
                    .from('Users')
                    .select('*')
                    .eq('email', formData.email)
                    .single();

                if (profileErrorLow || !userProfileLow) {
                    throw new Error("User profile not found. Please sign up first.");
                }
            }

            console.log('Profile verified:', userProfile || "Found via fallback");
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            // Customize error message for profile not found
            let errorMessage = err.message;
            if (errorMessage === "Invalid login credentials") errorMessage = "Invalid email or password.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (error) throw error;
            // Note: OAuth details are handled by Supabase redirect
        } catch (err) {
            console.error('Google login error:', err);
            setError(err.message);
            setGoogleLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            setError("Please enter your email address to reset password.");
            return;
        }
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            alert("Password reset link sent to your email!");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <section className="login-section" style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '100px',
            paddingBottom: '40px'
        }}>
            <div className="container" style={{ maxWidth: '450px', width: '100%' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass"
                    style={{ padding: '40px', borderRadius: 'var(--radius-lg)' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue to OnLab</p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        disabled={googleLoading || loading}
                        className="btn-secondary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            marginBottom: '24px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            opacity: (googleLoading || loading) ? 0.7 : 1
                        }}
                    >
                        {googleLoading ? (
                            <span>Connecting...</span>
                        ) : (
                            <>
                                <i className="fab fa-google"></i> Continue with Google
                            </>
                        )}
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '24px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem'
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                        OR
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    </div>

                    <form onSubmit={handleEmailLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontWeight: '500' }}>Password</label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '0.9rem',
                                        color: 'var(--accent-color)',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>Sign up</Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Login;
