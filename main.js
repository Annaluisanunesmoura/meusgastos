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
    const filterAmountSelect = document.getElementById('filter-amount');
    const customAmountGroup = document.getElementById('custom-amount-group');
    const customAmountInput = document.getElementById('custom-amount');
    const categoriesDatalist = document.getElementById('categories');
    const editSalaryBtn = document.getElementById('edit-salary-btn');
    const salaryFormContainer = document.getElementById('salary-form-container');
    const salaryMonthSelect = document.getElementById('salary-month');
    const salaryAmountInput = document.getElementById('salary-amount');
    const salaryDiscountsInput = document.getElementById('salary-discounts');
    const salaryNetInput = document.getElementById('salary-net');
    const saveSalaryBtn = document.getElementById('save-salary-btn');
    const cancelSalaryBtn = document.getElementById('cancel-salary-btn');
    const budgetCategorySelect = document.getElementById('budget-category');
    const budgetAmountInput = document.getElementById('budget-amount');
    const setBudgetBtn = document.getElementById('set-budget-btn');
    const budgetAlertsContainer = document.getElementById('budget-alerts');
    const sortBySelect = document.getElementById('sort-by');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const exportBtn = document.getElementById('export-btn');
    const printBtn = document.getElementById('print-btn');
    const chartCanvas = document.getElementById('expensesChart');
    const chartTypeBtns = document.querySelectorAll('.chart-type-btn');

    // Carrega despesas, salários e orçamentos do localStorage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let salaries = JSON.parse(localStorage.getItem('salaries')) || {};
    let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
    let currentChart = null;
    let chartType = 'pie';

    // Configura data padrão
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Inicializa o tema
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton();

    // Evento para alternar tema
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Evento para adicionar/editar despesa
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validação
        if (!categoryInput.value || !amountInput.value || !dateInput.value) {
            showAlert('Preencha todos os campos obrigatórios!', 'error');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (amount <= 0) {
            showAlert('O valor deve ser maior que zero!', 'error');
            return;
        }

        const expenseData = {
            id: editIdInput.value ? parseInt(editIdInput.value) : Date.now(),
            category: categoryInput.value.trim(),
            description: descriptionInput.value.trim(),
            amount: amount,
            date: dateInput.value
        };

        // Se estiver editando, remove a despesa antiga
        if (editIdInput.value) {
            expenses = expenses.filter(expense => expense.id !== parseInt(editIdInput.value));
        }

        // Adiciona ao array
        expenses.push(expenseData);
        
        // Salva no localStorage
        saveData();
        
        // Atualiza a interface
        loadExpenses();
        
        // Limpa o formulário
        resetForm();

        showAlert('Despesa salva com sucesso!', 'success');
    });

    // Função para mostrar alertas
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Função para salvar todos os dados
    function saveData() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        localStorage.setItem('salaries', JSON.stringify(salaries));
        localStorage.setItem('budgets', JSON.stringify(budgets));
    }

    // Função para cancelar edição
    cancelEditBtn.addEventListener('click', resetForm);

    // Função para resetar o formulário
    function resetForm() {
        expenseForm.reset();
        dateInput.value = today;
        editIdInput.value = '';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Despesa';
        cancelEditBtn.style.display = 'none';
    }

    // Função para carregar e exibir despesas
    function loadExpenses() {
        const monthFilter = filterMonthSelect.value;
        const categoryFilter = filterCategorySelect.value;
        const amountFilter = filterAmountSelect.value;
        const customAmount = customAmountInput.value;
        const sortBy = sortBySelect.value;

        let filteredExpenses = [...expenses];

        // Filtra por mês
        if (monthFilter !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}` === monthFilter;
            });
        }

        // Filtra por categoria
        if (categoryFilter !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => 
                expense.category === categoryFilter
            );
        }

        // Filtra por valor
        if (amountFilter !== 'all') {
            let minAmount = 0;
            if (amountFilter === 'custom') {
                minAmount = parseFloat(customAmount) || 0;
            } else {
                minAmount = parseFloat(amountFilter);
            }
            
            filteredExpenses = filteredExpenses.filter(expense => 
                expense.amount >= minAmount
            );
        }

        // Ordena
        filteredExpenses = sortExpenses(filteredExpenses, sortBy);

        // Exibe os gastos
        displayExpenses(filteredExpenses);
        updateSummary(filteredExpenses);
        updateFilters();
        updateCharts(filteredExpenses);
        checkBudgets(filteredExpenses);
    }

    // Função para ordenar despesas
    function sortExpenses(expenses, sortBy) {
        switch (sortBy) {
            case 'date-desc':
                return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'date-asc':
                return expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'amount-desc':
                return expenses.sort((a, b) => b.amount - a.amount);
            case 'amount-asc':
                return expenses.sort((a, b) => a.amount - b.amount);
            case 'category':
                return expenses.sort((a, b) => a.category.localeCompare(b.category));
            default:
                return expenses;
        }
    }

    // Exibe as despesas na tabela
    function displayExpenses(expensesToDisplay) {
        expensesContainer.innerHTML = '';

        if (expensesToDisplay.length === 0) {
            expensesContainer.innerHTML = `
                <p class="empty-message">
                    <i class="fas fa-info-circle"></i> Nenhuma despesa encontrada.
                </p>
            `;
            return;
        }

        expensesToDisplay.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const formattedDate = expenseDate.toLocaleDateString('pt-BR');

            const expenseElement = document.createElement('div');
            expenseElement.className = 'expense-item';
            expenseElement.innerHTML = `
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
            `;
            expensesContainer.appendChild(expenseElement);
        });
    }

    // Atualiza o resumo financeiro
    function updateSummary(expensesToAnalyze) {
        // Obtém o mês selecionado
        const selectedMonth = filterMonthSelect.value;
        
        // Total do mês
        const monthTotal = expensesToAnalyze.reduce((total, expense) => 
            total + expense.amount, 0
        );
        monthTotalElement.textContent = formatMoney(monthTotal);
        
        // Salário do mês
        let monthSalary = 0;
        if (selectedMonth !== 'all' && salaries[selectedMonth]) {
            monthSalary = salaries[selectedMonth].net || 0;
        }
        monthSalaryElement.textContent = formatMoney(monthSalary);
        
        // Saldo do mês
        const monthBalance = monthSalary - monthTotal;
        monthBalanceElement.textContent = formatMoney(monthBalance);
        monthBalanceElement.style.color = monthBalance >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        
        // Categoria mais gasta
        const categoryTotals = {};
        expensesToAnalyze.forEach(expense => {
            categoryTotals[expense.category] = 
                (categoryTotals[expense.category] || 0) + expense.amount;
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

    // Formata valores monetários
    function formatMoney(value) {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    // Atualiza os filtros
    function updateFilters() {
        // Filtro de meses
        const months = new Set();
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(month);
        });

        // Adiciona meses que têm salário mas não têm despesas
        Object.keys(salaries).forEach(month => {
            months.add(month);
        });

        const sortedMonths = Array.from(months).sort().reverse();
        filterMonthSelect.innerHTML = '<option value="all">Todos os meses</option>';
        salaryMonthSelect.innerHTML = '';
        budgetCategorySelect.innerHTML = '<option value="">Selecione</option>';

        sortedMonths.forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            const monthName = monthNames[parseInt(monthNum) - 1];
            const monthYear = `${monthName}/${year}`;
            
            // Para o filtro de mês
            const option = document.createElement('option');
            option.value = month;
            option.textContent = monthYear;
            filterMonthSelect.appendChild(option);
            
            // Para o select de salário
            const salaryOption = document.createElement('option');
            salaryOption.value = month;
            salaryOption.textContent = monthYear;
            salaryMonthSelect.appendChild(salaryOption);
        });

        // Filtro de categorias
        const categories = new Set(expenses.map(expense => expense.category));
        filterCategorySelect.innerHTML = '<option value="all">Todas as Categorias</option>';
        categoriesDatalist.innerHTML = '';
        budgetCategorySelect.innerHTML = '<option value="">Selecione</option>';

        Array.from(categories).sort().forEach(category => {
            // Para o datalist (auto-complete)
            const optionDatalist = document.createElement('option');
            optionDatalist.value = category;
            categoriesDatalist.appendChild(optionDatalist);

            // Para o select de filtro
            const optionSelect = document.createElement('option');
            optionSelect.value = category;
            optionSelect.textContent = category;
            filterCategorySelect.appendChild(optionSelect);

            // Para o select de orçamento
            const budgetOption = document.createElement('option');
            budgetOption.value = category;
            budgetOption.textContent = category;
            budgetCategorySelect.appendChild(budgetOption);
        });

        // Preenche orçamentos existentes
        const selectedMonth = filterMonthSelect.value;
        if (selectedMonth !== 'all' && budgets[selectedMonth]) {
            const monthBudgets = budgets[selectedMonth];
            for (const category in monthBudgets) {
                const option = budgetCategorySelect.querySelector(`option[value="${category}"]`);
                if (option) {
                    option.dataset.budget = monthBudgets[category];
                    option.textContent = `${category} (R$ ${monthBudgets[category].toFixed(2)})`;
                }
            }
        }
    }

    // Verifica orçamentos
    function checkBudgets(expenses) {
        budgetAlertsContainer.innerHTML = '';
        const selectedMonth = filterMonthSelect.value;
        
        if (selectedMonth === 'all' || !budgets[selectedMonth]) return;
        
        const monthBudgets = budgets[selectedMonth];
        const categoryTotals = {};
        
        expenses.forEach(expense => {
            categoryTotals[expense.category] = 
                (categoryTotals[expense.category] || 0) + expense.amount;
        });
        
        for (const category in monthBudgets) {
            const budget = monthBudgets[category];
            const spent = categoryTotals[category] || 0;
            const percentage = (spent / budget) * 100;
            
            if (spent > 0) {
                const alertDiv = document.createElement('div');
                alertDiv.className = `alert ${percentage > 100 ? 'danger' : 'warning'}`;
                
                if (percentage > 100) {
                    alertDiv.innerHTML = `
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>${category}:</strong> Você ultrapassou o orçamento em ${(percentage - 100).toFixed(0)}% 
                        (R$ ${spent.toFixed(2)} / R$ ${budget.toFixed(2)})
                    `;
                } else {
                    alertDiv.innerHTML = `
                        <i class="fas fa-info-circle"></i>
                        <strong>${category}:</strong> Você gastou ${percentage.toFixed(0)}% do orçamento 
                        (R$ ${spent.toFixed(2)} / R$ ${budget.toFixed(2)})
                    `;
                }
                
                budgetAlertsContainer.appendChild(alertDiv);
            }
        }
    }

    // Eventos dos filtros
    filterMonthSelect.addEventListener('change', loadExpenses);
    filterCategorySelect.addEventListener('change', loadExpenses);
    filterAmountSelect.addEventListener('change', function() {
        customAmountGroup.style.display = this.value === 'custom' ? 'block' : 'none';
        loadExpenses();
    });
    customAmountInput.addEventListener('input', loadExpenses);
    sortBySelect.addEventListener('change', loadExpenses);

    // Evento para editar salário
    editSalaryBtn.addEventListener('click', function() {
        salaryFormContainer.style.display = 'block';
        
        // Preenche com o mês selecionado no filtro, se não for "Todos"
        const selectedMonth = filterMonthSelect.value;
        if (selectedMonth !== 'all') {
            salaryMonthSelect.value = selectedMonth;
            
            // Se já existir salário para este mês, preenche os campos
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
    });

    // Evento para cancelar edição de salário
    cancelSalaryBtn.addEventListener('click', function() {
        salaryFormContainer.style.display = 'none';
    });

    // Calcula o salário líquido quando os campos são alterados
    salaryAmountInput.addEventListener('input', calculateNetSalary);
    salaryDiscountsInput.addEventListener('input', calculateNetSalary);

    function calculateNetSalary() {
        const gross = parseFloat(salaryAmountInput.value) || 0;
        const discounts = parseFloat(salaryDiscountsInput.value) || 0;
        const net = gross - discounts;
        salaryNetInput.value = net.toFixed(2);
    }

    // Evento para salvar salário
    saveSalaryBtn.addEventListener('click', function() {
        const month = salaryMonthSelect.value;
        const gross = parseFloat(salaryAmountInput.value) || 0;
        const discounts = parseFloat(salaryDiscountsInput.value) || 0;
        const net = parseFloat(salaryNetInput.value) || 0;
        
        if (!month) {
            showAlert('Selecione um mês!', 'error');
            return;
        }
        
        if (gross <= 0) {
            showAlert('O valor bruto deve ser maior que zero!', 'error');
            return;
        }
        
        // Salva o salário
        salaries[month] = {
            gross,
            discounts,
            net
        };
        
        saveData();
        loadExpenses();
        salaryFormContainer.style.display = 'none';
        showAlert('Salário salvo com sucesso!', 'success');
    });

    // Evento para definir orçamento
    setBudgetBtn.addEventListener('click', function() {
        const category = budgetCategorySelect.value;
        const amount = parseFloat(budgetAmountInput.value);
        const selectedMonth = filterMonthSelect.value;
        
        if (!category) {
            showAlert('Selecione uma categoria!', 'error');
            return;
        }
        
        if (!amount || amount <= 0) {
            showAlert('Digite um valor válido para o orçamento!', 'error');
            return;
        }
        
        if (selectedMonth === 'all') {
            showAlert('Selecione um mês específico para definir o orçamento!', 'error');
            return;
        }
        
        // Salva o orçamento
        if (!budgets[selectedMonth]) {
            budgets[selectedMonth] = {};
        }
        
        budgets[selectedMonth][category] = amount;
        saveData();
        updateFilters();
        checkBudgets(expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
        }));
        
        budgetAmountInput.value = '';
        showAlert('Orçamento definido com sucesso!', 'success');
    });

    // Evento para selecionar orçamento existente
    budgetCategorySelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.budget) {
            budgetAmountInput.value = selectedOption.dataset.budget;
        }
    });

    // Atualiza gráficos
    function updateCharts(expensesToDisplay) {
        // Destrói o gráfico anterior se existir
        if (currentChart) {
            currentChart.destroy();
        }
        
        // Agrupa por categoria
        const categories = {};
        expensesToDisplay.forEach(expense => {
            categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
        });
        
        const ctx = chartCanvas.getContext('2d');
        const labels = Object.keys(categories);
        const data = Object.values(categories);
        const backgroundColors = [
            '#4361ee', '#3a0ca3', '#4895ef', '#4cc9f0', '#f72585',
            '#7209b7', '#3f37c9', '#4cc9f0', '#4895ef', '#560bad'
        ];
        
        const config = {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
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
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatMoney(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };
        
        currentChart = new Chart(ctx, config);
    }

    // Alterna entre tipos de gráfico
    chartTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            chartTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            chartType = this.dataset.type;
            loadExpenses();
        });
    });

    // Alterna tema
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton();
    }

    // Atualiza botão do tema
    function updateThemeButton() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Tema Claro';
        } else {
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Tema Escuro';
        }
    }

    // Exporta dados
    exportBtn.addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(18);
        doc.text('Relatório de Gastos', 105, 15, { align: 'center' });
        
        // Período
        const monthFilter = filterMonthSelect.value;
        let periodText = 'Todos os períodos';
        if (monthFilter !== 'all') {
            const [year, month] = monthFilter.split('-');
            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            periodText = `${monthNames[parseInt(month) - 1]} de ${year}`;
        }
        
        doc.setFontSize(12);
        doc.text(`Período: ${periodText}`, 14, 25);
        
        // Dados
        const columns = [
            { title: "Data", dataKey: "date" },
            { title: "Categoria", dataKey: "category" },
            { title: "Descrição", dataKey: "description" },
            { title: "Valor (R$)", dataKey: "amount" }
        ];
        
        const rows = expenses.map(expense => ({
            date: new Date(expense.date).toLocaleDateString('pt-BR'),
            category: expense.category,
            description: expense.description || '-',
            amount: expense.amount.toFixed(2)
        }));
        
        doc.autoTable({
            startY: 30,
            head: [columns.map(col => col.title)],
            body: rows.map(row => columns.map(col => row[col.dataKey])
        });
        
        // Resumo
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text('Resumo', 14, finalY);
        
        const monthTotal = monthTotalElement.textContent;
        const monthSalary = monthSalaryElement.textContent;
        const monthBalance = monthBalanceElement.textContent;
        
        doc.setFontSize(12);
        doc.text(`Total de Gastos: ${monthTotal}`, 14, finalY + 10);
        doc.text(`Salário: ${monthSalary}`, 14, finalY + 20);
        doc.text(`Saldo: ${monthBalance}`, 14, finalY + 30);
        
        // Salva o PDF
        doc.save(`relatorio_gastos_${new Date().toISOString().slice(0, 10)}.pdf`);
        showAlert('Relatório exportado com sucesso!', 'success');
    });

    // Imprime dados
    printBtn.addEventListener('click', function() {
        const printWindow = window.open('', '_blank');
        const monthFilter = filterMonthSelect.value;
        let periodText = 'Todos os períodos';
        
        if (monthFilter !== 'all') {
            const [year, month] = monthFilter.split('-');
            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            periodText = `${monthNames[parseInt(month) - 1]} de ${year}`;
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de Gastos</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .summary { margin-top: 30px; }
                    .summary-item { margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <h1>Relatório de Gastos</h1>
                <p><strong>Período:</strong> ${periodText}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Categoria</th>
                            <th>Descrição</th>
                            <th>Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.map(expense => `
                            <tr>
                                <td>${new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                                <td>${expense.category}</td>
                                <td>${expense.description || '-'}</td>
                                <td>${expense.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="summary">
                    <h2>Resumo</h2>
                    <div class="summary-item"><strong>Total de Gastos:</strong> ${monthTotalElement.textContent}</div>
                    <div class="summary-item"><strong>Salário:</strong> ${monthSalaryElement.textContent}</div>
                    <div class="summary-item"><strong>Saldo:</strong> ${monthBalanceElement.textContent}</div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    });

    // Mostra/oculta campo de valor personalizado
    filterAmountSelect.addEventListener('change', function() {
        customAmountGroup.style.display = this.value === 'custom' ? 'block' : 'none';
    });

    // Carrega dados iniciais
    loadExpenses();
});

// Função global para editar despesa
function editExpense(id) {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const expenseToEdit = expenses.find(expense => expense.id === id);
    
    if (!expenseToEdit) return;

    // Preenche o formulário com os dados da despesa
    document.getElementById('category').value = expenseToEdit.category;
    document.getElementById('description').value = expenseToEdit.description || '';
    document.getElementById('amount').value = expenseToEdit.amount;
    document.getElementById('date').value = expenseToEdit.date;
    document.getElementById('edit-id').value = expenseToEdit.id;
    
    // Atualiza o botão de submit
    document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Atualizar Despesa';
    document.getElementById('cancel-edit').style.display = 'block';

    // Rola até o formulário
    document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
}

// Função global para deletar despesa
function deleteExpense(id) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    // Recarrega a página para atualizar a lista
    location.reload();
}
