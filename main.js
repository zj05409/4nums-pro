// 直接导入所需的功能，避免动态导入
import { Solver } from './solver.js';
import { NumberExpression, BinaryExpression } from './expression.js';

/**
 * 测试特定表达式是否符合规则
 * @param {string} exprStr 表达式字符串
 * @param {number[]} numbers 数字列表
 */
function testSpecificExpression(exprStr, numbers) {
    // 这里需要实现表达式解析器或手动构建表达式
    // 暂时省略实现
}

/**
 * 基本测试：检查四个数的组合方式
 */
function testBasic() {
    const solver = new Solver(24);

    // 测试案例1：{1, 2, 3, 4}
    const numbers1 = [1, 2, 3, 4];
    const solutions1 = solver.solve(numbers1);

    console.log(`四个数 ${numbers1} 的24点解法：`);
    solutions1.forEach((sol, i) => {
        console.log(`解法 ${i + 1}: ${sol}`);
    });

    // 测试案例2：{5, 5, 5, 1}
    const numbers2 = [5, 5, 5, 1];
    const solutions2 = solver.solve(numbers2);

    console.log(`\n四个数 ${numbers2} 的24点解法：`);
    solutions2.forEach((sol, i) => {
        console.log(`解法 ${i + 1}: ${sol}`);
    });

    // 测试案例3：{13, 11, 5, 4}
    const numbers3 = [13, 11, 5, 4];
    const solutions3 = solver.solve(numbers3);

    console.log(`\n四个数 ${numbers3} 的24点解法：`);
    solutions3.forEach((sol, i) => {
        console.log(`解法 ${i + 1}: ${sol}`);
    });
}

/**
 * 测试等价表达式判断
 */
function testEquivalentExpressions() {
    // 测试规则1：交换律
    const expr1 = new BinaryExpression(new NumberExpression(3), '+', new NumberExpression(4));
    const expr2 = new BinaryExpression(new NumberExpression(4), '+', new NumberExpression(3));
    console.log(`${expr1} 和 ${expr2} 等价: ${expr1.isEquivalentTo(expr2)}`);

    // 测试规则3：a - (b - c) -> a + c - b
    const expr3 = new BinaryExpression(
        new NumberExpression(5),
        '-',
        new BinaryExpression(new NumberExpression(3), '-', new NumberExpression(2))
    );
    const expr4 = new BinaryExpression(
        new BinaryExpression(new NumberExpression(5), '+', new NumberExpression(2)),
        '-',
        new NumberExpression(3)
    );
    console.log(`${expr3} 和 ${expr4} 等价: ${expr3.isEquivalentTo(expr4)}`);

    // 测试表达式规范化
    const normalized = expr3.normalize();
    console.log(`${expr3} 的规范化形式: ${normalized}`);
    console.log(`规范化后与 ${expr4} 相同: ${normalized.toString() === expr4.toString()}`);
}

/**
 * 测试特殊规则
 */
function testSpecialRules() {
    // 测试规则6：乘除1
    const expr = new BinaryExpression(
        new BinaryExpression(new NumberExpression(13), '+', new NumberExpression(11)),
        '/',
        new NumberExpression(1)
    );
    const normalized = expr.normalize();
    console.log(`${expr} 的规范化形式: ${normalized}`);

    // 测试规则8：{a, b, c, c}
    const solver = new Solver(24);
    const numbers1 = [6, 6, 8, 3];
    const solutions1 = solver.solve(numbers1);
    console.log(`\n测试${numbers1}的特殊规则8解法：`);
    solutions1.forEach((sol, i) => {
        console.log(`解法 ${i + 1}: ${sol}`);
    });

    // 测试规则8.b：{a, b, 1, 1}
    const numbers2 = [12, 12, 1, 1];
    const solutions2 = solver.solve(numbers2);
    console.log(`\n测试${numbers2}的特殊规则8.b解法：`);
    solutions2.forEach((sol, i) => {
        console.log(`解法 ${i + 1}: ${sol}`);
    });
}

/**
 * 从命令行参数中获取数字并求解
 * 这个函数同时可以在Node.js环境和浏览器环境中使用
 * @param {string[]} args 命令行参数
 */
function solveFromCommandLine(args) {
    // console.log('solveFromCommandLine被调用，参数:', args);

    if (args.length !== 4) {
        console.log("请提供恰好4个数字");
        return [];
    }

    try {
        const numbers = args.map(n => parseInt(n, 10));
        if (numbers.some(isNaN)) {
            throw new Error("请输入有效的整数");
        }

        // console.log('正在使用Solver求解数字:', numbers);
        const solver = new Solver(24);
        const solutions = solver.solve(numbers);
        // console.log('Solver求解完成，找到解法数量:', solutions.length);

        if (solutions.length === 0) {
            console.log(`四个数 ${numbers} 无法构成24点`);
        } else {
            // console.log(`四个数 ${numbers} 的24点解法：`);
            solutions.forEach((sol, i) => {
                // console.log(`解法 ${i + 1}: ${sol}`);
                console.log(`${i + 1}: ${sol}`);
            });
        }

        return solutions;
    } catch (e) {
        console.log(e.message);
        console.error('solveFromCommandLine执行错误:', e);
        return [];
    }
}

/**
 * 主函数
 */
function main(argv = []) {
    // 如果在Node.js环境中运行，使用process.argv，否则使用传入的参数
    const args = typeof process !== 'undefined' ? process.argv.slice(2) : argv;

    if (args.length === 0) {
        console.log("24点游戏求解器测试");
        console.log("=".repeat(50));
        testBasic();
    } else if (args.length === 1) {
        if (args[0] === "interactive") {
            // 交互模式
            console.log("浏览器环境不支持交互模式");
        } else if (args[0] === "test") {
            console.log("24点游戏求解器测试");
            console.log("=".repeat(50));

            console.log("\n基本测试：");
            testBasic();

            console.log("\n等价表达式测试：");
            testEquivalentExpressions();

            console.log("\n特殊规则测试：");
            testSpecialRules();
        } else {
            console.log("24点游戏求解器");
            console.log("用法:");
            console.log("  在浏览器中直接运行 index.html");
        }
    } else if (args.length === 4) {
        solveFromCommandLine(args);
    } else {
        console.log("24点游戏求解器");
        console.log("用法:");
        console.log("  在浏览器中直接运行 index.html");
    }
}

// 改为ES模块导出
export {
    testBasic,
    testEquivalentExpressions,
    testSpecialRules,
    solveFromCommandLine,
    main
}; 