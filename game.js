// 24点游戏实际求解器与UI交互
import { Solver } from './solver.js';
import { NumberExpression, BinaryExpression } from './expression.js';
import { solveFromCommandLine } from './main.js';
import { challengeData } from './challengeData.js';

// 游戏状态变量
let currentGame = null;
let currentCards = [];
let solver = new Solver(24); // 创建24点求解器实例
let inChallengeMode = false; // 是否在闯关模式
let currentLevel = 0; // 当前关卡
let currentLevelPassed = false; // 当前关卡是否通过
let isCalculatingAnswers = false; // 是否正在计算答案
let pendingCalculation = null; // 存储待计算的操作
let calculationWorker = null; // 计算用的Worker

// 卡片相关常量
const SUITS = ['♥', '♦', '♠', '♣'];
const RED_SUITS = ['♥', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const VALUE_MAP = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

// DOM元素
const dealBtn = document.getElementById('deal-btn');
const customBtn = document.getElementById('custom-btn');
const submitCustomBtn = document.getElementById('submit-custom');
const customInput = document.getElementById('custom-input');
const submitBtn = document.getElementById('submit-btn');
const showAnswerBtn = document.getElementById('show-answer-btn');
const answerInput = document.getElementById('answer-input');
const resultMessage = document.getElementById('result-message');
const solutionsContainer = document.getElementById('solutions-container');
const solutionsList = document.getElementById('solutions-list');
const cardElements = [
    document.getElementById('card1'),
    document.getElementById('card2'),
    document.getElementById('card3'),
    document.getElementById('card4')
];
const numberInputs = [
    document.getElementById('num1'),
    document.getElementById('num2'),
    document.getElementById('num3'),
    document.getElementById('num4')
];

// 闯关模式相关DOM元素
const challengeBtn = document.getElementById('challenge-btn');
const challengeInfo = document.getElementById('challenge-info');
const challengeLevel = document.getElementById('challenge-level');
const nextChallengeBtn = document.getElementById('next-challenge');
const prevChallengeBtn = document.getElementById('prev-challenge');

// 初始化计算Worker
function initCalculationWorker() {
    // Worker代码 - 将在独立线程中运行
    const workerCode = `
        // 操作符
        const operators = ['+', '-', '*', '/'];

        // 表达式类
        class Expression {
            constructor(value, repr) {
                this.value = value;
                this.repr = repr;
            }
            
            toString() {
                return this.repr;
            }
        }

        // 数字表达式
        class NumberExpression extends Expression {
            constructor(value) {
                super(value, String(value));
            }
        }

        // 二元表达式
        class BinaryExpression extends Expression {
            constructor(op, left, right) {
                let value;
                switch (op) {
                    case '+': value = left.value + right.value; break;
                    case '-': value = left.value - right.value; break;
                    case '*': value = left.value * right.value; break;
                    case '/': value = left.value / right.value; break;
                }
                
                // 构建表达式字符串
                let repr;
                if (op === '+' || op === '-') {
                    repr = \`\${left.toString()}\${op}\${right.toString()}\`;
                } else {
                    // 乘除法优先级高，需要考虑括号
                    let leftRepr = left.toString();
                    if (left instanceof BinaryExpression && (left.op === '+' || left.op === '-')) {
                        leftRepr = \`(\${leftRepr})\`;
                    }
                    
                    let rightRepr = right.toString();
                    if (right instanceof BinaryExpression && (right.op === '+' || right.op === '-')) {
                        rightRepr = \`(\${rightRepr})\`;
                    }
                    
                    repr = \`\${leftRepr}\${op}\${rightRepr}\`;
                }
                
                super(value, repr);
                this.op = op;
                this.left = left;
                this.right = right;
            }
        }

        // 求解24点
        function solve24(numbers) {
            if (numbers.length !== 4) {
                return [];
            }
            
            // 将数字转换为表达式
            const exprs = numbers.map(n => new NumberExpression(Number(n)));
            
            // 所有可能的结果
            const solutions = [];
            
            // 递归函数
            function combine(expressions) {
                if (expressions.length === 1) {
                    // 检查是否等于24
                    const value = expressions[0].value;
                    if (Math.abs(value - 24) < 0.0001) {
                        solutions.push(expressions[0]);
                    }
                    return;
                }
                
                // 尝试所有可能的组合
                for (let i = 0; i < expressions.length; i++) {
                    for (let j = 0; j < expressions.length; j++) {
                        if (i === j) continue; // 不能使用同一个表达式
                        
                        // 创建新的表达式列表，排除已使用的
                        const newExpressions = [];
                        for (let k = 0; k < expressions.length; k++) {
                            if (k !== i && k !== j) {
                                newExpressions.push(expressions[k]);
                            }
                        }
                        
                        // 尝试所有操作符
                        for (const op of operators) {
                            // 避免无意义的操作
                            if ((op === '+' || op === '*') && i > j) continue; // 加法和乘法满足交换律
                            if (op === '/' && expressions[j].value === 0) continue; // 除数不能为0
                            
                            // 创建新表达式
                            const newExpr = new BinaryExpression(op, expressions[i], expressions[j]);
                            newExpressions.push(newExpr);
                            
                            // 递归
                            combine(newExpressions);
                            
                            // 回溯
                            newExpressions.pop();
                        }
                    }
                }
            }
            
            // 开始求解
            combine(exprs);
            
            // 返回所有不同的解法
            const uniqueSolutions = [];
            const seen = new Set();
            
            for (const solution of solutions) {
                const str = solution.toString();
                if (!seen.has(str)) {
                    seen.add(str);
                    uniqueSolutions.push(str);
                }
            }
            
            return uniqueSolutions;
        }

        // 监听消息
        self.addEventListener('message', function(e) {
            const numbers = e.data;
            
            try {
                // 计算24点解法
                const solutions = solve24(numbers);
                
                // 返回结果
                self.postMessage({
                    status: 'success',
                    solutions: solutions
                });
            } catch (error) {
                // 返回错误
                self.postMessage({
                    status: 'error',
                    message: error.message
                });
            }
        });
    `;

    // 创建Blob URL
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const blobURL = URL.createObjectURL(blob);

    // 创建Worker
    calculationWorker = new Worker(blobURL);

    // 设置消息处理
    calculationWorker.onmessage = function (e) {
        const result = e.data;
        isCalculatingAnswers = false;

        if (result.status === 'success') {
            // 更新游戏数据
            if (currentGame) {
                currentGame.solutions = result.solutions;
                // 更新解决方案数量
                if (result.solutions.length > 0) {
                    updateSolutionCount();
                } else {
                    setResultMessage('该组合没有找到解法', 'warning');
                }

                // 计算完成后保存游戏状态
                saveGameState();
            }
        } else {
            console.error('计算答案出错:', result.message);
            setResultMessage('计算答案出错，但你仍可以尝试解题', 'error');
        }
    };

    // 设置错误处理
    calculationWorker.onerror = function (error) {
        console.error('Worker错误:', error);
        isCalculatingAnswers = false;
        setResultMessage('计算答案时出错，但你仍可以尝试解题', 'error');
    };

    // 清理函数
    return function () {
        if (calculationWorker) {
            calculationWorker.terminate();
            URL.revokeObjectURL(blobURL);
        }
    };
}

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载，开始初始化游戏...');

    // 先尝试恢复游戏状态，避免自动发牌
    const hasRestoredState = tryRestoreGameState();

    // 初始化计算Worker
    const cleanupWorker = initCalculationWorker();

    // 页面卸载时清理Worker
    window.addEventListener('unload', cleanupWorker);

    // 注册事件监听器
    dealBtn.addEventListener('click', dealCards);
    customBtn.addEventListener('click', toggleCustomInput);
    submitCustomBtn.addEventListener('click', handleCustomNumbers);
    submitBtn.addEventListener('click', checkAnswer);
    showAnswerBtn.addEventListener('click', toggleSolutions);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    // 监听输入框变化以检测密码
    answerInput.addEventListener('input', checkSecretCode);

    // 为数字输入框添加回车事件
    numberInputs.forEach((input, index) => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (index < numberInputs.length - 1) {
                    // 移动到下一个输入框
                    numberInputs[index + 1].focus();
                } else {
                    // 最后一个输入框回车时提交
                    handleCustomNumbers();
                }
            }
        });
    });

    // 闯关模式按钮事件
    challengeBtn.addEventListener('click', toggleChallengeMode);
    nextChallengeBtn.addEventListener('click', () => navigateChallenge(1));
    prevChallengeBtn.addEventListener('click', () => navigateChallenge(-1));

    // 在正常模式下隐藏上一关和下一关按钮
    prevChallengeBtn.style.display = 'none';
    nextChallengeBtn.style.display = 'none';

    // 如果没有恢复状态，才默认发牌
    if (!hasRestoredState) {
        // 恢复游戏状态
        restoreGameState();
    }
});

