import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [session, setSession] = useState(null);

    const [notifyBalance, setNotifyBalance] = useState(() => {
        return localStorage.getItem('notifyBalance') === 'true';
    });
    const [notifyOrders, setNotifyOrders] = useState(() => {
        return localStorage.getItem('notifyOrders') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('notifyBalance', notifyBalance);
    }, [notifyBalance]);

    useEffect(() => {
        localStorage.setItem('notifyOrders', notifyOrders);
    }, [notifyOrders]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });
    }, []);

    const fetchProfile = async (user) => {
        try {
            let { data, error } = await supabase
                .from('Users')
                .select('*')
                .eq('Email', user.email)
                .single();

            if (error) {
                const { data: dataLow, error: errorLow } = await supabase
                    .from('Users')
                    .select('*')
                    .eq('email', user.email)
                    .single();
                if (dataLow) data = dataLow;
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

    const tabs = [
        { id: 'profile', label: 'Profile' },
        { id: 'contact', label: 'Contact' },
        { id: 'compliance', label: 'Compliance' },
        { id: 'payout', label: 'Payout' },
        { id: 'alerts', label: 'Alerts' },
    ];

    if (loading) {
        return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading settings...</div>;
    }

    const user = {
        name: userProfile?.FullNmae || userProfile?.fullnmae || userProfile?.FullName || "User",
        email: userProfile?.Email || userProfile?.email || session?.user?.email || "",
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Breadcrumbs / Header */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Home &gt; Settings &gt; <span style={{ color: 'var(--text-primary)' }}>Settings</span>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your account and business settings</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', md: { flexDirection: 'row' } }}>
                {/* Responsive Layout: Mobile might need column, Desktop row.
                    Using CSS Grid or Flexbox. Since I'm using inline styles mostly, I'll use a flex container
                    that wraps or uses media queries if I could, but inline styles are limited.
                    I will rely on the parent container width or basic flex wrap.
                 */}
                <div className="settings-container" style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>

                    {/* Sidebar / Tabs */}
                    <div style={{ flex: '0 0 200px', minWidth: '150px' }}>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {tabs.map(tab => (
                                <li key={tab.id} style={{ marginBottom: '8px' }}>
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '10px 16px',
                                            background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                                            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: activeTab === tab.id ? '600' : '400',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Content Area */}
                    <motion.div
                        style={{ flex: 1, minWidth: '300px' }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={activeTab}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'profile' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Personal Information */}
                                <section className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                                        Personal Information
                                    </h3>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                            Your personal account details
                                        </label>
                                    </div>

                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.name}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Address</label>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </section>

                                {/* Change Password */}
                                <section className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Change Password</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                        Update your account password
                                    </p>

                                    <button className="btn-primary" style={{ padding: '10px 24px' }}>
                                        Change Password
                                    </button>
                                </section>
                            </div>
                        )}

                        {activeTab === 'alerts' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <section className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Live Notifications</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                        Choose if to receive live notification of balance topup and orders completed.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Balance Top-up Toggle */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '500', marginBottom: '4px' }}>Balance Top-up</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Get notified when funds are added</div>
                                            </div>
                                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={notifyBalance}
                                                    onChange={(e) => setNotifyBalance(e.target.checked)}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span className="slider round" style={{
                                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundColor: notifyBalance ? 'var(--accent-color)' : '#ccc',
                                                    transition: '.4s', borderRadius: '34px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute', content: '""', height: '18px', width: '18px', left: notifyBalance ? '26px' : '4px', bottom: '4px',
                                                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>

                                        {/* Orders Completed Toggle */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '500', marginBottom: '4px' }}>Orders Completed</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Get notified when an order is finished</div>
                                            </div>
                                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={notifyOrders}
                                                    onChange={(e) => setNotifyOrders(e.target.checked)}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span className="slider round" style={{
                                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundColor: notifyOrders ? 'var(--accent-color)' : '#ccc',
                                                    transition: '.4s', borderRadius: '34px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute', content: '""', height: '18px', width: '18px', left: notifyOrders ? '26px' : '4px', bottom: '4px',
                                                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab !== 'profile' && activeTab !== 'alerts' && (
                            <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                                <i className="fas fa-hammer" style={{ fontSize: '2rem', marginBottom: '16px', opacity: 0.5 }}></i>
                                <p>{tabs.find(t => t.id === activeTab)?.label} settings are coming soon.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
