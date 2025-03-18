let score = 0, timeLeft, interval, totalClicks = 0, totalMisses = 0;
let attemptNumber = 1; // Contador de tentativas
let autoMode = false; // Estado do modo automático
let reactionTimes = []; // Array para armazenar os tempos de reação
let lastTargetTime; // Tempo em que o último alvo apareceu
let currentDifficulty = 100; // Tamanho inicial do alvo
let timeoutId; // ID do temporizador para contabilizar erros no modo automático

function goToScreen(screenNumber) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(`screen${screenNumber}`).classList.add('active');
}

function startGame() {
    score = 0;
    totalClicks = 0;
    totalMisses = 0;
    reactionTimes = []; // Reinicia o array de tempos de reação
    autoMode = document.getElementById('autoMode').checked; // Atualiza o estado do modo automático
    document.getElementById('score').innerText = score;
    timeLeft = parseInt(document.getElementById('duration').value);
    document.getElementById('time').innerText = timeLeft;
    currentDifficulty = parseInt(document.getElementById('difficulty').value); // Define a dificuldade inicial
    let targetColor = document.getElementById('targetColor').value;
    let gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = '';
    let target = createTarget(currentDifficulty, targetColor);
    gameContainer.appendChild(target);
    moveTarget(target);

    if (autoMode) {
        // Modo automático: pontua ao passar o mouse sobre o alvo
        target.addEventListener('mouseover', () => {
            clearTimeout(timeoutId); // Cancela o temporizador de erro
            const reactionTime = performance.now() - lastTargetTime;
            reactionTimes.push(reactionTime); // Armazena o tempo de reação
            score++;
            document.getElementById('score').innerText = score;
            playSound('hitSound');
            target.classList.add('glow');
            setTimeout(() => target.classList.remove('glow'), 500);
            increaseDifficulty(); // Aumenta a dificuldade
            moveTarget(target);
            startErrorTimer(); // Reinicia o temporizador de erro
        });

        // Inicia o temporizador de erro para o modo automático
        startErrorTimer();
    } else {
        // Modo manual: pontua ao clicar no alvo
        target.addEventListener('click', () => {
            score++;
            document.getElementById('score').innerText = score;
            playSound('hitSound');
            target.classList.add('glow');
            setTimeout(() => target.classList.remove('glow'), 500);
            increaseDifficulty(); // Aumenta a dificuldade
            moveTarget(target);
        });

        // Contabiliza erros no modo manual (cliques fora do alvo)
        gameContainer.addEventListener('click', (e) => {
            if (e.target !== target) {
                totalMisses++;
                playSound('missSound');
            }
            totalClicks++;
        });
    }

    goToScreen(3);
    interval = setInterval(updateGame, 1000);
}

function startErrorTimer() {
    if (autoMode) {
        // Define um tempo limite para passar o mouse sobre o alvo (ex: 2 segundos)
        const errorTimeLimit = 2000; // 2 segundos
        timeoutId = setTimeout(() => {
            totalMisses++; // Contabiliza um erro
            document.getElementById('misses').innerText = totalMisses; // Atualiza a exibição de erros
            playSound('missSound');
            moveTarget(document.querySelector('.quadrant')); // Move o alvo para uma nova posição
            startErrorTimer(); // Reinicia o temporizador de erro
        }, errorTimeLimit);
    }
}

function createTarget(size, color) {
    let target = document.createElement('div');
    target.classList.add('quadrant');
    target.style.width = size + 'px';
    target.style.height = size + 'px';
    target.style.backgroundColor = color;
    return target;
}

function moveTarget(target) {
    let maxX = 600 - target.offsetWidth;
    let maxY = 600 - target.offsetHeight;
    target.style.left = Math.floor(Math.random() * maxX) + 'px';
    target.style.top = Math.floor(Math.random() * maxY) + 'px';
    lastTargetTime = performance.now(); // Registrar o tempo em que o alvo apareceu
}

function increaseDifficulty() {
    // Reduz o tamanho do alvo em 5% a cada 5 acertos
    if (score % 5 === 0 && currentDifficulty > 20) {
        currentDifficulty *= 0.95;
        let target = document.querySelector('.quadrant');
        target.style.width = currentDifficulty + 'px';
        target.style.height = currentDifficulty + 'px';
    }
}