// 尝试恢复游戏状态，返回是否成功恢复
function tryRestoreGameState() {
    try {
        const gameStateStr = localStorage.getItem('gameState');
        console.log('尝试恢复游戏状态:', gameStateStr);

        if (gameStateStr) {
            const gameState = JSON.parse(gameStateStr);
            console.log('解析的游戏状态:', gameState);

            // 如果之前是在闯关模式，恢复闯关模式
            if (gameState.inChallengeMode) {
                inChallengeMode = true;
                currentLevel = gameState.currentLevel;
                currentLevelPassed = gameState.currentLevelPassed;

                // 进入闯关模式
                enterChallengeMode();
                return true;
            } else {
                // 如果有保存的题目状态，先恢复它
                if (gameState.currentCards && gameState.currentCards.length === 4 && gameState.currentGame) {
                    console.log('恢复之前的题目:', gameState.currentCards);

                    // 恢复卡片和游戏状态
                    currentCards = gameState.currentCards;
                    currentGame = gameState.currentGame;

                    // 渲染卡片
                    renderCards();

                    // 更新解法计数，如果已经计算过
                    if (currentGame.solutions && currentGame.solutions.length > 0) {
                        updateSolutionCount();
                    } else {
                        setResultMessage('思考中...（你可以先开始思考答案）', 'info');
                        // 尝试重新计算答案
                        const numbers = currentCards.map(card => card.numericValue);
                        calculateAnswersWithWorker(numbers);
                    }
                    return true;
                }
            }
        }
        return false;
    } catch (e) {
        console.error('恢复游戏状态失败:', e);
        return false;
    }
}

