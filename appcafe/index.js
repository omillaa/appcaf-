/* ==========================================================================
   1. CONTROLES DE MODO APRESENTAÇÃO (SLIDES)
   ========================================================================== */
let isPresentationMode = false;
let currentSlideIndex = 0;
let slides = [];

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa slides
    slides = Array.from(document.querySelectorAll('.pres-slide'));
    
    // Configura menu ativo na rolagem
    setupScrollSpy();

    // Carrega dados salvos do questionário
    loadSavedSurveyData();

    // Adiciona escuta de inputs no form para salvar automaticamente
    setupSurveyAutoSave();
});

function togglePresentationMode() {
    isPresentationMode = !isPresentationMode;
    const body = document.body;
    
    if (isPresentationMode) {
        body.classList.add('presentation-active');
        currentSlideIndex = 0;
        updateSlidesView();
    } else {
        body.classList.remove('presentation-active');
    }
}

function updateSlidesView() {
    slides.forEach((slide, idx) => {
        if (idx === currentSlideIndex) {
            slide.classList.add('active-slide');
        } else {
            slide.classList.remove('active-slide');
        }
    });

    // Atualiza barra de progresso dos slides
    const progressPercent = ((currentSlideIndex + 1) / slides.length) * 100;
    const progressFill = document.getElementById('pres-progress-fill');
    if (progressFill) progressFill.style.width = `${progressPercent}%`;

    // Atualiza contador de slides
    const counterDisplay = document.getElementById('pres-slide-counter');
    if (counterDisplay) {
        counterDisplay.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
    }

    // Desabilita botões nas extremidades
    const prevBtn = document.getElementById('btn-prev-slide');
    const nextBtn = document.getElementById('btn-next-slide');
    if (prevBtn) prevBtn.disabled = currentSlideIndex === 0;
    if (nextBtn) nextBtn.disabled = currentSlideIndex === slides.length - 1;
}

function changeSlide(direction) {
    if (!isPresentationMode) return;
    const newIndex = currentSlideIndex + direction;
    if (newIndex >= 0 && newIndex < slides.length) {
        currentSlideIndex = newIndex;
        updateSlidesView();
    }
}

// Teclas de atalho para a Apresentação
window.addEventListener('keydown', (e) => {
    if (!isPresentationMode) return;

    if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        changeSlide(1);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        changeSlide(-1);
    } else if (e.key === 'Escape') {
        togglePresentationMode();
    }
});

/* ==========================================================================
   2. NAVEGAÇÃO E SCROLL
   ========================================================================== */
function navigateToSection(id) {
    // Se estiver no modo apresentação, sai dele primeiro
    if (isPresentationMode) {
        togglePresentationMode();
    }

    const element = document.getElementById(id);
    if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        // Fecha o menu móvel
        document.getElementById('nav-menu').classList.remove('open');
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('nav-menu');
    if (menu) {
        menu.classList.toggle('open');
    }
}

function setupScrollSpy() {
    const sections = ['hero', 'quem-somos', 'desenvolvimento', 'visita', 'roteiro'];
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentActive = 'hero';
        const scrollPosition = window.scrollY + 200;

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                if (scrollPosition >= top && scrollPosition < top + height) {
                    currentActive = id;
                }
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const onclickAttr = link.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(currentActive)) {
                link.classList.add('active');
            }
        });

        // Efeito scrolled no header
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
}

/* ==========================================================================
   3. ROTEIRO DE ENTREVISTA INTERATIVO (FORMULÁRIO)
   ========================================================================== */
let activeTabIndex = 0;
const totalTabs = 7; // Apresentação (0), 5 Seções (1-5), Conclusão (6)

// Estrutura das perguntas por seção para mapeamento de progresso
const surveyStructure = {
    1: ['q1', 'q2', 'q3', 'q4', 'q5', 'q23'],
    2: ['q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q24'],
    3: ['q12', 'q13', 'q14', 'q15', 'q16', 'q25'],
    4: ['q17', 'q18', 'q19', 'q26'],
    5: ['q20', 'q21', 'q22', 'q27']
};

