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
    const topCategoryElement = document.getElementById('top-category');
    const monthSalaryElement = document.getElementById('month-salary');
    const monthBalanceElement = document.getElementById('month-balance');
    const filterMonthSelect = document.getElementById('filter-month');
    const filterCategorySelect = document.getElementById('filter-category');
    const categoriesDatalist = document.getElementById('categories');
    const editSalaryBtn = document.getElementById('edit-salary-btn');
    const salaryFormContainer = document.getElementById('salary-form-container');
    const salaryMonthSelect = document.getElementById('salary-month');
    const salaryAmountInput = document.getElementById('salary-amount');
    const salaryDiscountsInput = document.getElementById('salary-discounts');
    const salaryNetInput = document.getElementById('salary-net');
    const saveSalaryBtn = document.getElementById('save-salary-btn');
    const cancelSalaryBtn = document.getElementById('cancel-salary-btn');
    const chartTabs = document.querySelectorAll('.chart-tab');

    // Variáveis globais
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let salaries = JSON.parse(localStorage.getItem('salaries')) || {};
    let expensesChart = null;
    const today = new Date().toISOString().split('T')[0];

    // Configurações iniciais
    dateInput.value = today;

    // Event Listeners
    expenseForm.addEventListener('submit', handleExpenseSubmit);
    cancelEditBtn.addEventListener('click', resetForm);
    filterMonthSelect.addEventListener('change', loadExpenses);
    filterCategorySelect.addEventListener('change', loadExpenses);
    editSalaryBtn.addEventListener('click', showSalaryForm);
    cancelSalaryBtn.addEventListener('click', hideSalaryForm);
    saveSalaryBtn.addEventListener('click', saveSalary);
    salaryAmountInput.addEventListener('input', calculateNetSalary);
    salaryDiscountsInput.addEventListener('input', calculateNetSalary);
    chartTabs.forEach(tab => tab.addEventListener('click', switchChartType));

    // Inicialização
    loadExpenses();
    setupChartTabs();

    // Funções principais
    function handleExpenseSubmit(e) {
        e.preventDefault();
        
        if (!validateExpenseForm()) return;

        const expenseData = createExpenseData();
        saveExpense(expenseData);
        loadExpenses();
        resetForm();
    }

    function validateExpenseForm() {
        if (!categoryInput.value || !amountInput.value || !dateInput.value) {
            alert('Preencha todos os campos obrigatórios!');
            return false;
        }
        if (amountInput.value <= 0) {
            alert("O valor deve ser maior que zero!");
            return false;
        }
        return true;
    }

    function createExpenseData() {
        return {
            id: editIdInput.value ? parseInt(editIdInput.value) : Date.now(),
            category: categoryInput.value.trim(),
            description: descriptionInput.value.trim(),
            amount: parseFloat(amountInput.value),
            date: dateInput.value
        };
    }

    function saveExpense(expenseData) {
        if (editIdInput.value) {
            expenses = expenses.filter(expense => expense.id !== parseInt(editIdInput.value));
        }
        expenses.push(expenseData);
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    function resetForm() {
        expenseForm.reset();
        dateInput.value = today;
        editIdInput.value = '';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Despesa';
        cancelEditBtn.style.display = 'none';
    }

    function loadExpenses() {
        const filteredExpenses = getFilteredExpenses();
        displayExpenses(filteredExpenses);
        updateSummary(filteredExpenses);
        updateFilters();
        updateCharts(filteredExpenses);
    }

    function getFilteredExpenses() {
        const monthFilter = filterMonthSelect.value;
        const categoryFilter = filterCategorySelect.value;

        let filteredExpenses = [...expenses];

        if (monthFilter !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}` === monthFilter;
            });
        }

        if (categoryFilter !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => 
                expense.category === categoryFilter
            );
        }

        return filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function displayExpenses(expensesToDisplay) {
        expensesContainer.innerHTML = expensesToDisplay.length === 0 ? 
            '<p class="empty-message"><i class="fas fa-info-circle"></i> Nenhuma despesa encontrada.</p>' :
            expensesToDisplay.map(expense => createExpenseElement(expense)).join('');
    }

    function createExpenseElement(expense) {
        const formattedDate = new Date(expense.date).toLocaleDateString('pt-BR');
        return `
            <div class="expense-item">
                <div>${formattedDate}</div>
                <div>${expense.category}</div>
                <div>${expense.description || '-'}</div>
                <div>R$ ${expense.amount.toFixed(2)}</div>
                <div class="expense-actions">
                    <button onclick="editExpense(${expense.id})" class="action-btn edit-btn" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteExpense(${expense.id})" class="action-btn delete-btn" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function updateSummary(expensesToAnalyze) {
        const selectedMonth = filterMonthSelect.value;
        const monthTotal = expensesToAnalyze.reduce((total, expense) => total + expense.amount, 0);
        const monthSalary = selectedMonth !== 'all' && salaries[selectedMonth] ? salaries[selectedMonth].net : 0;
        const monthBalance = monthSalary - monthTotal;

        monthTotalElement.textContent = `R$ ${monthTotal.toFixed(2)}`;
        monthSalaryElement.textContent = `R$ ${monthSalary.toFixed(2)}`;
        monthBalanceElement.textContent = `R$ ${monthBalance.toFixed(2)}`;
        monthBalanceElement.style.color = monthBalance >= 0 ? 'var(--success-color)' : 'var(--danger-color)';

        updateTopCategory(expensesToAnalyze);
    }

    function updateTopCategory(expenses) {
        const categoryTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        let topCategory = '-';
        let maxAmount = 0;
        for (const category in categoryTotals) {
            if (categoryTotals[category] > maxAmount) {
                maxAmount = categoryTotals[category];
                topCategory = category;
            }
        }
        topCategoryElement.textContent = topCategory;
    }

    function updateFilters() {
        updateMonthFilter();
        updateCategoryFilter();
    }

    function updateMonthFilter() {
        const months = new Set([...expenses.map(expense => {
            const date = new Date(expense.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }), ...Object.keys(salaries)]);

        const sortedMonths = Array.from(months).sort().reverse();
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        filterMonthSelect.innerHTML = '<option value="all">Todos os meses</option>';
        salaryMonthSelect.innerHTML = '';

        sortedMonths.forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthName = monthNames[parseInt(monthNum) - 1];
            
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `${monthName}/${year}`;
            filterMonthSelect.appendChild(option.cloneNode(true));
            salaryMonthSelect.appendChild(option);
        });
    }

    function updateCategoryFilter() {
        const categories = new Set(expenses.map(expense => expense.category));
        filterCategorySelect.innerHTML = '<option value="all">Todas as Categorias</option>';
        categoriesDatalist.innerHTML = '';

        Array.from(categories).sort().forEach(category => {
            categoriesDatalist.appendChild(new Option(category));
            filterCategorySelect.appendChild(new Option(category, category));
        });
    }

    function showSalaryForm() {
        const selectedMonth = filterMonthSelect.value;
        if (selectedMonth !== 'all') {
            salaryMonthSelect.value = selectedMonth;
            if (salaries[selectedMonth]) {
                salaryAmountInput.value = salaries[selectedMonth].gross || '';
                salaryDiscountsInput.value = salaries[selectedMonth].discounts || '';
                salaryNetInput.value = salaries[selectedMonth].net || '';
            } else {
                salaryAmountInput.value = '';
                salaryDiscountsInput.value = '';
                salaryNetInput.value = '';
            }
        }
        salaryFormContainer.style.display = 'block';
    }

    function hideSalaryForm() {
        salaryFormContainer.style.display = 'none';
    }

    function calculateNetSalary() {
        const gross = parseFloat(salaryAmountInput.value) || 0;
        const discounts = parseFloat(salaryDiscountsInput.value) || 0;
        salaryNetInput.value = (gross - discounts).toFixed(2);
    }

    function saveSalary() {
        const month = salaryMonthSelect.value;
        const gross = parseFloat(salaryAmountInput.value) || 0;
        const discounts = parseFloat(salaryDiscountsInput.value) || 0;
        const net = parseFloat(salaryNetInput.value) || 0;
        
        if (!month || gross <= 0) {
            alert(month ? 'O valor bruto deve ser maior que zero!' : 'Selecione um mês!');
            return;
        }
        
        salaries[month] = { gross, discounts, net };
        localStorage.setItem('salaries', JSON.stringify(salaries));
        loadExpenses();
        hideSalaryForm();
    }

    function setupChartTabs() {
        chartTabs.forEach(tab => tab.addEventListener('click', switchChartType));
    }

    function switchChartType() {
        chartTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        updateCharts(getFilteredExpenses(), this.getAttribute('data-chart'));
    }

    function updateCharts(expensesToDisplay, chartType = 'pie') {
        const ctx = document.getElementById('expensesChart').getContext('2d');
        
        if (expensesChart) expensesChart.destroy();

        expensesChart = chartType === 'pie' ? 
            createPieChart(ctx, expensesToDisplay) : 
            createBarChart(ctx, expensesToDisplay);
    }

    function createPieChart(ctx, expenses) {
        const categories = {};
        expenses.forEach(expense => {
            categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
        });

        return new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: generateColors(Object.keys(categories).length),
                    borderWidth: 1
                }]
            },
            options: getPieChartOptions()
        });
    }

    function createBarChart(ctx, expenses) {
        const monthlyData = {};
        expenses.forEach(expense => {
            const monthYear = getMonthYearFromDate(expense.date);
            monthlyData[monthYear] = (monthlyData[monthYear] || 0) + expense.amount;
        });

        Object.keys(salaries).forEach(month => {
            if (!monthlyData[month]) monthlyData[month] = 0;
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(month => formatMonthLabel(month));
        const expensesData = sortedMonths.map(month => monthlyData[month]);
        const salaryData = sortedMonths.map(month => salaries[month]?.net || 0);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gastos',
                        data: expensesData,
                        backgroundColor: '#f72585',
                        borderColor: '#f72585',
                        borderWidth: 1
                    },
                    {
                        label: 'Salários',
                        data: salaryData,
                        backgroundColor: '#4cc9f0',
                        borderColor: '#4cc9f0',
                        borderWidth: 1,
                        type: 'line',
                        tension: 0.1
                    }
                ]
            },
            options: getBarChartOptions()
        });
    }

    function getMonthYearFromDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function formatMonthLabel(monthYear) {
        const [year, monthNum] = monthYear.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${monthNames[parseInt(monthNum) - 1]}/${year}`;
    }

    function generateColors(count) {
        const baseColors = ['#4361ee', '#3a0ca3', '#4895ef', '#4cc9f0', '#f72585', '#7209b7', '#b5179e', '#560bad', '#3f37c9'];
        return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
    }

    function getPieChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        };
    }

    function getBarChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Valor (R$)' }
                },
                x: {
                    title: { display: true, text: 'Mês' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        };
    }
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
    document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Atualizar Despesa';
    document.getElementById('cancel-edit').style.display = 'block';
    document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
}

function deleteExpense(id) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    location.reload();
}
// Variável global para o gráfico
let expensesChart = null;

// No final do DOMContentLoaded, adicione:
setupChartTabs();

// Função para configurar as abas dos gráficos
function setupChartTabs() {
    const tabs = document.querySelectorAll('.chart-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove a classe active de todas as abas
            tabs.forEach(t => t.classList.remove('active'));
            
            // Adiciona a classe active apenas na aba clicada
            this.classList.add('active');
            
            // Obtém o tipo de gráfico a ser exibido
            const chartType = this.getAttribute('data-chart');
            
            // Atualiza o gráfico
            updateCharts(getFilteredExpenses(), chartType);
        });
    });
}

// Função para atualizar os gráficos
function updateCharts(expensesToDisplay, chartType = 'pie') {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    
    // Destrói o gráfico anterior se existir
    if (expensesChart) {
        expensesChart.destroy();
    }

    // Cria o novo gráfico baseado no tipo selecionado
    if (chartType === 'pie') {
        createPieChart(ctx, expensesToDisplay);
    } else {
        createBarChart(ctx, expensesToDisplay);
    }
}

// Função para criar gráfico de pizza
function createPieChart(ctx, expenses) {
    // Agrupa gastos por categoria
    const categories = {};
    expenses.forEach(expense => {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    expensesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#4361ee', '#3a0ca3', '#4895ef', '#4cc9f0', '#f72585',
                    '#7209b7', '#b5179e', '#560bad', '#3f37c9'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Função para criar gráfico de barras
function createBarChart(ctx, expenses) {
    // Agrupa por mês
    const monthlyData = {};
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + expense.amount;
    });

    // Ordena os meses
    const sortedMonths = Object.keys(monthlyData).sort();
    
    // Prepara os rótulos (labels) formatados
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${monthNames[parseInt(monthNum) - 1]}/${year}`;
    });

    // Prepara os dados para o gráfico
    const data = sortedMonths.map(month => monthlyData[month]);

    expensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos Mensais',
                data: data,
                backgroundColor: '#4361ee',
                borderColor: '#3a0ca3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mês'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Modifique a função loadExpenses() para incluir:
function loadExpenses() {
    const filteredExpenses = getFilteredExpenses();
    displayExpenses(filteredExpenses);
    updateSummary(filteredExpenses);
    updateFilters();
    
    // Obtém o tipo de gráfico ativo
    const activeTab = document.querySelector('.chart-tab.active');
    const chartType = activeTab ? activeTab.getAttribute('data-chart') : 'pie';
    
    // Atualiza o gráfico
    updateCharts(filteredExpenses, chartType);
}
