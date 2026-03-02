import { useState, useEffect } from 'react';
import { updateTask, deleteTask } from '../services/taskService';
import { getUsers } from '../services/userService';
import styles from './TaskDetailModal.module.css';


function resolveImage(name) {
    const known = ['Design', 'Development', 'Research', 'Marketing', 'Writing', 'Other'];
    const matched = known.find(k => k.toLowerCase() === (name || '').toLowerCase());
    return matched ? `/${matched}.png` : '/Design.png';
}

function fmt(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUSES = ['Not Started', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];


export default function TaskDetailModal({ task, onClose, onUpdated, onDeleted }) {
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmComplete, setConfirmComplete] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        getUsers().then(res => setAllUsers(res.data)).catch(() => { });
    }, []);

    const [form, setForm] = useState({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Not Started',
        priority: task.priority || 'Low',
        startDate: task.startDate ? task.startDate.slice(0, 10) : '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        assignedTo: task.assignedTo?.map(u => u._id) || [],
        subtasks: task.subtasks || [],
    });

    const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const isDone = form.status === 'Done';

    /* ── Save ───────────────────────────────────────────── */
    async function handleSave() {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            const res = await updateTask(task._id, form);
            onUpdated(res.data);
            setEditing(false);
        } catch {
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    /* ── Toggle complete ────────────────────────────────── */
    async function handleToggleComplete() {
        const newStatus = isDone ? 'Not Started' : 'Done';
        const updated = { ...form, status: newStatus };
        setForm(updated);
        try {
            const res = await updateTask(task._id, { status: newStatus });
            onUpdated(res.data);
        } catch {
            setForm(form); // revert
        }
    }

    /* ── Subtask Handlers ───────────────────────────────── */
    function handleAddSubtask() {
        setForm(f => ({
            ...f,
            subtasks: [...f.subtasks, { title: '', isCompleted: false }]
        }));
    }

    function handleUpdateSubtask(index, field, value) {
        setForm(f => {
            const newSubtasks = [...f.subtasks];
            newSubtasks[index] = { ...newSubtasks[index], [field]: value };
            return { ...f, subtasks: newSubtasks };
        });
    }

    function handleRemoveSubtask(index) {
        setForm(f => {
            const newSubtasks = [...f.subtasks];
            newSubtasks.splice(index, 1);
            return { ...f, subtasks: newSubtasks };
        });
    }

    async function handleToggleSubtask(index) {
        // Toggle immediately triggers a save of the whole subtasks array
        if (editing) return; // In edit mode, toggling doesn't save instantly, just edit checkmarks
        const currentComplete = form.subtasks[index].isCompleted;

        // Optimistic update
        setForm(f => {
            const newSubtasks = [...f.subtasks];
            newSubtasks[index] = { ...newSubtasks[index], isCompleted: !currentComplete };
            return { ...f, subtasks: newSubtasks };
        });

        const updatedSubtasks = [...form.subtasks];
        updatedSubtasks[index].isCompleted = !currentComplete;

        try {
            const res = await updateTask(task._id, { subtasks: updatedSubtasks });
            onUpdated(res.data);
        } catch {
            // Revert state
            setForm(f => ({ ...f, subtasks: task.subtasks || [] }));
        }
    }

    /* ── Delete ─────────────────────────────────────────── */
    async function handleDelete() {
        setDeleting(true);
        try {
            await deleteTask(task._id);
            onDeleted(task._id);
            onClose();
        } catch {
            alert('Failed to delete. Please try again.');
            setDeleting(false);
        }
    }

    /* ── Render ─────────────────────────────────────────── */
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>

                {/* ── Top section: handle centered, then header+icons row ── */}
                <div className={styles.topBar}>
                    {/* Drag handle — centered */}
                    <div className={styles.handleWrap}>
                        <div className={styles.handle} />
                    </div>

                    {/* Header row: image+title on left, icons on right */}
                    <div className={styles.topContent}>
                        {/* Image + title */}
                        <div className={styles.header}>
                            <img
                                src={resolveImage(task.image)}
                                alt={task.title}
                                className={styles.heroImage}
                                onError={(e) => { e.target.src = '/Design.png'; }}
                            />
                            <div className={styles.headerText}>
                                {editing ? (
                                    <input
                                        className={styles.inputInline}
                                        value={form.title}
                                        onChange={field('title')}
                                        placeholder="Task title"
                                    />
                                ) : (
                                    <p className={styles.taskTitle}>{form.title}</p>
                                )}
                                <span className={`${styles.badge} ${styles[`priority${form.priority}`]}`}>
                                    {form.priority}
                                </span>
                            </div>
                        </div>

                        {/* Icon buttons — top right */}
                        <div className={styles.iconRow}>
                            {editing ? (
                                <>
                                    <button className={styles.iconBtn} onClick={() => setEditing(false)} aria-label="Cancel edit">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                    <button
                                        className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
                                        onClick={handleSave}
                                        disabled={saving || !form.title.trim()}
                                        aria-label="Save"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </>
                            ) : confirmDelete ? (
                                <button className={styles.iconBtn} onClick={() => setConfirmDelete(false)} aria-label="Cancel delete">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            ) : (
                                <>
                                    <button className={styles.iconBtn} onClick={() => setEditing(true)} aria-label="Edit task">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => setConfirmDelete(true)} aria-label="Delete task">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className={styles.body}>

                    {/* Description */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Description</p>
                        {editing ? (
                            <textarea className={styles.textarea} rows={3} value={form.description} onChange={field('description')} placeholder="Add a description…" />
                        ) : (
                            <p className={styles.sectionValue}>
                                {form.description || <span className={styles.empty}>No description</span>}
                            </p>
                        )}
                    </div>

                    {/* Subtasks */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeaderRow}>
                            <p className={styles.sectionLabel} style={{ marginBottom: 0 }}>Subtasks</p>
                            {editing && (
                                <button className={styles.addSubtaskBtn} onClick={handleAddSubtask} type="button">
                                    + Add
                                </button>
                            )}
                        </div>
                        {form.subtasks && form.subtasks.length > 0 ? (
                            <div className={styles.subtasksList}>
                                {form.subtasks.map((st, idx) => (
                                    <div key={idx} className={`${styles.subtaskRow} ${st.isCompleted ? styles.subtaskDone : ''}`}>
                                        <button
                                            className={styles.subtaskCheckBtn}
                                            onClick={() => {
                                                if (editing) handleUpdateSubtask(idx, 'isCompleted', !st.isCompleted);
                                                else handleToggleSubtask(idx);
                                            }}
                                        >
                                            {st.isCompleted ? (
                                                <svg viewBox="0 0 24 24" fill="none" className={styles.subtaskIconChecked}>
                                                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
                                                    <path d="M8 12.5l3 3 5-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" className={styles.subtaskIconUnchecked}>
                                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                                                </svg>
                                            )}
                                        </button>

                                        {editing ? (
                                            <input
                                                className={styles.subtaskInput}
                                                value={st.title}
                                                onChange={(e) => handleUpdateSubtask(idx, 'title', e.target.value)}
                                                placeholder="Subtask title"
                                                autoFocus={!st.title}
                                            />
                                        ) : (
                                            <span className={styles.subtaskTitle}>{st.title}</span>
                                        )}

                                        {editing && (
                                            <button
                                                className={styles.subtaskDeleteBtn}
                                                onClick={() => handleRemoveSubtask(idx)}
                                                aria-label="Remove subtask"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : !editing ? (
                            <p className={styles.sectionValue}>
                                <span className={styles.empty}>No subtasks</span>
                            </p>
                        ) : null}
                    </div>

                    {/* Status + Priority */}
                    <div className={styles.row}>
                        <div className={styles.cell}>
                            <p className={styles.sectionLabel}>Status</p>
                            {editing ? (
                                <select className={styles.select} value={form.status} onChange={field('status')}>
                                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            ) : (
                                <p className={styles.sectionValue}>{form.status || '—'}</p>
                            )}
                        </div>
                        <div className={styles.cell}>
                            <p className={styles.sectionLabel}>Priority</p>
                            {editing ? (
                                <select className={styles.select} value={form.priority} onChange={field('priority')}>
                                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                                </select>
                            ) : (
                                <p className={styles.sectionValue}>{form.priority || '—'}</p>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className={styles.row}>
                        <div className={styles.cell}>
                            <p className={styles.sectionLabel}>Start date</p>
                            {editing ? (
                                <input className={styles.select} type="date" value={form.startDate} onChange={field('startDate')} />
                            ) : (
                                <p className={styles.sectionValue}>{fmt(task.startDate)}</p>
                            )}
                        </div>
                        <div className={styles.cell}>
                            <p className={styles.sectionLabel}>Due date</p>
                            {editing ? (
                                <input className={styles.select} type="date" value={form.dueDate} onChange={field('dueDate')} />
                            ) : (
                                <p className={styles.sectionValue}>{fmt(task.dueDate)}</p>
                            )}
                        </div>
                    </div>

                    {/* Assigned To */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Assigned to</p>
                        {editing ? (
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
                        ) : (
                            task.assignedTo && task.assignedTo.length > 0 ? (
                                <div className={styles.assigneeList}>
                                    {task.assignedTo.map(user => (
                                        <div key={user._id} className={styles.assigneeRow}>
                                            <div className={styles.assigneeAvatar}>
                                                <span className={styles.assigneeAvatarInitial}>
                                                    {user.username?.[0]?.toUpperCase()}
                                                </span>
                                                <img
                                                    src={`/${user.avatar}.jpg`}
                                                    alt={user.username}
                                                    onError={e => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                            <p className={styles.sectionValue}>{user.username}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.sectionValue}><span className={styles.empty}>Unassigned</span></p>
                            )
                        )}
                    </div>

                    {/* Created */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Created</p>
                        <p className={styles.sectionValue}>{fmt(task.createdAt)}</p>
                    </div>

                </div>

                {/* ── Bottom action bar ── */}
                <div className={styles.actions}>
                    {confirmDelete ? (
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmText}>Delete this task?</p>
                            <button className={styles.btnDelete} onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting…' : 'Yes, delete'}
                            </button>
                        </div>
                    ) : editing ? (
                        <button
                            className={styles.btnFull}
                            onClick={handleSave}
                            disabled={saving || !form.title.trim()}
                        >
                            {saving ? 'Saving…' : 'Save changes'}
                        </button>
                    ) : confirmComplete ? (
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmText}>
                                {isDone ? 'Mark as not completed?' : 'Mark as completed?'}
                            </p>
                            <div className={styles.confirmBtns}>
                                <button
                                    className={styles.btnCancel}
                                    onClick={() => setConfirmComplete(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`${styles.btnFull} ${isDone ? '' : styles.btnDone}`}
                                    style={{ flex: 1 }}
                                    onClick={() => { setConfirmComplete(false); handleToggleComplete(); }}
                                >
                                    {isDone ? 'Yes, unmark' : 'Yes, complete'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className={`${styles.btnFull} ${isDone ? styles.btnDone : ''}`}
                            onClick={() => setConfirmComplete(true)}
                        >
                            {isDone ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" className={styles.btnIcon}>
                                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Completed
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" className={styles.btnIcon}>
                                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    Mark as Completed
                                </>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div >
    );
}
