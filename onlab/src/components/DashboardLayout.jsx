import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DashboardLayout = ({ theme, toggleTheme }) => {
    // Desktop: collapse state. Mobile: open/close state.
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const toggleMobileMenu = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    const navItems = [
        { label: 'Overview', path: '/dashboard', icon: 'fa-home' },
        { label: 'My Orders', path: '/dashboard/orders', icon: 'fa-shopping-bag' },
        { label: 'Plagiarism Check', path: '/dashboard/plagiarism', icon: 'fa-search' },
        { label: 'Editing', path: '/dashboard/editing', icon: 'fa-pen-nib' },
        { label: 'Wallet', path: '/dashboard/wallet', icon: 'fa-wallet' },
        { label: 'Settings', path: '/dashboard/settings', icon: 'fa-cog' },
    ];

    return (
        <div className="dashboard-layout">
            {/* Mobile Header */}
            <header className="dashboard-mobile-header">
                <div className="logo" style={{ fontSize: '1.2rem' }}>
                    <i className="fas fa-flask"></i> On<span>Lab</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button onClick={toggleTheme} className="theme-toggle" style={{ fontSize: '1.2rem' }}>
                        <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                    </button>
                    <button onClick={toggleMobileMenu} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <i className={`fas ${isMobileOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                </div>
            </header>

            {/* Mobile Overlay */}
            <div
                className={`dashboard-overlay ${isMobileOpen ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
            ></div>

            {/* Sidebar */}
            <motion.aside
                className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
                animate={{ width: isSidebarCollapsed ? '80px' : '280px' }}
                // Note: On mobile, CSS class handles width logic override (!important), so animate width applies mostly to desktop.
                // However, framer-motion might inline-style width.
                // To fix conflict, we can disable animation prop on mobile if needed, 
                // but usually CSS !important overrides inline path.
                transition={{ duration: 0.3 }}
            >
                {/* Sidebar Header (Desktop) */}
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between' }} className="md-hidden-wrapper">
                    {/* Hide toggle on mobile, controlled by overlay/header */}
                    {!isSidebarCollapsed && (
                        <div className="logo" style={{ fontSize: '1.2rem' }}>
                            <i className="fas fa-flask"></i> On<span>Lab</span>
                        </div>
                    )}
                    {isSidebarCollapsed && <i className="fas fa-flask" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}></i>}

                    <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <i className={`fas ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                    </button>
                </div>

                {/* Sidebar Header (Mobile Specific - just Logo/Close if wanted, but using outside header) */}
                {/* We use padding-top on mobile sidebar to clear header if needed, but here sidebar is full height z-index 100 > header 99? 
                    Actually sidebar is fixed left 0 top 0. It covers header if z-index is higher.
                    Let's add some top padding on mobile internal content if desired, or just let it be.
                */}
                <div style={{ height: '24px' }} className="mobile-only-spacer"></div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '24px 12px' }}>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={() => setIsMobileOpen(false)} // Close on navigate (mobile)
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        color: location.pathname === item.path ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        background: location.pathname === item.path ? 'rgba(0,0,0,0.05)' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <i className={`fas ${item.icon}`} style={{ width: '20px', textAlign: 'center' }}></i>
                                    {(!isSidebarCollapsed || isMobileOpen) && <span style={{ fontWeight: '500' }}>{item.label}</span>}
                                    {/* On mobile (isMobileOpen true), we want full labels. 
                                        Logic: show label if !collapsed OR mobile 
                                        Actually, logic: if mobile, width is forced to 280px via CSS, so we should allow label rendering.
                                        But 'isSidebarCollapsed' state belongs to desktop.
                                        We can say: render label if (!collapsed) OR (window.innerWidth < 768) -- but avoiding window listeners in render.
                                        Better: CSS hides it? No, React renders.
                                        Simplest: If mobile, sidebar is wide.
                                    */}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer / Theme Toggle */}
                <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '12px 16px'
                        }}
                    >
                        <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`} style={{ width: '20px', textAlign: 'center' }}></i>
                        {(!isSidebarCollapsed || isMobileOpen) && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
                    </button>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            width: '100%',
                            color: 'var(--accent-color)',
                            padding: '12px 16px',
                            marginTop: '8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontFamily: 'inherit'
                        }}
                    >
                        <i className="fas fa-sign-out-alt" style={{ width: '20px', textAlign: 'center' }}></i>
                        {(!isSidebarCollapsed || isMobileOpen) && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <motion.main
                className="dashboard-main"
                animate={{ marginLeft: isSidebarCollapsed ? '80px' : '280px' }}
                transition={{ duration: 0.3 }}
            >
                <Outlet />
            </motion.main>

        </div>
    );
};

export default DashboardLayout;
