import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './AdminDB.css';

const AdminDB = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalUsers: 0,
        revenue: 0,
        activeOrders: 0
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [traffic, setTraffic] = useState(124);
    const [currentUser, setCurrentUser] = useState({ username: 'Admin' });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [downloadLoading, setDownloadLoading] = useState(false);

    useEffect(() => {
        // Simple Auth Check
        const isAuthenticated = localStorage.getItem('adminAuthenticated');
        const userData = localStorage.getItem('adminUser');

        if (!isAuthenticated) {
            navigate('/admin');
            return;
        }

        if (userData) {
            try {
                setCurrentUser(JSON.parse(userData));
            } catch (e) {
                console.error('Error parsing admin user:', e);
            }
        }

        fetchDashboardData();
    }, [navigate]);

    // Live Traffic Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setTraffic(prev => {
                const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
                return Math.max(50, prev + change); // Min 50 visitors
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users Count
            const { count: userCount, error: userError } = await supabase
                .from('Users')
                .select('*', { count: 'exact', head: true });

            if (userError) console.error('Error fetching users:', userError);

            // 2. Fetch Tasks (Orders)
            const { data: tasks, error: tasksError } = await supabase
                .from('Tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;

            // Calculate Stats
            const totalTasks = tasks.length;
            const revenue = totalTasks * 70; // Assuming 70 KES per task based on standard rate
            const active = tasks.filter(t => !t.progress).length;

            setStats({
                totalOrders: totalTasks,
                totalUsers: userCount || 0,
                revenue: revenue,
                activeOrders: active
            });

            setOrders(tasks);
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminUser');
        navigate('/admin');
    };

    const normalizeStoragePath = (item) => {
        if (!item) return null;

        // If full URL was saved by mistake, extract the real path
        if (item.includes('/storage/v1/object')) {
            const parts = item.split('/Plagdocs/');
            return parts.length > 1 ? parts[1] : null;
        }

        return item.replace(/^\/+/, '');
    };

    const openOrderDetails = async (order) => {
        setSelectedOrder(order);
        setShowModal(true);
        setDownloadUrl(null);
        setDownloadLoading(false);

        const cleanPath = normalizeStoragePath(order.Item);

        if (!cleanPath) {
            console.error('Invalid file path:', order.Item);
            return;
        }

        setDownloadLoading(true);

        try {
            const filename = cleanPath.split('/').pop();

            const { data, error } = await supabase
                .storage
                .from('Plagdocs') // ✅ CASE-SENSITIVE
                .createSignedUrl(cleanPath, 3600, {
                    download: filename
                });

            if (error) throw error;

            setDownloadUrl(data.signedUrl);
        } catch (err) {
            console.error('Signed URL failed:', err);
            // Fallback to public URL if signing fails
            const { data } = supabase.storage.from('Plagdocs').getPublicUrl(cleanPath, {
                download: cleanPath.split('/').pop()
            });
            if (data?.publicUrl) {
                setDownloadUrl(data.publicUrl);
            } else {
                setDownloadUrl(null);
            }
        } finally {
            setDownloadLoading(false);
        }
    };


    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
        setDownloadUrl(null);
        setDownloadLoading(false);
    };

    return (
        <div className="admin-container">

            {/* --- SIDEBAR --- */}
            <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-logo">
                    <div className="logo-icon">O</div>
                    <span className="logo-text">OnLab Admin</span>
                </div>

                <nav className="sidebar-nav">
                    <SidebarItem icon="fa-th-large" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} />
                    <SidebarItem icon="fa-shopping-bag" label="All Orders" active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }} />
                    <SidebarItem icon="fa-users" label="Customers" active={activeTab === 'customers'} onClick={() => { setActiveTab('customers'); setMobileMenuOpen(false); }} />
                    <SidebarItem icon="fa-wallet" label="Finance" active={activeTab === 'finance'} onClick={() => { setActiveTab('finance'); setMobileMenuOpen(false); }} />
                    <SidebarItem icon="fa-cog" label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} />
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button onClick={handleLogout} className="logout-btn">
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                    <p style={{ marginTop: '16px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>v1.2.0 • Pro Build</p>
                </div>
            </aside>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay-backdrop ${mobileMenuOpen ? 'open' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            ></div>

            {/* --- MAIN CONTENT --- */}
            <main className="admin-main">

                {/* Header */}
                <header className="admin-header">
                    <div className="header-left">
                        {/* Hamburger Toggle */}
                        <button
                            className="mobile-toggle"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <i className="fas fa-bars"></i>
                        </button>

                        <div className="header-title">
                            <h1>Welcome back, {currentUser.username} <span>👋</span></h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Here's what's happening with your platform today.</p>
                        </div>
                    </div>

                    <div className="header-right">
                        {/* Traffic Widget */}
                        <div className="traffic-widget glass">
                            <span className="ping-dot">
                                <span className="ping-dot-inner"></span>
                                <span className="ping-dot-solid"></span>
                            </span>
                            <span style={{ fontWeight: '600', color: '#10b981', fontSize: '0.9rem' }}>{traffic} Live Visitor{traffic !== 1 && 's'}</span>
                        </div>

                        {/* Profile Widget */}
                        <div className="profile-widget">
                            <div className="avatar"></div>
                            <div style={{ display: 'none', flexDirection: 'column', gap: '2px' }} className="md-flex">
                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Donte Admin</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Super Admin</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <AdminStatCard icon="fa-wallet" label="Total Revenue" value={`KES ${stats.revenue.toLocaleString()}`} color="#8b5cf6" trend="+12.5%" />
                    <AdminStatCard icon="fa-users" label="Active Users" value={stats.totalUsers} color="#3b82f6" trend="+5.2%" />
                    <AdminStatCard icon="fa-box-open" label="Pending Orders" value={stats.activeOrders} color="#f59e0b" trend="-2%" />
                    <AdminStatCard icon="fa-check-circle" label="Total Tasks" value={stats.totalOrders} color="#10b981" trend="+8.1%" />
                </div>

                {/* Main Content Area */}
                <div className="operations-section">
                    <div className="ops-header">
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Recent Operations</h3>
                        <div className="ops-actions">
                            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}><i className="fas fa-filter"></i> Filter</button>
                            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}><i className="fas fa-download"></i> Export</button>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <th style={{ textAlign: 'left', padding: '0 20px', paddingBottom: '16px' }}>Task Info</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px', paddingBottom: '16px' }}>Client</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px', paddingBottom: '16px' }}>Date</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px', paddingBottom: '16px' }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '0 20px', paddingBottom: '16px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading data...</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order.Task_id || order.created_at} className="table-row-hover">
                                        <td style={{ padding: '16px 20px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <i className="fas fa-file-alt"></i>
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{order.Name}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>#{order.Task_id || 'ID'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{ fontWeight: '500' }}>User {order.UserID.substring(0, 6)}...</span>
                                        </td>
                                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span
                                                className="status-pill"
                                                style={{
                                                    background: order.progress ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                    color: order.progress ? '#10b981' : '#f59e0b',
                                                    border: `1px solid ${order.progress ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                                }}
                                            >
                                                {order.progress ? 'Completed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                            <button
                                                onClick={() => openOrderDetails(order)}
                                                className="btn-secondary"
                                                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* --- DETAILS MODAL --- */}
            <AnimatePresence>
                {showModal && selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="modal-content glass"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '32px' }}>
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Task Order</p>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{selectedOrder.Name}</h2>
                                </div>
                                <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Order ID</p>
                                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>#{selectedOrder.Task_id || 'N/A'}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Submission Date</p>
                                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Service Type</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                        <p style={{ fontSize: '1rem', fontWeight: '600' }}>{selectedOrder.Service}</p>
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Customer ID</p>
                                    <p style={{ fontSize: '1rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedOrder.UserID}</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Attachments</h4>
                                {selectedOrder.Item ? (
                                    <div style={{
                                        padding: '16px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)',
                                        borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                                <i className="fas fa-file-alt"></i>
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <p style={{ fontWeight: '600', fontSize: '1rem' }}>Original Document</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedOrder.Item.split('/').pop()}</p>
                                            </div>
                                        </div>

                                        {downloadLoading ? (
                                            <button disabled className="btn-secondary" style={{ padding: '10px 20px', width: '100%' }}><i className="fas fa-spinner fa-spin"></i> Processing</button>
                                        ) : downloadUrl ? (
                                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '10px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                                                <i className="fas fa-cloud-download-alt"></i> Download
                                            </a>
                                        ) : (
                                            <button disabled className="btn-secondary" style={{ color: 'var(--danger)', width: '100%' }}>Unavailable</button>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ padding: '24px', textAlign: 'center', border: '2px dashed var(--glass-border)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                                        No files attached
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column-reverse' }}>
                                <button onClick={closeModal} className="btn-secondary" style={{ flex: 1, padding: '14px' }}>Close View</button>
                                <button
                                    onClick={() => navigate('/admin/process-order', { state: { order: selectedOrder } })}
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '14px', background: '#3b82f6' }}
                                >
                                    Process Order
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`sidebar-item ${active ? 'active' : ''}`}
    >
        <i className={`fas ${icon}`} style={{ width: '20px', textAlign: 'center' }}></i>
        <span style={{ fontWeight: active ? '600' : '400' }}>{label}</span>
    </div>
);

const AdminStatCard = ({ icon, label, value, color, trend }) => (
    <div className="stat-card">
        <div className="stat-header">
            <div className="stat-icon" style={{ background: `${color}15`, color: color }}>
                <i className={`fas ${icon}`}></i>
            </div>
            <span className="stat-trend" style={{ color: trend.includes('+') ? '#10b981' : '#ef4444', background: trend.includes('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                {trend}
            </span>
        </div>
        <div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '4px' }}>{value}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</p>
        </div>
    </div>
);

export default AdminDB;
