document.addEventListener("DOMContentLoaded", function() {

    // 1. EXTRAIR DATAS E NOMES DA TABELA
    function extractDates() {
        const eventsMap = {}; 
        const rows = document.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const startCol = row.querySelector('.date-start');
            const endCol = row.querySelector('.date-end');
            const stepId = row.id.split('-')[1]; 
            
            let activityName = "Atividade";
            const processCol = row.querySelector('.process-col');
            if (processCol) {
                activityName = processCol.innerText.replace(/\n/g, ' ').trim();
            }

            if (startCol && endCol && stepId) {
                const s = startCol.textContent.trim().split('/');
                const e = endCol.textContent.trim().split('/');
                
                // Mapeia INÍCIO
                if (s.length === 3) {
                    const startTime = new Date(s[2], s[1]-1, s[0]).getTime();
                    if (!eventsMap[startTime]) eventsMap[startTime] = { steps: [], isStart: false, isEnd: false };
                    eventsMap[startTime].steps.push({ id: stepId, name: activityName, type: 'Início' });
                    eventsMap[startTime].isStart = true;
                }
                
                // Mapeia TÉRMINO
                if (e.length === 3) {
                    const endTime = new Date(e[2], e[1]-1, e[0]).getTime();
                    if (!eventsMap[endTime]) eventsMap[endTime] = { steps: [], isStart: false, isEnd: false };
                    
                    const existingStep = eventsMap[endTime].steps.find(step => step.id === stepId);
                    if (existingStep) {
                        existingStep.type = 'Início e Término';
                    } else {
                        eventsMap[endTime].steps.push({ id: stepId, name: activityName, type: 'Término' });
                    }
                    eventsMap[endTime].isEnd = true;
                }
            }
        });
        return eventsMap;
    }

    const eventDates = extractDates();
    let currentDate = new Date(2024, 5, 1); 

    // Usaremos uma "data fictícia" (ex: 18/07/2024) para o mock das atividades "Atrasadas" funcionar no visual
    const mockToday = new Date(2024, 6, 18).getTime(); 

    // ==========================================
    // 2. ATUALIZAR CARDS DINAMICAMENTE
    // ==========================================
    function updateSummaryCards() {
        let countTotal = 0;
        let countConcluidas = 0;
        let countParaConcluir = 0;
        let countAtrasadas = 0;
        
        document.querySelectorAll('tbody tr').forEach(row => {
            countTotal++;
            const statusEl = row.querySelector('.status');
            const statusText = statusEl ? statusEl.textContent.trim().toLowerCase() : '';
            const isConcluido = statusText === 'concluído';
            
            if (isConcluido) {
                countConcluidas++;
            } else {
                countParaConcluir++;
                
                // Avalia se está atrasada (Pendente + Data fim menor que "hoje")
                const endCol = row.querySelector('.date-end');
                if (endCol) {
                    const e = endCol.textContent.trim().split('/');
                    if (e.length === 3) {
                        const endTime = new Date(e[2], e[1]-1, e[0]).getTime();
                        if (endTime < mockToday) {
                            countAtrasadas++; 
                        }
                    }
                }
            }
        });
        
        // Injeta os valores corretos nos cards
        const cardsValues = document.querySelectorAll('.summary-card .card-value');
        if(cardsValues.length === 4) {
            cardsValues[0].textContent = countAtrasadas;     // Perigo (Vermelho)
            cardsValues[1].textContent = countParaConcluir;  // Alerta (Amarelo)
            cardsValues[2].textContent = countConcluidas;    // Sucesso (Verde)
            cardsValues[3].textContent = countTotal;         // Total (Azul)
        }
    }
    
    // Roda a função para injetar os números reais no layout
    updateSummaryCards(); 


    // 3. FUNÇÃO GLOBAL PARA LIMPAR TODOS OS FILTROS
    function resetFilters() {
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected-filter'));
        document.querySelectorAll('.bar-group').forEach(b => b.classList.remove('bar-highlighted'));
        document.querySelectorAll('.summary-card').forEach(c => c.classList.remove('active-card')); // Limpa os cards
        
        document.querySelectorAll('tbody tr').forEach(r => {
            r.style.display = ''; 
            r.classList.remove('row-highlighted');
        });
    }

    // 4. CALENDÁRIO
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
        const realToday = new Date(); // Para o CSS '.today'
        
        // Espaços vazios
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.className = "calendar-day empty";
            daysContainer.appendChild(empty);
        }
        
        // Preenche os dias do mês
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement("div");
            day.className = "calendar-day";
            day.textContent = i;
            
            const currentDayTime = new Date(year, month, i).getTime();
            const eventData = eventDates[currentDayTime];
            
            if (eventData) {
                if (eventData.isStart && eventData.isEnd) {
                    day.classList.add("event-start-end");
                } else if (eventData.isStart) {
                    day.classList.add("event-start");
                } else if (eventData.isEnd) {
                    day.classList.add("event-end");
                }
                
                const tooltipLines = eventData.steps.map(s => `${s.type}: ${s.name}`);
                day.setAttribute('data-tooltip', tooltipLines.join(' | '));
                day.classList.add('has-tooltip');
                
                day.addEventListener('click', function(e) {
                    e.stopPropagation(); 
                    const isAlreadySelected = day.classList.contains('selected-filter');
                    
                    resetFilters(); 
                    
                    if (!isAlreadySelected) {
                        day.classList.add('selected-filter');
                        document.querySelectorAll('tbody tr').forEach(r => r.style.display = 'none');
                        
                        eventData.steps.forEach(stepInfo => {
                            const targetRow = document.getElementById('step-' + stepInfo.id);
                            if (targetRow) {
                                targetRow.style.display = ''; 
                                void targetRow.offsetWidth; 
                                targetRow.classList.add('row-highlighted');
                            }
                            
                            const targetBar = document.querySelector(`.bar-group[data-step="${stepInfo.id}"]`);
                            if (targetBar) {
                                void targetBar.offsetWidth; 
                                targetBar.classList.add('bar-highlighted'); 
                            }
                        });
                    }
                });
            } else {
                day.addEventListener('click', function(e) {
                    e.stopPropagation();
                    resetFilters();
                });
            }

            if (i === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) {
                day.classList.add("today");
            }
            
            daysContainer.appendChild(day);
        }
    }
    
    renderCalendar(currentDate);
    
    document.getElementById("prev-month").onclick = () => { resetFilters(); currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); };
    document.getElementById("next-month").onclick = () => { resetFilters(); currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); };

    // 5. DESTAQUE NO GRÁFICO
    document.querySelectorAll('[data-highlight-step]').forEach(bar => {
        bar.onclick = function() {
            resetFilters(); 
            
            const step = this.getAttribute('data-step');
            const target = document.getElementById('step-' + step);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                void target.offsetWidth;
                target.classList.add('row-highlighted');
            }
        };
    });

    // ==========================================
    // 6. LÓGICA DE FILTRO NOS CARDS
    // ==========================================
    const summaryCards = document.querySelectorAll('.summary-card');
    
    summaryCards.forEach(card => {
        card.addEventListener('click', function() {
            const isAlreadyActive = this.classList.contains('active-card');
            
            resetFilters(); // Limpa estado anterior
            
            // Se clicar no mesmo card que já estava ativo, ele apenas limpa e mostra tudo (Toggle)
            if (!isAlreadyActive) {
                this.classList.add('active-card'); // Deixa o card "pressionado" visualmente
                
                const isDanger = this.classList.contains('danger');
                const isWarning = this.classList.contains('warning');
                const isSuccess = this.classList.contains('success');
                const isPrimary = this.classList.contains('primary');
                
                document.querySelectorAll('tbody tr').forEach(row => {
                    const statusEl = row.querySelector('.status');
                    const statusText = statusEl ? statusEl.textContent.trim().toLowerCase() : '';
                    const isConcluido = statusText === 'concluído';
                    
                    let isAtrasado = false;
                    if (!isConcluido) {
                        const endCol = row.querySelector('.date-end');
                        if (endCol) {
                            const e = endCol.textContent.trim().split('/');
                            if (e.length === 3) {
                                const endTime = new Date(e[2], e[1]-1, e[0]).getTime();
                                if (endTime < mockToday) isAtrasado = true;
                            }
                        }
                    }
                    
                    let showRow = false;
                    
                    if (isPrimary) showRow = true; // Botão Azul: mostra tudo
                    else if (isSuccess) showRow = isConcluido; // Botão Verde
                    else if (isWarning) showRow = !isConcluido; // Botão Amarelo
                    else if (isDanger) showRow = isAtrasado; // Botão Vermelho
                    
                    if (showRow) {
                        row.style.display = '';
                        row.style.animation = 'none';
                        void row.offsetWidth; // Dispara animação
                        row.classList.add('row-highlighted');
                    } else {
                        row.style.display = 'none';
                    }
                });
            }
        });
    });

});