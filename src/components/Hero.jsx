import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <section className="hero-section">
            <div className="container hero-content">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1>
                        One stop <span style={{ opacity: 0.5 }}>Freelancing</span> tools Lab
                    </h1>
                    <p>
                        Your trusted partner for plagiarism checking, Course Hero Unlocks, AI Removal, Research Library, Proxies, and Fullz. Clean, ethical, professional.
                    </p>

                    <div className="hero-actions">
                        <a href="#services" className="btn-primary">
                            Explore Services
                        </a>
                        <a href="#pricing" className="btn-secondary">
                            View Pricing
                        </a>
                    </div>
                </motion.div>

                {/* Optional abstract decoration */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, var(--text-primary) 0%, transparent 70%)',
                    opacity: '0.03',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}></div>
            </div>
        </section>
    );
};

export default Hero;
