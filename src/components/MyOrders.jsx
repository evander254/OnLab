import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 10;
    const [totalOrders, setTotalOrders] = useState(0);
    const [session, setSession] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // Plagiarism Popup State (cloned from UserDashboard)
    const [showPlagiarismPopup, setShowPlagiarismPopup] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [plagiarismFile, setPlagiarismFile] = useState(null);
    const [orderName, setOrderName] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showLowBalancePopup, setShowLowBalancePopup] = useState(false);
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // View Results State
    const [showResultPopup, setShowResultPopup] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [fetchingResult, setFetchingResult] = useState(false);

    // Initial Load
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user);
            }
        });
    }, []);

    useEffect(() => {
        if (userProfile?.User_id) {
            fetchOrders(userProfile.User_id, page);
        }
    }, [userProfile, page]);

    const fetchProfile = async (user) => {
        let { data, error } = await supabase
            .from('Users')
            .select('*')
            .eq('Email', user.email)
            .single();

        if (!data && !error) {
            const { data: dataLow } = await supabase.from('Users').select('*').eq('email', user.email).single();
            if (dataLow) data = dataLow;
        }

        if (data) {
            setUserProfile(data);
        }
    };

    const fetchOrders = async (userId, pageNum) => {
        setLoading(true);
        const from = pageNum * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, count, error } = await supabase
            .from('Tasks')
            .select('*', { count: 'exact' })
            .eq('UserID', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
            setTotalOrders(count || 0);
        }
        setLoading(false);
    };

    // --- Copied Payment Logic ---
    const ALLOWED_EXTS = ['.pdf', '.ppt', '.pptx', '.xls', '.xlsx', '.doc', '.docx'];

    const handleFileSelect = (file) => {
        if (!file) return;
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTS.includes(fileExt)) {
            alert('Invalid file format. Please upload PDF, PPT, Excel, or Word documents only.');
            return;
        }
        setPlagiarismFile(file);
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const cleanName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
        setOrderName(`Plag_${cleanName}_${randomId}`);
    };

    const initiatePayment = () => {
        if (!plagiarismFile) { alert("No file selected."); return; }
        setShowConfirmPopup(true);
    };

    const processPayment = async () => {
        if (!plagiarismFile || !userProfile?.User_id) {
            alert("Missing file or user profile information.");
            return;
        }
        setProcessingPayment(true);
        try {
            // Check Balance
            const { data: walletData, error: walletError } = await supabase
                .from('Wallet')
                .select('Balance')
                .eq('UserID', userProfile.User_id)
                .maybeSingle();

            if (walletError) throw new Error(`Wallet Check Failed: ${walletError.message}`);
            const currentBalance = walletData?.Balance || 0;

            if (currentBalance < 70) {
                setShowLowBalancePopup(true);
                setShowConfirmPopup(false);
                setShowPlagiarismPopup(false);
                setProcessingPayment(false);
                return;
            }

            // Upload
            const fileExt = plagiarismFile.name.split('.').pop();
            const filePath = `${userProfile.User_id}/${orderName}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('Plagdocs')
                .upload(filePath, plagiarismFile);

            if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

            // Create Task
            const { error: taskError } = await supabase.from('Tasks').insert([{
                Name: orderName, Item: filePath, Service: 'Plag Check', UserID: userProfile.User_id, progress: false
            }]);
            if (taskError) throw new Error(`Task Create Failed: ${taskError.message}`);

            // Deduct
            const { error: updateError } = await supabase.from('Wallet').update({ Balance: currentBalance - 70 }).eq('UserID', userProfile.User_id);
            if (updateError) throw new Error(`Deduct Failed: ${updateError.message}`);

            setShowConfirmPopup(false);
            setShowPlagiarismPopup(false);
            setShowSuccessPopup(true);
            fetchOrders(userProfile.User_id, 0); // Refresh list

        } catch (error) {
            alert(error.message);
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleViewResult = async (order) => {
        setFetchingResult(true);
        try {
            const { data, error } = await supabase
                .from('Plagdocs')
                .select('*')
                .eq('Name', order.Name)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setSelectedResult(data);
                setShowResultPopup(true);
            } else {
                alert('Results not found for this order. It might still be processing.');
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            alert('Failed to load results.');
        } finally {
            setFetchingResult(false);
        }
    };

    const getDownloadUrl = (path) => {
        if (!path) return '#';
        const { data } = supabase.storage.from('Plagreports').getPublicUrl(path);
        return data.publicUrl;
    };

    const handleDownloadZip = async () => {
        if (!selectedResult) return;
        const zip = new JSZip();

        const downloadFile = async (path, filename) => {
            if (!path) return;
            const { data, error } = await supabase.storage.from('Plagreports').download(path);
            if (error) {
                console.error("Error downloading file:", error);
                return;
            }
            zip.file(filename, data);
        };

        const aiExt = selectedResult.AIDoc?.split('.').pop() || 'pdf';
        const plagExt = selectedResult.PlagDoc?.split('.').pop() || 'pdf';

        await Promise.all([
            downloadFile(selectedResult.AIDoc, `AI_Report.${aiExt}`),
            downloadFile(selectedResult.PlagDoc, `Plagiarism_Report.${plagExt}`)
        ]);

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${selectedResult.Name}_Reports.zip`);
    };

    const handleShare = async (docType, path) => {
        const url = getDownloadUrl(path);
        const title = `${selectedResult.Name} - ${docType} Report`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: `Check out my ${docType} report for ${selectedResult.Name}`,
                    url: url
                });
            } catch (err) {
                console.log('Share canceled or failed', err);
            }
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <motion.div
            className="container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '40px 20px', minHeight: '100vh' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem' }}>My Orders</h2>
                <button
                    onClick={() => setShowPlagiarismPopup(true)}
                    className="btn-primary"
                >
                    <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> New Check
                </button>
            </div>



            <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table className="my-orders-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Order Name</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Service</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center' }}>Loading orders...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders found.</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.Task_id || order.created_at} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td data-label="Order Name" style={{ padding: '16px', fontWeight: '500' }}>{order.Name}</td>
                                    <td data-label="Service" style={{ padding: '16px', color: 'var(--text-secondary)' }}>{order.Service}</td>
                                    <td data-label="Date" style={{ padding: '16px', color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td data-label="Status" style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem',
                                            background: order.progress ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: order.progress ? 'var(--success)' : 'var(--warning)'
                                        }}>
                                            {order.progress ? 'Completed' : 'Processing'}
                                        </span>
                                    </td>
                                    <td data-label="Action" style={{ padding: '16px' }}>
                                        {order.progress ? (
                                            <button
                                                onClick={() => handleViewResult(order)}
                                                className="btn-primary"
                                                style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                                                disabled={fetchingResult}
                                            >
                                                {fetchingResult ? 'Loading...' : <><i className="fas fa-eye" style={{ marginRight: '8px' }}></i> View</>}
                                            </button>
                                        ) : (
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                <i className="fas fa-clock"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
                <button
                    className="btn-secondary"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center' }}>Page {page + 1} of {Math.ceil(totalOrders / ITEMS_PER_PAGE) || 1}</span>
                <button
                    className="btn-secondary"
                    disabled={(page + 1) * ITEMS_PER_PAGE >= totalOrders}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>

            {/* --- Modals (Duplicated) --- */}
            {
                showPlagiarismPopup && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '500px', background: 'var(--bg-primary)' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Plagiarism Check</h2>
                            <div
                                style={{ border: '2px dashed var(--glass-border)', padding: '40px', marginBottom: '24px', textAlign: 'center' }}
                                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                                onDragOver={e => e.preventDefault()}
                            >
                                <input type="file" id="order-upload" hidden onChange={(e) => handleFileSelect(e.target.files[0])} accept=".pdf,.doc,.docx" />
                                {!plagiarismFile ? (
                                    <label htmlFor="order-upload" style={{ cursor: 'pointer', display: 'block' }}>
                                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', marginBottom: '16px' }}></i>
                                        <p>Click or Drag file here</p>
                                    </label>
                                ) : (
                                    <div><p>{orderName}</p><button onClick={() => setPlagiarismFile(null)} style={{ color: 'red', border: 'none', background: 'none' }}>Remove</button></div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button onClick={() => setShowPlagiarismPopup(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button onClick={initiatePayment} className="btn-primary" disabled={!plagiarismFile} style={{ flex: 1 }}>Pay 70 Ksh</button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {
                showConfirmPopup && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002, backdropFilter: 'blur(5px)' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '400px', background: 'var(--bg-primary)' }}>
                            <h3>Confirm Payment</h3>
                            <p style={{ margin: '16px 0' }}>Pay 70 KES for {orderName}?</p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button onClick={() => setShowConfirmPopup(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button onClick={processPayment} className="btn-primary" style={{ flex: 1 }}>{processingPayment ? 'Processing...' : 'Confirm'}</button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {
                showSuccessPopup && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1003, backdropFilter: 'blur(5px)' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '450px', background: 'var(--bg-primary)', textAlign: 'center' }}>
                            <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '16px' }}></i>
                            <h2>Success!</h2>
                            <p>Order submitted. Please wait ~10 mins.</p>
                            <button onClick={() => setShowSuccessPopup(false)} className="btn-primary" style={{ marginTop: '24px', width: '100%' }}>Got it</button>
                        </motion.div>
                    </div>
                )
            }

            {
                showLowBalancePopup && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1003, backdropFilter: 'blur(5px)' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '450px', background: 'var(--bg-primary)', textAlign: 'center' }}>
                            <i className="fas fa-wallet" style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '16px' }}></i>
                            <h2>Low Balance</h2>
                            <p>Insufficient funds. Please top up.</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setShowLowBalancePopup(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button onClick={() => alert("Top Up")} className="btn-primary" style={{ flex: 1 }}>Top Up</button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {
                showResultPopup && selectedResult && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1005, backdropFilter: 'blur(5px)' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{ padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '600px', background: 'var(--bg-primary)', position: 'relative' }}
                        >
                            <button
                                onClick={() => setShowResultPopup(false)}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                <i className="fas fa-times"></i>
                            </button>

                            <h2
                                style={{ fontSize: '1.8rem', marginBottom: '8px', paddingRight: '30px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
                                title={selectedResult.Name}
                            >
                                {selectedResult.Name}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Order Results</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                                {/* AI Score Card */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <i className="fas fa-robot" style={{ fontSize: '2rem', color: 'var(--accent-color)' }}></i>
                                    </div>
                                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>AI Score</h3>
                                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedResult.AIvalue}</p>
                                </div>

                                {/* Plag Score Card */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <i className="fas fa-search" style={{ fontSize: '2rem', color: '#f59e0b' }}></i>
                                    </div>
                                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Plagiarism</h3>
                                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedResult.Plagvalue}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* AI Report Actions */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <a
                                        href={getDownloadUrl(selectedResult.AIDoc)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary"
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', textDecoration: 'none' }}
                                    >
                                        <i className="fas fa-file-download"></i> AI Report
                                    </a>
                                    <button
                                        onClick={() => handleShare('AI', selectedResult.AIDoc)}
                                        className="btn-secondary"
                                        style={{ padding: '12px 16px', cursor: 'pointer' }}
                                        title="Share AI Report"
                                    >
                                        <i className="fas fa-share-alt"></i>
                                    </button>
                                </div>

                                {/* Plag Report Actions */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <a
                                        href={getDownloadUrl(selectedResult.PlagDoc)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary"
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', textDecoration: 'none' }}
                                    >
                                        <i className="fas fa-file-download"></i> Plag Report
                                    </a>
                                    <button
                                        onClick={() => handleShare('Plagiarism', selectedResult.PlagDoc)}
                                        className="btn-secondary"
                                        style={{ padding: '12px 16px', cursor: 'pointer' }}
                                        title="Share Plagiarism Report"
                                    >
                                        <i className="fas fa-share-alt"></i>
                                    </button>
                                </div>

                                {/* Download All Zip */}
                                <button
                                    onClick={handleDownloadZip}
                                    className="btn-primary"
                                    style={{ marginTop: '12px', width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-file-archive"></i> Download All (Zip)
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
        </motion.div >
    );
};

export default MyOrders;
