const BusinessModel = () => {
    return (
        <section className="business-model" id="business">
            <div className="container">
                <div className="section-title">
                    <h2>Our Business Model</h2>
                    <p>Digital Academic & Freelance Support Platform with high-margin, recurring revenue streams</p>
                </div>

                <div className="model-content">
                    <div className="model-text">
                        <h3>Target Market</h3>
                        <p>OnlineLab.co.ke serves a diverse range of clients who need support with academic and professional writing:</p>

                        <div className="target-market">
                            <div className="target-card">
                                <h4>University & College Students</h4>
                                <p>Undergraduate and postgraduate students seeking ethical writing support and study aids.</p>
                            </div>

                            <div className="target-card">
                                <h4>Freelancers</h4>
                                <p>Writers, researchers, and marketers needing productivity tools and quality assurance.</p>
                            </div>

                            <div className="target-card">
                                <h4>ESL Learners</h4>
                                <p>Non-native English speakers improving their academic and professional writing skills.</p>
                            </div>
                        </div>

                        <h3 style={{ marginTop: '30px' }}>Monetization Strategy</h3>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>💳 Pay-per-service for occasional users</li>
                            <li>🔁 Monthly subscriptions (students love this)</li>
                            <li>🎓 Semester packages at discounted rates</li>
                            <li>🤝 Campus ambassador program for referrals</li>
                            <li>🏢 Institutional licenses for universities</li>
                        </ul>
                    </div>

                    <div className="model-image">
                        {/* You would replace this with an actual image */}
                        <div style={{ backgroundColor: '#f0f8ff', padding: '30px', borderRadius: '8px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <i className="fas fa-chart-pie" style={{ fontSize: '5rem', color: 'var(--secondary)', marginBottom: '20px' }}></i>
                                <h3>High-Profit Margin Services</h3>
                                <p>Our core services offer margins of 70%+ with low operational costs and scalable delivery.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BusinessModel;
