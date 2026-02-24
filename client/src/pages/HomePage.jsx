import { useState, useEffect } from 'react';
import { getTasks } from '../services/taskService';
import styles from './HomePage.module.css';

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomePage() {
    const [stats, setStats] = useState({ total: 0, completed: 0, upcoming: 0, today: 0 });

    useEffect(() => {
        getTasks()
            .then(res => {
                const tasks = res.data || [];
                const today = todayStr();
                setStats({
                    total: tasks.length,
                    completed: tasks.filter(t => t.status === 'Done').length,
                    upcoming: tasks.filter(t => t.status !== 'Done').length,
                    today: tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === today).length,
                });
            })
            .catch(() => { }); // fail silently — stats stay 0
    }, []);

    const STATS = [
        { value: stats.total, label: 'Total' },
        { value: stats.upcoming, label: 'Upcoming' },
        { value: stats.completed, label: 'Completed' },
    ];

    return (
        <section className={styles.content}>

            {/* ── Section title ── */}
            <h2 className={styles.sectionTitle}>Task Overview</h2>

            {/* ── Overview card ── */}
            <div className={styles.card}>

                {/* 3-column stats grid */}
                <div className={styles.statsRow}>
                    {STATS.map(({ value, label }) => (
                        <div key={label} className={styles.statItem}>
                            <span className={styles.statNumber}>{value}</span>
                            <span className={styles.statLabel}>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Blue highlight bar */}
                <div className={styles.highlightBar}>
                    <span className={styles.barIcon} aria-hidden="true">🎯</span>
                    <p className={styles.barText}>
                        You have <strong>{stats.today}</strong> task{stats.today !== 1 ? 's' : ''} today
                    </p>
                </div>

            </div>
        </section>
    );
}
