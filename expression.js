/**
 * 表达式基类
 */
class Expression {
    /**
     * 计算表达式的值
     * @returns {number} 表达式的值
     */
    evaluate() {
        throw new Error("必须由子类实现");
    }

    /**
     * 判断两个表达式是否等价
     * @param {Expression} other 另一个表达式
     * @returns {boolean} 是否等价
     */
    isEquivalentTo(other) {
        throw new Error("必须由子类实现");
    }

    /**
     * 返回标准化后的表达式（应用偏好规则）
     * @returns {Expression} 标准化后的表达式
     */
    normalize() {
        throw new Error("必须由子类实现");
    }

    /**
     * 返回表达式的复杂度，用于偏好规则判断
     * @returns {number} 复杂度值
     */
    complexity() {
        throw new Error("必须由子类实现");
    }

    /**
     * 深拷贝表达式
     * @returns {Expression} 表达式的深拷贝
     */
    deepCopy() {
        throw new Error("必须由子类实现");
    }
}

/**
 * 数字表达式
 */
class NumberExpression extends Expression {
    /**
     * 构造函数
     * @param {number} value 数字值
     */
    constructor(value) {
        super();
        this.value = value;
    }

    /**
     * 计算表达式的值
     * @returns {number} 表达式的值
     */
    evaluate() {
        return this.value;
    }

    /**
     * 判断两个表达式是否等价
     * @param {Expression} other 另一个表达式
     * @returns {boolean} 是否等价
     */
    isEquivalentTo(other) {
        if (other instanceof NumberExpression) {
            return this.value === other.value;
        }
        return false;
    }

    /**
     * 返回标准化后的表达式
     * @returns {NumberExpression} 标准化后的表达式
     */
    normalize() {
        return this;
    }

    /**
     * 返回表达式的复杂度
     * @returns {number} 复杂度值
     */
    complexity() {
        return 1;
    }

    /**
     * 深拷贝表达式
     * @returns {NumberExpression} 表达式的深拷贝
     */
    deepCopy() {
        return new NumberExpression(this.value);
    }

    /**
     * 从数字表达式中提取加减项，返回自身作为一个项
     * @returns {Array} 项数组和符号
     */
    _extractAdditiveTerms() {
        return [[this, true]]; // 返回数字本身和正号
    }

    /**
     * 数字表达式不应该调用此方法，但为完整性实现
     * @param {Array} terms1 第一组项
     * @param {Array} terms2 第二组项
     * @returns {boolean} 是否等价
     */
    _termsAreEquivalent(terms1, terms2) {
        return terms1 === terms2;
    }

    /**
     * 数字表达式直接比较值判断等价性
     * @param {Expression} other 另一个表达式
     * @returns {boolean} 是否等价
     */
    _isMultDivEquivalent(other) {
        if (other instanceof NumberExpression) {
            return this.value === other.value;
        }
        return false;
    }

    /**
     * 数字表达式不包含乘除法
     * @returns {boolean} 是否包含乘除法
     */
    _containsMultDiv() {
        return false;
    }

    /**
     * 数字表达式作为分子返回
     * @returns {Array} 分子和分母
     */
    _collectMultDivTerms() {
        return [[this], []];
    }

    /**
     * 判断两个因子是否等价
     * @param {Expression} factor1 第一个因子
     * @param {Expression} factor2 第二个因子
     * @returns {boolean} 是否等价
     */
    _factorEquivalent(factor1, factor2) {
        return factor1.isEquivalentTo(factor2);
    }

    /**
     * 转换为字符串
     * @returns {string} 表达式的字符串表示
     */
    toString() {
        return String(this.value);
    }
}

/**
 * 二元操作表达式
 */
class BinaryExpression extends Expression {
    /**
     * 构造函数
     * @param {Expression} left 左操作数
     * @param {string} operator 操作符
     * @param {Expression} right 右操作数
     */
    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    /**
     * 计算表达式的值
     * @returns {number} 表达式的值
     */
    evaluate() {
        const leftVal = this.left.evaluate();
        const rightVal = this.right.evaluate();

        switch (this.operator) {
            case '+':
                return leftVal + rightVal;
            case '-':
                return leftVal - rightVal;
            case '*':
                return leftVal * rightVal;
            case '/':
                if (rightVal === 0) {
                    throw new Error("除数不能为零");
                }
                return leftVal / rightVal;
            default:
                throw new Error(`不支持的操作符: ${this.operator}`);
        }
    }

