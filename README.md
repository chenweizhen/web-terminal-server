# Web Terminal Server

#### 介绍
使用NodeJS搭建的Express服务

#### 软件架构
| 依赖包      | 说明     |
|----------|--------|
| Express  | API服务  |
| node-pty | 提供终端服务 |


#### 安装教程

```
1.  git clone https://gitee.com/mikenchen/web-terminal-server.git
2.  cd web-terminal-server
3.  pnpm install
4.  pnpm run start 或 pnpm run start:win
````


#### 前端代码

```
1.  git clone https://gitee.com/mikenchen/web-terminal-client.git
2.  cd web-terminal-client
3.  pnpm install
4.  pnpm run dev
````

#### 使用说明

1.  [node-pty](https://www.npmjs.com/package/node-pty)安装比较麻烦，windows需要安装windows-build-tools，如果不需要使用terminal终端，可屏蔽相关依赖包和代码入口
```
npm install --global --production windows-build-tools
```
2. windows下，如果terminal终端出现乱码，可在启动脚本加入  **chcp 65001** 


