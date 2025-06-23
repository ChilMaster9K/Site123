document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации при загрузке страниц
    checkAuth();
    
    // Валидация формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            if (!registerForm.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            // Проверка совпадения паролей
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            if (password.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity('Пароли не совпадают');
                confirmPassword.classList.add('is-invalid');
            } else {
                confirmPassword.setCustomValidity('');
                confirmPassword.classList.remove('is-invalid');
            }
            
            registerForm.classList.add('was-validated');
            
            if (registerForm.checkValidity()) {
                // Сохраняем пользователя в localStorage
                const user = {
                    login: document.getElementById('login').value,
                    password: document.getElementById('password').value,
                    fullName: document.getElementById('fullName').value,
                    phone: document.getElementById('phone').value,
                    email: document.getElementById('email').value
                };
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Сохраняем всех пользователей
                let users = JSON.parse(localStorage.getItem('users')) || [];
                users.push(user);
                localStorage.setItem('users', JSON.stringify(users));
                
                alert('Регистрация прошла успешно!');
                window.location.href = 'orders.html';
            }
        });
    }
    
    // Валидация формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            if (!loginForm.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            loginForm.classList.add('was-validated');
            
            if (loginForm.checkValidity()) {
                const login = document.getElementById('login').value;
                const password = document.getElementById('password').value;
                
                // Проверка логина и пароля администратора
                if (login === 'admin' && password === 'gruzovik2024') {
                    localStorage.setItem('isAdmin', 'true');
                    window.location.href = 'admin.html';
                    return;
                }
                
                // Проверка обычного пользователя
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.login === login && u.password === password);
                
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = 'orders.html';
                } else {
                    alert('Неверный логин или пароль!');
                }
            }
        });
    }
    
    // Выход из системы
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isAdmin');
            window.location.href = 'index.html';
        });
    });
    
    // Валидация формы заявки
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(event) {
            if (!orderForm.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            orderForm.classList.add('was-validated');
            
            if (orderForm.checkValidity()) {
                const order = {
                    id: Date.now(),
                    date: document.getElementById('date').value,
                    cargoType: document.getElementById('cargoType').value,
                    weight: document.getElementById('weight').value,
                    fromAddress: document.getElementById('fromAddress').value,
                    toAddress: document.getElementById('toAddress').value,
                    status: 'new',
                    userId: JSON.parse(localStorage.getItem('currentUser')).login
                };
                
                // Сохраняем заявку
                let orders = JSON.parse(localStorage.getItem('orders')) || [];
                orders.push(order);
                localStorage.setItem('orders', JSON.stringify(orders));
                
                alert('Заявка успешно отправлена!');
                window.location.href = 'orders.html';
            }
        });
    }
    
    // Загрузка заявок пользователя
    if (document.getElementById('ordersTable')) {
        loadUserOrders();
    }
    
    // Загрузка всех заявок для администратора
    if (document.getElementById('adminOrdersTable')) {
        loadAllOrders();
    }
});

// Проверка авторизации
function checkAuth() {
    const protectedPages = ['orders.html', 'create-order.html', 'admin.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser && !isAdmin) {
            window.location.href = 'login.html';
            return;
        }
        
        // Для администратора запрещаем доступ к обычным страницам
        if (isAdmin && currentPage !== 'admin.html') {
            window.location.href = 'admin.html';
            return;
        }
        
        // Для пользователей запрещаем доступ к админке
        if (currentUser && currentPage === 'admin.html') {
            window.location.href = 'orders.html';
            return;
        }
        
        // Отображаем имя пользователя
        if (currentUser) {
            const userElements = document.querySelectorAll('.user-name');
            userElements.forEach(el => {
                el.textContent = currentUser.fullName;
            });
        }
    }
}

// Загрузка заявок пользователя
function loadUserOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === currentUser.login);
    
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '';
    
    userOrders.forEach((order, index) => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(order.date)}</td>
            <td>${getCargoTypeName(order.cargoType)}</td>
            <td>${order.fromAddress}</td>
            <td>${order.toAddress}</td>
            <td><span class="badge ${getStatusClass(order.status)}">${getStatusName(order.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-info">Подробности</button>
                ${order.status === 'completed' ? 
                  '<button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#feedbackModal">Оставить отзыв</button>' : ''}
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Загрузка всех заявок для администратора
function loadAllOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    const tbody = document.querySelector('#adminOrdersTable tbody');
    tbody.innerHTML = '';
    
    orders.forEach((order, index) => {
        const user = users.find(u => u.login === order.userId);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(order.date)}</td>
            <td>${user ? user.fullName : 'Неизвестный пользователь'}</td>
            <td>${formatDate(order.date)}</td>
            <td>${getCargoTypeName(order.cargoType)}</td>
            <td>${order.fromAddress}</td>
            <td>${order.toAddress}</td>
            <td>
                <select class="form-select form-select-sm status-select" data-order-id="${order.id}">
                    <option value="new" ${order.status === 'new' ? 'selected' : ''}>Новая</option>
                    <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Завершена</option>
                    <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>Отменена</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-info">Подробности</button>
                <button class="btn btn-sm btn-success contact-btn" data-user-id="${order.userId}">Связаться</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Обработка изменения статуса
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            const orderId = parseInt(this.dataset.orderId);
            const newStatus = this.value;
            
            let orders = JSON.parse(localStorage.getItem('orders'));
            const orderIndex = orders.findIndex(o => o.id === orderId);
            
            if (orderIndex !== -1) {
                orders[orderIndex].status = newStatus;
                localStorage.setItem('orders', JSON.stringify(orders));
            }
        });
    });
}

// Вспомогательные функции
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

function getCargoTypeName(type) {
    const types = {
        'fragile': 'Хрупкое',
        'perishable': 'Скоропортящееся',
        'animals': 'Животные',
        'liquid': 'Жидкость',
        'furniture': 'Мебель',
        'trash': 'Мусор',
        'other': 'Другое'
    };
    return types[type] || type;
}

function getStatusName(status) {
    const statuses = {
        'new': 'Новая',
        'in_progress': 'В работе',
        'completed': 'Завершена',
        'canceled': 'Отменена'
    };
    return statuses[status] || status;
}

function getStatusClass(status) {
    const classes = {
        'new': 'bg-secondary',
        'in_progress': 'bg-primary',
        'completed': 'bg-success',
        'canceled': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
}