function playSound(soundId) {
    let sound = document.getElementById(soundId);
    sound.currentTime = 0; // Reinicia o som para permitir repetição rápida
    sound.play();
}

function updateGame() {
    timeLeft--;
    document.getElementById('time').innerText = timeLeft;
    document.getElementById('progress').style.width = `${(timeLeft / parseInt(document.getElementById('duration').value)) * 100}%`;
    if (timeLeft <= 0) {
        clearInterval(interval);
        endGame();
    }
}

function endGame() {
    clearTimeout(timeoutId); // Cancela o temporizador de erro ao finalizar o jogo
    const duration = parseInt(document.getElementById('duration').value);
    const hitsPerSecond = (score / duration).toFixed(2);
    const clicksPerSecond = (totalClicks / duration).toFixed(2);
    const targetEfficiency = ((score / (score + totalMisses)) * 100).toFixed(2); // Eficiência corrigida
    const clickAccuracy = ((score / totalClicks) * 100).toFixed(2);

    // Calcular métricas do Modo Automático
    const metrics = calculateMetrics();

    // Exibir as métricas na tela de resultados
    if (autoMode) {
        document.getElementById('autoResults').style.display = 'grid';
        document.getElementById('manualStats').style.display = 'none';
        document.getElementById('finalScoreAuto').innerText = score;
        document.getElementById('averageTimeResult').innerText = `${metrics.averageTime.toFixed(2)}ms`;
        document.getElementById('bestTimeResult').innerText = `${metrics.bestTime.toFixed(2)}ms`;
        document.getElementById('worstTimeResult').innerText = `${metrics.worstTime.toFixed(2)}ms`;
        document.getElementById('consistencyResult').innerText = `${metrics.standardDeviation.toFixed(2)}ms`;
    } else {
        document.getElementById('autoResults').style.display = 'none';
        document.getElementById('manualStats').style.display = 'grid';
        document.getElementById('finalScore').innerText = score;
        document.getElementById('hits').innerText = score;
        document.getElementById('misses').innerText = totalMisses;
        document.getElementById('hitsPerSecond').innerText = hitsPerSecond;
        document.getElementById('clicksHits').innerText = score;
        document.getElementById('clicksMisses').innerText = totalMisses;
        document.getElementById('clicksPerSecond').innerText = clicksPerSecond;
        document.getElementById('targetEfficiency').innerText = `${targetEfficiency}%`;
        document.getElementById('clickAccuracy').innerText = `${clickAccuracy}%`;
    }

    saveGameData(metrics);
    goToScreen(4);
}

function calculateMetrics() {
    if (reactionTimes.length === 0) return { averageTime: 0, bestTime: 0, worstTime: 0, standardDeviation: 0 };

    const totalTime = reactionTimes.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / reactionTimes.length;
    const bestTime = Math.min(...reactionTimes);
    const worstTime = Math.max(...reactionTimes);
    const standardDeviation = Math.sqrt(
        reactionTimes.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / reactionTimes.length
    );

    return { averageTime, bestTime, worstTime, standardDeviation, reactionTimes };
}

function restartGame() {
    startGame();
}

