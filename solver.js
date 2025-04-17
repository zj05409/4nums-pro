import { NumberExpression, BinaryExpression } from './expression.js';

/**
 * 24点游戏求解器
 */
class Solver {
    /**
     * 构造函数
     * @param {number} target 目标数值，默认为24
     */
    constructor(target = 24) {
        this.target = target;
        this.operators = ['+', '-', '*', '/'];
    }

    /**
     * 给定四个数，找出所有可能的组合方式
     * @param {number[]} numbers 四个数字
     * @returns {BinaryExpression[]} 所有可能的表达式
     */
    solve(numbers) {
        if (numbers.length !== 4) {
            throw new Error("必须提供4个数字");
        }

        // 将数字转换为表达式
        const numExprs = numbers.map(n => new NumberExpression(n));

        // 存储所有找到的解
        const allSolutions = [];

        // 尝试所有数字的排列
        this._generatePermutations(numExprs).forEach(perm => {
            this._solveWithPermutation([...perm], allSolutions);
        });

        // 检查特殊情况
        const specialSolutions = this._handleSpecialCases(numbers, allSolutions);
        if (specialSolutions.length > 0) {
            allSolutions.push(...specialSolutions);
        }

        // 对解集进行去重和偏好选择
        const normalizedSolutions = this._normalizeSolutions(allSolutions);

        // 验证所有解法使用了4个数字
        const validSolutions = this._validateSolutions(normalizedSolutions, new Set(numbers));

        return validSolutions;
    }

    /**
     * 生成所有可能的排列
     * @param {NumberExpression[]} arr 表达式数组
     * @returns {NumberExpression[][]} 所有可能的排列
     */
    _generatePermutations(arr) {
        const result = [];

        // 辅助函数，递归生成排列
        const permute = (current, remaining) => {
            if (remaining.length === 0) {
                result.push([...current]);
                return;
            }

            const used = new Set();

            for (let i = 0; i < remaining.length; i++) {
                const item = remaining[i];

                // 跳过重复元素，减少重复计算
                if (used.has(item.value)) continue;
                used.add(item.value);

                const newRemaining = [...remaining];
                newRemaining.splice(i, 1);

                current.push(item);
                permute(current, newRemaining);
                current.pop();
            }
        };

        permute([], arr);
        return result;
    }

    /**
     * 尝试一种排列的所有可能组合方式
     * @param {NumberExpression[]} numExprs 表达式数组
     * @param {BinaryExpression[]} solutions 解集
     */
    _solveWithPermutation(numExprs, solutions) {
        // 策略1: ((a op b) op c) op d
        for (const op1 of this.operators) {
            for (const op2 of this.operators) {
                for (const op3 of this.operators) {
                    const expr1 = new BinaryExpression(numExprs[0], op1, numExprs[1]);
                    const expr2 = new BinaryExpression(expr1, op2, numExprs[2]);
                    const expr3 = new BinaryExpression(expr2, op3, numExprs[3]);

                    try {
                        const result = expr3.evaluate();
                        if (Math.abs(result - this.target) < 1e-10) {
                            solutions.push(expr3);
                        }
                    } catch (e) {
                        // 除以零等情况
                    }
                }
            }
        }

        // 策略2: (a op b) op (c op d)
        for (const op1 of this.operators) {
            for (const op2 of this.operators) {
                for (const op3 of this.operators) {
                    const expr1 = new BinaryExpression(numExprs[0], op1, numExprs[1]);
                    const expr2 = new BinaryExpression(numExprs[2], op2, numExprs[3]);
                    const expr3 = new BinaryExpression(expr1, op3, expr2);

                    try {
                        const result = expr3.evaluate();
                        if (Math.abs(result - this.target) < 1e-10) {
                            solutions.push(expr3);
                        }
                    } catch (e) {
                        // 除以零等情况
                    }
                }
            }
        }

        // 策略3: a op ((b op c) op d)
        for (const op1 of this.operators) {
            for (const op2 of this.operators) {
                for (const op3 of this.operators) {
                    const expr1 = new BinaryExpression(numExprs[1], op1, numExprs[2]);
                    const expr2 = new BinaryExpression(expr1, op2, numExprs[3]);
                    const expr3 = new BinaryExpression(numExprs[0], op3, expr2);

                    try {
                        const result = expr3.evaluate();
                        if (Math.abs(result - this.target) < 1e-10) {
                            solutions.push(expr3);
                        }
                    } catch (e) {
                        // 除以零等情况
                    }
                }
            }
        }

        // 策略4: a op (b op (c op d))
        for (const op1 of this.operators) {
            for (const op2 of this.operators) {
                for (const op3 of this.operators) {
                    const expr1 = new BinaryExpression(numExprs[2], op1, numExprs[3]);
                    const expr2 = new BinaryExpression(numExprs[1], op2, expr1);
                    const expr3 = new BinaryExpression(numExprs[0], op3, expr2);

                    try {
                        const result = expr3.evaluate();
                        if (Math.abs(result - this.target) < 1e-10) {
                            solutions.push(expr3);
                        }
                    } catch (e) {
                        // 除以零等情况
                    }
                }
            }
        }

        // 策略5: (a op (b op c)) op d
        for (const op1 of this.operators) {
            for (const op2 of this.operators) {
                for (const op3 of this.operators) {
                    const expr1 = new BinaryExpression(numExprs[1], op1, numExprs[2]);
                    const expr2 = new BinaryExpression(numExprs[0], op2, expr1);
                    const expr3 = new BinaryExpression(expr2, op3, numExprs[3]);

                    try {
                        const result = expr3.evaluate();
                        if (Math.abs(result - this.target) < 1e-10) {
                            solutions.push(expr3);
                        }
                    } catch (e) {
                        // 除以零等情况
                    }
                }
            }
        }
    }