    /**
     * 判断两个表达式是否等价
     * @param {Expression} other 另一个表达式
     * @returns {boolean} 是否等价
     */
    isEquivalentTo(other) {
        // 如果类型不同，直接返回false
        if (!(other instanceof BinaryExpression)) {
            return false;
        }

        // 尝试计算两个表达式的值，如果相等则可能等价
        try {
            const val1 = this.evaluate();
            const val2 = other.evaluate();
            // 完全相等的表达式一定等价
            if (Math.abs(val1 - val2) < 1e-10) { // 浮点数比较需要容差
                // 简单情况：完全相同的表达式结构
                if (this.operator === other.operator &&
                    this.left.isEquivalentTo(other.left) &&
                    this.right.isEquivalentTo(other.right)) {
                    return true;
                }

                // 高效判断：直接比较字符串表示是否相同
                if (this.toString() === other.toString()) {
                    return true;
                }

                // 乘除法交换律和结合律的组合 - 特殊情况处理
                // 处理 (a*b)/c ↔ (a/c)*b ↔ a*(b/c) 等形式
                if (this._isMultDivEquivalent(other)) {
                    return true;
                }
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }

        // 规则1：交换律
        if ((this.operator === '+' || this.operator === '*') && other.operator === this.operator) {
            // a + b == b + a 或 a * b == b * a
            if (this.left.isEquivalentTo(other.right) && this.right.isEquivalentTo(other.left)) {
                return true;
            }
        }

        // 规则2：结合律
        if ((this.operator === '+' || this.operator === '*') && other.operator === this.operator) {
            // (a + b) + c == a + (b + c)
            if (this.left instanceof BinaryExpression && this.left.operator === this.operator) {
                // (a + b) + c == a + (b + c)
                if (this.left.left.isEquivalentTo(other.left) &&
                    new BinaryExpression(this.left.right, this.operator, this.right).isEquivalentTo(other.right)) {
                    return true;
                }
                // (a + b) + c == b + (a + c)
                if (this.left.right.isEquivalentTo(other.left) &&
                    new BinaryExpression(this.left.left, this.operator, this.right).isEquivalentTo(other.right)) {
                    return true;
                }
            }

            if (other.left instanceof BinaryExpression && other.left.operator === other.operator) {
                // a + (b + c) == (a + b) + c
                if (this.left.isEquivalentTo(other.left.left) &&
                    this.right.isEquivalentTo(new BinaryExpression(other.left.right, other.operator, other.right))) {
                    return true;
                }
                // a + (b + c) == (a + c) + b
                if (this.left.isEquivalentTo(other.left.right) &&
                    this.right.isEquivalentTo(new BinaryExpression(other.left.left, other.operator, other.right))) {
                    return true;
                }
            }
        }

        // 处理加减法组合的等价性
        // 例如：(a + b - c) == (b - c + a) == (a - c + b) 等
        if ((this.operator === '+' || this.operator === '-') &&
            (other.operator === '+' || other.operator === '-')) {
            // 将加减表达式转换为标准形式并比较
            // 这是一个复杂的情况，需要递归处理多个加减项
            // 我们可以尝试将a+b-c形式转换为a+b+(-c)，然后比较各项是否相等
            const selfTerms = this._extractAdditiveTerms();
            const otherTerms = other._extractAdditiveTerms();

            if (selfTerms.length === otherTerms.length) {
                // 检查两组项是否可以一一对应
                return this._termsAreEquivalent(selfTerms, otherTerms);
            }
        }

        // 规则3：交换性规则
        // a - (b - c) == a + c - b
        if (this.operator === '-' && this.right instanceof BinaryExpression && this.right.operator === '-') {
            const equivalentExpr = new BinaryExpression(
                new BinaryExpression(this.left.deepCopy(), '+', this.right.right.deepCopy()),
                '-',
                this.right.left.deepCopy()
            );
            if (equivalentExpr.isEquivalentTo(other)) {
                return true;
            }
        }

        if (other.operator === '-' && other.right instanceof BinaryExpression && other.right.operator === '-') {
            const equivalentExpr = new BinaryExpression(
                new BinaryExpression(other.left.deepCopy(), '+', other.right.right.deepCopy()),
                '-',
                other.right.left.deepCopy()
            );
            if (this.isEquivalentTo(equivalentExpr)) {
                return true;
            }
        }

        // x/(y/z) == x*z/y
        if (this.operator === '/' && this.right instanceof BinaryExpression && this.right.operator === '/') {
            const equivalentExpr = new BinaryExpression(
                new BinaryExpression(this.left.deepCopy(), '*', this.right.right.deepCopy()),
                '/',
                this.right.left.deepCopy()
            );
            if (equivalentExpr.isEquivalentTo(other)) {
                return true;
            }
        }

        if (other.operator === '/' && other.right instanceof BinaryExpression && other.right.operator === '/') {
            const equivalentExpr = new BinaryExpression(
                new BinaryExpression(other.left.deepCopy(), '*', other.right.right.deepCopy()),
                '/',
                other.right.left.deepCopy()
            );
            if (this.isEquivalentTo(equivalentExpr)) {
                return true;
            }
        }

        // x/(y*z) == x/y/z
        if (this.operator === '/' && this.right instanceof BinaryExpression && this.right.operator === '*') {
            const equivalentExpr = new BinaryExpression(
                new BinaryExpression(this.left.deepCopy(), '/', this.right.left.deepCopy()),
                '/',
                this.right.right.deepCopy()
            );
            if (equivalentExpr.isEquivalentTo(other)) {
                return true;
            }
        }

        if (other.operator === '/' && other.right instanceof BinaryExpression && other.right.operator === '*') {
            const equivalentExpr = new BinaryExpression(
                new BinaryExpression(other.left.deepCopy(), '/', other.right.left.deepCopy()),
                '/',
                other.right.right.deepCopy()
            );
            if (this.isEquivalentTo(equivalentExpr)) {
                return true;
            }
        }

        // 规则6：乘除1
        // x * 1 == x / 1
        if (this.operator === '*' && this.right instanceof NumberExpression && this.right.value === 1) {
            if (other.operator === '/' && other.right instanceof NumberExpression && other.right.value === 1) {
                if (this.left.isEquivalentTo(other.left)) {
                    return true;
                }
            }
        }

        if (other.operator === '*' && other.right instanceof NumberExpression && other.right.value === 1) {
            if (this.operator === '/' && this.right instanceof NumberExpression && this.right.value === 1) {
                if (this.left.isEquivalentTo(other.left)) {
                    return true;
                }
            }
        }

        // 规则7：当z=1时，x + y*z == x*z + y == (x + y)*z
        if (this.operator === '+' && this.right instanceof BinaryExpression && this.right.operator === '*') {
            if (this.right.right instanceof NumberExpression && this.right.right.value === 1) {
                // a + b*1 == (a + b)*1
                const equivalentExpr = new BinaryExpression(
                    new BinaryExpression(this.left.deepCopy(), '+', this.right.left.deepCopy()),
                    '*',
                    new NumberExpression(1)
                );
                if (equivalentExpr.isEquivalentTo(other)) {
                    return true;
                }
            }
        }

        // 更多等价性规则...

        return false;
    }

    /**
     * 从表达式中提取加减项
     * @returns {Array} 项数组
     */
    _extractAdditiveTerms() {
        if (this.operator === '+') {
            // a + b => 提取a的项和b的项
            const leftTerms = this.left._extractAdditiveTerms();
            const rightTerms = this.right._extractAdditiveTerms();
            return [...leftTerms, ...rightTerms];
        } else if (this.operator === '-') {
            // a - b => 提取a的项和b的相反项
            const leftTerms = this.left._extractAdditiveTerms();
            const rightTerms = this.right._extractAdditiveTerms();
            // 对右边的项取反
            const negatedRightTerms = rightTerms.map(([term, isPositive]) => [term, !isPositive]);
            return [...leftTerms, ...negatedRightTerms];
        } else {
            // 其他操作符，将整个表达式作为一个项
            return [[this, true]];
        }
    }

    /**
     * 判断两组项是否等价
     * @param {Array} terms1 第一组项
     * @param {Array} terms2 第二组项
     * @returns {boolean} 是否等价
     */
    _termsAreEquivalent(terms1, terms2) {
        if (terms1.length !== terms2.length) {
            return false;
        }

        // 为简单起见，我们检查每个项是否在另一组中有对应项
        // 这是一个O(n²)的算法，但由于n很小，所以性能影响不大

        // 创建一个副本以便标记已匹配的项
        const terms2Copy = [...terms2];

        for (const [term1, isPositive1] of terms1) {
            let foundMatch = false;

            for (let i = 0; i < terms2Copy.length; i++) {
                const [term2, isPositive2] = terms2Copy[i];

                if (term1.isEquivalentTo(term2) && isPositive1 === isPositive2) {
                    // 找到匹配，标记并移至下一项
                    terms2Copy.splice(i, 1);
                    foundMatch = true;
                    break;
                }
            }

            if (!foundMatch) {
                return false;
            }
        }

        // 如果所有项都匹配，则两组项等价
        return terms2Copy.length === 0;
    }

    /**
     * 返回标准化后的表达式
     * @returns {Expression} 标准化后的表达式
     */
    normalize() {
        // 首先规范化子表达式
        const leftNorm = this.left.normalize();
        const rightNorm = this.right.normalize();

        // 应用基本规范化规则

        // 规则6：乘除1
        if (rightNorm instanceof NumberExpression && rightNorm.value === 1) {
            if (this.operator === '*' || this.operator === '/') {
                return leftNorm;
            }
        }

        if (leftNorm instanceof NumberExpression && leftNorm.value === 1) {
            if (this.operator === '*') {
                return rightNorm;
            }
        }

        // 规则0：0的特殊处理
        if (rightNorm instanceof NumberExpression && rightNorm.value === 0) {
            if (this.operator === '+' || this.operator === '-') {
                return leftNorm;
            }
            if (this.operator === '*') {
                return new NumberExpression(0);
            }
        }

        if (leftNorm instanceof NumberExpression && leftNorm.value === 0) {
            if (this.operator === '+') {
                return rightNorm;
            }
            if (this.operator === '*' || this.operator === '/') {
                return new NumberExpression(0);
            }
        }

        // 乘法交换律：将数字移到左侧
        if (this.operator === '*' && rightNorm instanceof NumberExpression && !(leftNorm instanceof NumberExpression)) {
            return new BinaryExpression(rightNorm, '*', leftNorm);
        }

        // 规则3：交换性规则
        // a - (b - c) -> a + c - b
        if (this.operator === '-' && rightNorm instanceof BinaryExpression && rightNorm.operator === '-') {
            return new BinaryExpression(
                new BinaryExpression(leftNorm, '+', rightNorm.right),
                '-',
                rightNorm.left
            );
        }

        // x/(y/z) -> x*z/y
        if (this.operator === '/' && rightNorm instanceof BinaryExpression && rightNorm.operator === '/') {
            return new BinaryExpression(
                new BinaryExpression(leftNorm, '*', rightNorm.right),
                '/',
                rightNorm.left
            );
        }

        // 默认情况，使用规范化后的子表达式创建新表达式
        return new BinaryExpression(leftNorm, this.operator, rightNorm);
    }

    /**
     * 深拷贝表达式
     * @returns {BinaryExpression} 表达式的深拷贝
     */
    deepCopy() {
        return new BinaryExpression(
            this.left.deepCopy(),
            this.operator,
            this.right.deepCopy()
        );
    }

    /**
     * 返回表达式的复杂度
     * @returns {number} 复杂度值
     */
    complexity() {
        return 1 + this.left.complexity() + this.right.complexity();
    }

    /**
     * 转换为字符串
     * @returns {string} 表达式的字符串表示
     */
    toString() {
        // 判断是否需要加括号
        const needLeftParens = this.left instanceof BinaryExpression &&
            this._needParentheses(this.operator, this.left.operator, true);

        const needRightParens = this.right instanceof BinaryExpression &&
            this._needParentheses(this.operator, this.right.operator, false);

        const leftStr = needLeftParens ? `(${this.left.toString()})` : this.left.toString();
        const rightStr = needRightParens ? `(${this.right.toString()})` : this.right.toString();

        // 修改乘除法表达式的显示顺序，优先显示乘号在除号前的形式
        // 如果是 a/b*c 形式，转换为 a*c/b 形式（乘号在除号前）
        if (this.operator === '*' && this.left instanceof BinaryExpression && this.left.operator === '/') {
            return `${this.left.left.toString()}*${this.right.toString()}/${this.left.right.toString()}`;
        }

        return `${leftStr}${this.operator}${rightStr}`;
    }

    /**
     * 判断是否需要括号
     * @param {string} parentOp 父操作符
     * @param {string} childOp 子操作符
     * @param {boolean} isLeft 是否是左子表达式
     * @returns {boolean} 是否需要括号
     */
    _needParentheses(parentOp, childOp, isLeft) {
        // 操作符优先级
        const precedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2
        };

        // 如果父操作符优先级高于或等于子操作符，不需要括号
        if (precedence[parentOp] > precedence[childOp]) {
            return true;
        }

        // 对于相同优先级，加法和乘法满足交换律和结合律，可以不加括号
        if (precedence[parentOp] === precedence[childOp]) {
            // 对于减法和除法的右侧表达式，总是需要括号
            if (!isLeft && (parentOp === '-' || parentOp === '/')) {
                return true;
            }

            // 如果左侧是减法，且父操作符也是减法或加法，需要括号
            if (isLeft && childOp === '-' && (parentOp === '+' || parentOp === '-')) {
                return true;
            }
        }

        return false;
    }