// 恢复游戏状态
function restoreGameState() {
    // 如果尝试恢复失败，则发一副新牌
    if (!tryRestoreGameState()) {
        console.log('没有找到保存的游戏状态或状态无效，生成新题目');
        dealCards();
    }
}

// 检查是否输入了特殊密码
function checkSecretCode() {
    if (inChallengeMode && answerInput.value.trim() === '4nums.com') {
        showChallengeAnswers();
    }
}

// 显示闯关模式答案
function showChallengeAnswers() {
    const levelData = challengeData[currentLevel];  // 直接使用数组索引
    if (levelData && levelData.solutions.length > 0) {
        setResultMessage(`第 ${currentLevel + 1} 关答案：${levelData.solutions[0]}`, 'info');
    }
}

// 检查答案
function checkAnswer() {
    if (!currentGame || currentCards.length !== 4) {
        setResultMessage('请先发牌或输入题目', 'error');
        return;
    }

    const userAnswer = answerInput.value.trim();

    if (userAnswer === '') {
        setResultMessage('请输入你的答案', 'error');
        return;
    }

    // 检查特殊密码以显示答案
    if (userAnswer === '4nums.com' && inChallengeMode) {
        showChallengeAnswers();
        return;
    }

    try {
        // 计算用户表达式
        const result = evaluateExpression(userAnswer);

        // 四舍五入到很小的误差范围
        const roundedResult = Math.round(result * 1000000) / 1000000;

        // 验证使用的数字是否正确
        const usedNumbers = extractNumbersFromExpression(userAnswer);
        const currentNumbers = currentCards.map(card => card.numericValue);

        // 检查数字是否有效
        if (!areValidNumbers(usedNumbers, currentNumbers)) {
            setResultMessage('你使用了错误的数字，请只使用给定的四个数字', 'error');
            return;
        }

        // 检查计算结果
        if (roundedResult === 24) {
            setResultMessage('恭喜！你的答案正确！', 'success');

            // 如果在闯关模式，添加关卡完成动画并解锁下一关
            if (inChallengeMode) {
                document.querySelector('.game-area').classList.add('level-complete');
                setTimeout(() => {
                    document.querySelector('.game-area').classList.remove('level-complete');
                }, 1000);

                // 标记当前关卡为已通过
                currentLevelPassed = true;

                // 更新关卡解锁状态
                updateChallengeLevel();

                // 保存当前进度到localStorage
                saveProgress();

                // 保存游戏状态
                saveGameState();
            }

            // 显示所有可能的解法
            if (!inChallengeMode && !solutionsContainer.classList.contains('visible')) {
                toggleSolutions();
            }
        } else {
            setResultMessage(`计算结果为 ${roundedResult}，不等于 24`, 'error');
        }
    } catch (e) {
        setResultMessage('表达式不正确: ' + e.message, 'error');
    }
}

