import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) {
                setLoading(false);
                navigate('/login');
            } else {
                fetchProfile(session.user);
            }
        });

        // 2. Listen for changes (e.g. sign in, sign out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                navigate('/login');
            } else {
                // Only fetch if not already fetched or user changed
                fetchProfile(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const fetchProfile = async (user) => {
        try {
            // Try fetching with the case-sensitive column names first (as per previous code)
            let { data, error } = await supabase
                .from('Users')
                .select('*')
                .eq('Email', user.email)
                .single();

            if (error) {
                // Fallback: try lowercase column names if the above failed
                console.warn("First fetch failed, trying lowercase columns...", error.message);
                const { data: dataLow, error: errorLow } = await supabase
                    .from('Users')
                    .select('*')
                    .eq('email', user.email)
                    .single();

                if (dataLow) data = dataLow;
                if (errorLow) throw errorLow;
            }

            if (data) {
                setUserProfile(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
            }}>
                Loading dashboard...
            </div>
        );
    }

    // Mock/Default data merging with fetched profile
    // Handle both potential column casing in the state object
    const user = {
        name: userProfile?.FullNmae || userProfile?.fullnmae || userProfile?.FullName || "User",
        email: userProfile?.Email || userProfile?.email || session?.user?.email || "",
        balance: 0, // In future, fetch this from DB
        activeOrders: 0
    };

    // Calculate Initials
    const getInitials = (name) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
            : 'U';
    };

    const stats = [
        { label: "Wallet Balance", value: `KES ${user.balance}`, icon: "fa-wallet", color: "var(--success)" },
        { label: "Active Orders", value: user.activeOrders, icon: "fa-clock", color: "var(--warning)" },
        { label: "Total Completed", value: "15", icon: "fa-check-circle", color: "var(--secondary)" },
    ];

    return (
        <section className="dashboard-section" style={{
            minHeight: '100vh',
            paddingTop: '40px', // Adjusted padding
            paddingBottom: '40px'
        }}>
            <div className="container">
                {/* Dashboard Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Profile Avatar with Initials */}
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'var(--accent-color)',
                            color: 'var(--bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            border: '2px solid var(--glass-border)'
                        }}>
                            {getInitials(user.name)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '4px' }}>Dashboard</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</span></p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="services-grid" style={{ marginBottom: '40px' }}>
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            className="glass"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '24px' }}
                        >
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                color: stat.color
                            }}>
                                <i className={`fas ${stat.icon}`}></i>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{stat.value}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    {/* Quick Actions */}
                    <motion.div
                        className="glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}
                    >
                        <h3 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>Quick Actions</h3>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <button className="btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer' }}>
                                <i className="fas fa-plus-circle"></i> New Plagiarism Check
                            </button>
                            <button className="btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer' }}>
                                <i className="fas fa-file-alt"></i> Course Hero Unlock
                            </button>
                            <button className="btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer' }}>
                                <i className="fas fa-unlock"></i> Unlock Resource
                            </button>
                        </div>
                    </motion.div>

                    {/* Recent Activity Mockup */}
                    <motion.div
                        className="glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}
                    >
                        <h3 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>Recent Activity</h3>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                                <div>
                                    <p style={{ fontWeight: '500' }}>Essay_Final_Draft.docx</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Plagiarism Check</p>
                                </div>
                                <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>Completed</span>
                            </li>
                            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                                <div>
                                    <p style={{ fontWeight: '500' }}>Course Hero Link #492</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unlock Service</p>
                                </div>
                                <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>Processing</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
