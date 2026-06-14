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

    // Rola a área do formulário de volta para o topo no mobile
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

    return {
        totalAnswered: answeredQuestions,
        totalQuestions: totalQuestions,
        percentage: Math.round((answeredQuestions / totalQuestions) * 100),
        sections: sectionCounts
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
    if (confirm('Tem certeza que deseja limpar todas as respostas do formulário atual?')) {
        localStorage.removeItem('unifenas_survey_draft');
        
        // Limpa campos de texto
        const form = document.getElementById('interview-form');
        const textFields = form.querySelectorAll('input[type="text"], textarea');
        textFields.forEach(field => field.value = '');

        // Limpa radios
        const radios = form.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.checked = false;
            radio.parentElement.classList.remove('checked');
        });

        // Volta ao início
        switchTab(0);
    }
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
