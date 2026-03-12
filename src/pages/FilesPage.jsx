import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import fileService from '../services/fileService';
import styles from './FilesPage.module.css';

export default function FilesPage() {
    const [currentPath, setCurrentPath] = useState('/');
    const [viewMode, setViewMode] = useState('grid');
    const [previewFile, setPreviewFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTask, setActiveTask] = useState(null); // { name: '', type: 'upload' | 'delete' | 'folder' }
    const [isFabOpen, setIsFabOpen] = useState(false);

    // Custom Modal States
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folderNameInput, setFolderNameInput] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // stores file object to delete

    const fileInputRef = useRef(null);
    const queryClient = useQueryClient();

    const { data: files = [], isLoading } = useQuery({
        queryKey: ['files', currentPath],
        queryFn: () => fileService.getFiles(currentPath)
    });

    const createFolderMutation = useMutation({
        mutationFn: fileService.createFolder,
        onMutate: (folder) => {
            setActiveTask({ name: folder.showcaseName, type: 'folder' });
            setIsFabOpen(false);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['files', currentPath]);
            setShowFolderModal(false);
            setFolderNameInput('');
        },
        onSettled: () => setActiveTask(null)
    });

    const deleteMutation = useMutation({
        mutationFn: fileService.deleteFile,
        onMutate: (id) => {
            const file = files.find(f => f._id === id);
            setActiveTask({ name: file?.showcaseName || 'Item', type: 'delete' });
            setShowDeleteConfirm(null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['files', currentPath]);
        },
        onSettled: () => setActiveTask(null)
    });

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsFabOpen(false);

        // Validation
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File size exceeds 5MB limit.');
            return;
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Only Images and PDFs are allowed.');
            return;
        }

        setIsUploading(true);
        setActiveTask({ name: file.name, type: 'upload', icon: file.type.includes('pdf') ? 'pdf' : 'image' });
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Content = reader.result;

                await fileService.uploadFileMetadata({
                    showcaseName: file.name.split('.')[0],
                    originalName: file.name,
                    url: base64Content,
                    type: file.type.includes('pdf') ? 'pdf' : 'image',
                    size: file.size,
                    path: currentPath
                });

                queryClient.invalidateQueries(['files', currentPath]);
                setIsUploading(false);
                setActiveTask(null);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Upload failed:', error);
            setIsUploading(false);
            setActiveTask(null);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleNewFolder = () => {
        if (folderNameInput.trim()) {
            createFolderMutation.mutate({
                showcaseName: folderNameInput.trim(),
                originalName: folderNameInput.trim(),
                url: '',
                path: currentPath
            });
        }
    };

    const navigateToFolder = (folderName) => {
        setCurrentPath(`${currentPath}${folderName}/`);
    };

    const goBack = () => {
        if (currentPath === '/') return;
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        setCurrentPath(`/${parts.join('/')}${parts.length ? '/' : ''}`);
    };

    return (
        <section className={styles.container}>
            {currentPath !== '/' && (
                <div className={styles.navigationRow}>
                    <button onClick={goBack} className={styles.navBackBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        <span>Back</span>
                    </button>
                </div>
            )}
            <div className={styles.scrollArea}>
                {isLoading ? (
                    <div className={styles.loading}>Loading files...</div>
                ) : files.length === 0 ? (
                    <div className={styles.empty}>
                        <img src="/file.png" alt="Empty" className={styles.emptyIcon} />
                        <p>No files or folders here yet.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {files.map(file => (
                            <div key={file._id} className={styles.fileCard}>
                                <div className={styles.fileIcon} onClick={() => file.isFolder ? navigateToFolder(file.showcaseName) : setPreviewFile(file)}>
                                    {file.isFolder ? (
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="#6366f1"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                                    ) : file.type === 'pdf' ? (
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="#ef4444"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" /></svg>
                                    ) : (
                                        <img src={file.url} alt={file.showcaseName} className={styles.thumbnail} />
                                    )}
                                </div>
                                <div className={styles.fileInfo}>
                                    <span className={styles.fileName}>{file.showcaseName}</span>
                                    {!file.isFolder && <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>}
                                </div>
                                <div className={styles.fileActions}>
                                    <button
                                        onClick={() => setShowDeleteConfirm(file)}
                                        className={styles.deleteBtn}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                    {!file.isFolder && (
                                        <a href={file.url} download={file.originalName} className={styles.downloadBtn}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4M7 10l5 5 5-5M12 15V3" /></svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.fabWrapper}>
                {isFabOpen && (
                    <div className={styles.fabMenu}>
                        <button onClick={() => setShowFolderModal(true)} className={styles.fabMenuItem}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#013064"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                            <span>New Folder</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className={styles.fabMenuItem}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" /></svg>
                            <span>Upload PDF/Image</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                            accept=".pdf,image/*"
                        />
                    </div>
                )}
                <button
                    className={`${styles.fab} ${isFabOpen ? styles.fabActive : ''}`}
                    onClick={() => setIsFabOpen(!isFabOpen)}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            </div>

            {/* Folder Creation Modal */}
            {showFolderModal && (
                <div className={styles.customModalOverlay}>
                    <div className={styles.customModal}>
                        <h3 className={styles.modalTitle}>New Folder</h3>
                        <input
                            type="text"
                            className={styles.modalInput}
                            placeholder="Enter folder name"
                            value={folderNameInput}
                            onChange={(e) => setFolderNameInput(e.target.value)}
                            autoFocus
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowFolderModal(false)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleNewFolder} className={styles.confirmBtn}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className={styles.customModalOverlay}>
                    <div className={styles.customModal}>
                        <h3 className={styles.modalTitle}>Delete {showDeleteConfirm.isFolder ? 'Folder' : 'File'}?</h3>
                        <p className={styles.modalMessage}>
                            Are you sure you want to delete <strong>{showDeleteConfirm.showcaseName}</strong>?
                            {showDeleteConfirm.isFolder && " This will permanently remove all nested files."}
                        </p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowDeleteConfirm(null)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={() => deleteMutation.mutate(showDeleteConfirm._id)} className={`${styles.confirmBtn} ${styles.deleteConfirmBtn}`}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTask && (
                <div className={`${styles.statusContainer} ${styles[activeTask.type]}`}>
                    <div className={styles.statusContent}>
                        <div className={styles.statusHeader}>
                            <div className={styles.statusIcon}>
                                {activeTask.type === 'folder' ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#6366f1"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                                ) : activeTask.icon === 'pdf' ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" /></svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#10b981"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                                )}
                            </div>
                            <div className={styles.statusInfo}>
                                <div className={styles.statusTitle}>{activeTask.name}</div>
                                <div className={styles.statusLabel}>
                                    {activeTask.type === 'upload' ? 'Uploading...' : activeTask.type === 'delete' ? 'Deleting...' : 'Creating Folder...'}
                                </div>
                            </div>
                        </div>
                        <div className={styles.progressBarWrapper}>
                            <div className={`${styles.progressBar} ${styles[activeTask.type]}`}></div>
                        </div>
                    </div>
                </div>
            )}

            {previewFile && (
                <div className={styles.modalOverlay} onClick={() => setPreviewFile(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <header className={styles.modalHeader}>
                            <h3>{previewFile.showcaseName}</h3>
                            <button onClick={() => setPreviewFile(null)}>×</button>
                        </header>
                        <div className={styles.previewBody}>
                            {previewFile.type === 'pdf' ? (
                                <embed src={previewFile.url} type="application/pdf" className={styles.pdfFrame} />
                            ) : (
                                <img src={previewFile.url} alt="Preview" className={styles.fullImage} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
