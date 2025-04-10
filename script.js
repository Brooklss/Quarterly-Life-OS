class HabitTracker {
    constructor() {
        this.setInitialDate();
        this.initializeDOM();
        this.initializeState();
        this.createGrid();
        this.addEventListeners();
        this.loadData();
        this.setupModal();
        this.setupGoalsModal();
        this.setupTodosModal();
        this.setupWeeklyTodosModal();
        this.setupDarkModeToggle();
        this.moveExportButton();
    }

    setInitialDate() {
        const now = new Date();
        this.currentYear = now.getFullYear();
        // Calculate current quarter (1-4)
        this.currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    }

    initializeDOM() {
        this.datesColumn = document.querySelector('.dates-column');
        this.monthColumns = document.querySelector('.month-columns');
        this.yearInput = document.getElementById('year');
        this.quarterInput = document.getElementById('quarter');
        this.habitsList = document.querySelector('.habits-list');
        this.addHabitBtn = document.getElementById('addHabitBtn');
        this.yearDisplay = document.getElementById('yearDisplay');
        this.quarterDisplay = document.getElementById('quarterDisplay');
        this.goalsList = document.querySelector('.goals-list');
        this.addGoalBtn = document.getElementById('addGoalBtn');
        this.todosList = document.querySelector('.todos-list');
        this.addTodoBtn = document.getElementById('addTodoBtn');
        this.weeklyTodosList = document.querySelector('.weekly-todos-list');
        this.addWeeklyTodoBtn = document.getElementById('addWeeklyTodoBtn');
        this.streaksList = document.querySelector('.streaks-list');
        this.journalsList = document.querySelector('.journals-list');
        this.addJournalBtn = document.getElementById('addJournalBtn');
        this.prevJournalBtn = document.getElementById('prevJournalBtn');
        this.nextJournalBtn = document.getElementById('nextJournalBtn');
        this.mainContent = document.querySelector('.main-content');
        
        // Set initial display values
        this.yearDisplay.textContent = this.currentYear;
        this.quarterDisplay.textContent = this.currentQuarter;
    }

    initializeState() {
        this.habits = this.loadHabitsFromStorage();
        this.habitData = this.loadFromLocalStorage();
        this.goals = this.loadGoalsFromStorage();
        this.todos = this.loadTodosFromStorage();
        this.weeklyTodos = this.loadWeeklyTodosFromStorage();
        this.journals = this.loadJournalsFromStorage();
        this.currentJournalIndex = 0;
        this.checkWeeklyTodos();
    }

    getStorageKey() {
        return `habitTracker_${this.currentYear}_Q${this.currentQuarter}`;
    }

    getHabitsStorageKey() {
        return `habits_${this.currentYear}_Q${this.currentQuarter}`;
    }

    getGoalsStorageKey() {
        return `goals_${this.currentYear}_Q${this.currentQuarter}`;
    }

    getTodosStorageKey() {
        // Store todos with just the date
        return `todos_${new Date().toISOString().split('T')[0]}`;
    }

    getWeeklyTodosStorageKey() {
        return 'weekly_todos';
    }

    getJournalsStorageKey() {
        return 'weekly_journals';
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem(this.getStorageKey());
        return data ? JSON.parse(data) : {};
    }

    saveToLocalStorage() {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.habitData));
    }

    setupModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal" id="habitModal">
                <div class="modal-content">
                    <h3 id="habitModalTitle">Add New Habit</h3>
                    <div class="form-group">
                        <label for="habitName">Habit Name:</label>
                        <input type="text" id="habitName" required>
                    </div>
                    <div class="form-group">
                        <label for="habitColor">Habit Color:</label>
                        <input type="color" id="habitColor" value="#2196F3">
                    </div>
                    <div class="modal-buttons">
                        <button class="modal-btn cancel" id="cancelHabit">Cancel</button>
                        <button class="modal-btn save" id="saveHabit">Save</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.modal = document.getElementById('habitModal');
        this.habitModalTitle = document.getElementById('habitModalTitle');
        this.habitNameInput = document.getElementById('habitName');
        this.habitColorInput = document.getElementById('habitColor');
        
        // Modal event listeners
        document.getElementById('cancelHabit').addEventListener('click', () => this.closeModal());
        document.getElementById('saveHabit').addEventListener('click', () => this.saveHabit());
    }

    openModal(editMode = false, habitId = null) {
        this.modal.classList.add('active');
        this.habitNameInput.focus();
        if (editMode) {
            const habit = this.habits.find(h => h.id === habitId);
            if (habit) {
                this.habitModalTitle.textContent = 'Edit Habit';
                this.habitNameInput.value = habit.name;
                this.habitColorInput.value = habit.color;
                this.currentEditingHabitId = habitId;
            }
        } else {
            this.habitModalTitle.textContent = 'Add New Habit';
            this.habitNameInput.value = '';
            this.habitColorInput.value = '#2196F3';
            this.currentEditingHabitId = null;
        }
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.habitNameInput.value = '';
        this.habitColorInput.value = '#2196F3';
        this.currentEditingHabitId = null;
    }

    saveHabit() {
        const name = this.habitNameInput.value.trim();
        const color = this.habitColorInput.value;
        if (!name) return;

        if (this.currentEditingHabitId) {
            const habit = this.habits.find(h => h.id === this.currentEditingHabitId);
            if (habit) {
                habit.name = name;
                habit.color = color;
            }
        } else {
            const habit = {
                id: Date.now(),
                name: name,
                color: color,
                quarter: this.currentQuarter,
                year: this.currentYear,
                streak: 0 // Initialize streak count
            };
            this.habits.push(habit);
        }

        this.saveHabitsToStorage();
        this.renderHabits();
        this.createGrid();
        this.closeModal();
    }

    deleteHabit(habitId) {
        this.openConfirmationModal('Do you really want to delete this habit?', () => {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.saveHabitsToStorage();
            const updatedHabitData = {};
            for (let key in this.habitData) {
                if (!key.includes(`-${habitId}`)) {
                    updatedHabitData[key] = this.habitData[key];
                }
            }
            this.habitData = updatedHabitData;
            this.saveToLocalStorage();
            this.renderHabits();
            this.createGrid();
        });
    }

    renderStreaks() {
        this.streaksList.innerHTML = this.habits.map(habit => `
            <div class="streak-item">
                <span class="streak-name">${habit.name}</span>
                <div class="streak-loader">
                    <div class="streak-fill" style="width: ${Math.min(habit.streak / 93 * 100, 100)}%; background-color: ${habit.color};"></div>
                </div>
            </div>
        `).join('');
    }

    renderHabits() {
        this.habitsList.innerHTML = this.habits.map(habit => `
            <div class="habit-item" onclick="habitTracker.openModal(true, ${habit.id})">
                <div class="color-preview" style="background-color: ${habit.color}"></div>
                <span class="habit-name">${habit.name}</span>
                <span class="streak-count">Streak: ${habit.streak}</span>
                <button class="delete-habit-btn" onclick="event.stopPropagation(); habitTracker.deleteHabit(${habit.id})">Delete</button>
            </div>
        `).join('');

        // Hide tracker container if no habits exist
        const trackerContainer = document.querySelector('.tracker-container');
        trackerContainer.style.display = this.habits.length > 0 ? 'block' : 'none';

        this.renderStreaks();
    }

    saveHabitsToStorage() {
        localStorage.setItem(this.getHabitsStorageKey(), JSON.stringify(this.habits));
    }

    loadHabitsFromStorage() {
        return JSON.parse(localStorage.getItem(this.getHabitsStorageKey())) || [];
    }

    toggleHabitCell(habitCell, cellId, habit) {
        habitCell.classList.toggle('checked');
        this.habitData[cellId] = habitCell.classList.contains('checked');
        this.saveToLocalStorage();

        // Update streak count
        if (habitCell.classList.contains('checked')) {
            habit.streak++;
        } else {
            habit.streak--;
        }
        this.saveHabitsToStorage();
        this.renderHabits();
    }

    createGrid() {
        this.datesColumn.innerHTML = '';
        this.monthColumns.innerHTML = '';

        // Create dates column (1-31)
        for (let i = 1; i <= 31; i++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            dateCell.textContent = i.toString().padStart(2, '0');
            this.datesColumn.appendChild(dateCell);
        }

        // Get month names based on quarter
        const startMonth = (this.currentQuarter - 1) * 3;
        const months = [
            new Date(this.currentYear, startMonth).toLocaleString('default', { month: 'long' }),
            new Date(this.currentYear, startMonth + 1).toLocaleString('default', { month: 'long' }),
            new Date(this.currentYear, startMonth + 2).toLocaleString('default', { month: 'long' })
        ];

        // Get today's date
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();

        // Create month columns
        months.forEach((month, monthIndex) => {
            const monthColumn = document.createElement('div');
            monthColumn.className = 'month-column';

            // Add month header
            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-header';
            monthHeader.textContent = month;
            monthColumn.appendChild(monthHeader);

            // Create habit color indicators
            const habitHeaderRow = document.createElement('div');
            habitHeaderRow.className = 'habit-header-row';
            this.habits.forEach(habit => {
                const habitHeader = document.createElement('div');
                habitHeader.className = 'habit-header';
                habitHeader.style.setProperty('--habit-color', habit.color);
                habitHeaderRow.appendChild(habitHeader);
            });
            monthColumn.appendChild(habitHeaderRow);

            // Get the number of days in the current month
            const daysInMonth = new Date(this.currentYear, startMonth + monthIndex + 1, 0).getDate();

            // Create days grid
            for (let day = 1; day <= 31; day++) {
                const dayRow = document.createElement('div');
                dayRow.className = 'day-row';
                
                this.habits.forEach(habit => {
                    const habitCell = document.createElement('div');
                    habitCell.className = 'habit-cell';
                    habitCell.style.setProperty('--habit-color', habit.color);
                    
                    const cellId = `${monthIndex + 1}-${day}-${habit.id}`;
                    
                    if (this.habitData[cellId]) {
                        habitCell.classList.add('checked');
                    }

                    // Highlight today's cell
                    if (day === todayDate && (startMonth + monthIndex) === todayMonth) {
                        habitCell.classList.add('today');
                    }

                    // Disable cells for days that do not exist in the current month
                    if (day > daysInMonth) {
                        habitCell.classList.add('disabled');
                    } else {
                        habitCell.addEventListener('click', () => {
                            this.toggleHabitCell(habitCell, cellId, habit);
                        });
                    }
                    
                    dayRow.appendChild(habitCell);
                });
                
                monthColumn.appendChild(dayRow);
            }

            this.monthColumns.appendChild(monthColumn);
        });
    }

    loadData() {
        this.habits = this.loadHabitsFromStorage();
        this.habitData = this.loadFromLocalStorage();
        this.goals = this.loadGoalsFromStorage();
        this.todos = this.loadTodosFromStorage();
        this.weeklyTodos = this.loadWeeklyTodosFromStorage();
        this.journals = this.loadJournalsFromStorage();
        this.renderHabits();
        this.createGrid();
        this.renderGoals();
        this.renderTodos();
        this.renderWeeklyTodos();
        this.renderJournals();
        this.checkWeeklyTodos();
        this.checkRepeatingTodos();
        this.checkRepeatingWeeklyTodos();
    }

    addEventListeners() {
        // Add year button listeners
        document.querySelector('.decrease-year').addEventListener('click', () => {
            if (this.currentYear > 2000) {
                this.currentYear--;
                this.yearDisplay.textContent = this.currentYear;
                this.loadData();
            }
        });

        document.querySelector('.increase-year').addEventListener('click', () => {
            if (this.currentYear < 2100) {
                this.currentYear++;
                this.yearDisplay.textContent = this.currentYear;
                this.loadData();
            }
        });

        // Update quarter button listeners
        document.querySelector('.decrease-quarter').addEventListener('click', () => {
            if (this.currentQuarter > 1) {
                this.currentQuarter--;
                this.quarterDisplay.textContent = this.currentQuarter;
                this.loadData();
            }
        });

        document.querySelector('.increase-quarter').addEventListener('click', () => {
            if (this.currentQuarter < 4) {
                this.currentQuarter++;
                this.quarterDisplay.textContent = this.currentQuarter;
                this.loadData();
            }
        });

        this.addHabitBtn.addEventListener('click', () => this.openModal());
        this.addGoalBtn.addEventListener('click', () => this.openGoalModal());
        this.addTodoBtn.addEventListener('click', () => this.openTodoModal());
        this.addWeeklyTodoBtn.addEventListener('click', () => this.openWeeklyTodoModal());
        this.addJournalBtn.addEventListener('click', () => this.openJournalModal());
        this.prevJournalBtn.addEventListener('click', () => this.showPreviousJournal());
        this.nextJournalBtn.addEventListener('click', () => this.showNextJournal());
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importDataInput').addEventListener('change', (event) => this.importData(event));
    }

    setupGoalsModal() {
        const modalHTML = `
            <div class="modal" id="goalModal">
                <div class="modal-content">
                    <h3 id="goalModalTitle">Add Quarter Goal</h3>
                    <div class="form-group">
                        <label for="goalText">Goal:</label>
                        <input type="text" id="goalText" required>
                    </div>
                    <div class="form-group">
                        <label for="goalSystem">System:</label>
                        <textarea id="goalSystem" rows="10" required></textarea> <!-- Increase rows -->
                    </div>
                    <div class="modal-buttons">
                        <button class="modal-btn cancel" id="cancelGoal">Cancel</button>
                        <button class="modal-btn save" id="saveGoal">Save</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.goalModal = document.getElementById('goalModal');
        this.goalModalTitle = document.getElementById('goalModalTitle');
        this.goalTextInput = document.getElementById('goalText');
        this.goalSystemInput = document.getElementById('goalSystem');
        
        document.getElementById('cancelGoal').addEventListener('click', () => this.closeGoalModal());
        document.getElementById('saveGoal').addEventListener('click', () => this.saveGoal());
    }

    openGoalModal(editMode = false, goalId = null) {
        this.goalModal.classList.add('active');
        this.goalTextInput.focus();
        if (editMode) {
            const goal = this.goals.find(g => g.id === goalId);
            if (goal) {
                this.goalModalTitle.textContent = 'Edit Quarter Goal';
                this.goalTextInput.value = goal.text;
                this.goalSystemInput.value = goal.system;
                this.currentEditingGoalId = goalId;
            }
        } else {
            this.goalModalTitle.textContent = 'Add Quarter Goal';
            this.goalTextInput.value = '';
            this.goalSystemInput.value = '';
            this.currentEditingGoalId = null;
        }
    }

    closeGoalModal() {
        this.goalModal.classList.remove('active');
        this.goalTextInput.value = '';
        this.goalSystemInput.value = '';
        this.currentEditingGoalId = null;
    }

    saveGoal() {
        const text = this.goalTextInput.value.trim();
        const system = this.goalSystemInput.value.trim();
        if (!text || !system) return;

        if (this.currentEditingGoalId) {
            const goal = this.goals.find(g => g.id === this.currentEditingGoalId);
            if (goal) {
                goal.text = text;
                goal.system = system;
                goal.date = new Date().toISOString().split('T')[0];
            }
        } else {
            const goal = {
                id: Date.now(),
                text: text,
                system: system,
                completed: false,
                quarter: this.currentQuarter,
                year: this.currentYear
            };
            this.goals.push(goal);
        }

        this.saveGoalsToStorage();
        this.renderGoals();
        this.closeGoalModal();
    }

    toggleGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            this.saveGoalsToStorage();
            this.renderGoals();
        }
    }

    deleteGoal(goalId) {
        this.openConfirmationModal('Do you really want to delete this goal?', () => {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoalsToStorage();
            this.renderGoals();
        });
    }

    renderGoals() {
        this.goalsList.innerHTML = this.goals.map(goal => `
            <div class="goal-item" onclick="habitTracker.openGoalModal(true, ${goal.id})">
                <div class="goal-checkbox ${goal.completed ? 'checked' : ''}" 
                     onclick="event.stopPropagation(); habitTracker.toggleGoal(${goal.id})"></div>
                <span class="goal-text">${goal.text}</span>
                <button class="delete-goal-btn" onclick="event.stopPropagation(); habitTracker.deleteGoal(${goal.id})">Delete</button>
            </div>
        `).join('');
    }

    saveGoalsToStorage() {
        localStorage.setItem(this.getGoalsStorageKey(), JSON.stringify(this.goals));
    }

    loadGoalsFromStorage() {
        return JSON.parse(localStorage.getItem(this.getGoalsStorageKey())) || [];
    }

    setupTodosModal() {
        const modalHTML = `
            <div class="modal" id="todoModal">
                <div class="modal-content">
                    <h3 id="todoModalTitle">Add Daily Task</h3>
                    <div class="form-group">
                        <label for="todoText">Task:</label>
                        <input type="text" id="todoText" required>
                    </div>
                    <div class="form-group">
                        <label for="todoRepeat">Repeat:</label>
                        <select id="todoRepeat">
                            <option value="none">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="custom">Custom Days</option>
                        </select>
                    </div>
                    <div class="form-group" id="customDaysContainer" style="display: none;">
                        <label>Select Days:</label>
                        <div class="days-selector">
                            <input type="checkbox" id="day-sun" value="0">
                            <label for="day-sun">Sun</label>
                            <input type="checkbox" id="day-mon" value="1">
                            <label for="day-mon">Mon</label>
                            <input type="checkbox" id="day-tue" value="2">
                            <label for="day-tue">Tue</label>
                            <input type="checkbox" id="day-wed" value="3">
                            <label for="day-wed">Wed</label>
                            <input type="checkbox" id="day-thu" value="4">
                            <label for="day-thu">Thu</label>
                            <input type="checkbox" id="day-fri" value="5">
                            <label for="day-fri">Fri</label>
                            <input type="checkbox" id="day-sat" value="6">
                            <label for="day-sat">Sat</label>
                        </div>
                    </div>
                    <div class="modal-buttons">
                        <button class="modal-btn cancel" id="cancelTodo">Cancel</button>
                        <button class="modal-btn save" id="saveTodo">Save</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.todoModal = document.getElementById('todoModal');
        this.todoModalTitle = document.getElementById('todoModalTitle');
        this.todoTextInput = document.getElementById('todoText');
        this.todoRepeatInput = document.getElementById('todoRepeat');
        this.customDaysContainer = document.getElementById('customDaysContainer');
        this.customDaysCheckboxes = this.customDaysContainer.querySelectorAll('input[type="checkbox"]');

        this.todoRepeatInput.addEventListener('change', () => {
            this.customDaysContainer.style.display = this.todoRepeatInput.value === 'custom' ? 'block' : 'none';
        });

        document.getElementById('cancelTodo').addEventListener('click', () => this.closeTodoModal());
        document.getElementById('saveTodo').addEventListener('click', () => this.saveTodo());
    }

    openTodoModal(editMode = false, todoId = null) {
        this.todoModal.classList.add('active');
        this.todoTextInput.focus();
        if (editMode) {
            const todo = this.todos.find(t => t.id === todoId);
            if (todo) {
                this.todoModalTitle.textContent = 'Edit Daily Task';
                this.todoTextInput.value = todo.text;
                this.todoRepeatInput.value = todo.repeat || 'none';
                this.customDaysCheckboxes.forEach(checkbox => {
                    checkbox.checked = todo.customDays?.includes(parseInt(checkbox.value)) || false;
                });
                this.customDaysContainer.style.display = todo.repeat === 'custom' ? 'block' : 'none';
                this.currentEditingTodoId = todoId;
            }
        } else {
            this.todoModalTitle.textContent = 'Add Daily Task';
            this.todoTextInput.value = '';
            this.todoRepeatInput.value = 'none';
            this.customDaysCheckboxes.forEach(checkbox => (checkbox.checked = false));
            this.customDaysContainer.style.display = 'none';
            this.currentEditingTodoId = null;
        }
    }

    closeTodoModal() {
        this.todoModal.classList.remove('active');
        this.todoTextInput.value = '';
        this.todoRepeatInput.value = 'none';
        this.currentEditingTodoId = null;
    }

    saveTodo() {
        const text = this.todoTextInput.value.trim();
        const repeat = this.todoRepeatInput.value;
        const customDays = Array.from(this.customDaysCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => parseInt(checkbox.value));
        if (!text) return;

        if (this.currentEditingTodoId) {
            const todo = this.todos.find(t => t.id === this.currentEditingTodoId);
            if (todo) {
                todo.text = text;
                todo.repeat = repeat;
                todo.customDays = repeat === 'custom' ? customDays : [];
            }
        } else {
            const todo = {
                id: Date.now(),
                text: text,
                completed: false,
                date: new Date().toISOString().split('T')[0],
                repeat: repeat,
                customDays: repeat === 'custom' ? customDays : []
            };
            this.todos.push(todo);
        }

        this.saveTodosToStorage();
        this.renderTodos();
        this.closeTodoModal();
    }

    toggleTodo(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodosToStorage();
            this.renderTodos();
        }
    }

    deleteTodo(todoId) {
        this.openConfirmationModal('Do you really want to delete this task?', () => {
            const todo = this.todos.find(t => t.id === todoId);
            if (todo) {
                this.todos = this.todos.filter(t => t.id !== todoId);
                this.saveTodosToStorage();
                this.renderTodos();
                this.weeklyTodos = this.weeklyTodos.filter(t => t.text !== todo.text);
                this.saveWeeklyTodosToStorage();
                this.renderWeeklyTodos();
            }
        });
    }

    renderTodos() {
        // Only show today's todos
        const today = new Date().toISOString().split('T')[0];
        const todaysTodos = this.todos.filter(todo => todo.date === today);
        
        this.todosList.innerHTML = todaysTodos.map(todo => `
            <div class="todo-item" onclick="habitTracker.openTodoModal(true, ${todo.id})">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="event.stopPropagation(); habitTracker.toggleTodo(${todo.id})"></div>
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                <button class="delete-todo-btn" onclick="event.stopPropagation(); habitTracker.deleteTodo(${todo.id})">Delete</button>
            </div>
        `).join('');
    }

    saveTodosToStorage() {
        localStorage.setItem(this.getTodosStorageKey(), JSON.stringify(this.todos));
    }

    loadTodosFromStorage() {
        return JSON.parse(localStorage.getItem(this.getTodosStorageKey())) || [];
    }

    checkRepeatingTodos() {
        const today = new Date();
        const todayDay = today.getDay();
        const todayDate = today.toISOString().split('T')[0];

        this.todos.forEach(todo => {
            if (todo.repeat === 'daily' && todo.date !== todayDate) {
                const newTodo = { ...todo, id: Date.now(), completed: false, date: todayDate };
                this.todos.push(newTodo);
            } else if (todo.repeat === 'weekly') {
                const todoDate = new Date(todo.date);
                const diffDays = Math.floor((today - todoDate) / (1000 * 60 * 60 * 24));
                if (diffDays >= 7) {
                    const newTodo = { ...todo, id: Date.now(), completed: false, date: todayDate };
                    this.todos.push(newTodo);
                }
            } else if (todo.repeat === 'custom' && todo.customDays.includes(todayDay) && todo.date !== todayDate) {
                const newTodo = { ...todo, id: Date.now(), completed: false, date: todayDate };
                this.todos.push(newTodo);
            }
        });

        this.saveTodosToStorage();
        this.renderTodos();
    }

    setupWeeklyTodosModal() {
        const modalHTML = `
            <div class="modal" id="weeklyTodoModal">
                <div class="modal-content">
                    <h3 id="weeklyTodoModalTitle">Add Weekly Task</h3>
                    <div class="form-group">
                        <label for="weeklyTodoText">Task:</label>
                        <input type="text" id="weeklyTodoText" required>
                    </div>
                    <div class="form-group date-input">
                        <label for="weeklyTodoDate">Due Date:</label>
                        <input type="date" id="weeklyTodoDate" required>
                    </div>
                    <div class="form-group">
                        <label for="weeklyTodoRepeat">Repeat:</label>
                        <select id="weeklyTodoRepeat">
                            <option value="none">None</option>
                            <option value="weekly">Weekly</option>
                            <option value="custom">Custom Days</option>
                        </select>
                    </div>
                    <div class="form-group" id="weeklyCustomDaysContainer" style="display: none;">
                        <label>Select Days:</label>
                        <div class="days-selector">
                            <label><input type="checkbox" value="0"> Sun</label>
                            <label><input type="checkbox" value="1"> Mon</label>
                            <label><input type="checkbox" value="2"> Tue</label>
                            <label><input type="checkbox" value="3"> Wed</label>
                            <label><input type="checkbox" value="4"> Thu</label>
                            <label><input type="checkbox" value="5"> Fri</label>
                            <label><input type="checkbox" value="6"> Sat</label>
                        </div>
                    </div>
                    <div class="modal-buttons">
                        <button class="modal-btn cancel" id="cancelWeeklyTodo">Cancel</button>
                        <button class="modal-btn save" id="saveWeeklyTodo">Save</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.weeklyTodoModal = document.getElementById('weeklyTodoModal');
        this.weeklyTodoModalTitle = document.getElementById('weeklyTodoModalTitle');
        this.weeklyTodoTextInput = document.getElementById('weeklyTodoText');
        this.weeklyTodoDateInput = document.getElementById('weeklyTodoDate');
        this.weeklyTodoRepeatInput = document.getElementById('weeklyTodoRepeat');
        this.weeklyCustomDaysContainer = document.getElementById('weeklyCustomDaysContainer');
        this.weeklyCustomDaysCheckboxes = this.weeklyCustomDaysContainer.querySelectorAll('input[type="checkbox"]');

        this.weeklyTodoRepeatInput.addEventListener('change', () => {
            this.weeklyCustomDaysContainer.style.display = this.weeklyTodoRepeatInput.value === 'custom' ? 'block' : 'none';
        });

        const today = new Date().toISOString().split('T')[0];
        this.weeklyTodoDateInput.min = today;

        document.getElementById('cancelWeeklyTodo').addEventListener('click', () => this.closeWeeklyTodoModal());
        document.getElementById('saveWeeklyTodo').addEventListener('click', () => this.saveWeeklyTodo());
    }

    openWeeklyTodoModal(editMode = false, todoId = null) {
        this.weeklyTodoModal.classList.add('active');
        this.weeklyTodoTextInput.focus();
        if (editMode) {
            const todo = this.weeklyTodos.find(t => t.id === todoId);
            if (todo) {
                this.weeklyTodoModalTitle.textContent = 'Edit Weekly Task';
                this.weeklyTodoTextInput.value = todo.text;
                this.weeklyTodoDateInput.value = todo.dueDate;
                this.weeklyTodoRepeatInput.value = todo.repeat || 'none';
                this.currentEditingWeeklyTodoId = todoId;
            }
        } else {
            this.weeklyTodoModalTitle.textContent = 'Add Weekly Task';
            this.weeklyTodoTextInput.value = '';
            this.weeklyTodoDateInput.value = new Date().toISOString().split('T')[0];
            this.weeklyTodoRepeatInput.value = 'none';
            this.currentEditingWeeklyTodoId = null;
        }
    }

    closeWeeklyTodoModal() {
        this.weeklyTodoModal.classList.remove('active');
        this.weeklyTodoTextInput.value = '';
        this.weeklyTodoDateInput.value = '';
        this.weeklyTodoRepeatInput.value = 'none';
        this.currentEditingWeeklyTodoId = null;
    }

    saveWeeklyTodo() {
        const text = this.weeklyTodoTextInput.value.trim();
        const date = this.weeklyTodoDateInput.value;
        const repeat = this.weeklyTodoRepeatInput.value;
        const customDays = Array.from(this.weeklyCustomDaysCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => parseInt(checkbox.value));
        if (!text || !date) return;

        if (this.currentEditingWeeklyTodoId) {
            const todo = this.weeklyTodos.find(t => t.id === this.currentEditingWeeklyTodoId);
            if (todo) {
                todo.text = text;
                todo.dueDate = date;
                todo.repeat = repeat;
                todo.customDays = repeat === 'custom' ? customDays : [];
            }
        } else {
            const todo = {
                id: Date.now(),
                text: text,
                dueDate: date,
                completed: false,
                repeat: repeat,
                customDays: repeat === 'custom' ? customDays : []
            };
            this.weeklyTodos.push(todo);
        }

        this.saveWeeklyTodosToStorage();
        this.renderWeeklyTodos();
        this.closeWeeklyTodoModal();
        this.checkWeeklyTodos();
    }

    deleteWeeklyTodo(todoId) {
        this.openConfirmationModal('Do you really want to delete this weekly task?', () => {
            this.weeklyTodos = this.weeklyTodos.filter(t => t.id !== todoId);
            this.saveWeeklyTodosToStorage();
            this.renderWeeklyTodos();
        });
    }

    renderWeeklyTodos() {
        // Sort by due date
        const sortedTodos = [...this.weeklyTodos].sort((a, b) => 
            new Date(a.dueDate) - new Date(b.dueDate)
        );
        
        this.weeklyTodosList.innerHTML = sortedTodos.map(todo => `
            <div class="weekly-todo-item" onclick="habitTracker.openWeeklyTodoModal(true, ${todo.id})">
                <div class="weekly-todo-content">
                    <span class="weekly-todo-text">${todo.text}</span>
                    <span class="weekly-todo-date">Due: ${new Date(todo.dueDate).toLocaleDateString()}</span>
                </div>
                <button class="delete-todo-btn" onclick="event.stopPropagation(); habitTracker.deleteWeeklyTodo(${todo.id})">Delete</button>
            </div>
        `).join('');
    }

    checkWeeklyTodos() {
        const today = new Date().toISOString().split('T')[0];
        const dueTodos = this.weeklyTodos.filter(todo => 
            todo.dueDate === today && !todo.completed
        );

        // Add due todos to daily list
        dueTodos.forEach(todo => {
            const dailyTodo = {
                id: Date.now() + Math.random(),
                text: todo.text,
                completed: false,
                date: today
            };
            this.todos.push(dailyTodo);
            
            // Mark weekly todo as completed
            todo.completed = true;
        });

        if (dueTodos.length > 0) {
            this.saveWeeklyTodosToStorage();
            this.saveTodosToStorage();
            this.renderTodos();
            this.renderWeeklyTodos();
        }
    }

    checkRepeatingWeeklyTodos() {
        const today = new Date();
        const todayDay = today.getDay();
        const todayDate = today.toISOString().split('T')[0];

        this.weeklyTodos.forEach(todo => {
            if (todo.repeat === 'weekly') {
                const todoDate = new Date(todo.dueDate);
                const diffDays = Math.floor((today - todoDate) / (1000 * 60 * 60 * 24));
                if (diffDays >= 7) {
                    const newTodo = { ...todo, id: Date.now(), completed: false, dueDate: todayDate };
                    this.weeklyTodos.push(newTodo);
                }
            } else if (todo.repeat === 'custom' && todo.customDays.includes(todayDay) && todo.dueDate !== todayDate) {
                const newTodo = { ...todo, id: Date.now(), completed: false, dueDate: todayDate };
                this.weeklyTodos.push(newTodo);
            }
        });

        this.saveWeeklyTodosToStorage();
        this.renderWeeklyTodos();
    }

    saveWeeklyTodosToStorage() {
        localStorage.setItem(this.getWeeklyTodosStorageKey(), JSON.stringify(this.weeklyTodos));
    }

    loadWeeklyTodosFromStorage() {
        return JSON.parse(localStorage.getItem(this.getWeeklyTodosStorageKey())) || [];
    }

    setupJournalModal() {
        const modalHTML = `
            <div class="modal" id="journalModal">
                <div class="modal-content">
                    <h3 id="journalModalTitle">Add Weekly Journal</h3>
                    <div class="form-group">
                        <label for="journalText">What Worked Well?</label>
                        <textarea id="journalWorkedWell" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="journalText">What Didn’t Work?</label>
                        <textarea id="journalDidntWork" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="journalText">What Needs Adjustment?</label>
                        <textarea id="journalNeedsAdjustment" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="journalText">How Do I Feel?</label>
                        <textarea id="journalFeel" rows="3" required></textarea>
                    </div>
                    <div class="modal-buttons">
                        <button class="modal-btn cancel" id="cancelJournal">Cancel</button>
                        <button class="modal-btn save" id="saveJournal">Save</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.journalModal = document.getElementById('journalModal');
        this.journalModalTitle = document.getElementById('journalModalTitle');
        this.journalWorkedWellInput = document.getElementById('journalWorkedWell');
        this.journalDidntWorkInput = document.getElementById('journalDidntWork');
        this.journalNeedsAdjustmentInput = document.getElementById('journalNeedsAdjustment');
        this.journalFeelInput = document.getElementById('journalFeel');
        
        document.getElementById('cancelJournal').addEventListener('click', () => this.closeJournalModal());
        document.getElementById('saveJournal').addEventListener('click', () => this.saveJournal());
    }

    openJournalModal(editMode = false, journalId = null) {
        this.journalModal.classList.add('active');
        this.journalWorkedWellInput.focus();
        if (editMode) {
            const journal = this.journals.find(j => j.id === journalId);
            if (journal) {
                this.journalModalTitle.textContent = 'Edit Weekly Journal';
                this.journalWorkedWellInput.value = journal.workedWell;
                this.journalDidntWorkInput.value = journal.didntWork;
                this.journalNeedsAdjustmentInput.value = journal.needsAdjustment;
                this.journalFeelInput.value = journal.feel;
                this.currentEditingJournalId = journalId;
            }
        } else {
            this.journalModalTitle.textContent = 'Add Weekly Journal';
            this.journalWorkedWellInput.value = '';
            this.journalDidntWorkInput.value = '';
            this.journalNeedsAdjustmentInput.value = '';
            this.journalFeelInput.value = '';
            this.currentEditingJournalId = null;
        }
    }

    closeJournalModal() {
        this.journalModal.classList.remove('active');
        this.journalWorkedWellInput.value = '';
        this.journalDidntWorkInput.value = '';
        this.journalNeedsAdjustmentInput.value = '';
        this.journalFeelInput.value = '';
        this.currentEditingJournalId = null;
    }

    saveJournal() {
        const workedWell = this.journalWorkedWellInput.value.trim();
        const didntWork = this.journalDidntWorkInput.value.trim();
        const needsAdjustment = this.journalNeedsAdjustmentInput.value.trim();
        const feel = this.journalFeelInput.value.trim();
        if (!workedWell || !didntWork || !needsAdjustment || !feel) return;

        if (this.currentEditingJournalId) {
            const journal = this.journals.find(j => j.id === this.currentEditingJournalId);
            if (journal) {
                journal.workedWell = workedWell;
                journal.didntWork = didntWork;
                journal.needsAdjustment = needsAdjustment;
                journal.feel = feel;
                journal.date = new Date().toISOString().split('T')[0];
            }
        } else {
            const journal = {
                id: Date.now(),
                workedWell: workedWell,
                didntWork: didntWork,
                needsAdjustment: needsAdjustment,
                feel: feel,
                date: new Date().toISOString().split('T')[0]
            };
            this.journals.push(journal);
        }

        this.saveJournalsToStorage();
        this.renderJournals();
        this.closeJournalModal();
    }

    deleteJournal(journalId) {
        this.openConfirmationModal('Do you really want to delete this journal?', () => {
            this.journals = this.journals.filter(j => j.id !== journalId);
            this.saveJournalsToStorage();
            this.renderJournals();
        });
    }

    renderJournals() {
        if (this.journals.length === 0) {
            this.journalsList.innerHTML = '<p>No journals available.</p>';
            return;
        }

        const journal = this.journals[this.currentJournalIndex];
        const icons = ['📓', '📝', '📒', '📓'];
        const iconIndex = this.currentJournalIndex % icons.length;

        this.journalsList.innerHTML = `
            <div class="journal-item" onclick="habitTracker.openJournalModal(true, ${journal.id})">
                <span class="journal-date">${new Date(journal.date).toLocaleDateString()}</span>
                <div class="journal-icon">${icons[iconIndex]}</div>
                <button class="delete-journal-btn" onclick="event.stopPropagation(); habitTracker.deleteJournal(${journal.id})">Delete</button>
            </div>
        `;

        // Update navigation button icons
        this.prevJournalBtn.textContent = this.currentJournalIndex > 0 ? '⬅️' : '🔒';
        this.nextJournalBtn.textContent = this.currentJournalIndex < this.journals.length - 1 ? '➡️' : '🔒';
    }

    showPreviousJournal() {
        if (this.currentJournalIndex > 0) {
            this.currentJournalIndex--;
            this.renderJournals();
        }
    }

    showNextJournal() {
        if (this.currentJournalIndex < this.journals.length - 1) {
            this.currentJournalIndex++;
            this.renderJournals();
        }
    }

    loadJournalsFromStorage() {
        return JSON.parse(localStorage.getItem(this.getJournalsStorageKey())) || [];
    }

    saveJournalsToStorage() {
        localStorage.setItem(this.getJournalsStorageKey(), JSON.stringify(this.journals));
    }

    setupDarkModeToggle() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
        }

        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
            localStorage.setItem('darkMode', isDarkMode);
            document.querySelectorAll('.container, .header-content, .time-selector, .tracker-grid, .date-cell, .habit-cell, .side-panel, .habits-section, .rewards-section, .goals-section, .todos-section, .weekly-todos-section, .journals-section, .streaks-section, .habits-list, .goals-list, .todos-list, .weekly-todos-list, .journals-list, .habit-item, .goal-item, .todo-item, .weekly-todo-item, .journal-item, .delete-habit-btn, .delete-goal-btn, .delete-todo-btn, .delete-journal-btn, .add-habit-btn, .add-goal-btn, .add-todo-btn, .add-weekly-todo-btn, .add-journal-btn, .modal-content, .form-group input, .form-group textarea, .modal-btn').forEach(el => {
                el.classList.toggle('dark-mode');
            });
        });
    }

    exportData() {
        const data = {
            habits: this.habits,
            habitData: this.habitData,
            goals: this.goals,
            todos: this.todos,
            weeklyTodos: this.weeklyTodos,
            journals: this.journals,
            currentYear: this.currentYear,
            currentQuarter: this.currentQuarter
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `habit_tracker_data_${this.currentYear}_Q${this.currentQuarter}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Update state with imported data
                this.habits = importedData.habits || [];
                this.habitData = importedData.habitData || {};
                this.goals = importedData.goals || [];
                this.todos = importedData.todos || [];
                this.weeklyTodos = importedData.weeklyTodos || [];
                this.journals = importedData.journals || [];
                this.currentYear = importedData.currentYear || this.currentYear;
                this.currentQuarter = importedData.currentQuarter || this.currentQuarter;

                // Save imported data to local storage
                this.saveHabitsToStorage();
                this.saveToLocalStorage();
                this.saveGoalsToStorage();
                this.saveTodosToStorage();
                this.saveWeeklyTodosToStorage();
                this.saveJournalsToStorage();

                // Reload the application state
                this.loadData();
                alert('Data imported successfully!');
            } catch (error) {
                alert('Failed to import data. Please ensure the file is a valid JSON.');
            }
        };
        reader.readAsText(file);
    }

    moveExportButton() {
        const exportButton = document.getElementById('exportDataBtn');
        this.mainContent.appendChild(exportButton);
    }

    setupConfirmationCard() {
        const confirmationHTML = `
            <div class="modal" id="confirmationModal">
                <div class="modal-content">
                    <h3>Are you sure?</h3>
                    <p id="confirmationMessage"></p>
                    <div class="modal-buttons">
                        <button class="modal-btn cancel" id="cancelDelete">Cancel</button>
                        <button class="modal-btn save" id="confirmDelete">Confirm</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);

        this.confirmationModal = document.getElementById('confirmationModal');
        this.confirmationMessage = document.getElementById('confirmationMessage');
        this.cancelDeleteBtn = document.getElementById('cancelDelete');
        this.confirmDeleteBtn = document.getElementById('confirmDelete');

        this.cancelDeleteBtn.addEventListener('click', () => this.closeConfirmationModal());
    }

    openConfirmationModal(message, onConfirm) {
        this.confirmationMessage.textContent = message;
        this.confirmationModal.classList.add('active');
        this.confirmDeleteBtn.onclick = () => {
            this.closeConfirmationModal();
            onConfirm();
        };
    }

    closeConfirmationModal() {
        this.confirmationModal.classList.remove('active');
    }
}

// Make habitTracker globally accessible for the delete button onclick handler
let habitTracker;
document.addEventListener('DOMContentLoaded', () => {
    habitTracker = new HabitTracker();
    habitTracker.setupJournalModal();
    habitTracker.setupGoalsModal();
    habitTracker.setupConfirmationCard(); // Initialize confirmation card
});