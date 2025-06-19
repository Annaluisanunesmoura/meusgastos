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

    // Carrega despesas e salários do localStorage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let salaries = JSON.parse(localStorage.getItem('salaries')) || {};

    // Configura data padrão
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Evento para adicionar/editar despesa
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validação
        if (!categoryInput.value || !amountInput.value || !dateInput.value) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }

        const expenseData = {
            id: editIdInput.value ? parseInt(editIdInput.value) : Date.now(),
            category: categoryInput.value.trim(),
            description: descriptionInput.value.trim(),
            amount: parseFloat(amountInput.value),
            date: dateInput.value
        };

        // Se estiver editando, remove a despesa antiga
        if (editIdInput.value) {
            expenses = expenses.filter(expense => expense.id !== parseInt(editIdInput.value));
        }

        // Adiciona ao array
        expenses.push(expenseData);
        
        // Salva no localStorage
        localStorage.setItem('expenses', JSON.stringify(expenses));
        
        // Atualiza a interface
        loadExpenses();
        
        // Limpa o formulário
        resetForm();
    });

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

        // Ordena por data (mais recente primeiro)
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Exibe os gastos
        displayExpenses(filteredExpenses);
        updateSummary(filteredExpenses);
        updateFilters();
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
        monthTotalElement.textContent = `R$ ${monthTotal.toFixed(2)}`;
        
        // Salário do mês
        let monthSalary = 0;
        if (selectedMonth !== 'all' && salaries[selectedMonth]) {
            monthSalary = salaries[selectedMonth].net || 0;
        }
        monthSalaryElement.textContent = `R$ ${monthSalary.toFixed(2)}`;
        
        // Saldo do mês
        const monthBalance = monthSalary - monthTotal;
        monthBalanceElement.textContent = `R$ ${monthBalance.toFixed(2)}`;
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

        sortedMonths.forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            const monthName = monthNames[parseInt(monthNum) - 1];
            
            // Para o filtro de mês
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `${monthName}/${year}`;
            filterMonthSelect.appendChild(option);
            
            // Para o select de salário
            const salaryOption = document.createElement('option');
            salaryOption.value = month;
            salaryOption.textContent = `${monthName}/${year}`;
            salaryMonthSelect.appendChild(salaryOption);
        });

        // Filtro de categorias
        const categories = new Set(expenses.map(expense => expense.category));
        filterCategorySelect.innerHTML = '<option value="all">Todas as Categorias</option>';
        categoriesDatalist.innerHTML = '';

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
        });
    }

    // Eventos dos filtros
    filterMonthSelect.addEventListener('change', loadExpenses);
    filterCategorySelect.addEventListener('change', loadExpenses);

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
            alert('Selecione um mês!');
            return;
        }
        
        if (gross <= 0) {
            alert('O valor bruto deve ser maior que zero!');
            return;
        }
        
        // Salva o salário
        salaries[month] = {
            gross,
            discounts,
            net
        };
        
        localStorage.setItem('salaries', JSON.stringify(salaries));
        
        // Atualiza a interface
        loadExpenses();
        
        // Fecha o formulário
        salaryFormContainer.style.display = 'none';
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