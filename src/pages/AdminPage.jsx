import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import styles from './AdminPage.module.css';

const AVATAR_OPTIONS = [
    { label: 'Sree', value: 'Sree', src: '/Sree.jpg' },
    { label: 'Vimy', value: 'Vimy', src: '/Vimy.jpg' },
];

const emptyForm = { username: '', password: '', avatar: 'Sree' };

export default function AdminPage() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const formRef = useRef(null);

    /* ── Queries ────────────────────────────────────────────── */
    const { data: usersRes, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
    });
    const users = usersRes?.data || [];

    useEffect(() => {
        if (usersError) setError('Could not refresh user list.');
    }, [usersError]);

    /* ── Mutations ──────────────────────────────────────────── */
    const saveMutation = useMutation({
        mutationFn: (variables) => {
            if (editingId) return updateUser(editingId, variables);
            return createUser(variables);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setForm(emptyForm);
            setEditingId(null);
            setShowPassword(false);
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Error saving user.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            if (editingId) cancelEdit();
        },
        onError: () => {
            setError('Failed to delete user. Please try again.');
        }
    });

    const field = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        const trimmed = {
            ...form,
            username: form.username.trim(),
            password: form.password.trim(),
        };
        if (!trimmed.username) { setError('Username cannot be blank.'); return; }
        if (!editingId && !trimmed.password) { setError('Password cannot be blank.'); return; }

        setError('');
        saveMutation.mutate(trimmed);
    }

    function startEdit(user) {
        setEditingId(user._id);
        setForm({ username: user.username, password: user.password || '', avatar: user.avatar || 'Sree' });
        setShowPassword(false);
        setError('');
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(emptyForm);
        setError('');
        setShowPassword(false);
    }

    async function handleDelete(id) {
        const target = users.find(u => u._id === id);
        if (!window.confirm(`Delete user "@${target?.username}"? This cannot be undone.`)) return;
        deleteMutation.mutate(id);
    }

    const loading = saveMutation.isPending || deleteMutation.isPending;

    return (
        <div className={styles.page}>

            {/* ── Header ── */}
            <header className={styles.header}>
                <img src="/zege.png" alt="Zege" className={styles.logo}
                    onError={e => { e.target.style.display = 'none'; }} />
                <p className={styles.company}>Admin Dashboard</p>
            </header>

            <div className={styles.body}>

                {/* ── Create / Edit Form ── */}
                <section className={styles.section}>
                    <div className={styles.formCard} ref={formRef}>
                        <h2 className={styles.sectionTitle}>
                            {editingId ? 'Edit User' : 'Create User'}
                        </h2>

                        {error && <p className={styles.error}>{error}</p>}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.fieldRow}>
                                <label className={styles.label}>Username</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="e.g. sree"
                                    value={form.username}
                                    onChange={field('username')}
                                    required
                                    autoComplete="off"
                                />
                            </div>

                            <div className={styles.fieldRow}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.passwordWrap}>
                                    <input
                                        className={styles.input}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Password"
                                        value={form.password}
                                        onChange={field('password')}
                                        required={!editingId}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(v => !v)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            /* eye-off */
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            /* eye */
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Avatar picker */}
                            <div className={styles.fieldRow}>
                                <label className={styles.label}>Avatar</label>
                                <div className={styles.avatarPicker}>
                                    {AVATAR_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`${styles.avatarOption} ${form.avatar === opt.value ? styles.avatarSelected : ''}`}
                                            onClick={() => setForm(f => ({ ...f, avatar: opt.value }))}
                                        >
                                            <img src={opt.src} alt={opt.label} className={styles.avatarImg} />
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <button
                                    type="submit"
                                    className={styles.btnPrimary}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving…' : editingId ? 'Update User' : 'Create User'}
                                </button>
                                {editingId && (
                                    <button type="button" className={styles.btnSecondary} onClick={cancelEdit}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </section>

                {/* ── Divider ── */}
                <hr className={styles.divider} />

                {/* ── User List ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Team Members</h2>

                    {users.length === 0 ? (
                        <p className={styles.empty}>No users yet. Create one above.</p>
                    ) : (
                        <ul className={styles.userList}>
                            {users.map(user => (
                                <li key={user._id} className={styles.userRow}>
                                    <img
                                        src={`/${user.avatar}.jpg`}
                                        alt={user.username}
                                        className={styles.userAvatar}
                                        onError={e => { e.target.src = '/Sree.jpg'; }}
                                    />
                                    <span className={styles.userName}>@{user.username}</span>
                                    <div className={styles.userActions}>
                                        <button className={styles.btnEdit} onClick={() => startEdit(user)}>Edit</button>
                                        <button className={styles.btnDelete} onClick={() => handleDelete(user._id)}>Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

            </div>
        </div>
    );
}
