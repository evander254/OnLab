import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        passord: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Check against Admin table as requested
            const { data, error } = await supabase
                .from('Admin')
                .select('*')
                .eq('username', formData.username)
                .eq('passord', formData.passord) // Checking plain text as requested
                .single();

            if (error || !data) {
                throw new Error('Invalid Admin Credentials');
            }

            // Simple session storage for demo purposes (or use Context)
            localStorage.setItem('adminAuthenticated', 'true');
            localStorage.setItem('adminUser', JSON.stringify(data));

            navigate('/admin/dashboard');

        } catch (err) {
            console.error('Login error:', err);
            setError('Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{ padding: '40px', borderRadius: '16px', maxWidth: '400px', width: '100%' }}
            >
                <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', textAlign: 'center' }}>Admin Portal</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px' }}>Secure Access Only</p>

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

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
                        <input
                            type="password"
                            name="passord"
                            placeholder="••••••••"
                            value={formData.passord}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Verifying...' : 'Access Dashboard'}
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <a href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Back to Home</a>
                    </div>
                </form>
            </motion.div>
        </section>
    );
};

export default AdminLogin;