    /**
     * 处理特殊情况
     * @param {number[]} numbers 输入的数字
     * @param {BinaryExpression[]} existingSolutions 已有的解集
     * @returns {BinaryExpression[]} 特殊情况下的解集
     */
    _handleSpecialCases(numbers, existingSolutions) {
        const specialSolutions = [];

        // 检查是否有重复数字
        const numberCounts = {};
        for (const num of numbers) {
            numberCounts[num] = (numberCounts[num] || 0) + 1;
        }

        // 规则8：处理 {a, b, c, c} 的情况
        for (const [num, count] of Object.entries(numberCounts)) {
            if (count >= 2) {
                // 找到两个相同的数c
                const c = Number(num);
                const otherNums = numbers.filter(n => n !== c);

                if (otherNums.length === 2) { // 确认是{a,b,c,c}形式
                    const a = otherNums[0];
                    const b = otherNums[1];

                    // 规则8：a × b × c /c ↔ a × b + c - c
                    const multExpr = new BinaryExpression(
                        new BinaryExpression(new NumberExpression(a), '*', new NumberExpression(b)),
                        '+',
                        new BinaryExpression(new NumberExpression(c), '-', new NumberExpression(c))
                    );

                    try {
                        if (Math.abs(multExpr.evaluate() - this.target) < 1e-10) {
                            specialSolutions.push(multExpr);
                        }
                    } catch (e) {
                        // 处理可能的计算错误
                    }

                    // 规则8：(a + b) × c /c ↔ a + b + c - c
                    const addExpr = new BinaryExpression(
                        new BinaryExpression(new NumberExpression(a), '+', new NumberExpression(b)),
                        '+',
                        new BinaryExpression(new NumberExpression(c), '-', new NumberExpression(c))
                    );

                    try {
                        if (Math.abs(addExpr.evaluate() - this.target) < 1e-10) {
                            specialSolutions.push(addExpr);
                        }
                    } catch (e) {
                        // 处理可能的计算错误
                    }
                }
            }
        }

        // 规则8.b：处理 {a, b, 1, 1} 的情况
        if (numberCounts[1] >= 2) {
            const otherNums = numbers.filter(n => n !== 1);

            if (otherNums.length === 2) { // 确认是{a,b,1,1}形式
                const a = otherNums[0];
                const b = otherNums[1];

                // a × b × 1 × 1 ↔ a × b + 1 - 1
                const multExpr = new BinaryExpression(
                    new BinaryExpression(new NumberExpression(a), '*', new NumberExpression(b)),
                    '+',
                    new BinaryExpression(new NumberExpression(1), '-', new NumberExpression(1))
                );

                try {
                    if (Math.abs(multExpr.evaluate() - this.target) < 1e-10) {
                        specialSolutions.push(multExpr);
                    }
                } catch (e) {
                    // 处理可能的计算错误
                }

                // (a + b) × 1 × 1 ↔ a + b + 1 - 1
                const addExpr = new BinaryExpression(
                    new BinaryExpression(new NumberExpression(a), '+', new NumberExpression(b)),
                    '+',
                    new BinaryExpression(new NumberExpression(1), '-', new NumberExpression(1))
                );

                try {
                    if (Math.abs(addExpr.evaluate() - this.target) < 1e-10) {
                        specialSolutions.push(addExpr);
                    }
                } catch (e) {
                    // 处理可能的计算错误
                }
            }
        }

        // 规则8.c：处理包含24的情况
        if (numberCounts[24]) {
            const otherNums = numbers.filter(n => n !== 24);

            if (otherNums.length === 3) {
                // 尝试 24 + x - y，其中x和y有相同的值
                for (let i = 0; i < otherNums.length; i++) {
                    for (let j = i + 1; j < otherNums.length; j++) {
                        if (otherNums[i] === otherNums[j]) {
                            // 24 + c - c
                            const expr = new BinaryExpression(
                                new BinaryExpression(new NumberExpression(24), '+', new NumberExpression(otherNums[i])),
                                '-',
                                new NumberExpression(otherNums[j])
                            );

                            try {
                                if (Math.abs(expr.evaluate() - this.target) < 1e-10) {
                                    specialSolutions.push(expr);
                                }
                            } catch (e) {
                                // 处理可能的计算错误
                            }
                        }
                    }
                }
            }
        }

        return specialSolutions;
    }

