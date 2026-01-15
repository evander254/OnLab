import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [showPlagiarismPopup, setShowPlagiarismPopup] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [plagiarismFile, setPlagiarismFile] = useState(null);
    const [orderName, setOrderName] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showLowBalancePopup, setShowLowBalancePopup] = useState(false);
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [recentTasks, setRecentTasks] = useState([]);

    // Notifications State
    const [unreadCount, setUnreadCount] = useState(0);
    const [audio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')); // Beb sound


    // Course Hero State
    const [showCHPopup, setShowCHPopup] = useState(false);
    const [chLink, setChLink] = useState('');
    const [processingCH, setProcessingCH] = useState(false);

    // Research Library State
    const [showRLPopup, setShowRLPopup] = useState(false);
    const [rlLink, setRlLink] = useState('');
    const [processingRL, setProcessingRL] = useState(false);

    // AI Removal State
    const [showAIPopup, setShowAIPopup] = useState(false);
    const [aiFile, setAiFile] = useState(null);
    const [aiPages, setAiPages] = useState(0);
    const [calculatingCost, setCalculatingCost] = useState(false);
    const [processingAI, setProcessingAI] = useState(false);

    // ... (Allowed types code remains same)



    const initiatePayment = () => {
        if (!plagiarismFile) {
            alert("No file selected.");
            return;
        }
        setShowConfirmPopup(true);
    };

    const processPayment = async () => {
        if (!plagiarismFile || !userProfile?.User_id) {
            alert("Missing file or user profile information.");
            return;
        }

        setProcessingPayment(true);
        try {
            // 1. Check fresh balance
            const { data: walletData, error: walletError } = await supabase
                .from('Wallet')
                .select('Balance')
                .eq('UserID', userProfile.User_id)
                .maybeSingle();

            if (walletError) throw new Error(`Wallet Balance Check Failed: ${walletError.message}`);

            const currentBalance = walletData?.Balance || 0;

            if (currentBalance < 70) {
                setShowLowBalancePopup(true);
                setShowConfirmPopup(false);
                setShowPlagiarismPopup(false);
                setProcessingPayment(false);
                return;
            }

            // 2. Upload File
            const fileExt = plagiarismFile.name.split('.').pop();
            const filePath = `${userProfile.User_id}/${orderName}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('Plagdocs') // Reverted to 'Plagdocs' as confirmed by user URL
                .upload(filePath, plagiarismFile);

            if (uploadError) throw new Error(`File Upload Failed: ${uploadError.message}`);

            // 3. Create Task
            const { error: taskError } = await supabase
                .from('Tasks')
                .insert([
                    {
                        Name: orderName,
                        Item: filePath,
                        Service: 'Plag Check',
                        UserID: userProfile.User_id,
                        progress: false
                    }
                ]);

            if (taskError) throw new Error(`Task Creation Failed: ${taskError.message}`);

            // 4. Deduct Balance
            const newBalance = currentBalance - 70;
            const { error: updateError } = await supabase
                .from('Wallet')
                .update({ Balance: newBalance })
                .eq('UserID', userProfile.User_id);

            if (updateError) throw new Error(`Wallet Deduction Failed: ${updateError.message}`);

            // Success
            // alert(`Payment successful! Task '${orderName}' created.`); // Removed alert
            setShowConfirmPopup(false);
            setShowPlagiarismPopup(false);
            setShowSuccessPopup(true); // Show success modal instead
            fetchWallet(userProfile.User_id);

        } catch (error) {
            console.error('Payment error:', error);
            alert(`Payment Failed: ${error.message}`);
        } finally {
            setProcessingPayment(false);
        }
    };

    // Allowed file types: PDF, PPT, Excel, Word
    const ALLOWED_TYPES = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    // Also check extensions as backup since MIME types can vary
    const ALLOWED_EXTS = ['.pdf', '.ppt', '.pptx', '.xls', '.xlsx', '.doc', '.docx'];

    const handleFileSelect = (file) => {
        if (!file) return;

        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        // Simple extension check for UX
        if (!ALLOWED_EXTS.includes(fileExt)) {
            alert('Invalid file format. Please upload PDF, PPT, Excel, or Word documents only.');
            return;
        }

        setPlagiarismFile(file);
        // Generate random order name format: Plag_Itemname (using random suffix for uniqueness)
        // e.g. Plag_MyReport_8392
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const cleanName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const generatedName = `Plag_${cleanName}_${randomId}`;
        setOrderName(generatedName);
    };

    const handleCHSubmit = async () => {
        // 1. Validation
        if (!chLink) {
            alert("Please enter a URL.");
            return;
        }

        // Simple URL regex check
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlPattern.test(chLink)) {
            alert("Please enter a valid URL.");
            return;
        }

        if (!userProfile?.User_id) {
            alert("User profile not loaded. Please refresh.");
            return;
        }

        setProcessingCH(true);

        try {
            // 2. Check Balance
            const { data: walletData, error: walletError } = await supabase
                .from('Wallet')
                .select('Balance')
                .eq('UserID', userProfile.User_id)
                .maybeSingle();

            if (walletError) throw new Error(`Wallet Check Failed: ${walletError.message}`);
            const currentBalance = walletData?.Balance || 0;

            if (currentBalance < 30) {
                setShowLowBalancePopup(true);
                setShowCHPopup(false);
                setProcessingCH(false);
                return;
            }

            // 3. Create Task
            const { error: taskError } = await supabase
                .from('Tasks')
                .insert([
                    {
                        Name: `CH_Unlock_${Math.floor(Math.random() * 10000)}`,
                        Item: chLink,
                        Service: 'Course Hero',
                        UserID: userProfile.User_id,
                        progress: false
                    }
                ]);

            if (taskError) throw new Error(`Task Creation Failed: ${taskError.message}`);

            // 4. Deduct Balance
            const newBalance = currentBalance - 30;
            const { error: updateError } = await supabase
                .from('Wallet')
                .update({ Balance: newBalance })
                .eq('UserID', userProfile.User_id);

            if (updateError) throw new Error(`Wallet Deduction Failed: ${updateError.message}`);

            // Success
            setChLink('');
            setShowCHPopup(false);
            setShowSuccessPopup(true);
            setOrderName('Course Hero Unlock'); // For success msg context
            fetchWallet(userProfile.User_id);

        } catch (error) {
            console.error('CH Error:', error);
            alert(`Failed: ${error.message}`);
        } finally {
            setProcessingCH(false);
        }
    };

    const handleRLSubmit = async () => {
        // 1. Validation
        if (!rlLink) {
            alert("Please enter a URL.");
            return;
        }

        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlPattern.test(rlLink)) {
            alert("Please enter a valid URL.");
            return;
        }

        if (!userProfile?.User_id) {
            alert("User profile not loaded. Please refresh.");
            return;
        }

        setProcessingRL(true);

        try {
            // 2. Check Balance
            const { data: walletData, error: walletError } = await supabase
                .from('Wallet')
                .select('Balance')
                .eq('UserID', userProfile.User_id)
                .maybeSingle();

            if (walletError) throw new Error(`Wallet Check Failed: ${walletError.message}`);
            const currentBalance = walletData?.Balance || 0;

            if (currentBalance < 30) {
                setShowLowBalancePopup(true);
                setShowRLPopup(false);
                setProcessingRL(false);
                return;
            }

            // 3. Create Task
            const { error: taskError } = await supabase
                .from('Tasks')
                .insert([
                    {
                        Name: `RL_Unlock_${Math.floor(Math.random() * 10000)}`,
                        Item: rlLink,
                        Service: 'Research Library',
                        UserID: userProfile.User_id,
                        progress: false
                    }
                ]);

            if (taskError) throw new Error(`Task Creation Failed: ${taskError.message}`);

            // 4. Deduct Balance
            const newBalance = currentBalance - 30;
            const { error: updateError } = await supabase
                .from('Wallet')
                .update({ Balance: newBalance })
                .eq('UserID', userProfile.User_id);

            if (updateError) throw new Error(`Wallet Deduction Failed: ${updateError.message}`);

            // Success
            setRlLink('');
            setShowRLPopup(false);
            setShowSuccessPopup(true);
            setOrderName('Research Library Unlock');
            fetchWallet(userProfile.User_id);

        } catch (error) {
            console.error('RL Error:', error);
            alert(`Failed: ${error.message}`);
        } finally {
            setProcessingRL(false);
        }
    };

    const handleAIFileSelect = (file) => {
        if (!file) return;

        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        // Strict Word Document check
        if (!['.doc', '.docx'].includes(fileExt)) {
            alert('Invalid file format. Please upload Word documents (.doc, .docx) only.');
            return;
        }

        setAiFile(file);
        setCalculatingCost(true);
        setAiPages(0); // Reset

        // Simulate Page Detection Analysis
        setTimeout(() => {
            // Random page count between 1 and 10 for simulation
            const estimatedPages = Math.floor(Math.random() * 10) + 1;
            setAiPages(estimatedPages);
            setCalculatingCost(false);
        }, 1500);
    };

    const handleAISubmit = async () => {
        if (!aiFile || !userProfile?.User_id) {
            alert("Missing file or user profile.");
            return;
        }

        if (aiPages === 0) {
            alert("Still analyzing document pages...");
            return;
        }

        setProcessingAI(true);
        const cost = aiPages * 150;

        try {
            // 1. Check Balance
            const { data: walletData, error: walletError } = await supabase
                .from('Wallet')
                .select('Balance')
                .eq('UserID', userProfile.User_id)
                .maybeSingle();

            if (walletError) throw new Error(`Wallet Check Failed: ${walletError.message}`);
            const currentBalance = walletData?.Balance || 0;

            if (currentBalance < cost) {
                // Reuse low balance popup logic but context might be slightly off (it says 30/70 usually)
                // For custom amount, ideally we update the LowBalancePopup text dynamically, but for now just showing it.
                // Or we can simple Alert for this iteration to keep it robust.
                alert(`Insufficient funds. Your balance is KES ${currentBalance}, but this task costs KES ${cost}.`);
                // setShowLowBalancePopup(true); 
                setProcessingAI(false);
                return;
            }

            // 2. Upload File
            const fileExt = aiFile.name.split('.').pop();
            const fileName = `AI_Removal_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
            const filePath = `${userProfile.User_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('Plagdocs') // Reusing bucket for now
                .upload(filePath, aiFile);

            if (uploadError) throw new Error(`File Upload Failed: ${uploadError.message}`);

            // 3. Create Task
            const { error: taskError } = await supabase
                .from('Tasks')
                .insert([
                    {
                        Name: `AI_Clean_${fileName}`,
                        Item: filePath,
                        Service: 'AI Removal',
                        UserID: userProfile.User_id,
                        progress: false
                    }
                ]);

            if (taskError) throw new Error(`Task Creation Failed: ${taskError.message}`);

            // 4. Deduct Balance
            const newBalance = currentBalance - cost;
            const { error: updateError } = await supabase
                .from('Wallet')
                .update({ Balance: newBalance })
                .eq('UserID', userProfile.User_id);

            if (updateError) throw new Error(`Wallet Deduction Failed: ${updateError.message}`);

            // Success
            setAiFile(null);
            setAiPages(0);
            setShowAIPopup(false);
            setShowSuccessPopup(true);
            setOrderName(`AI Removal (${aiPages} pgs)`);
            fetchWallet(userProfile.User_id);

        } catch (error) {
            console.error('AI Error:', error);
            alert(`Failed: ${error.message}`);
        } finally {
            setProcessingAI(false);
        }
    };
    const [stats, setStats] = useState([
        { label: 'Active Orders', value: '...', icon: 'fa-box-open', color: '#3b82f6' },
        { label: 'Wallet Balance', value: 'KES ...', icon: 'fa-wallet', color: '#10b981' },
        { label: 'Completed Orders', value: '...', icon: 'fa-check-circle', color: '#f59e0b' },
        { label: 'Pending Reviews', value: '3', icon: 'fa-star', color: '#8b5cf6' },
    ]);

    useEffect(() => {
        let authSubscription = null;
        let realtimeChannel = null;

        // 1. Check current session and Auth Listener
        const setupAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (!session) {
                setLoading(false);
                navigate('/login');
            } else {
                fetchProfile(session.user);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
                if (!session) navigate('/login');
                else fetchProfile(session.user);
            });
            authSubscription = subscription;
        };

        setupAuth();

        // 2. Notification Subscription
        const setupRealtime = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch Initial Count
            const { count, error } = await supabase
                .from('Notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .eq('is_read', false);

            if (!error) setUnreadCount(count || 0);

            realtimeChannel = supabase
                .channel('dashboard-notifs')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'Notifications',
                        filter: `user_id=eq.${session.user.id}`
                    },
                    (payload) => {
                        const newMsg = payload.new.message;
                        const notifyOrders = localStorage.getItem('notifyOrders') === 'true';
                        const notifyBalance = localStorage.getItem('notifyBalance') === 'true';

                        let shouldPlay = false;
                        if (newMsg.includes('Order completed') && notifyOrders) shouldPlay = true;
                        if (newMsg.includes('Balance') && notifyBalance) shouldPlay = true;

                        if (shouldPlay) {
                            audio.play().catch(e => console.warn("Audio blocked", e));
                        }

                        // Always increment counter
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .subscribe();
        };

        setupRealtime();

        return () => {
            if (authSubscription) authSubscription.unsubscribe();
            if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        };
    }, [navigate]);

    const fetchProfile = async (user) => {
        try {
            // Attempt fetch with Exact Case
            let { data, error } = await supabase
                .from('Users')
                .select('*')
                .eq('Email', user.email)
                .single();

            if (error) {
                // Fallback attempt with lowercase
                const { data: dataLow, error: errorLow } = await supabase
                    .from('Users')
                    .select('*')
                    .eq('email', user.email)
                    .single();

                if (dataLow) data = dataLow;
            }

            if (data) {
                setUserProfile(data);
                // Fetch wallet using the ID from the Users table as requested
                if (data.User_id) {
                    fetchWallet(data.User_id);
                } else {
                    console.warn('User profile found but no User_id field present');
                }
            }
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWallet = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('Wallet')
                .select('Balance')
                .eq('UserID', userId)
                .maybeSingle();

            if (error) throw error;

            const balance = data ? data.Balance : 0;

            setStats(prevStats => {
                return prevStats.map(stat => {
                    if (stat.label === 'Wallet Balance') {
                        return { ...stat, value: `KES ${balance.toLocaleString()}` };
                    }
                    return stat;
                });
            });

            // Fetch Recent Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('Tasks')
                .select('*')
                .eq('UserID', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (tasksError) {
                console.error("Error fetching tasks:", tasksError);
            } else {
                setRecentTasks(tasksData || []);
            }

            // Fetch Counts
            // Active Orders (progress = false)
            const { count: activeCount, error: activeError } = await supabase
                .from('Tasks')
                .select('*', { count: 'exact', head: true })
                .eq('UserID', userId)
                .eq('progress', false);

            // Completed Orders (progress = true)
            const { count: completedCount, error: completedError } = await supabase
                .from('Tasks')
                .select('*', { count: 'exact', head: true })
                .eq('UserID', userId)
                .eq('progress', true);

            setStats(prevStats => {
                return prevStats.map(stat => {
                    if (stat.label === 'Active Orders') return { ...stat, value: activeCount || 0 };
                    if (stat.label === 'Completed Orders') return { ...stat, value: completedCount || 0 };
                    return stat;
                });
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            setStats(prevStats => {
                return prevStats.map(stat => {
                    if (stat.label === 'Wallet Balance') {
                        return { ...stat, value: `KES 0` };
                    }
                    return stat;
                });
            });
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
                Loading your dashboard...
            </div>
        );
    }

    // Default User Object
    const user = {
        name: userProfile?.FullNmae || userProfile?.fullnmae || userProfile?.FullName || "User",
        email: userProfile?.Email || userProfile?.email || session?.user?.email || "",
        balance: 0,
        activeOrders: 0
    };

    // Initials Helper
    const getInitials = (name) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
            : 'U';
    };

    return (
        <section className="user-dashboard-section" style={{
            minHeight: '100vh',
            paddingTop: '20px',
            paddingBottom: '40px'
        }}>
            <div className="container">
                {/* Header Area */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '40px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid var(--glass-border)'
                }}>
                    {/* Header Left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Avatar */}
                        <div
                            onClick={() => navigate('/dashboard/settings')}
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'var(--accent-color)',
                                color: 'var(--bg-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                boxShadow: 'var(--shadow-sm)',
                                cursor: 'pointer'
                            }}>
                            {getInitials(user.name)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Dashboard</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Welcome back, <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</span>
                            </p>
                        </div>
                    </div>

                    {/* Date / Status pill (Optional enhancement) */}
                    {/* Notifications & Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {/* Notification Bell */}
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/dashboard/settings')}>
                            {/* Redirect to settings/alerts implies managing them, or maybe a dedicated notifications page later */}
                            <i className="fas fa-bell" style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}></i>
                            {unreadCount > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    background: 'red',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    border: '2px solid var(--bg-primary)'
                                }}>
                                    {unreadCount}
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: '8px 16px',
                            background: 'rgba(0,0,0,0.03)',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                        }} className="md-hidden-wrapper">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="services-grid" style={{ marginBottom: '40px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            className="glass"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => stat.label === 'Wallet Balance' && navigate('/dashboard/wallet')}
                            style={{
                                padding: '24px',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '24px',
                                cursor: stat.label === 'Wallet Balance' ? 'pointer' : 'default',
                                transition: 'transform 0.2s'
                            }}
                            whileHover={stat.label === 'Wallet Balance' ? { scale: 1.02 } : {}}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                color: stat.color
                            }}>
                                <i className={`fas ${stat.icon}`}></i>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2px' }}>{stat.value}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    {/* Quick Actions */}
                    <motion.div
                        className="glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}
                    >
                        <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-bolt" style={{ color: 'var(--accent-color)' }}></i> Quick Actions
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {/* 1. Plagiarism Checking */}
                            {/* 1. Plagiarism Checking */}
                            <button
                                onClick={() => setShowPlagiarismPopup(true)}
                                className="btn-secondary"
                                style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer', padding: '16px' }}
                            >
                                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', color: 'var(--accent-color)' }}><i className="fas fa-search"></i></div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Plagiarism Check</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scan for originality</div>
                                </div>
                            </button>

                            {/* 2. Course Hero Unlocks */}
                            <button
                                onClick={() => setShowCHPopup(true)}
                                className="btn-secondary"
                                style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer', padding: '16px' }}
                            >
                                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', color: 'var(--warning)' }}><i className="fas fa-unlock"></i></div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Course Hero</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unlock documents</div>
                                </div>
                            </button>

                            {/* 3. AI Removal */}
                            <button
                                onClick={() => setShowAIPopup(true)}
                                className="btn-secondary"
                                style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer', padding: '16px' }}
                            >
                                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', color: 'var(--danger)' }}><i className="fas fa-robot"></i></div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>AI Removal</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Humanize text</div>
                                </div>
                            </button>

                            {/* 4. Research Library */}
                            <button
                                onClick={() => setShowRLPopup(true)}
                                className="btn-secondary"
                                style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer', padding: '16px' }}
                            >
                                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', color: 'var(--info)' }}><i className="fas fa-book"></i></div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Research Library</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Access resources</div>
                                </div>
                            </button>

                            {/* 5. Proxies */}
                            <button className="btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer', padding: '16px' }}>
                                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', color: 'var(--secondary)' }}><i className="fas fa-network-wired"></i></div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Proxies</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Secure browsing</div>
                                </div>
                            </button>

                            {/* 6. Fullz */}
                            <button className="btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', cursor: 'pointer', padding: '16px' }}>
                                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', color: '#8b5cf6' }}><i className="fas fa-id-card"></i></div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Fullz</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Identity services</div>
                                </div>
                            </button>
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        className="glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.2rem' }}>Recent Activity</h3>
                            <Link to="/dashboard/orders" style={{ fontSize: '0.85rem', color: 'var(--accent-color)' }}>View All</Link>
                        </div>

                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recentTasks.length > 0 ? (
                                recentTasks.map((task) => (
                                    <li key={task.Task_id || task.created_at} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <i className="fas fa-file-alt" style={{ fontSize: '1.2rem', color: '#2b579a' }}></i>
                                            <div>
                                                <p style={{ fontWeight: '500' }}>{task.Name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {task.Service} • {new Date(task.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            background: task.progress ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: task.progress ? 'var(--success)' : 'var(--warning)'
                                        }}>
                                            {task.progress ? 'Completed' : 'Processing'}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No recent activity found.</p>
                            )}
                        </ul>
                    </motion.div>
                </div>

                {/* Plagiarism Popup Modal */}
                {showPlagiarismPopup && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass"
                            style={{
                                padding: '40px',
                                borderRadius: '24px',
                                textAlign: 'center',
                                width: '90%',
                                maxWidth: '500px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Plagiarism Check</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Upload your document to proceed</p>

                            {/* Drag & Drop Area */}
                            <div
                                style={{
                                    border: dragActive ? '2px dashed var(--accent-color)' : '2px dashed var(--glass-border)',
                                    background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0,0,0,0.02)',
                                    borderRadius: '16px',
                                    padding: '40px 20px',
                                    marginBottom: '32px',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragActive(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        handleFileSelect(e.dataTransfer.files[0]);
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    id="popup-file-upload"
                                    accept=".pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileSelect(e.target.files[0]);
                                        }
                                    }}
                                    style={{ display: 'none' }}
                                />

                                {!plagiarismFile ? (
                                    <>
                                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '16px', display: 'block' }}></i>
                                        <p style={{ fontWeight: '500', marginBottom: '8px' }}>Drag & drop or Click to Upload</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Supported formats: PDF, PPT, Excel, Word</p>
                                        <label htmlFor="popup-file-upload" style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer'
                                        }}></label>
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: '16px', fontSize: '1.5rem'
                                        }}>
                                            <i className="far fa-file-alt"></i>
                                        </div>
                                        <p style={{ fontWeight: '600', marginBottom: '4px', fontSize: '1.1rem' }}>{orderName}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                            Original: {plagiarismFile.name}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                            {(plagiarismFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <button
                                            onClick={() => { setPlagiarismFile(null); setOrderName(''); }}
                                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                        >
                                            Remove File
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setShowPlagiarismPopup(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={processingPayment}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={initiatePayment}
                                    className="btn-primary"
                                    disabled={!plagiarismFile || processingPayment}
                                    style={{ flex: 1, opacity: !plagiarismFile || processingPayment ? 0.6 : 1, cursor: !plagiarismFile || processingPayment ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                >
                                    {/* Spin moved to confirmation modal, but keeping static icon here if wanted, or just text */}
                                    Pay 70 Ksh
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Course Hero Popup */}
                {showCHPopup && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                padding: '40px',
                                borderRadius: '24px',
                                textAlign: 'center',
                                width: '90%',
                                maxWidth: '500px',
                                background: 'var(--bg-primary)'
                            }}
                        >
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Course Hero Unlock</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                Enter the document URL below. Cost: <strong>30 KES</strong>.
                            </p>

                            <input
                                type="url"
                                value={chLink}
                                onChange={(e) => setChLink(e.target.value)}
                                placeholder="https://www.coursehero.com/file/..."
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    marginBottom: '32px',
                                    outline: 'none'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setShowCHPopup(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={processingCH}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCHSubmit}
                                    className="btn-primary"
                                    disabled={processingCH || !chLink}
                                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {processingCH ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-unlock"></i>}
                                    Unlock Now
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Research Library Popup */}
                {showRLPopup && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                padding: '40px',
                                borderRadius: '24px',
                                textAlign: 'center',
                                width: '90%',
                                maxWidth: '500px',
                                background: 'var(--bg-primary)'
                            }}
                        >
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Research Library Unlock</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                Enter the resource URL below. Cost: <strong>30 KES</strong>.
                            </p>

                            <input
                                type="url"
                                value={rlLink}
                                onChange={(e) => setRlLink(e.target.value)}
                                placeholder="https://..."
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    marginBottom: '32px',
                                    outline: 'none'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setShowRLPopup(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={processingRL}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRLSubmit}
                                    className="btn-primary"
                                    disabled={processingRL || !rlLink}
                                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {processingRL ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-book-open"></i>}
                                    Unlock Now
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* AI Removal Popup */}
                {showAIPopup && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                padding: '40px',
                                borderRadius: '24px',
                                textAlign: 'center',
                                width: '90%',
                                maxWidth: '500px',
                                background: 'var(--bg-primary)'
                            }}
                        >
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>AI Content Removal</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                Upload Word Doc. <strong>150 KES/page</strong>.
                            </p>

                            {/* File Upload Area */}
                            <div style={{ marginBottom: '24px' }}>
                                {!aiFile ? (
                                    <label style={{
                                        display: 'block',
                                        border: '2px dashed var(--glass-border)',
                                        padding: '30px',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        background: 'rgba(0,0,0,0.02)'
                                    }}>
                                        <input
                                            type="file"
                                            accept=".doc,.docx"
                                            onChange={(e) => e.target.files?.[0] && handleAIFileSelect(e.target.files[0])}
                                            style={{ display: 'none' }}
                                        />
                                        <i className="fas fa-file-word" style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-secondary)' }}></i>
                                        <p>Click to upload Word Document</p>
                                    </label>
                                ) : (
                                    <div style={{
                                        padding: '20px',
                                        borderRadius: '12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px solid var(--accent-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                            <i className="fas fa-file-word" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{aiFile.name}</p>
                                                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{(aiFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button onClick={() => { setAiFile(null); setAiPages(0); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>

                                        {/* Analysis Status */}
                                        <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px', marginTop: '10px' }}>
                                            {calculatingCost ? (
                                                <p style={{ fontSize: '0.9rem', color: 'var(--warning)' }}>
                                                    <i className="fas fa-circle-notch fa-spin"></i> Analyzing document pages...
                                                </p>
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.9rem' }}>Detected Pages: <strong>{aiPages}</strong></span>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                                        KES {(aiPages * 150).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setShowAIPopup(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={processingAI}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAISubmit}
                                    className="btn-primary"
                                    disabled={processingAI || calculatingCost || !aiFile}
                                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {processingAI ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                                    Remove AI
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Low Balance Popup */}
                {showLowBalancePopup && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1001, backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                padding: '40px', borderRadius: '24px', textAlign: 'center',
                                width: '90%', maxWidth: '400px', background: 'var(--bg-primary)',
                                border: '1px solid var(--danger)'
                            }}
                        >
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px auto', fontSize: '2rem'
                            }}>
                                <i className="fas fa-wallet"></i>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Low Balance</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                You do not have enough funds to complete this transaction. Required: KES 70.
                            </p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setShowLowBalancePopup(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { alert('Redirecting to Top Up page...'); setShowLowBalancePopup(false); /* Add Top Up Navigation here */ }}
                                    className="btn-primary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Top Up
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Confirmation Popup */}
                {showConfirmPopup && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1002, backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                padding: '32px', borderRadius: '24px', textAlign: 'center',
                                width: '90%', maxWidth: '400px', background: 'var(--bg-primary)',
                                border: '1px solid var(--accent-color)'
                            }}
                        >
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Confirm Payment</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                Are you sure you want to pay <strong style={{ color: 'var(--text-primary)' }}>70 KES</strong> to check <strong>{orderName}</strong>?
                            </p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setShowConfirmPopup(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processPayment}
                                    className="btn-primary"
                                    disabled={processingPayment}
                                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {processingPayment && <i className="fas fa-spinner fa-spin"></i>}
                                    Confirm Pay
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Success Popup */}
                {showSuccessPopup && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1003, backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                padding: '40px', borderRadius: '24px', textAlign: 'center',
                                width: '90%', maxWidth: '450px', background: 'var(--bg-primary)',
                                border: '1px solid var(--success)'
                            }}
                        >
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px auto', fontSize: '2.5rem'
                            }}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h2 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Payment Confirmed</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>
                                Your task <strong>{orderName}</strong> has been successfully submitted.
                            </p>
                            <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '32px' }}>
                                Please wait approximately 10 minutes for your results.
                            </p>
                            <button
                                onClick={() => {
                                    setShowSuccessPopup(false);
                                    setOrderName('');
                                    setPlagiarismFile(null);
                                }}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Got it
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        </section >
    );
};

export default UserDashboard;