// 评估表达式
function evaluateExpression(expression) {
    // 替换所有字母为对应的数值（处理如A, J, Q, K）
    let expr = expression.replace(/[A-Za-z]/g, match => {
        const upperMatch = match.toUpperCase();
        if (VALUE_MAP[upperMatch]) {
            return VALUE_MAP[upperMatch];
        }
        return match;
    });

    // 将表达式中的×替换为*，÷替换为/
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/');

    // 计算表达式
    try {
        // 创建一个沙盒函数来计算表达式
        const calculatorFn = new Function('return ' + expr);
        return calculatorFn();
    } catch (e) {
        console.error('表达式计算错误:', e);
        throw new Error('无法计算表达式');
    }
}

// 从表达式中提取数字
function extractNumbersFromExpression(expression) {
    // 替换所有字母为对应的数值
    let expr = expression.replace(/[A-Za-z]/g, match => {
        const upperMatch = match.toUpperCase();
        if (VALUE_MAP[upperMatch]) {
            return VALUE_MAP[upperMatch];
        }
        return match;
    });

    // 提取所有数字
    const numbers = [];
    const matches = expr.match(/\d+/g);

    if (matches) {
        matches.forEach(match => {
            numbers.push(parseInt(match, 10));
        });
    }

    return numbers;
}

// 检查使用的数字是否有效
function areValidNumbers(usedNumbers, currentNumbers) {
    // 如果数量不同，直接返回false
    if (usedNumbers.length !== currentNumbers.length) {
        return false;
    }

    // 复制一份当前数字数组，以便进行修改
    const availableNumbers = [...currentNumbers];

    // 检查每个使用的数字是否在可用数字中
    for (const num of usedNumbers) {
        const index = availableNumbers.indexOf(num);
        if (index === -1) {
            return false;
        }
        // 从可用数字中移除已使用的数字
        availableNumbers.splice(index, 1);
    }

    // 如果所有数字都匹配，返回true
    return true;
}

// 切换自定义输入显示状态
function toggleCustomInput() {
    customInput.classList.toggle('hidden');

    // 如果显示了输入框，则自动聚焦到第一个输入框
    if (!customInput.classList.contains('hidden')) {
        numberInputs[0].focus();
    }
}

// 处理自定义数字
function handleCustomNumbers() {
    // 获取输入的四个数字
    const numbers = [];
    let isValid = true;

    for (const input of numberInputs) {
        const value = parseInt(input.value);
        if (isNaN(value) || value < 1 || value > 13) {
            isValid = false;
            break;
        }
        numbers.push(value);
    }

    if (!isValid || numbers.length !== 4) {
        setResultMessage('请输入4个有效数字（1-13之间）', 'error');
        return;
    }

    // 先创建卡片并显示界面
    createCardsFromNumbers(numbers);

    // 隐藏自定义输入并清空
    customInput.classList.add('hidden');
    numberInputs.forEach(input => input.value = '');

    // 显示思考中提示
    setResultMessage('思考中...（你可以先开始思考答案）', 'info');

    // 先设置一个空的游戏对象，让界面可用
    currentGame = {
        numbers: numbers,
        solutions: []
    };

    // 在Web Worker中计算答案
    calculateAnswersWithWorker(numbers);

    // 保存当前游戏状态到localStorage
    saveGameState();
}

