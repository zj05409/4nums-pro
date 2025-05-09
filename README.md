# 4nums-pro (24点豪华版)

一个现代化的24点游戏Web应用，支持多种游戏模式和难度级别。

## 特性

- 📱 响应式设计，适配各种设备
- 🎮 多种游戏模式：练习模式和挑战模式
- 🔢 支持不同难度级别
- 🧠 内置高效求解算法
- 💾 游戏状态自动保存，刷新页面不丢失
- 🌙 深色模式支持
- 🔍 查看解法功能

## 演示

访问 [https://zj05409.github.io/4nums-pro](https://zj05409.github.io/4nums-pro) 体验游戏

## 安装

```bash
# 克隆仓库
git clone https://github.com/zj05409/4nums-pro.git

# 进入项目目录
cd 4nums-pro

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 构建

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 游戏规则

24点游戏要求玩家使用四个数字，通过加减乘除运算得到24。在4nums-pro中：

1. 练习模式：自由练习，可以查看解法
2. 挑战模式：按难度级别挑战，需要密码才能查看解法

## 技术栈

- HTML5 / CSS3 / JavaScript
- Web Workers 用于计算
- LocalStorage 用于保存游戏状态

## 贡献

欢迎提交PR或Issues！详情请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## 许可证

[MIT](LICENSE) 