function saveGameData(metrics) {
    let playerName = document.getElementById('playerName').value;
    let playerGroup = document.getElementById('playerGroup').value;
    let gameData = JSON.parse(localStorage.getItem('gameAttempts')) || [];

    const duration = parseInt(document.getElementById('duration').value);
    const hitsPerSecond = (score / duration).toFixed(2);
    const clicksPerSecond = (totalClicks / duration).toFixed(2);
    const targetEfficiency = ((score / (score + totalMisses)) * 100).toFixed(2); // Eficiência corrigida
    const clickAccuracy = ((score / totalClicks) * 100).toFixed(2);

    let newAttempt = {
        attempt: attemptNumber++,
        name: playerName,
        group: playerGroup,
        score: score,
        difficulty: document.getElementById('difficulty').value,
        duration: document.getElementById('duration').value,
        autoMode: autoMode,
        hits: score,
        misses: totalMisses, // Erros contabilizados em ambos os modos
        hitsPerSecond: hitsPerSecond,
        clicksHits: autoMode ? null : score, // Cliques só no Modo Manual
        clicksMisses: autoMode ? null : totalMisses, // Erros de cliques só no Modo Manual
        clicksPerSecond: autoMode ? null : clicksPerSecond, // Cliques por segundo só no Modo Manual
        targetEfficiency: `${targetEfficiency}%`, // Eficiência corrigida
        clickAccuracy: autoMode ? null : `${clickAccuracy}%`, // Precisão só no Modo Manual
        averageTime: autoMode ? metrics.averageTime.toFixed(2) : null, // Tempo médio só no Modo Automático
        bestTime: autoMode ? metrics.bestTime.toFixed(2) : null, // Melhor tempo só no Modo Automático
        worstTime: autoMode ? metrics.worstTime.toFixed(2) : null, // Pior tempo só no Modo Automático
        consistency: autoMode ? metrics.standardDeviation.toFixed(2) : null, // Consistência só no Modo Automático
        reactionTimes: autoMode ? metrics.reactionTimes : null, // Tempos de reação só no Modo Automático
        timestamp: new Date().toISOString()
    };

    gameData.push(newAttempt);
    localStorage.setItem('gameAttempts', JSON.stringify(gameData));
}

function finalizeGame() {
    // Obtém os dados do localStorage
    const gameData = JSON.parse(localStorage.getItem('gameAttempts')) || [];
    const playerName = document.getElementById('playerName').value;
    const playerGroup = document.getElementById('playerGroup').value;
    const fileName = `tentativas_${playerName}_${playerGroup}.csv`;

    // Cria o cabeçalho do CSV
    let csvContent = "Tentativa,Nome,Grupo,Pontuação,Dificuldade,Duração,Modo Automático,Acertos,Erros,Acertos/s,Cliques Acertados,Cliques Errados,Cliques/s,Eficiência Alvo,Precisão Clique,Tempo Médio (ms),Melhor Tempo (ms),Pior Tempo (ms),Consistência (ms),Data,Hora\n";

    // Função para formatar a data no padrão dd/mm/yyyy
    function formatarData(data) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    // Função para formatar o horário no padrão hh:mm:ss
    function formatarHora(data) {
        const horas = String(data.getHours()).padStart(2, '0');
        const minutos = String(data.getMinutes()).padStart(2, '0');
        const segundos = String(data.getSeconds()).padStart(2, '0');
        return `${horas}:${minutos}:${segundos}`;
    }

    // Adiciona os dados de cada tentativa ao CSV
    gameData.forEach(attempt => {
        // Extrai a data e o horário do timestamp
        const timestamp = new Date(attempt.timestamp);
        const data = formatarData(timestamp); // Formato dd/mm/yyyy
        const hora = formatarHora(timestamp); // Formato hh:mm:ss

        const row = [
            attempt.attempt,
            attempt.name,
            attempt.group,
            attempt.score,
            attempt.difficulty,
            attempt.duration,
            attempt.autoMode ? "Sim" : "Não",
            attempt.hits,
            attempt.misses,
            attempt.hitsPerSecond,
            attempt.clicksHits || "N/A",
            attempt.clicksMisses || "N/A",
            attempt.clicksPerSecond || "N/A",
            attempt.targetEfficiency,
            attempt.clickAccuracy || "N/A",
            attempt.averageTime || "N/A",
            attempt.bestTime || "N/A",
            attempt.worstTime || "N/A",
            attempt.consistency || "N/A",
            data, // Coluna de data
            hora  // Coluna de horário
        ].map(field => `"${field}"`).join(","); // Adiciona aspas para evitar problemas com vírgulas

        csvContent += row + "\n";
    });

    // Cria um link para download do arquivo CSV
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Adiciona BOM para garantir UTF-8
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    // Limpa o localStorage e reinicia o jogo
    localStorage.removeItem('gameAttempts');
    attemptNumber = 1; // Reinicia o contador de tentativas
    goToScreen(1);
}