// 创建卡片从数字
function createCardsFromNumbers(numbers) {
    currentCards = numbers.map(num => {
        const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
        let value = Object.keys(VALUE_MAP).find(k => VALUE_MAP[k] === num);
        return { suit, value, numericValue: num };
    });

    // 渲染卡片
    renderCards();
}

// 处理发牌
function dealCards() {
    resetUI();

    // 如果在闯关模式，直接加载当前关卡
    if (inChallengeMode) {
        loadChallengeLevel(currentLevel);
        return;
    }

    // 随机生成4个1-13之间的数字
    const numbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);

    // 先创建卡片并显示界面
    createCardsFromNumbers(numbers);

    // 随机打乱卡片顺序
    currentCards.sort(() => Math.random() - 0.5);

    // 显示思考中提示
    setResultMessage('思考中...（你可以先开始思考答案）', 'info');

    // 先设置一个空的游戏对象，让界面可用
    currentGame = {
        numbers: numbers,
        solutions: []
    };

    // 在Web Worker中计算答案
    calculateAnswersWithWorker(numbers);

    // 保存当前游戏状态到localStorage
    saveGameState();
}

// 使用Web Worker计算答案
function calculateAnswersWithWorker(numbers) {
    if (!calculationWorker) {
        console.error('计算Worker未初始化');
        setResultMessage('计算服务不可用，但你仍可以尝试解题', 'warning');
        return;
    }

    // 如果已经在计算中，取消之前的计算
    if (isCalculatingAnswers) {
        // Web Worker无法直接取消任务，但可以忽略旧结果
        console.log('有计算任务正在进行，新结果将覆盖旧结果');
    }

    isCalculatingAnswers = true;

    // 发送消息给Worker，启动计算
    calculationWorker.postMessage(numbers);
}

// 更新解决方案数量显示
function updateSolutionCount() {
    if (currentGame && currentGame.solutions && currentGame.solutions.length > 0) {
        setResultMessage(`该组合有 ${currentGame.solutions.length} 种可能的解法`, 'info');
    } else {
        setResultMessage('该组合没有找到解法', 'warning');
    }
}

// 渲染卡片
function renderCards() {
    cardElements.forEach((element, index) => {
        if (index < currentCards.length) {
            const card = currentCards[index];
            const isRed = RED_SUITS.includes(card.suit);

            // 构建卡片HTML
            element.innerHTML = `
                <span class="suit top-suit">${card.suit}</span>
                <span class="value">${card.value}</span>
                <span class="suit bottom-suit">${card.suit}</span>
            `;

            // 设置卡片颜色
            element.className = 'card';
            if (isRed) {
                element.classList.add('red');
            } else {
                element.classList.add('black');
            }
        } else {
            element.innerHTML = '';
            element.className = 'card';
        }
    });

    // 清空答案输入
    answerInput.value = '';

    // 隐藏解决方案
    solutionsContainer.classList.remove('visible');
}