function switchTab(index) {
    if (index < 0 || index >= totalTabs) return;
    
    // Atualiza aba ativa na barra lateral
    const tabButtons = document.querySelectorAll('#survey-sidebar .tab-btn');
    tabButtons.forEach((btn, idx) => {
        if (idx === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Atualiza painel visível
    const panels = document.querySelectorAll('.survey-panel');
    panels.forEach((panel, idx) => {
        if (idx === index) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    activeTabIndex = index;

    if (index === 6) updateSuccessStats();

    // Volta o scroll do painel para o topo sempre
    const formContent = document.querySelector('.survey-form-content');
    if (formContent) formContent.scrollTop = 0;

    // Rola a página até a seção no mobile
    if (window.innerWidth <= 992) {
        document.getElementById('roteiro').scrollIntoView({ behavior: 'smooth' });
    }

    updateSurveyProgressView();
}

function handleRadioChange(radio) {
    // Remove classe checked de todos os irmãos
    const name = radio.name;
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach(r => {
        r.parentElement.classList.remove('checked');
    });

    // Adiciona ao selecionado
    if (radio.checked) {
        radio.parentElement.classList.add('checked');
    }

    // Salva e atualiza progresso
    saveSurveyField(name, radio.value);
    updateSurveyProgressView();
}

function setupSurveyAutoSave() {
    const form = document.getElementById('interview-form');
    
    // Text inputs e Textareas
    const textFields = form.querySelectorAll('input[type="text"], textarea');
    textFields.forEach(field => {
        field.addEventListener('input', () => {
            saveSurveyField(field.id, field.value);
            updateSurveyProgressView();
        });
    });
}

function saveSurveyField(id, value) {
    let data = localStorage.getItem('unifenas_survey_draft');
    if (!data) {
        data = {};
    } else {
        data = JSON.parse(data);
    }
    data[id] = value;
    localStorage.setItem('unifenas_survey_draft', JSON.stringify(data));
}

function loadSavedSurveyData() {
    const savedData = localStorage.getItem('unifenas_survey_draft');
    if (!savedData) {
        updateSurveyProgressView();
        return;
    }

    const data = JSON.parse(savedData);
    
    // Preenche campos de texto
    Object.keys(data).forEach(key => {
        const val = data[key];
        
        // Verifica se é input de texto ou textarea
        const field = document.getElementById(key);
        if (field) {
            field.value = val;
        } else {
            // Verifica se é um radio button
            const radio = document.querySelector(`input[name="${key}"][value="${val}"]`);
            if (radio) {
                radio.checked = true;
                radio.parentElement.classList.add('checked');
            }
        }
    });

    updateSurveyProgressView();
}

function calculateProgress() {
    const savedData = localStorage.getItem('unifenas_survey_draft');
    const data = savedData ? JSON.parse(savedData) : {};
    
    // Contagem geral
    let answeredQuestions = 0;
    const totalQuestions = 27;

    // Contagem por seção
    const sectionCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Percorre estrutura das seções
    Object.keys(surveyStructure).forEach(sec => {
        const questions = surveyStructure[sec];
        questions.forEach(qId => {
            if (data[qId] && data[qId].trim() !== '') {
                answeredQuestions++;
                sectionCounts[sec]++;
            }
        });
    });

    const sectionsCompleted = Object.keys(surveyStructure).filter(sec => {
        return sectionCounts[sec] === surveyStructure[sec].length;
    }).length;

    return {
        totalAnswered: answeredQuestions,
        totalQuestions: totalQuestions,
        percentage: Math.round((answeredQuestions / totalQuestions) * 100),
        sections: sectionCounts,
        sectionsCompleted: sectionsCompleted
    };
}

function updateSurveyProgressView() {
    const progress = calculateProgress();
    
    // Atualiza preenchimento das abas
    Object.keys(surveyStructure).forEach(sec => {
        const max = surveyStructure[sec].length;
        const current = progress.sections[sec];
        const badge = document.getElementById(`badge-tab-${sec}`);
        if (badge) {
            badge.textContent = `${current}/${max}`;
            if (current === max) {
                badge.style.backgroundColor = 'var(--agro-green-light)';
                badge.style.color = 'var(--agro-green)';
            } else {
                badge.style.backgroundColor = '#EFEBE9';
                badge.style.color = 'var(--primary-coffee)';
            }
        }
    });

    // Atualiza barra de progresso superior do questionário
    const progressBar = document.getElementById('survey-progress-fill');
    const progressText = document.getElementById('survey-progress-text');
    
    if (progressBar) {
        // Se estiver na aba inicial ou final, mostra progresso estático ou total
        if (activeTabIndex === 0) {
            progressBar.style.width = '0%';
            if (progressText) progressText.textContent = 'Apresentação';
        } else if (activeTabIndex === 6) {
            progressBar.style.width = '100%';
            if (progressText) progressText.textContent = 'Concluído!';
        } else {
            progressBar.style.width = `${progress.percentage}%`;
            if (progressText) {
                progressText.textContent = `Progresso: ${progress.totalAnswered} / ${progress.totalQuestions} (${progress.percentage}%)`;
            }
        }
    }
}

function resetSurvey() {
    showConfirmModal(
        'Limpar Entrevista?',
        'Todas as respostas preenchidas serão apagadas. Essa ação não pode ser desfeita.',
        () => {
            localStorage.removeItem('unifenas_survey_draft');

            const form = document.getElementById('interview-form');
            form.querySelectorAll('input[type="text"], textarea').forEach(f => f.value = '');
            form.querySelectorAll('input[type="radio"]').forEach(r => {
                r.checked = false;
                r.parentElement.classList.remove('checked');
            });

            switchTab(0);
        }
    );
}

function updateSuccessStats() {
    const progress = calculateProgress();

    document.getElementById('stat-answered').textContent = `${progress.totalAnswered}/27`;
    document.getElementById('stat-sections').textContent = `${progress.sectionsCompleted}/5`;
    document.getElementById('stat-percent').textContent  = `${progress.percentage}%`;

    const btn = document.querySelector('.btn-success-send');
    if (!btn) return;

    if (progress.percentage < 100) {
        btn.disabled = true;
        btn.style.opacity = '0.45';
        btn.style.cursor  = 'not-allowed';
        btn.style.boxShadow = 'none';
        btn.title = 'Preencha todas as perguntas antes de enviar';
    } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor  = 'pointer';
        btn.style.boxShadow = '';
        btn.title = '';
    }
}

async function sendToTelegram() {
    const progress = calculateProgress();
    if (progress.percentage < 100) {
        showFeedbackModal('error', 'Formulário Incompleto', `Ainda faltam ${progress.totalQuestions - progress.totalAnswered} pergunta(s) sem resposta. Preencha todas antes de enviar.`);
        return;
    }

    const BOT_TOKEN = '8662983200:AAH-sjAsscEQkv65q4-8n4ccQyO1m1zWnug';
    const CHAT_ID = '-1004329580949';

    const savedData = localStorage.getItem('unifenas_survey_draft');
    const data = savedData ? JSON.parse(savedData) : {};

    const sections = [
        {
            title: '👤 1. O PRODUTOR',
            questions: [
                { id: 'q1',  text: 'Há quantos anos trabalha com café?' },
                { id: 'q2',  text: 'Principal atividade na propriedade?' },
                { id: 'q3',  text: 'Tamanho da área de café (hectares)?' },
                { id: 'q4',  text: 'Produção média anual?' },
                { id: 'q5',  text: 'Nível de escolaridade?' },
                { id: 'q23', text: 'Como vende o café?' }
            ]
        },
        {
            title: '☀️ 2. SECAGEM',
            questions: [
                { id: 'q6',  text: 'Como acompanha a secagem no terreiro?' },
                { id: 'q7',  text: 'Como decide o ponto de retirada?' },
                { id: 'q8',  text: 'Usa algum método ou referência?' },
                { id: 'q9',  text: 'Mais alguém participa da decisão?' },
                { id: 'q10', text: 'Maior preocupação ao definir o momento de retirar?' },
                { id: 'q11', text: 'Já teve café fora do ponto? Como foi?' },
                { id: 'q24', text: 'Tipo de secagem utilizada?' }
            ]
        },
        {
            title: '📱 3. TECNOLOGIA',
            questions: [
                { id: 'q12', text: 'Utiliza smartphone no dia a dia?' },
                { id: 'q13', text: 'Modelo ou marca do celular?' },
                { id: 'q14', text: 'Usa apps de lavoura ou clima?' },
                { id: 'q15', text: 'Já usou app para produção de café?' },
                { id: 'q16', text: 'Facilidade para aprender novos apps?' },
                { id: 'q25', text: 'Tem sinal de internet na propriedade?' }
            ]
        },
        {
            title: '⚠️ 4. DIFICULDADES',
            questions: [
                { id: 'q17', text: 'O que mais dificulta o acompanhamento da secagem?' },
                { id: 'q18', text: 'Alguma etapa gera dúvidas ou insegurança?' },
                { id: 'q19', text: 'O que mais gera retrabalho?' },
                { id: 'q26', text: 'Já teve café desvalorizado por qualidade?' }
            ]
        },
        {
            title: '✅ 5. SOLUÇÕES',
            questions: [
                { id: 'q20', text: 'Analisar o café pelo celular seria útil?' },
                { id: 'q21', text: 'O que tornaria a ferramenta útil?' },
                { id: 'q22', text: 'O que faria você confiar na ferramenta?' },
                { id: 'q27', text: 'Como prefere receber o resultado no app?' }
            ]
        }
    ];

    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        let msg = `☕ <b>NOVA ENTREVISTA — PROJETO UNIFENAS</b>\n`;
        msg += `📅 <i>${new Date().toLocaleString('pt-BR')}</i>\n`;
        msg += `${'─'.repeat(28)}\n\n`;

        for (const section of sections) {
            msg += `<b>${section.title}</b>\n`;
            section.questions.forEach(q => {
                const answer = data[q.id] || '—';
                msg += `▸ <i>${q.text}</i>\n${answer}\n\n`;
            });
            msg += `${'─'.repeat(28)}\n\n`;
        }

        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' })
        });

        showFeedbackModal('success', 'Respostas Enviadas!', 'A entrevista foi registrada com sucesso. Obrigado pela participação!');
    } catch (e) {
        showFeedbackModal('error', 'Erro ao Enviar', 'Não foi possível enviar as respostas. Verifique sua conexão com a internet e tente novamente.');
    }
}

function showFeedbackModal(type, title, text) {
    const overlay = document.getElementById('feedback-modal-overlay');
    const icon    = document.getElementById('feedback-modal-icon');
    const titleEl = document.getElementById('feedback-modal-title');
    const textEl  = document.getElementById('feedback-modal-text');
    const btn     = document.getElementById('feedback-modal-btn');

    const successSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    const errorSvg   = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    icon.className  = `feedback-modal-icon ${type}`;
    icon.innerHTML  = type === 'success' ? successSvg : errorSvg;
    btn.className   = `feedback-modal-btn ${type}`;
    titleEl.textContent = title;
    textEl.textContent  = text;

    overlay.classList.add('active');
}

function showConfirmModal(title, text, onConfirm) {
    const overlay    = document.getElementById('feedback-modal-overlay');
    const icon       = document.getElementById('feedback-modal-icon');
    const titleEl    = document.getElementById('feedback-modal-title');
    const textEl     = document.getElementById('feedback-modal-text');
    const btn        = document.getElementById('feedback-modal-btn');
    const cancelBtn  = document.getElementById('feedback-modal-cancel');

    icon.className = 'feedback-modal-icon warning';
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    btn.className      = 'feedback-modal-btn warning';
    btn.textContent    = 'Sim, limpar';
    cancelBtn.style.display = 'block';
    titleEl.textContent = title;
    textEl.textContent  = text;

    btn.onclick = () => { closeFeedbackModal(); onConfirm(); };
    cancelBtn.onclick = closeFeedbackModal;
    overlay.onclick   = closeFeedbackModal;

    overlay.classList.add('active');
}

function closeFeedbackModal() {
    const overlay = document.getElementById('feedback-modal-overlay');
    overlay.classList.remove('active');
    document.getElementById('feedback-modal-cancel').style.display = 'none';
    document.getElementById('feedback-modal-btn').textContent = 'OK';
}

function exportSurveyData() {
    const savedData = localStorage.getItem('unifenas_survey_draft');
    const data = savedData ? JSON.parse(savedData) : {};
    
    // Perguntas por extenso
    const questionsTexts = {
        q1: "Há quantos anos você trabalha com café?",
        q2: "Qual é sua principal atividade hoje na propriedade?",
        q3: "Qual é o tamanho aproximado da área de café da propriedade (em hectares)?",
        q4: "Qual é a produção média anual de café da propriedade?",
        q5: "Qual é seu nível de escolaridade?",
        q6: "Como você costuma acompanhar a secagem do café no terreiro?",
        q7: "Como você decide que o café está no ponto de sair do terreiro?",
        q8: "Existe algum método ou referência que você utiliza para tomar essa decisão?",
        q9: "Mais alguém participa dessa decisão além de você?",
        q10: "Qual é sua maior preocupação ou medo ao definir o momento de retirar o café do terreiro?",
        q11: "Você já teve alguma situação em que o café saiu antes ou depois do ponto ideal? Como foi?",
        q12: "Você utiliza smartphone no dia a dia?",
        q13: "Qual modelo ou marca de celular você usa atualmente?",
        q14: "Você costuma utilizar aplicativos relacionados à lavoura ou ao clima?",
        q15: "Já utilizou algum aplicativo para auxiliar na produção de café?",
        q16: "Como você avalia sua facilidade para aprender a usar novos aplicativos?",
        q17: "O que mais dificulta o acompanhamento da secagem do café hoje?",
        q18: "Existe alguma etapa da secagem que costuma gerar dúvidas ou insegurança?",
        q19: "O que mais gera perda de tempo ou retrabalho nesse processo?",
        q20: "Se fosse possível analisar o café pelo celular para ajudar a identificar o ponto de secagem, você acha que isso seria útil?",
        q21: "O que tornaria uma ferramenta assim realmente útil para você?",
        q22: "O que faria você confiar em uma ferramenta desse tipo?",
        q23: "Como você vende seu café?",
        q24: "Qual tipo de secagem você utiliza na propriedade?",
        q25: "Você tem sinal de internet na propriedade?",
        q26: "Você já teve café desvalorizado ou rejeitado por problemas de qualidade?",
        q27: "Como você preferiria receber o resultado da análise no aplicativo?"
    };

    let report = "";
    report += "==========================================================================\n";
    report += "           RELATÓRIO DE ENTREVISTA - PROJETO DE PESQUISA UNIFENAS         \n";
    report += `Data da Exportação: ${new Date().toLocaleString('pt-BR')}\n`;
    report += "==========================================================================\n\n";

    // Seção 1
    report += "--- 1. CONHECENDO O PRODUTOR ---\n";
    surveyStructure[1].forEach(qId => {
        report += `${qId.toUpperCase()}. ${questionsTexts[qId]}\n`;
        report += `R: ${data[qId] || "[Sem resposta]"}\n\n`;
    });

    // Seção 2
    report += "--- 2. PROCESSO DE SECAGEM ---\n";
    surveyStructure[2].forEach(qId => {
        report += `${qId.toUpperCase()}. ${questionsTexts[qId]}\n`;
        report += `R: ${data[qId] || "[Sem resposta]"}\n\n`;
    });

    // Seção 3
    report += "--- 3. USO DE TECNOLOGIA ---\n";
    surveyStructure[3].forEach(qId => {
        report += `${qId.toUpperCase()}. ${questionsTexts[qId]}\n`;
        report += `R: ${data[qId] || "[Sem resposta]"}\n\n`;
    });

    // Seção 4
    report += "--- 4. DORES E DIFICULDADES ---\n";
    surveyStructure[4].forEach(qId => {
        report += `${qId.toUpperCase()}. ${questionsTexts[qId]}\n`;
        report += `R: ${data[qId] || "[Sem resposta]"}\n\n`;
    });

    // Seção 5
    report += "--- 5. POSSÍVEIS SOLUÇÕES ---\n";
    surveyStructure[5].forEach(qId => {
        report += `${qId.toUpperCase()}. ${questionsTexts[qId]}\n`;
        report += `R: ${data[qId] || "[Sem resposta]"}\n\n`;
    });

    report += "==========================================================================\n";
    report += "Fim do Relatório acadêmico. Obrigado pela colaboração do produtor! 🚜☕\n";
    report += "==========================================================================\n";

    // Gera arquivo para download
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    // Nome do arquivo com timestamp
    const dateFormatted = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `entrevista-unifenas-cafe-${dateFormatted}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Limpeza
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
