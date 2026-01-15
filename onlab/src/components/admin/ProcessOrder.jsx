import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

const ProcessOrder = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { order } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [aiValue, setAiValue] = useState('');
    const [plagValue, setPlagValue] = useState('');
    const [aiFile, setAiFile] = useState(null);
    const [plagFile, setPlagFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (!order) {
            alert('No order selected. Redirecting to dashboard.');
            navigate('/admin/dashboard');
        }
    }, [order, navigate]);

    if (!order) return null;

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (type === 'ai') setAiFile(file);
        else setPlagFile(file);
    };

    const uploadFile = async (file, folder) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${order.Name}_${folder}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${order.UserID}/${fileName}`;

        const { error } = await supabase.storage
            .from('Plagreports')
            .upload(filePath, file);

        if (error) throw new Error(`Error uploading ${folder} report: ${error.message}`);

        return filePath; // Store specific bucket path
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!aiValue || !plagValue || !aiFile || !plagFile) {
            alert('Please fill in all fields and upload both reports.');
            return;
        }

        setLoading(true);
        setUploadProgress(10);

        try {
            // 1. Upload Files
            setUploadProgress(30);
            const aiDocPath = await uploadFile(aiFile, 'AI');
            setUploadProgress(50);
            const plagDocPath = await uploadFile(plagFile, 'Plag');

            // 2. Insert into Plagdocs
            setUploadProgress(70);
            const { error: insertError } = await supabase
                .from('Plagdocs')
                .insert([
                    {
                        Name: order.Name,
                        UserID: order.UserID,
                        AIvalue: aiValue,
                        AIDoc: aiDocPath,
                        Plagvalue: plagValue,
                        PlagDoc: plagDocPath
                        // created_at is auto-handled default
                    }
                ]);

            if (insertError) throw new Error(`Database Error: ${insertError.message}`);

            // 3. Update Tasks (Mark as Complete)
            setUploadProgress(90);
            const { error: updateError } = await supabase
                .from('Tasks')
                .update({ progress: true })
                .eq('Task_id', order.Task_id);

            if (updateError) throw new Error(`Task Update Error: ${updateError.message}`);

            // 4. Send Notification
            const { error: notifError } = await supabase
                .from('Notifications')
                .insert([
                    {
                        user_id: order.UserID,
                        message: `Order completed: ${order.Name}`,
                        is_read: false
                    }
                ]);

            if (notifError) console.error('Notification Error:', notifError); // Log but don't fail flow

            setUploadProgress(100);
            alert('Order processed successfully!');
            navigate('/admin/dashboard');

        } catch (error) {
            console.error('Processing failed:', error);
            alert(`Failed to process order: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass"
                    style={{ padding: '40px', borderRadius: '24px' }}
                >
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Process Order</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Completing order: <strong style={{ color: 'var(--accent-color)' }}>{order.Name}</strong></p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Reports Upload Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* AI Report */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-robot" style={{ color: 'var(--accent-color)' }}></i> AI Report
                                </h3>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>AI Percentage Value</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 15%"
                                        value={aiValue}
                                        onChange={(e) => setAiValue(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Upload AI Report Doc</label>
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileChange(e, 'ai')}
                                        required
                                        style={{ width: '100%', padding: '8px', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>

                            {/* Plagiarism Report */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-search" style={{ color: '#f59e0b' }}></i> Plagiarism Report
                                </h3>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Plagiarism Percentage</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 5%"
                                        value={plagValue}
                                        onChange={(e) => setPlagValue(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Upload Plag Report Doc</label>
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileChange(e, 'plag')}
                                        required
                                        style={{ width: '100%', padding: '8px', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <div style={{ margin: '10px 0' }}>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--accent-color)', transition: 'width 0.3s' }}></div>
                                </div>
                                <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '4px', color: 'var(--text-secondary)' }}>Processing... {uploadProgress}%</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ padding: '16px', fontSize: '1.1rem', fontWeight: '600', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}
                        >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                            {loading ? 'Processing Order...' : 'Complete Order'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ProcessOrder;
