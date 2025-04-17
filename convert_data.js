import { readFileSync, writeFileSync } from 'fs';

try {
    // 读取data.txt文件
    const text = readFileSync('data.txt', 'utf8');

    // 解析每一行
    const lines = text.split('\n').filter(line => line.trim());
    const challengeData = lines.map((line, index) => {
        // 解析每一行数据，格式: "1     1 1 1 8   (1+1+1)×8"
        const parts = line.trim().split(/\s+/);
        const level = parseInt(parts[0], 10);

        // 提取四个数字
        const numbers = [
            parseInt(parts[1], 10),
            parseInt(parts[2], 10),
            parseInt(parts[3], 10),
            parseInt(parts[4], 10)
        ];

        // 提取答案部分
        const solutions = [];
        let solutionStartIndex = 5;

        // 从第6个元素开始提取答案
        while (solutionStartIndex < parts.length) {
            let solution = parts[solutionStartIndex];
            // 检查是否是一个答案的开始
            if (solution.includes('(') || /^\d+[+\-*/]/.test(solution)) {
                // 可能是答案的一部分，查找完整答案
                let fullSolution = solution;
                let i = solutionStartIndex + 1;

                // 继续读取直到找到一个看起来是新答案开始的部分
                while (i < parts.length &&
                    !(parts[i].includes('(') || /^\d+[+\-*/]/.test(parts[i]))) {
                    fullSolution += ' ' + parts[i];
                    i++;
                }

                solutions.push(fullSolution);
                solutionStartIndex = i;
            } else {
                // 如果不是答案的开始，移到下一个元素
                solutionStartIndex++;
            }
        }

        return {
            level,
            numbers,
            solutions
        };
    });

    // 创建JS文件内容
    const jsContent = `// 自动生成的闯关模式数据
// 从data.txt转换而来

export const challengeData = ${JSON.stringify(challengeData, null, 2)};
`;

    // 写入新文件
    writeFileSync('challengeData.js', jsContent);
    console.log('成功将data.txt转换为challengeData.js');
} catch (error) {
    console.error('处理失败:', error);
} 