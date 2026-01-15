import { motion } from "framer-motion";

const Services = () => {
    const services = [
        {
            title: "Plagiarism Checking",
            desc: "Detailed plagiarism reports using trusted tools to ensure originality and proper citation.",
            icon: "🔍",
        },
        {
            title: "Course Hero Unlocks",
            desc: "Fast and secure access to locked academic resources and study materials.",
            icon: "📘",
        },
        {
            title: "AI Content Review",
            desc: "Human-assisted refinement to reduce AI traces while improving clarity and flow.",
            icon: "🤖",
        },
        {
            title: "Research Library",
            desc: "Premium journals, references, and academic materials at your fingertips.",
            icon: "📚",
        },
        {
            title: "Proxies & Tools",
            desc: "Reliable proxy solutions and tools for uninterrupted, secure online work.",
            icon: "🌐",
        },
        {
            title: "Freelancer Toolkits",
            desc: "Productivity and automation tools designed to help freelancers scale faster.",
            icon: "💼",
        },
    ];

    return (
        <section id="services" className="services-section">
            <div className="container">
                <div className="section-title">
                    <h2>Our Core Services</h2>
                    <p>Comprehensive support for professionals.</p>
                </div>

                <div className="services-grid">
                    {services.map((service, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="service-card glass"
                        >
                            <div className="service-icon">{service.icon}</div>
                            <h3>{service.title}</h3>
                            <p>{service.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
