import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';
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
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [toast, setToast] = useState(null); // { message }
    const [filter, setFilter] = useState('All'); // 'All' | 'My' | 'Completed'
    const [animationData, setAnimationData] = useState(null);
    const currentUser = getCurrentUser();

    /* ── Queries ────────────────────────────────────────────── */
    const { data: tasksRes, isLoading: tasksLoading, error: tasksError } = useQuery({
        queryKey: ['tasks'],
        queryFn: getTasks,
    });
    const tasks = tasksRes?.data || [];

    const { data: usersRes } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
    });
    const allUsers = usersRes?.data || [];

    /* ── Lottie Fetch ────────────────────────────────────────── */
    useEffect(() => {
        fetch('/Loading 40 _ Paperplane.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('Error loading animation:', err));
    }, []);

    const loading = tasksLoading;
    const error = tasksError ? 'Could not load tasks. Is the server running?' : null;

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    /* ── Mutations ──────────────────────────────────────────── */
    const createMutation = useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setShowModal(false);
            setForm(emptyForm);
        },
        onError: () => alert('Failed to create task. Please try again.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateTask(id, data),
        onMutate: async ({ id, data }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['tasks'] });

            // Snapshot the previous value
            const previousTasks = queryClient.getQueryData(['tasks']);

            // Optimistically update to the new value
            queryClient.setQueryData(['tasks'], (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map(t => t._id === id ? { ...t, ...data } : t)
                };
            });

            // Show toast instantly if marking as done
            if (data.status === 'Done') {
                showToast('Task marked as completed! 🎉');
            }

            // Return a context object with the snapshotted value
            return { previousTasks };
        },
        onError: (err, newTodo, context) => {
            // Rollback to the previous value if mutation fails
            queryClient.setQueryData(['tasks'], context.previousTasks);
            showToast('Failed to update task.');
        },
        onSettled: () => {
            // Always refetch after error or success to synchronize with server
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTask,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['tasks'] });
            const previousTasks = queryClient.getQueryData(['tasks']);
            queryClient.setQueryData(['tasks'], (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.filter(t => t._id !== id)
                };
            });
            return { previousTasks };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['tasks'], context.previousTasks);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setSelectedTask(null);
        },
    });

    async function toggleTask(task) {
        const isDone = task.status === 'Done';
        const newStatus = isDone ? 'In Progress' : 'Done';
        updateMutation.mutate({ id: task._id, data: { status: newStatus } });
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!form.title.trim()) return;
        createMutation.mutate({ ...form, status: 'Not Started' });
    }

    /* ── Modal callbacks ───────────────────────────────────── */
    function handleTaskUpdated(updated) {
        const oldTask = tasks.find(t => t._id === updated._id);
        setSelectedTask(updated);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });

        if (updated.status === 'Done' && oldTask?.status !== 'Done') {
            showToast('Task marked as completed! 🎉');
        }
    }

    function handleTaskDeleted(id) {
        deleteMutation.mutate(id);
    }

    const filteredTasks = tasks.filter(t => {
        if (filter === 'Completed') return t.status === 'Done';
        if (t.status === 'Done') return false;
        if (filter === 'My') return t.assignedTo?.some(u => u._id === currentUser?._id);
        return true;
    });

    const submitting = createMutation.isPending;

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