    /**
     * 对解集进行规范化，去除等价解并选择偏好形式
     * @param {BinaryExpression[]} solutions 解集
     * @returns {BinaryExpression[]} 规范化后的解集
     */
    _normalizeSolutions(solutions) {
        if (solutions.length === 0) {
            return [];
        }

        // 先对所有解应用规范化
        const normalized = solutions.map(s => s.normalize());

        // 为每个解生成常见的等价形式
        const expandedSolutions = [];
        for (const sol of normalized) {
            expandedSolutions.push(sol);

            // 尝试生成等价形式，特别是对乘除法表达式
            const equivalentForms = this._generateEquivalentForms(sol);
            expandedSolutions.push(...equivalentForms);
        }

        // 用字符串表示来快速去除完全相同的解
        const uniqueStrMap = new Map();
        expandedSolutions.forEach((sol, i) => {
            const solStr = sol.toString();
            if (!uniqueStrMap.has(solStr)) {
                uniqueStrMap.set(solStr, i);
            }
        });

        // 从原始规范化列表中获取不完全相同但可能等价的表达式
        const candidates = Array.from(uniqueStrMap.values()).map(i => expandedSolutions[i]);

        // 进一步去除等价解，同时选择偏好形式
        const uniqueSolutions = [];
        for (const sol of candidates) {
            // 检查是否已存在等价解
            let isDuplicate = false;
            for (const existing of uniqueSolutions) {
                if (sol.isEquivalentTo(existing)) {
                    isDuplicate = true;

                    // 如果当前解比已存在的解更简洁，则替换
                    if (this._multDivPreference(sol) > this._multDivPreference(existing) ||
                        (this._multDivPreference(sol) === this._multDivPreference(existing) &&
                            sol.complexity() < existing.complexity())) {
                        // 替换
                        uniqueSolutions[uniqueSolutions.indexOf(existing)] = sol;
                    }

                    break;
                }
            }

            if (!isDuplicate) {
                uniqueSolutions.push(sol);
            }
        }

        // 最后按偏好顺序排序
        uniqueSolutions.sort((a, b) => {
            // 首先按照乘除法偏好排序
            const prefA = this._multDivPreference(a);
            const prefB = this._multDivPreference(b);

            if (prefA !== prefB) {
                return prefB - prefA; // 高偏好在前
            }

            // 其次按复杂度排序
            return a.complexity() - b.complexity();
        });

        return uniqueSolutions;
    }

