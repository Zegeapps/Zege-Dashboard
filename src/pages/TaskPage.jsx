import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask } from '../services/taskService';
import { getUsers } from '../services/userService';
import TaskDetailModal from '../components/TaskDetailModal';
import { getCurrentUser } from '../services/authService';
import Lottie from 'lottie-react';
import styles from './TaskPage.module.css';

/* ── Image options: value is stored in DB, src is public path ── */
const IMAGE_OPTIONS = [
    { label: 'Design', value: 'Design' },
    { label: 'Development', value: 'Development' },
    { label: 'Research', value: 'Research' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Writing', value: 'Writing' },
    { label: 'Other', value: 'Other' },
];

/** Resolve a DB image name (e.g. "Design") to a public asset path. */
function resolveImage(name) {
    const known = ['Design', 'Development', 'Research', 'Marketing', 'Writing', 'Other'];
    const matched = known.find(k => k.toLowerCase() === (name || '').toLowerCase());
    return matched ? `/${matched}.png` : '/Design.png';
}

/* ── Empty form state ─────────────────────────────────────── */
const emptyForm = {
    title: '',
    description: '',
    image: 'Design',
    priority: 'Low',
    startDate: '',
    dueDate: '',
    estimatedEffort: '',
    assignedTo: [],
};

export default function TaskPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null); // { message }
    const [filter, setFilter] = useState('All'); // 'All' | 'My' | 'Completed'
    const [allUsers, setAllUsers] = useState([]);
    const [animationData, setAnimationData] = useState(null);
    const currentUser = getCurrentUser();

    /* ── Fetch tasks + users on mount ──────────────────────────────── */
    useEffect(() => {
        fetchTasks();
        getUsers().then(res => {
            if (Array.isArray(res.data)) setAllUsers(res.data);
        }).catch(() => { });

        // Fetch Lottie animation from public folder
        fetch('/Loading 40 _ Paperplane.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('Error loading animation:', err));
    }, []);

    async function fetchTasks() {
        try {
            setLoading(true);
            const res = await getTasks();
            setTasks(res.data);
        } catch {
            setError('Could not load tasks. Is the server running?');
        } finally {
            setLoading(false);
        }
    }

    /* ── 3-state cycle: Not Started → In Progress → Done → Not Started ── */
    const STATUS_CYCLE = { 'Not Started': 'In Progress', 'In Progress': 'Done', 'Done': 'Not Started' };

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    async function toggleTask(task) {
        const isDone = task.status === 'Done';
        const newStatus = isDone ? 'In Progress' : 'Done';

        // Optimistic update
        setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));

        try {
            await updateTask(task._id, { status: newStatus });
            if (newStatus === 'Done') {
                showToast('Task marked as completed! 🎉');
            }
        } catch {
            // Revert on failure
            setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: task.status } : t));
            showToast('Failed to update status. Try again.');
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSubmitting(true);
        try {
            const res = await createTask({ ...form, status: 'Not Started' });
            setTasks(prev => [res.data, ...prev]);
            setShowModal(false);
            setForm(emptyForm);
        } catch {
            alert('Failed to create task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    /* ── Modal callbacks ───────────────────────────────────── */
    function handleTaskUpdated(updated) {
        const oldTask = tasks.find(t => t._id === updated._id);
        setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
        setSelectedTask(updated);

        // Show toast if newly completed
        if (updated.status === 'Done' && oldTask?.status !== 'Done') {
            showToast('Task marked as completed! 🎉');
        }
    }

    function handleTaskDeleted(id) {
        setTasks(prev => prev.filter(t => t._id !== id));
    }

    const filteredTasks = tasks.filter(t => {
        if (filter === 'Completed') return t.status === 'Done';
        // If not Completed filter, show pending/in-progress only
        if (t.status === 'Done') return false;
        if (filter === 'My') return t.assignedTo?.some(u => u._id === currentUser?._id);
        return true; // All filter (excluding Done)
    });

    /* ── Render ────────────────────────────────────────────── */
    return (
        <section className={styles.content}>



            {/* Loading */}
            {loading && (
                <div className={styles.loadingContainer}>
                    {animationData && (
                        <Lottie
                            animationData={animationData}
                            loop={true}
                            className={styles.lottieLoader}
                        />
                    )}
                    <p className={styles.loadingTitle}>task loading...</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && <p className={`${styles.message} ${styles.errorMsg}`}>{error}</p>}

            {/* ── Section title + Filter (Hidden when loading) ── */}
            {!loading && (
                <div className={styles.headerRow}>
                    <h2 className={styles.sectionTitle}>Tasks</h2>
                    <div className={styles.filterToggle}>
                        <button
                            className={filter === 'All' ? styles.filterActive : styles.filterBtn}
                            onClick={() => setFilter('All')}
                        >All</button>
                        <button
                            className={filter === 'My' ? styles.filterActive : styles.filterBtn}
                            onClick={() => setFilter('My')}
                        >My</button>
                        <button
                            className={filter === 'Completed' ? styles.filterActive : styles.filterBtn}
                            onClick={() => setFilter('Completed')}
                        >Completed</button>
                    </div>
                </div>
            )}

            {!loading && !error && filteredTasks.length === 0 && (
                <div className={styles.emptyState}>
                    {filter === 'Completed' ? (
                        <>
                            <p className={styles.emptyTitle}>No completed tasks</p>
                            <p className={styles.emptySubtext}>Finish your active tasks to see them here!</p>
                        </>
                    ) : (
                        <>
                            <p className={styles.emptyTitle}>No tasks yet</p>
                            <p className={styles.emptySubtext}>Tap the + button below to create your first task</p>
                        </>
                    )}
                </div>
            )}

            {/* ── Task list ── */}
            {!loading && filteredTasks.length > 0 && (
                <ul className={styles.list}>
                    {filteredTasks.map(task => (
                        <li
                            key={task._id}
                            className={styles.card}
                            onClick={() => setSelectedTask(task)}
                            style={{ cursor: 'pointer' }}
                        >

                            <img
                                src={resolveImage(task.image)}
                                alt={task.title}
                                className={styles.cardImage}
                                onError={e => { e.target.src = '/Design.png'; }}
                            />

                            {/* Middle: text */}
                            <div className={styles.cardBody}>
                                <p className={styles.cardTitle}>{task.title}</p>
                                {task.description ? (
                                    <p className={styles.cardDesc}>{task.description}</p>
                                ) : null}
                            </div>

                            {/* Right: status circle */}
                            <button
                                className={[
                                    styles.status,
                                    task.status === 'In Progress' ? styles.statusInProgress : '',
                                    task.status === 'Done' ? styles.statusDone : '',
                                ].join(' ')}
                                onClick={e => { e.stopPropagation(); toggleTask(task); }}
                                aria-label={`Status: ${task.status}. Click to advance.`}
                            >
                                {task.status === 'Done' && (
                                    <svg viewBox="0 0 12 10" fill="none" className={styles.checkIcon}>
                                        <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>

                            {/* Assignee avatars (multiple) */}
                            {task.assignedTo && task.assignedTo.length > 0 && (
                                <div className={styles.assignmentWrap}>
                                    {task.assignedTo.map(user => (
                                        <div key={user._id} className={styles.avatarCircle} title={user.username}>
                                            <span className={styles.avatarInitial}>
                                                {user.username?.[0]?.toUpperCase()}
                                            </span>
                                            <img
                                                src={`/${user.avatar}.jpg`}
                                                alt={user.username}
                                                className={styles.avatarImg}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                        </li>
                    ))}
                </ul>
            )}

            {/* ── Error toast ── */}
            {toast && (
                <div className={styles.toast}>{toast}</div>
            )}

            {/* ── Add Task Modal ── */}
            {showModal && (
                <div className={styles.overlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>New Task</h3>

                        <form onSubmit={handleCreate} className={styles.form}>
                            {/* Top group: Title, Desc, Priority (12px internal gap) */}
                            <div className={styles.topGroup}>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="Task title *"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    required
                                    autoFocus
                                />

                                <textarea
                                    className={styles.input}
                                    placeholder="Description (optional)"
                                    rows={2}
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />

                                <select
                                    className={styles.input}
                                    value={form.priority}
                                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                >
                                    <option value="Low">Priority: Low</option>
                                    <option value="Medium">Priority: Medium</option>
                                    <option value="High">Priority: High</option>
                                    <option value="Critical">Priority: Critical</option>
                                </select>
                            </div>

                            {/* Dates Section (18px gap above) */}
                            <div className={styles.formSection}>
                                <div className={styles.row}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Start date</label>
                                        <input
                                            className={styles.input}
                                            type="date"
                                            value={form.startDate}
                                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Due date</label>
                                        <input
                                            className={styles.input}
                                            type="date"
                                            value={form.dueDate}
                                            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Assignee Section (18px gap above) */}
                            <div className={styles.formSection}>
                                <p className={styles.label} style={{ marginBottom: 4 }}>Assign to</p>
                                <div className={styles.assigneePicker}>
                                    {allUsers.map(u => {
                                        const isSelected = form.assignedTo.includes(u._id);
                                        return (
                                            <button
                                                key={u._id}
                                                type="button"
                                                className={`${styles.assigneeChip} ${isSelected ? styles.assigneeChipActive : ''}`}
                                                onClick={() => {
                                                    setForm(f => {
                                                        const newAssigned = isSelected
                                                            ? f.assignedTo.filter(id => id !== u._id)
                                                            : [...f.assignedTo, u._id];
                                                        return { ...f, assignedTo: newAssigned };
                                                    });
                                                }}
                                            >
                                                <div className={styles.assigneeChipAvatar}>
                                                    <span className={styles.assigneeChipInitial}>{u.username[0].toUpperCase()}</span>
                                                    <img
                                                        src={`/${u.avatar}.jpg`}
                                                        alt={u.username}
                                                        className={styles.assigneeChipImg}
                                                        onError={e => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                                <span>{u.username}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Category/Image Section (18px gap above) */}
                            <div className={styles.formSection}>
                                <div className={styles.imagePicker}>
                                    {IMAGE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`${styles.imageOption} ${form.image === opt.value ? styles.imageSelected : ''}`}
                                            onClick={() => setForm(f => ({ ...f, image: opt.value }))}
                                        >
                                            <img src={resolveImage(opt.value)} alt={opt.label} />
                                            <span className={styles.imageLabel}>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={submitting || !form.title.trim()}
                            >
                                {submitting ? 'Saving…' : 'Add Task'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Floating Action Button ── */}
            <button
                className={styles.fab}
                onClick={() => setShowModal(true)}
                aria-label="Add task"
            >
                <svg viewBox="0 0 24 24" fill="none" className={styles.fabIcon}>
                    <path
                        d="M12 5v14M5 12h14"
                        stroke="#fff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                </svg>
            </button>

            {/* ── Task Detail Modal ── */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdated={handleTaskUpdated}
                    onDeleted={handleTaskDeleted}
                />
            )}

        </section>
    );
}