    /**
     * 判断两个表达式在乘除法意义上是否等价
     * @param {Expression} other 另一个表达式
     * @returns {boolean} 是否等价
     */
    _isMultDivEquivalent(other) {
        // 如果两个表达式不都包含乘除法，则不需要特殊处理
        if (!this._containsMultDiv() || !(other instanceof BinaryExpression) || !other._containsMultDiv()) {
            return false;
        }

        // 收集乘法和除法项
        const [thisNumerators, thisDenominators] = this._collectMultDivTerms();
        const [otherNumerators, otherDenominators] = other._collectMultDivTerms();

        // 如果分子或分母的数量不同，则不等价
        if (thisNumerators.length !== otherNumerators.length ||
            thisDenominators.length !== otherDenominators.length) {
            return false;
        }

        // 检查分子是否匹配（不考虑顺序）
        for (const factor1 of thisNumerators) {
            let matched = false;
            for (let i = 0; i < otherNumerators.length; i++) {
                if (this._factorEquivalent(factor1, otherNumerators[i])) {
                    otherNumerators.splice(i, 1);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                return false;
            }
        }

        // 检查分母是否匹配（不考虑顺序）
        for (const factor1 of thisDenominators) {
            let matched = false;
            for (let i = 0; i < otherDenominators.length; i++) {
                if (this._factorEquivalent(factor1, otherDenominators[i])) {
                    otherDenominators.splice(i, 1);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                return false;
            }
        }

        return true;
    }

    /**
     * 判断两个因子是否等价
     * @param {Expression} factor1 第一个因子
     * @param {Expression} factor2 第二个因子
     * @returns {boolean} 是否等价
     */
    _factorEquivalent(factor1, factor2) {
        return factor1.isEquivalentTo(factor2);
    }

    /**
     * 判断表达式是否包含乘除法
     * @returns {boolean} 是否包含乘除法
     */
    _containsMultDiv() {
        if (this.operator === '*' || this.operator === '/') {
            return true;
        }

        // 递归检查子表达式
        if (this.left instanceof BinaryExpression && this.left._containsMultDiv()) {
            return true;
        }

        if (this.right instanceof BinaryExpression && this.right._containsMultDiv()) {
            return true;
        }

        return false;
    }

    /**
     * 收集表达式中的乘除法项
     * @returns {Array} 分子和分母
     */
    _collectMultDivTerms() {
        // 初始化分子和分母
        let numerators = [];
        let denominators = [];

        if (this.operator === '*') {
            // a * b: 收集a和b的分子、分母
            const [leftNumerators, leftDenominators] = this.left._collectMultDivTerms();
            const [rightNumerators, rightDenominators] = this.right._collectMultDivTerms();

            numerators = [...leftNumerators, ...rightNumerators];
            denominators = [...leftDenominators, ...rightDenominators];
        } else if (this.operator === '/') {
            // a / b: 收集a的分子、分母，b作为分母
            const [leftNumerators, leftDenominators] = this.left._collectMultDivTerms();
            const [rightNumerators, rightDenominators] = this.right._collectMultDivTerms();

            numerators = [...leftNumerators, ...rightDenominators];
            denominators = [...leftDenominators, ...rightNumerators];
        } else {
            // 其他操作符，将整个表达式作为分子
            numerators = [this];
        }

        return [numerators, denominators];
    }
}

// 改为ES模块导出
export {
    Expression,
    NumberExpression,
    BinaryExpression
}; 