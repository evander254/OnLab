import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = ({ theme, toggleTheme }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleScrollOrNavigate = (e, id) => {
        e.preventDefault();
        if (location.pathname !== '/') {
            navigate('/', { state: { targetId: id } });
        } else {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setIsMenuOpen(false);
    };

    // Effect to handle scroll after navigation
    // This is a simplified version. Ideally, use a useEffect in App or Home to check location.state

    return (
        <header className="site-header glass">
            <div className="container header-content">
                <Link to="/" className="logo">
                    <i className="fas fa-flask"></i>
                    <h1>On<span>Lab</span></h1>
                </Link>

                <div className="nav-desktop">
                    <nav>
                        <ul style={{ display: 'flex', gap: '32px' }}>
                            <li><a href="#services" onClick={(e) => handleScrollOrNavigate(e, 'services')}>Services</a></li>
                            <li><a href="#pricing" onClick={(e) => handleScrollOrNavigate(e, 'pricing')}>Pricing</a></li>
                            <li><a href="#about" onClick={(e) => handleScrollOrNavigate(e, 'about')}>About</a></li>
                            <li><a href="#contact" onClick={(e) => handleScrollOrNavigate(e, 'contact')}>Contact</a></li>
                        </ul>
                    </nav>
                    <button className="theme-toggle" onClick={toggleTheme}>
                        <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                    </button>
                    <Link to="/login" className="btn-primary" style={{ color: theme === 'light' ? '#a0a0a0' : '' }}>Get Started</Link>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }} className="md-hidden-wrapper">
                    <button className="theme-toggle mobile-only-toggle" onClick={toggleTheme} style={{ display: 'none' }}>
                        <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                    </button>
                    <button className="mobile-toggle" onClick={handleToggleMenu}>
                        <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                </div>

                {isMenuOpen && (
                    <nav className="nav-mobile glass">
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                            <li><a href="#services" onClick={(e) => handleScrollOrNavigate(e, 'services')}>Services</a></li>
                            <li><a href="#pricing" onClick={(e) => handleScrollOrNavigate(e, 'pricing')}>Pricing</a></li>
                            <li><a href="#about" onClick={(e) => handleScrollOrNavigate(e, 'about')}>About</a></li>
                            <li><a href="#contact" onClick={(e) => handleScrollOrNavigate(e, 'contact')}>Contact</a></li>
                            <li>
                                <button className="theme-toggle" onClick={toggleTheme}>
                                    <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i> {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                </button>
                            </li>
                            <li><Link to="/login" className="btn-primary" onClick={() => setIsMenuOpen(false)} style={{ color: theme === 'light' ? '#a0a0a0' : '' }}>Get Started</Link></li>
                        </ul>
                    </nav>
                )}
            </div>
        </header>
    );
};

export default Header;