    /**
     * 计算表达式的乘除法偏好值
     * @param {BinaryExpression} expr 表达式
     * @returns {number} 偏好值
     */
    _multDivPreference(expr) {
        // 提取表达式的字符串表示
        const exprStr = expr.toString();

        // 统计乘法和除法的数量
        const multCount = (exprStr.match(/\*/g) || []).length;
        const divCount = (exprStr.match(/\//g) || []).length;

        // 计算偏好值：乘法比除法更优先
        return multCount * 2 + divCount;
    }

    /**
     * 生成等价形式
     * @param {BinaryExpression} expr 表达式
     * @returns {BinaryExpression[]} 等价形式
     */
    _generateEquivalentForms(expr) {
        const equivalentForms = [];

        // 处理加减法等价形式
        if (expr.operator === '+' || expr.operator === '-') {
            // a + b == b + a
            if (expr.operator === '+') {
                equivalentForms.push(new BinaryExpression(expr.right.deepCopy(), '+', expr.left.deepCopy()));
            }

            // a - b == a + (-b)
            if (expr.operator === '-' && expr.right instanceof NumberExpression) {
                equivalentForms.push(new BinaryExpression(
                    expr.left.deepCopy(),
                    '+',
                    new NumberExpression(-expr.right.value)
                ));
            }
        }

        // 处理乘除法等价形式
        if (expr.operator === '*' || expr.operator === '/') {
            // a * b == b * a
            if (expr.operator === '*') {
                equivalentForms.push(new BinaryExpression(expr.right.deepCopy(), '*', expr.left.deepCopy()));
            }

            // a / 1 == a
            if (expr.operator === '/' && expr.right instanceof NumberExpression && expr.right.value === 1) {
                equivalentForms.push(expr.left.deepCopy());
            }

            // 尝试将(a*b)/c转换为a*(b/c)和(a/c)*b
            if (expr.operator === '/' && expr.left instanceof BinaryExpression && expr.left.operator === '*') {
                // (a*b)/c -> a*(b/c)
                equivalentForms.push(new BinaryExpression(
                    expr.left.left.deepCopy(),
                    '*',
                    new BinaryExpression(expr.left.right.deepCopy(), '/', expr.right.deepCopy())
                ));

                // (a*b)/c -> b*(a/c)
                equivalentForms.push(new BinaryExpression(
                    expr.left.right.deepCopy(),
                    '*',
                    new BinaryExpression(expr.left.left.deepCopy(), '/', expr.right.deepCopy())
                ));
            }
        }

        // 递归处理子表达式
        if (expr.left instanceof BinaryExpression) {
            const leftForms = this._generateEquivalentForms(expr.left);
            for (const leftForm of leftForms) {
                equivalentForms.push(new BinaryExpression(leftForm, expr.operator, expr.right.deepCopy()));
            }
        }

        if (expr.right instanceof BinaryExpression) {
            const rightForms = this._generateEquivalentForms(expr.right);
            for (const rightForm of rightForms) {
                equivalentForms.push(new BinaryExpression(expr.left.deepCopy(), expr.operator, rightForm));
            }
        }

        return equivalentForms;
    }

    /**
     * 收集表达式中使用的数字
     * @param {Expression} expr 表达式
     * @returns {Set<number>} 使用的数字集合
     */
    _collectNumbers(expr) {
        const numbers = new Set();

        if (expr instanceof NumberExpression) {
            numbers.add(expr.value);
        } else if (expr instanceof BinaryExpression) {
            // 递归收集左右子表达式中的数字
            const leftNumbers = this._collectNumbers(expr.left);
            const rightNumbers = this._collectNumbers(expr.right);

            // 合并结果
            for (const num of leftNumbers) {
                numbers.add(num);
            }
            for (const num of rightNumbers) {
                numbers.add(num);
            }
        }

        return numbers;
    }

    /**
     * 验证解法是否使用了所有输入的数字
     * @param {BinaryExpression[]} solutions 解集
     * @param {Set<number>} inputNumbers 输入的数字集合
     * @returns {BinaryExpression[]} 验证后的解集
     */
    _validateSolutions(solutions, inputNumbers) {
        const validSolutions = [];

        for (const sol of solutions) {
            const usedNumbers = this._collectNumbers(sol);

            // 检查使用的数字数量是否正确
            if (usedNumbers.size === inputNumbers.size) {
                // 检查使用的数字是否与输入数字匹配
                let allMatch = true;
                for (const num of usedNumbers) {
                    if (!inputNumbers.has(num)) {
                        allMatch = false;
                        break;
                    }
                }

                if (allMatch) {
                    validSolutions.push(sol);
                }
            }
        }

        return validSolutions;
    }
}

// 改为ES模块导出
export { Solver }; 