// 切换显示解决方案
function toggleSolutions() {
    // 如果没有卡牌或者不是四张，直接返回
    if (!currentGame || currentCards.length !== 4) {
        setResultMessage('请先发牌或输入题目', 'error');
        return;
    }

    // 检查是否在闯关模式
    if (inChallengeMode) {
        // 在闯关模式下，只能通过密码查看答案
        setResultMessage('在闯关模式中，输入 4nums.com 可查看答案', 'info');
        return;
    }

    // 如果答案还在计算中
    if (isCalculatingAnswers) {
        setResultMessage('答案正在计算中，请稍候...', 'info');
        return;
    }

    // 使用当前游戏的解法
    const solutions = currentGame.solutions;

    // 显示或隐藏解法
    if (solutionsContainer.classList.contains('visible')) {
        solutionsContainer.classList.remove('visible');
        showAnswerBtn.textContent = '查看答案';
    } else {
        // 填充解法列表
        solutionsList.innerHTML = '';

        if (solutions.length === 0) {
            solutionsList.innerHTML = '<div class="no-solution">没有找到解法</div>';
        } else {
            solutions.forEach((solution, index) => {
                const solutionElement = document.createElement('div');
                solutionElement.className = 'solution-item';
                solutionElement.textContent = `${index + 1}: ${solution}`;
                solutionsList.appendChild(solutionElement);
            });
        }

        solutionsContainer.classList.add('visible');
        showAnswerBtn.textContent = '隐藏答案';
    }
}

// 设置结果消息
function setResultMessage(message, type) {
    resultMessage.textContent = message;
    resultMessage.className = 'message';

    if (type) {
        resultMessage.classList.add(type);
    }
}

// 重置UI状态
function resetUI() {
    // 隐藏自定义输入和闯关信息
    customInput.classList.add('hidden');

    // 如果不在闯关模式，也隐藏闯关信息
    if (!inChallengeMode) {
        challengeInfo.classList.add('hidden');
        document.querySelector('.game-area').classList.remove('challenge-mode');
    }

    // 隐藏解法
    solutionsContainer.classList.remove('visible');
    showAnswerBtn.textContent = '查看答案';

    // 清空输入
    answerInput.value = '';
    numberInputs.forEach(input => input.value = '');

    // 清除消息
    setResultMessage('', '');
}

// 切换闯关模式（进入或退出）
function toggleChallengeMode() {
    if (inChallengeMode) {
        exitChallengeMode();
    } else {
        enterChallengeMode();
    }

    // 保存游戏模式状态
    saveGameState();
}

// 进入闯关模式
function enterChallengeMode() {
    inChallengeMode = true;

    // 从localStorage读取进度
    loadProgress();

    // 更新UI显示
    challengeBtn.textContent = '正常模式';
    dealBtn.style.display = 'none';
    customBtn.style.display = 'none';
    showAnswerBtn.style.display = 'none'; // 隐藏"查看答案"按钮

    // 显示上一关和下一关按钮
    prevChallengeBtn.style.display = '';
    nextChallengeBtn.style.display = '';

    // 将上一关/下一关按钮移到顶部按钮区域
    document.querySelector('.button-group').appendChild(prevChallengeBtn);
    document.querySelector('.button-group').appendChild(nextChallengeBtn);

    // 加载当前关卡
    loadChallengeLevel(currentLevel);

    // 显示关卡信息
    challengeInfo.classList.remove('hidden');
    document.querySelector('.game-area').classList.add('challenge-mode');

    // 隐藏答案区域
    solutionsContainer.classList.remove('visible');

    // 更新关卡显示
    updateChallengeLevel();

    setResultMessage('闯关模式已开启！', 'info');
}

// 退出闯关模式
function exitChallengeMode() {
    inChallengeMode = false;

    // 更新UI显示
    challengeBtn.textContent = '闯关模式';
    dealBtn.style.display = '';
    customBtn.style.display = '';
    showAnswerBtn.style.display = ''; // 恢复"查看答案"按钮

    // 隐藏上一关和下一关按钮
    prevChallengeBtn.style.display = 'none';
    nextChallengeBtn.style.display = 'none';

    // 隐藏关卡信息
    challengeInfo.classList.add('hidden');
    document.querySelector('.game-area').classList.remove('challenge-mode');

    // 重置UI状态
    resetUI();

    // 立即发一副新牌
    dealCards();

    setResultMessage('已退出闯关模式，自动发牌', 'info');
}

