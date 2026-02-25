import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { LogOut, Plus, CheckCircle, Circle, Download, Clock, Edit2, Trash2, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, isToday, isBefore, parseISO } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('works');

    // Forms state
    const [workDate, setWorkDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [workDesc, setWorkDesc] = useState('');
    const [editingWorkId, setEditingWorkId] = useState(null);

    const [todoDate, setTodoDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [todoTime, setTodoTime] = useState(format(new Date(), 'HH:mm'));
    const [todoReason, setTodoReason] = useState('');
    const [editingTodoId, setEditingTodoId] = useState(null);

    // Calendar state
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Pagination state
    const [currentPageWorks, setCurrentPageWorks] = useState(1);
    const [currentPageTodos, setCurrentPageTodos] = useState(1);
    const itemsPerPage = 8;

    // Data state
    const [works, setWorks] = useState([]);
    const [todos, setTodos] = useState([]);

    // Filter state
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Alerts state
    const [alertMsg, setAlertMsg] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        if (!currentUser) return;

        // Fetch Works
        const qWorks = query(
            collection(db, 'works'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc')
        );

        const unsubWorks = onSnapshot(qWorks, (snapshot) => {
            let worksArr = [];
            snapshot.forEach((doc) => worksArr.push({ ...doc.data(), id: doc.id }));
            setWorks(worksArr);
        }, (error) => {
            console.error("Error fetching works: ", error);
            showAlert("Failed to load works. Pls check permissions or indexes.");
        });

        // Fetch Todos
        const qTodos = query(
            collection(db, 'todos'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'asc'),
            orderBy('time', 'asc')
        );

        const unsubTodos = onSnapshot(qTodos, (snapshot) => {
            let todosArr = [];
            snapshot.forEach((doc) => todosArr.push({ ...doc.data(), id: doc.id }));

            // Re-sort array to push completed items to the bottom
            todosArr.sort((a, b) => {
                if (a.completed === b.completed) return 0;
                return a.completed ? 1 : -1;
            });

            setTodos(todosArr);
        }, (error) => {
            console.error("Error fetching todos: ", error);
        });

        return () => {
            unsubWorks();
            unsubTodos();
        };
    }, [currentUser]);

    // Removed alert checking interval as per request

    const showAlert = (msg) => {
        setAlertMsg(msg);
    };

    const showConfirm = (title, message, onConfirm) => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm });
    };

    const handleConfirm = () => {
        if (confirmDialog.onConfirm) confirmDialog.onConfirm();
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
    };

    const handleCancelConfirm = () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
    };

    async function handleLogout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Failed to log out', error);
        }
    }

    async function addWork(e) {
        e.preventDefault();
        if (!workDesc || !workDate) return;

        // Constraint: Only allow one work entry per date
        const existingEntry = works.some(w => w.date === workDate);
        if (existingEntry) {
            setAlertMsg(`A work entry for ${format(parseISO(workDate), 'dd.MM.yyyy')} already exists! Please edit the existing entry instead.`);
            return;
        }

        try {
            await addDoc(collection(db, 'works'), {
                userId: currentUser.uid,
                date: workDate,
                description: workDesc,
                createdAt: new Date().toISOString()
            });
            setWorkDesc('');
        } catch (err) {
            alert("Error adding work: " + err.message);
        }
    }

    async function addTodo(e) {
        e.preventDefault();
        if (!todoReason || !todoDate || !todoTime) return;

        try {
            await addDoc(collection(db, 'todos'), {
                userId: currentUser.uid,
                date: todoDate,
                time: todoTime,
                reason: todoReason,
                completed: false,
                alerted: false,
                createdAt: new Date().toISOString()
            });
            setTodoReason('');
        } catch (err) {
            alert("Error adding todo: " + err.message);
        }
    }

    async function toggleTodo(id, currentStatus) {
        try {
            await updateDoc(doc(db, 'todos', id), {
                completed: !currentStatus
            });
        } catch (error) {
            console.error('Error updating todo', error);
        }
    }

    function deleteWork(id) {
        showConfirm("Delete Work", "Are you sure you want to delete this work entry?", async () => {
            try {
                await deleteDoc(doc(db, 'works', id));
            } catch (err) {
                showAlert("Error deleting work: " + err.message);
            }
        });
    }

    function startEditWork(work) {
        setEditingWorkId(work.id);
        setWorkDate(work.date);
        setWorkDesc(work.description);
    }

    async function saveEditWork(e) {
        e.preventDefault();
        if (!editingWorkId) return;

        try {
            await updateDoc(doc(db, 'works', editingWorkId), {
                date: workDate,
                description: workDesc
            });
            setEditingWorkId(null);
            setWorkDate(format(new Date(), 'yyyy-MM-dd'));
            setWorkDesc('');
        } catch (err) {
            alert("Error updating work: " + err.message);
        }
    }

    function cancelEditWork() {
        setEditingWorkId(null);
        setWorkDate(format(new Date(), 'yyyy-MM-dd'));
        setWorkDesc('');
    }

    function deleteTodo(id) {
        showConfirm("Delete Todo", "Are you sure you want to delete this todo?", async () => {
            try {
                await deleteDoc(doc(db, 'todos', id));
            } catch (err) {
                showAlert("Error deleting todo: " + err.message);
            }
        });
    }

    function startEditTodo(todo) {
        setEditingTodoId(todo.id);
        setTodoDate(todo.date);
        setTodoTime(todo.time);
        setTodoReason(todo.reason);
    }

    async function saveEditTodo(e) {
        e.preventDefault();
        if (!editingTodoId) return;

        try {
            await updateDoc(doc(db, 'todos', editingTodoId), {
                date: todoDate,
                time: todoTime,
                reason: todoReason
            });
            setEditingTodoId(null);
            setTodoDate(format(new Date(), 'yyyy-MM-dd'));
            setTodoTime(format(new Date(), 'HH:mm'));
            setTodoReason('');
        } catch (err) {
            alert("Error updating todo: " + err.message);
        }
    }

    function cancelEditTodo() {
        setEditingTodoId(null);
        setTodoDate(format(new Date(), 'yyyy-MM-dd'));
        setTodoTime(format(new Date(), 'HH:mm'));
        setTodoReason('');
    }


    function downloadPDF() {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.text("Daily Work Report", 14, 20);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);

        const tableData = filteredWorks.map((work, index) => [
            index + 1,
            format(parseISO(work.date), 'dd.MM.yyyy'),
            work.description
        ]);

        autoTable(doc, {
            startY: 35,
            head: [['#', 'Date', 'Task / Description']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] }
        });

        doc.save(`Work_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    }

    function downloadExcel() {
        if (filteredWorks.length === 0) {
            showAlert("No data available to export.");
            return;
        }

        const dataToExport = filteredWorks.map((work, index) => ({
            'S.No': index + 1,
            'Date': format(parseISO(work.date), 'dd.MM.yyyy'),
            'Task Description': work.description
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DailyWorks");
        XLSX.writeFile(workbook, `Work_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    }

    const filteredWorks = works.filter(w => {
        return w.date >= startDate && w.date <= endDate;
    });

    const worksForSelectedDate = works.filter(w => w.date === format(selectedDate, 'yyyy-MM-dd'));
    const todosForSelectedDate = todos.filter(t => t.date === format(selectedDate, 'yyyy-MM-dd'));

    // Overview Stats
    const totalWorks = works.length;
    const totalTodos = todos.length;

    // Get this month works count instead of today
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthWorksCount = works.filter(w => {
        const d = parseISO(w.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const pendingTodosCount = todos.filter(t => !t.completed).length;

    const indexOfLastWork = currentPageWorks * itemsPerPage;
    const indexOfFirstWork = indexOfLastWork - itemsPerPage;
    const currentWorks = filteredWorks.slice(indexOfFirstWork, indexOfLastWork);
    const totalWorkPages = Math.ceil(filteredWorks.length / itemsPerPage);

    const indexOfLastTodo = currentPageTodos * itemsPerPage;
    const indexOfFirstTodo = indexOfLastTodo - itemsPerPage;
    const currentTodos = todos.slice(indexOfFirstTodo, indexOfLastTodo);
    const totalTodoPages = Math.ceil(todos.length / itemsPerPage);

    return (
        <div className="dashboard-layout">
            {/* Alert Modal */}
            {alertMsg && (
                <div className="alert-overlay">
                    <div className="alert-box glass-card">
                        <h3>Notification</h3>
                        <p>{alertMsg}</p>
                        <button className="btn btn-primary" onClick={() => setAlertMsg('')}>Acknowledge</button>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmDialog.isOpen && (
                <div className="alert-overlay">
                    <div className="alert-box glass-card">
                        <h3>{confirmDialog.title}</h3>
                        <p>{confirmDialog.message}</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
                            <button className="btn btn-danger" onClick={handleConfirm}>Yes, Delete</button>
                            <button className="btn btn-secondary" onClick={handleCancelConfirm}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navbar Header (UserInfo) */}
            <div className="top-header">
                <div className="user-profile">
                    <img src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&rounded=true" alt="User" className="avatar" />
                    <div className="user-info">
                        <span className="welcome-text">Welcome</span>
                        <span className="user-name">{currentUser.email.split('@')[0]}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={handleLogout} className="btn-icon">
                        <LogOut size={22} />
                    </button>
                </div>
            </div>

            <main className="main-content">
                <div className="content-pane mobile-scrollable">
                    {activeTab === 'works' && (
                        <div className="tab-overview">
                            <div className="section-header">
                                <h1 className="main-title">Overview</h1>
                            </div>

                            <div className="overview-cards">
                                <div className="stat-card" style={{ background: '#E0E7FF' }}> {/* Light Indigo */}
                                    <div className="stat-value">{thisMonthWorksCount}</div>
                                    <div className="stat-label">This Month's Works <span className="arrow">›</span></div>
                                </div>
                                <div className="stat-card" style={{ background: '#FFEDD5' }}> {/* Light Orange */}
                                    <div className="stat-value">{pendingTodosCount}</div>
                                    <div className="stat-label">Pending Todos <span className="arrow">›</span></div>
                                </div>
                                <div className="stat-card" style={{ background: '#DBEAFE' }}> {/* Light Blue */}
                                    <div className="stat-value">{totalWorks}</div>
                                    <div className="stat-label">Total Works <span className="arrow">›</span></div>
                                </div>
                                <div className="stat-card" style={{ background: '#DCFCE7' }}> {/* Light Green */}
                                    <div className="stat-value">{totalTodos}</div>
                                    <div className="stat-label">Total Todos <span className="arrow">›</span></div>
                                </div>
                            </div>

                            <div className="section-header" style={{ marginTop: '2rem' }}>
                                <h1 className="main-title">Projects & Works</h1>
                            </div>

                            <div className="pill-tabs">
                                <button className="pill active">My Project ({totalWorks})</button>
                            </div>

                            <h2 className="section-title mt-4">{editingWorkId ? "Edit Work Log" : "Log Work"}</h2>
                            <form onSubmit={editingWorkId ? saveEditWork : addWork} className="entry-form shadow-card">
                                <input
                                    type="date"
                                    className="input-field shrink-input"
                                    value={workDate}
                                    onChange={e => setWorkDate(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    className="input-field expand-input"
                                    placeholder="What did you work on today?"
                                    value={workDesc}
                                    onChange={e => setWorkDesc(e.target.value)}
                                    required
                                />
                                {editingWorkId ? (
                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary"><Edit2 size={18} /> Update</button>
                                        <button type="button" onClick={cancelEditWork} className="btn btn-secondary">Cancel</button>
                                    </div>
                                ) : (
                                    <button type="submit" className="btn btn-primary btn-round"><Plus size={20} /></button>
                                )}
                            </form>

                            <hr className="divider" />

                            <div className="works-header" style={{ marginTop: '2.5rem' }}>
                                <h2 className="section-title">Work History</h2>
                                <div className="filter-group">
                                    <input
                                        type="date"
                                        className="input-field small-input"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                    <span>to</span>
                                    <input
                                        type="date"
                                        className="input-field small-input"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate(format(new Date(), 'yyyy-MM-dd'));
                                        }}
                                        title="Show All Works"
                                    >
                                        All Works
                                    </button>
                                    <div className="export-buttons">
                                        <button onClick={downloadPDF} className="btn btn-primary btn-sm btn-icon-text">
                                            <Download size={16} /> PDF
                                        </button>
                                        <button onClick={downloadExcel} className="btn btn-success btn-sm btn-icon-text">
                                            <Download size={16} /> Excel
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th width="15%">Date</th>
                                            <th width="70%">Task Description</th>
                                            <th width="15%">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentWorks.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center empty-state">No work logged for this period.</td></tr>
                                        ) : (
                                            currentWorks.map(work => (
                                                <tr key={work.id}>
                                                    <td>{format(parseISO(work.date), 'dd.MM.yyyy')}</td>
                                                    <td>{work.description}</td>
                                                    <td className="actions-cell">
                                                        <button onClick={() => startEditWork(work)} className="action-btn text-primary" title="Edit">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => deleteWork(work.id)} className="action-btn text-danger" title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Work Pagination */}
                            {totalWorkPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={currentPageWorks === 1}
                                        onClick={() => setCurrentPageWorks(prev => Math.max(prev - 1, 1))}
                                    >Prev</button>
                                    <span className="page-info">Page {currentPageWorks} of {totalWorkPages}</span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={currentPageWorks === totalWorkPages}
                                        onClick={() => setCurrentPageWorks(prev => Math.min(prev + 1, totalWorkPages))}
                                    >Next</button>
                                </div>
                            )}

                        </div>
                    )}

                    {activeTab === 'calendar' && (
                        <div className="tab-calendar">
                            <div className="calendar-header">
                                <h2 className="current-date-title">{format(selectedDate, 'dd MMM, yy eeee')}</h2>
                            </div>

                            <div className="calendar-wrapper shadow-card">
                                <Calendar
                                    onChange={setSelectedDate}
                                    value={selectedDate}
                                    className="custom-calendar"
                                />
                            </div>

                            <div className="section-header mt-4">
                                <h2 className="main-title">Tasks for {format(selectedDate, 'MMM dd')}</h2>
                                <button className="btn-primary btn-round small-round" onClick={() => setActiveTab('todos')}>
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="daily-tasks-list">
                                {worksForSelectedDate.length === 0 && todosForSelectedDate.length === 0 ? (
                                    <div className="empty-state">No tasks or works scheduled for this day.</div>
                                ) : (
                                    <>
                                        {worksForSelectedDate.map(work => (
                                            <div className="task-row shadow-card" key={`w-${work.id}`}>
                                                <div className="task-icon type-work"><Briefcase size={18} /></div>
                                                <div className="task-details">
                                                    <div className="task-type-label">Work Logged</div>
                                                    <div className="task-desc">{work.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {todosForSelectedDate.map(todo => (
                                            <div className="task-row shadow-card" key={`t-${todo.id}`}>
                                                <div className={`task-icon ${todo.completed ? 'type-done' : 'type-todo'}`}>
                                                    {todo.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                                                </div>
                                                <div className="task-details">
                                                    <div className="task-type-label">Todo {todo.time}</div>
                                                    <div className={`task-desc ${todo.completed ? 'completed-text' : ''}`}>{todo.reason}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'todos' && (
                        <div className="tab-todos">
                            <h2 className="section-title">{editingTodoId ? "Edit Todo" : "Schedule Todo Alert"}</h2>
                            <form onSubmit={editingTodoId ? saveEditTodo : addTodo} className="entry-form shadow-card">
                                <input
                                    type="date"
                                    className="input-field shrink-input"
                                    value={todoDate}
                                    onChange={e => setTodoDate(e.target.value)}
                                    required
                                />
                                <input
                                    type="time"
                                    className="input-field shrink-input"
                                    value={todoTime}
                                    onChange={e => setTodoTime(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    className="input-field expand-input"
                                    placeholder="Task Reason / Alert Message"
                                    value={todoReason}
                                    onChange={e => setTodoReason(e.target.value)}
                                    required
                                />
                                {editingTodoId ? (
                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary"><Edit2 size={18} /> Update</button>
                                        <button type="button" onClick={cancelEditTodo} className="btn btn-secondary">Cancel</button>
                                    </div>
                                ) : (
                                    <button type="submit" className="btn btn-primary btn-round"><Plus size={20} /></button>
                                )}
                            </form>

                            <hr className="divider" />

                            <h2 className="section-title">Upcoming Todos</h2>
                            <div className="todo-list">
                                {currentTodos.length === 0 ? (
                                    <div className="text-center empty-state">No active todos.</div>
                                ) : (
                                    currentTodos.map(todo => (
                                        <div className={`todo-item glass-card ${todo.completed ? 'completed' : ''}`} key={todo.id}>
                                            <button className="todo-check" onClick={() => toggleTodo(todo.id, todo.completed)}>
                                                {todo.completed ? <CheckCircle className="text-success" /> : <Circle />}
                                            </button>
                                            <div className="todo-content">
                                                <div className="todo-title">{todo.reason}</div>
                                                <div className="todo-meta">
                                                    {todo.date ? format(parseISO(todo.date), 'dd/MM/yyyy') : ''} at {todo.time}
                                                </div>
                                            </div>

                                            <div className="todo-actions">
                                                <div className={`todo-status ${todo.completed ? 'status-done' : 'status-pend'}`}>
                                                    {todo.completed ? 'Completed' : 'Pending'}
                                                </div>
                                                <button onClick={() => startEditTodo(todo)} className="action-btn text-primary" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteTodo(todo.id)} className="action-btn text-danger" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Todo Pagination */}
                            {totalTodoPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={currentPageTodos === 1}
                                        onClick={() => setCurrentPageTodos(prev => Math.max(prev - 1, 1))}
                                    >Prev</button>
                                    <span className="page-info">Page {currentPageTodos} of {totalTodoPages}</span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        disabled={currentPageTodos === totalTodoPages}
                                        onClick={() => setCurrentPageTodos(prev => Math.min(prev + 1, totalTodoPages))}
                                    >Next</button>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <div
                    className={`nav-item ${activeTab === 'works' ? 'active' : ''}`}
                    onClick={() => setActiveTab('works')}
                >
                    <Briefcase size={22} />
                </div>
                <div
                    className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calendar')}
                >
                    <CalendarIcon size={22} />
                </div>
                <div
                    className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('todos')}
                >
                    <CheckCircle size={22} />
                </div>
            </div>

        </div>
    );
}
