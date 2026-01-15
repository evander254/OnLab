import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Wallet = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [processing, setProcessing] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        fetchUserAndWallet();
    }, []);

    const fetchUserAndWallet = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            // Fetch User
            let { data: user, error: userError } = await supabase
                .from('Users')
                .select('*')
                .eq('Email', session.user.email)
                .single();

            if (userError) {
                // Fallback to lowercase email if needed, similar to UserDashboard
                const { data: dataLow } = await supabase
                    .from('Users')
                    .select('*')
                    .eq('email', session.user.email)
                    .single();
                if (dataLow) user = dataLow;
            }

            if (user) {
                setUserProfile(user);
                // Fetch Wallet
                if (user.User_id) {
                    const { data: walletData, error: walletError } = await supabase
                        .from('Wallet')
                        .select('Balance')
                        .eq('UserID', user.User_id)
                        .maybeSingle();

                    if (!walletError && walletData) {
                        setBalance(walletData.Balance);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();

        if (!amount || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        if (!phoneNumber) {
            alert('Please enter a phone number.');
            return;
        }

        setProcessing(true);

        try {
            // Simulate Payment Processing Delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In a real app, you would integrate with a payment gateway here.
            // For now, we directly update the wallet balance.

            const newBalance = balance + parseInt(amount);

            // Update Supabase
            const { error: updateError } = await supabase
                .from('Wallet')
                .update({ Balance: newBalance })
                .eq('UserID', userProfile.User_id);

            if (updateError) throw updateError;

            setBalance(newBalance);
            setAmount('');
            setPhoneNumber('');
            alert(`Successfully topped up KES ${amount}!`);

        } catch (error) {
            console.error('Top-up failed:', error);
            alert('Top-up failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
            }}>
                Loading Wallet...
            </div>
        );
    }

    return (
        <section className="wallet-section" style={{ padding: '20px 0' }}>
            <div className="container">
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>My Wallet</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your funds and transactions</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

                    {/* Balance Card */}
                    <motion.div
                        className="glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '32px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
                    >
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '16px',
                            background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '24px', fontSize: '1.8rem'
                        }}>
                            <i className="fas fa-wallet"></i>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Current Balance</p>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
                            KES {balance.toLocaleString()}
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <i className="fas fa-shield-alt" style={{ marginRight: '8px', color: 'var(--accent-color)' }}></i>
                            Secure Payments via M-Pesa
                        </div>
                    </motion.div>

                    {/* Top Up Form */}
                    <motion.div
                        className="glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}
                    >
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-plus-circle" style={{ color: 'var(--accent-color)' }}></i>
                            Top Up Wallet
                        </h3>

                        <form onSubmit={handleTopUp}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                    Amount (KES)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>KES</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="e.g. 500"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px 12px 50px',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            fontSize: '1rem'
                                        }}
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                    M-Pesa Phone Number
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                        <i className="fas fa-phone"></i>
                                    </span>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="07..."
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px 12px 50px',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={processing}
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '14px',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                {processing ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Processing...
                                    </>
                                ) : (
                                    <>
                                        Top Up Now <i className="fas fa-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Wallet;
