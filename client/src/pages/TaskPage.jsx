import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask } from '../services/taskService';
import TaskDetailModal from '../components/TaskDetailModal';
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

    /* ── Fetch tasks on mount ──────────────────────────────── */
    useEffect(() => {
        fetchTasks();
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
        const newStatus = STATUS_CYCLE[task.status] ?? 'In Progress';
        // Optimistic update
        setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
        try {
            await updateTask(task._id, { status: newStatus });
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
        setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
        setSelectedTask(updated);
    }

    function handleTaskDeleted(id) {
        setTasks(prev => prev.filter(t => t._id !== id));
    }

    /* ── Render ────────────────────────────────────────────── */
    return (
        <section className={styles.content}>

            <h2 className={styles.sectionTitle}>Tasks</h2>

            {/* Loading */}
            {loading && <p className={styles.message}>Loading tasks…</p>}

            {/* Error */}
            {error && <p className={`${styles.message} ${styles.errorMsg}`}>{error}</p>}

            {!loading && !error && tasks.length === 0 && (
                <div className={styles.emptyState}>
                    <p className={styles.emptyTitle}>No tasks yet</p>
                    <p className={styles.emptySubtext}>Tap the + button below to create your first task</p>
                </div>
            )}

            {/* Task list */}
            <ul className={styles.list}>
                {tasks.map(task => (
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
                                    <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            {task.status === 'In Progress' && (
                                <span className={styles.inProgressDot} />
                            )}
                        </button>

                    </li>
                ))}
            </ul>

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

                            {/* Title — required */}
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Task title *"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                required
                                autoFocus
                            />

                            {/* Description */}
                            <textarea
                                className={styles.input}
                                placeholder="Description (optional)"
                                rows={2}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />

                            {/* Priority */}
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

                            {/* Dates row */}
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


                            {/* Image picker */}
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
