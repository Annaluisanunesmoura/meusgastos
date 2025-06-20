document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const expenseForm = document.getElementById('expense-form');
    const categoryInput = document.getElementById('category');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const editIdInput = document.getElementById('edit-id');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const expensesContainer = document.getElementById('expenses-container');
    const monthTotalElement = document.getElementById('month-total');
    const monthSalaryElement = document.getElementById('month-salary');
    const monthBalanceElement = document.getElementById('month-balance');
    const filterMonthSelect = document.getElementById('filter-month');
    const filterCategorySelect = document.getElementById('filter-category');
    const sortBySelect = document.getElementById('sort-by');
    const categoriesDatalist = document.getElementById('categories');
    const chartCanvas = document.getElementById('expensesChart');
    const chartOptions = document.querySelectorAll('.chart-option');

    // Dados
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let salaries = JSON.parse(localStorage.getItem('salaries')) || {};
    let currentChart = null;
    let chartType = 'pie';

    // Configuração inicial
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Evento para salvar despesa
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validação
        if (!categoryInput.value || !amountInput.value || !dateInput.value) {
            alert('Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (amount <= 0) {
            alert('O valor deve ser maior que zero!');
            return;
        }

        const expenseData = {
            id: editIdInput.value ? parseInt(editIdInput.value) : Date.now(),
            category: categoryInput.value.trim(),
            description: descriptionInput.value.trim(),
            amount: amount,
            date: dateInput.value
        };

        // Edição ou adição
        if (editIdInput.value) {
            expenses = expenses.filter(expense => expense.id !== parseInt(editIdInput.value));
        }
        expenses.push(expenseData);
        
        // Salvar e atualizar
        saveData();
        loadExpenses();
        resetForm();
    });

    // Funções auxiliares
    function saveData() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        localStorage.setItem('salaries', JSON.stringify(salaries));
    }

    function resetForm() {
        expenseForm.reset();
        dateInput.value = today;
        editIdInput.value = '';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Despesa';
        cancelEditBtn.style.display = 'none';
    }

    function loadExpenses() {
        const monthFilter = filterMonthSelect.value;
        const categoryFilter = filterCategorySelect.value;
        const sortBy = sortBySelect.value;

        // Filtrar
        let filteredExpenses = expenses.filter(expense => {
            const matchesMonth = monthFilter === 'all' || 
                `${new Date(expense.date).getFullYear()}-${String(new Date(expense.date).getMonth() + 1).padStart(2, '0')}` === monthFilter;
            
            const matchesCategory = categoryFilter === 'all' || 
                expense.category === categoryFilter;
            
            return matchesMonth && matchesCategory;
        });

        // Ordenar
        filteredExpenses = sortExpenses(filteredExpenses, sortBy);

        // Exibir
        displayExpenses(filteredExpenses);
        updateSummary(filteredExpenses);
        updateFilters();
        updateChart(filteredExpenses);
    }

    function sortExpenses(expenses, sortBy) {
        switch (sortBy) {
            case 'date-desc': return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'date-asc': return [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'amount-desc': return [...expenses].sort((a, b) => b.amount - a.amount);
            case 'amount-asc': return [...expenses].sort((a, b) => a.amount - b.amount);
            default: return expenses;
        }
    }

    function displayExpenses(expensesToDisplay) {
        expensesContainer.innerHTML = '';

        if (expensesToDisplay.length === 0) {
            expensesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>Nenhuma despesa encontrada</p>
                    <small>Tente alterar os filtros ou adicionar uma nova despesa</small>
                </div>
            `;
            return;
        }

        expensesToDisplay.forEach(expense => {
            const expenseElement = document.createElement('div');
            expenseElement.className = 'expense-item';
            expenseElement.innerHTML = `
                <div class="expense-date">${new Date(expense.date).toLocaleDateString('pt-BR')}</div>
                <div class="expense-category">${expense.category}</div>
                <div class="expense-description">${expense.description || '-'}</div>
                <div class="expense-amount">R$ ${expense.amount.toFixed(2)}</div>
                <div class="expense-actions">
                    <button onclick="editExpense(${expense.id})" class="action-btn edit-btn" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteExpense(${expense.id})" class="action-btn delete-btn" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            expensesContainer.appendChild(expenseElement);
        });
    }

    function updateSummary(expensesToAnalyze) {
        const selectedMonth = filterMonthSelect.value;
        
        // Total gasto
        const monthTotal = expensesToAnalyze.reduce((total, expense) => total + expense.amount, 0);
        monthTotalElement.textContent = `R$ ${monthTotal.toFixed(2)}`;
        
        // Salário
        let monthSalary = 0;
        if (selectedMonth !== 'all' && salaries[selectedMonth]) {
            monthSalary = salaries[selectedMonth].net || 0;
        }
        monthSalaryElement.textContent = `R$ ${monthSalary.toFixed(2)}`;
        
        // Saldo
        const monthBalance = monthSalary - monthTotal;
        monthBalanceElement.textContent = `R$ ${monthBalance.toFixed(2)}`;
    }

    function updateFilters() {
        // Meses disponíveis
        const months = new Set();
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        });

        // Atualizar selects
        updateMonthFilter(months);
        updateCategoryFilter();
    }

    function updateMonthFilter(months) {
        const sortedMonths = Array.from(months).sort().reverse();
        
        filterMonthSelect.innerHTML = '<option value="all">Todos os meses</option>';
        
        sortedMonths.forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthName = getMonthName(monthNum);
            
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `${monthName}/${year}`;
            filterMonthSelect.appendChild(option);
        });
    }

    function updateCategoryFilter() {
        const categories = new Set(expenses.map(expense => expense.category));
        
        filterCategorySelect.innerHTML = '<option value="all">Todas categorias</option>';
        categoriesDatalist.innerHTML = '';
        
        Array.from(categories).sort().forEach(category => {
            // Para filtro
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategorySelect.appendChild(option);
            
            // Para datalist
            const datalistOption = document.createElement('option');
            datalistOption.value = category;
            categoriesDatalist.appendChild(datalistOption);
        });
    }

    function getMonthName(monthNum) {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return months[parseInt(monthNum) - 1];
    }

    function updateChart(expensesToDisplay) {
        if (currentChart) {
            currentChart.destroy();
        }
        
        // Agrupar por categoria
        const categories = {};
        expensesToDisplay.forEach(expense => {
            categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
        });
        
        const ctx = chartCanvas.getContext('2d');
        const colors = [
            '#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#7209b7',
            '#560bad', '#480ca8', '#3a0ca3', '#3f37c9', '#4361ee'
        ];
        
        currentChart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: colors,
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: R$ ${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Event Listeners
    cancelEditBtn.addEventListener('click', resetForm);
    filterMonthSelect.addEventListener('change', loadExpenses);
    filterCategorySelect.addEventListener('change', loadExpenses);
    sortBySelect.addEventListener('change', loadExpenses);

    // Alternar tipo de gráfico
    chartOptions.forEach(option => {
        option.addEventListener('click', function() {
            chartOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            chartType = this.dataset.type;
            loadExpenses();
        });
    });

    // Editar salário (simplificado)
    document.querySelector('.income').addEventListener('click', function() {
        const selectedMonth = filterMonthSelect.value;
        if (selectedMonth === 'all') {
            alert('Selecione um mês específico para editar o salário');
            return;
        }
        
        const gross = prompt('Salário bruto (R$):', salaries[selectedMonth]?.gross || '');
        if (gross === null) return;
        
        const discounts = prompt('Descontos (R$):', salaries[selectedMonth]?.discounts || '0');
        
        const netValue = parseFloat(gross) - parseFloat(discounts || 0);
        
        salaries[selectedMonth] = {
            gross: parseFloat(gross),
            discounts: parseFloat(discounts || 0),
            net: netValue
        };
        
        saveData();
        loadExpenses();
    });

    // Carregar dados iniciais
    loadExpenses();
});

// Funções globais
function editExpense(id) {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const expenseToEdit = expenses.find(expense => expense.id === id);
    
    if (!expenseToEdit) return;

    document.getElementById('category').value = expenseToEdit.category;
    document.getElementById('description').value = expenseToEdit.description || '';
    document.getElementById('amount').value = expenseToEdit.amount;
    document.getElementById('date').value = expenseToEdit.date;
    document.getElementById('edit-id').value = expenseToEdit.id;
    
    document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Atualizar';
    document.getElementById('cancel-edit').style.display = 'inline-flex';
    
    document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
}

function deleteExpense(id) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    location.reload();
}
