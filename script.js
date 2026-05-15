document.addEventListener("DOMContentLoaded", function() {
    // 1. CALENDÁRIO (Inicia em Junho/2024)
    let currentDate = new Date(2024, 5, 1); 
    
    function renderCalendar(date) {
        const monthYear = document.getElementById("month-year");
        const daysContainer = document.getElementById("calendar-days");
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        
        const month = date.getMonth();
        const year = date.getFullYear();
        monthYear.textContent = `${monthNames[month]} ${year}`;
        daysContainer.innerHTML = "";
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const realToday = new Date();
        
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.className = "calendar-day empty";
            daysContainer.appendChild(empty);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement("div");
            day.className = "calendar-day";
            day.textContent = i;
            if (i === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) day.classList.add("today");
            daysContainer.appendChild(day);
        }
    }
    
    renderCalendar(currentDate);
    document.getElementById("prev-month").onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); };
    document.getElementById("next-month").onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); };

    // 2. DESTAQUE NO GRÁFICO
    document.querySelectorAll('[data-highlight-step]').forEach(bar => {
        bar.onclick = function() {
            const step = this.getAttribute('data-step');
            document.querySelectorAll('tbody tr').forEach(r => r.classList.remove('row-highlighted'));
            const target = document.getElementById('step-' + step);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                void target.offsetWidth;
                target.classList.add('row-highlighted');
            }
        };
    });
});