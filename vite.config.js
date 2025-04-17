import { defineConfig } from 'vite';
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
    base: './', // 使用相对路径，这样打包后的文件可以在任何位置运行
    plugins: [viteSingleFile()],
    build: {
        outDir: 'dist', // 输出目录
        assetsDir: 'assets', // 静态资源目录
        emptyOutDir: true, // 清空输出目录
        sourcemap: false, // 不生成sourceMap以减少文件大小
        minify: 'terser', // 使用terser进行压缩
        cssCodeSplit: false,
        assetsInlineLimit: 100000000
    }
}); 