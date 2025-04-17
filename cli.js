#!/usr/bin/env node

import { Solver } from './solver.js';
import { NumberExpression, BinaryExpression } from './expression.js';
import readline from 'readline';
import { testBasic, testEquivalentExpressions, testSpecialRules, solveFromCommandLine, main } from './main.js';

/**
 * 交互模式
 */
async function interactiveMode() {
    console.log("欢迎使用24点游戏求解器！");
    console.log("请输入4个数字，用空格分隔，或输入'exit'退出");

    const solver = new Solver(24);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function promptUser() {
        rl.question("> ", (userInput) => {
            if (['exit', 'quit', 'q'].includes(userInput.toLowerCase())) {
                rl.close();
                return;
            }

            try {
                const numbers = userInput.split(/\s+/).map(n => parseInt(n, 10));

                if (numbers.length !== 4 || numbers.some(isNaN)) {
                    console.log("请输入恰好4个有效的整数");
                } else {
                    const solutions = solver.solve(numbers);

                    if (solutions.length === 0) {
                        console.log(`四个数 ${numbers} 无法构成24点`);
                    } else {
                        console.log(`找到 ${solutions.length} 种解法：`);
                        solutions.forEach((sol, i) => {
                            console.log(`解法 ${i + 1}: ${sol}`);
                        });
                    }
                }
            } catch (e) {
                console.log(e.message);
            }

            promptUser();
        });
    }

    promptUser();
}

// 命令行入口
async function cliMain() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("24点游戏求解器测试");
        console.log("=".repeat(50));
        testBasic();
    } else if (args.length === 1) {
        if (args[0] === "interactive") {
            await interactiveMode();
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
            console.log("  node cli.js                 - 运行测试案例");
            console.log("  node cli.js interactive     - 进入交互模式");
            console.log("  node cli.js <a> <b> <c> <d> - 解决指定的四个数字");
            console.log("  node cli.js test            - 运行所有测试");
        }
    } else if (args.length === 4) {
        solveFromCommandLine(args);
    } else {
        console.log("24点游戏求解器");
        console.log("用法:");
        console.log("  node cli.js                 - 运行测试案例");
        console.log("  node cli.js interactive     - 进入交互模式");
        console.log("  node cli.js <a> <b> <c> <d> - 解决指定的四个数字");
        console.log("  node cli.js test            - 运行所有测试");
    }
}

// 直接执行CLI
cliMain().catch(console.error); 