// 更新关卡显示
function updateChallengeLevel() {
    challengeLevel.textContent = `第 ${currentLevel + 1} 关`;

    // 控制前后导航按钮的可用状态
    prevChallengeBtn.disabled = currentLevel <= 0;

    // 下一关按钮只有当前关通过后才能点击，或者这一关之前已经通过
    const maxLevelPassed = parseInt(localStorage.getItem('maxLevelPassed') || '0');
    nextChallengeBtn.disabled = !(currentLevelPassed || currentLevel < maxLevelPassed);
}

// 导航到下一关或上一关
function navigateChallenge(direction) {
    const newLevel = currentLevel + direction;

    // 确保在有效范围内
    if (newLevel >= 0 && newLevel < challengeData.length) {
        // 如果是前进到下一关，检查当前关是否通过
        if (direction > 0) {
            const maxLevelPassed = parseInt(localStorage.getItem('maxLevelPassed') || '0');
            // 只有当前关已通过或者之前已经玩过这一关，才能进入下一关
            if (!(currentLevelPassed || currentLevel < maxLevelPassed)) {
                setResultMessage('请先通过当前关卡！', 'error');
                return;
            }
        }

        currentLevel = newLevel;
        currentLevelPassed = false; // 重置关卡通过状态
        updateChallengeLevel();
        loadChallengeLevel(currentLevel);

        // 保存游戏状态
        saveGameState();
    }
}

// 加载指定关卡
function loadChallengeLevel(level) {
    // 找到对应关卡数据
    const levelData = challengeData[level];  // 直接使用数组索引

    if (!levelData) {
        console.error(`未找到第${level + 1}关数据`);
        return;
    }

    // 保存当前游戏
    const numbers = levelData.numbers;
    const solutions = levelData.solutions;

    currentGame = {
        numbers: numbers,
        solutions: solutions
    };

    // 创建卡片
    createCardsFromNumbers(numbers);

    // 清空答案输入
    answerInput.value = '';

    // 隐藏答案区域
    solutionsContainer.classList.remove('visible');

    // 清除结果消息
    setResultMessage('', '');

    // 更新解决方案数量
    updateSolutionCount();

    // 检查当前关卡是否已经通过
    const maxLevelPassed = parseInt(localStorage.getItem('maxLevelPassed') || '0');
    currentLevelPassed = (level < maxLevelPassed);

    // 更新UI状态
    updateChallengeLevel();
}

// 保存进度到localStorage
function saveProgress() {
    // 获取当前已通过的最高关卡
    const maxLevelPassed = parseInt(localStorage.getItem('maxLevelPassed') || '0');

    // 如果当前关卡比已保存的最高关卡大，则更新
    if (currentLevel > maxLevelPassed) {
        localStorage.setItem('maxLevelPassed', currentLevel.toString());
    }
}

// 从localStorage加载进度
function loadProgress() {
    const maxLevelPassed = parseInt(localStorage.getItem('maxLevelPassed') || '0');

    // 如果有已保存的进度，从上次通过的关卡开始
    if (maxLevelPassed > 0) {
        currentLevel = maxLevelPassed;
    } else {
        currentLevel = 0;
    }

    // 新进入的关卡标记为未通过
    currentLevelPassed = false;
}

// 保存游戏状态到localStorage
function saveGameState() {
    try {
        // 创建一个干净的可序列化的状态对象
        const cleanCards = currentCards.map(card => ({
            suit: card.suit,
            value: card.value,
            numericValue: card.numericValue
        }));

        const cleanGame = {
            numbers: currentGame ? currentGame.numbers : [],
            solutions: currentGame ? currentGame.solutions : []
        };

        const gameState = {
            inChallengeMode: inChallengeMode,
            currentLevel: currentLevel,
            currentLevelPassed: currentLevelPassed,
            // 保存当前题目信息
            currentCards: cleanCards,
            currentGame: cleanGame
        };

        // 保存到localStorage
        localStorage.setItem('gameState', JSON.stringify(gameState));
        console.log('游戏状态已保存：', gameState);
    } catch (error) {
        console.error('保存游戏状态失败:', error);
    }
}

// 导出游戏方法
export {
    dealCards,
    checkAnswer,
    toggleSolutions,
    handleCustomNumbers,
    toggleCustomInput
}; 