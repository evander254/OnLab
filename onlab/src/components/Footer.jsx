const Footer = () => {
    return (
        <footer id="contact" className="site-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h3><i className="fas fa-flask"></i> OnLab</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Your trusted academic and freelance support platform. Integrity first.
                        </p>
                        <p><i className="fas fa-envelope"></i> support@onlinelab.co.ke</p>
                        <p><i className="fas fa-phone"></i> +254 788 830848</p>
                    </div>

                    <div className="footer-col">
                        <h3>Links</h3>
                        <ul>
                            <li><a href="#services">Services</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                            <li><a href="#faq">FAQs</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>Legal</h3>
                        <ul>
                            <li><a href="#">Terms</a></li>
                            <li><a href="#">Privacy</a></li>
                            <li><a href="#">Integrity Policy</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>Connect</h3>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <a href="#"><i className="fab fa-twitter fa-lg"></i></a>
                            <a href="#"><i className="fab fa-facebook fa-lg"></i></a>
                            <a href="#"><i className="fab fa-instagram fa-lg"></i></a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2023 OnLab.co.ke. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
