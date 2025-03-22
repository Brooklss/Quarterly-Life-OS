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
                    <h3>Add New Habit</h3>
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
        this.habitNameInput = document.getElementById('habitName');
        this.habitColorInput = document.getElementById('habitColor');
        
        // Modal event listeners
        document.getElementById('cancelHabit').addEventListener('click', () => this.closeModal());
        document.getElementById('saveHabit').addEventListener('click', () => this.saveHabit());
    }

    openModal() {
        this.modal.classList.add('active');
        this.habitNameInput.focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.habitNameInput.value = '';
    }

    saveHabit() {
        const name = this.habitNameInput.value.trim();
        if (!name) return;

        const habit = {
            id: Date.now(),
            name: name,
            color: this.habitColorInput.value,
            quarter: this.currentQuarter,
            year: this.currentYear
        };

        this.habits.push(habit);
        this.saveHabitsToStorage();
        this.renderHabits();
        this.createGrid();
        this.closeModal();
    }

    deleteHabit(habitId) {
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
    }

    renderHabits() {
        this.habitsList.innerHTML = this.habits.map(habit => `
            <div class="habit-item">
                <div class="color-preview" style="background-color: ${habit.color}"></div>
                <span class="habit-name">${habit.name}</span>
                <button class="delete-habit-btn" onclick="habitTracker.deleteHabit(${habit.id})">Delete</button>
            </div>
        `).join('');
    }

    saveHabitsToStorage() {
        localStorage.setItem(this.getHabitsStorageKey(), JSON.stringify(this.habits));
    }

    loadHabitsFromStorage() {
        return JSON.parse(localStorage.getItem(this.getHabitsStorageKey())) || [];
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
                // Remove the text content, just show color
                habitHeaderRow.appendChild(habitHeader);
            });
            monthColumn.appendChild(habitHeaderRow);

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

                    habitCell.addEventListener('click', () => {
                        habitCell.classList.toggle('checked');
                        this.habitData[cellId] = habitCell.classList.contains('checked');
                        this.saveToLocalStorage();
                    });
                    
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
        this.renderHabits();
        this.createGrid();
        this.renderGoals();
        this.renderTodos();
        this.renderWeeklyTodos();
        this.checkWeeklyTodos();
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
    }

    setupGoalsModal() {
        const modalHTML = `
            <div class="modal" id="goalModal">
                <div class="modal-content">
                    <h3>Add Quarter Goal</h3>
                    <div class="form-group">
                        <label for="goalText">Goal:</label>
                        <input type="text" id="goalText" required>
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
        this.goalTextInput = document.getElementById('goalText');
        
        document.getElementById('cancelGoal').addEventListener('click', () => this.closeGoalModal());
        document.getElementById('saveGoal').addEventListener('click', () => this.saveGoal());
    }

    openGoalModal() {
        this.goalModal.classList.add('active');
        this.goalTextInput.focus();
    }

    closeGoalModal() {
        this.goalModal.classList.remove('active');
        this.goalTextInput.value = '';
    }

    saveGoal() {
        const text = this.goalTextInput.value.trim();
        if (!text) return;

        const goal = {
            id: Date.now(),
            text: text,
            completed: false,
            quarter: this.currentQuarter,
            year: this.currentYear
        };

        this.goals.push(goal);
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
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.saveGoalsToStorage();
        this.renderGoals();
    }

    renderGoals() {
        this.goalsList.innerHTML = this.goals.map(goal => `
            <div class="goal-item">
                <div class="goal-checkbox ${goal.completed ? 'checked' : ''}" 
                     onclick="habitTracker.toggleGoal(${goal.id})"></div>
                <span class="goal-text">${goal.text}</span>
                <button class="delete-goal-btn" onclick="habitTracker.deleteGoal(${goal.id})">Delete</button>
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
                    <h3>Add Daily Task</h3>
                    <div class="form-group">
                        <label for="todoText">Task:</label>
                        <input type="text" id="todoText" required>
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
        this.todoTextInput = document.getElementById('todoText');
        
        document.getElementById('cancelTodo').addEventListener('click', () => this.closeTodoModal());
        document.getElementById('saveTodo').addEventListener('click', () => this.saveTodo());
    }

    openTodoModal() {
        this.todoModal.classList.add('active');
        this.todoTextInput.focus();
    }

    closeTodoModal() {
        this.todoModal.classList.remove('active');
        this.todoTextInput.value = '';
    }

    saveTodo() {
        const text = this.todoTextInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            date: new Date().toISOString().split('T')[0]
        };

        this.todos.push(todo);
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
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            // Remove from daily todos
            this.todos = this.todos.filter(t => t.id !== todoId);
            this.saveTodosToStorage();
            this.renderTodos();

            // Remove from weekly todos if it exists
            this.weeklyTodos = this.weeklyTodos.filter(t => t.text !== todo.text);
            this.saveWeeklyTodosToStorage();
            this.renderWeeklyTodos();
        }
    }

    renderTodos() {
        // Only show today's todos
        const today = new Date().toISOString().split('T')[0];
        const todaysTodos = this.todos.filter(todo => todo.date === today);
        
        this.todosList.innerHTML = todaysTodos.map(todo => `
            <div class="todo-item">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="habitTracker.toggleTodo(${todo.id})"></div>
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                <button class="delete-todo-btn" onclick="habitTracker.deleteTodo(${todo.id})">Delete</button>
            </div>
        `).join('');
    }

    saveTodosToStorage() {
        localStorage.setItem(this.getTodosStorageKey(), JSON.stringify(this.todos));
    }

    loadTodosFromStorage() {
        return JSON.parse(localStorage.getItem(this.getTodosStorageKey())) || [];
    }

    setupWeeklyTodosModal() {
        const modalHTML = `
            <div class="modal" id="weeklyTodoModal">
                <div class="modal-content">
                    <h3>Add Weekly Task</h3>
                    <div class="form-group">
                        <label for="weeklyTodoText">Task:</label>
                        <input type="text" id="weeklyTodoText" required>
                    </div>
                    <div class="form-group date-input">
                        <label for="weeklyTodoDate">Due Date:</label>
                        <input type="date" id="weeklyTodoDate" required>
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
        this.weeklyTodoTextInput = document.getElementById('weeklyTodoText');
        this.weeklyTodoDateInput = document.getElementById('weeklyTodoDate');
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        this.weeklyTodoDateInput.min = today;
        
        document.getElementById('cancelWeeklyTodo').addEventListener('click', () => this.closeWeeklyTodoModal());
        document.getElementById('saveWeeklyTodo').addEventListener('click', () => this.saveWeeklyTodo());
    }

    openWeeklyTodoModal() {
        this.weeklyTodoModal.classList.add('active');
        this.weeklyTodoTextInput.focus();
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        this.weeklyTodoDateInput.value = today;
    }

    closeWeeklyTodoModal() {
        this.weeklyTodoModal.classList.remove('active');
        this.weeklyTodoTextInput.value = '';
        this.weeklyTodoDateInput.value = '';
    }

    saveWeeklyTodo() {
        const text = this.weeklyTodoTextInput.value.trim();
        const date = this.weeklyTodoDateInput.value;
        if (!text || !date) return;

        const todo = {
            id: Date.now(),
            text: text,
            dueDate: date,
            completed: false
        };

        this.weeklyTodos.push(todo);
        this.saveWeeklyTodosToStorage();
        this.renderWeeklyTodos();
        this.closeWeeklyTodoModal();
        this.checkWeeklyTodos();
    }

    deleteWeeklyTodo(todoId) {
        this.weeklyTodos = this.weeklyTodos.filter(t => t.id !== todoId);
        this.saveWeeklyTodosToStorage();
        this.renderWeeklyTodos();
    }

    renderWeeklyTodos() {
        // Sort by due date
        const sortedTodos = [...this.weeklyTodos].sort((a, b) => 
            new Date(a.dueDate) - new Date(b.dueDate)
        );
        
        this.weeklyTodosList.innerHTML = sortedTodos.map(todo => `
            <div class="weekly-todo-item">
                <div class="weekly-todo-content">
                    <span class="weekly-todo-text">${todo.text}</span>
                    <span class="weekly-todo-date">Due: ${new Date(todo.dueDate).toLocaleDateString()}</span>
                </div>
                <button class="delete-todo-btn" onclick="habitTracker.deleteWeeklyTodo(${todo.id})">Delete</button>
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

    saveWeeklyTodosToStorage() {
        localStorage.setItem(this.getWeeklyTodosStorageKey(), JSON.stringify(this.weeklyTodos));
    }

    loadWeeklyTodosFromStorage() {
        return JSON.parse(localStorage.getItem(this.getWeeklyTodosStorageKey())) || [];
    }
}

// Make habitTracker globally accessible for the delete button onclick handler
let habitTracker;
document.addEventListener('DOMContentLoaded', () => {
    habitTracker = new HabitTracker();
});