import { motion } from "framer-motion";

const Pricing = () => {
    return (
        <section id="pricing" className="pricing-section">
            <div className="container">
                <div className="section-title">
                    <h2>Transparent Pricing</h2>
                    <p>Simple plans for every stage of your journey.</p>
                </div>

                <div className="pricing-grid">
                    {/* Pay-Per-Service */}
                    <div className="pricing-card glass">
                        <h3>Pay-Per-Service</h3>
                        <p style={{ opacity: 0.7 }}>Occasional needs</p>
                        <div className="price">KES 70<span>+</span></div>
                        <ul className="features-list">
                            <li><i className="fas fa-check"></i> Plagiarism Report (KES 70)</li>
                            <li><i className="fas fa-check"></i> Course Hero (KES 30)</li>
                            <li><i className="fas fa-check"></i> Citation Format (KES 10)</li>
                            <li><i className="fas fa-check"></i> Unlock Chegg (KES 30)</li>
                        </ul>
                        <a href="#" className="btn-secondary" style={{ width: '100%', display: 'inline-block' }}>Select Service</a>
                    </div>

                    {/* Student Plan */}
                    <div className="pricing-card glass popular">
                        <div style={{
                            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--accent-color)', color: 'var(--bg-primary)', padding: '4px 12px',
                            borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                        }}>
                            Most Popular
                        </div>
                        <h3>Student Plan</h3>
                        <p style={{ opacity: 0.7 }}>Monthly subscription</p>
                        <div className="price">KES 1,500<span>/mo</span></div>
                        <ul className="features-list">
                            <li><i className="fas fa-check"></i> 10 Plagiarism Checks</li>
                            <li><i className="fas fa-check"></i> 5 Editing Sessions</li>
                            <li><i className="fas fa-check"></i> Priority Support</li>
                            <li><i className="fas fa-check"></i> Study Guides Access</li>
                        </ul>
                        <a href="#" className="btn-primary" style={{ width: '100%', display: 'inline-block' }}>Get Started</a>
                    </div>

                    {/* Unlimited Plan */}
                    <div className="pricing-card glass">
                        <h3>Unlimited Plan</h3>
                        <p style={{ opacity: 0.7 }}>Power users</p>
                        <div className="price">KES 3,000<span>/mo</span></div>
                        <ul className="features-list">
                            <li><i className="fas fa-check"></i> Unlimited Checks</li>
                            <li><i className="fas fa-check"></i> Unlimited Editing</li>
                            <li><i className="fas fa-check"></i> All Tools Included</li>
                            <li><i className="fas fa-check"></i> Research Consult</li>
                        </ul>
                        <a href="#" className="btn-secondary" style={{ width: '100%', display: 'inline-block' }}>Get Started</a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
