# 部署教学：把 daymark.top 与 Cloudflare 接起来

这份文档假设你**没有做过域名托管**，也没有做过自动部署。所有操作都是在浏览器网页上点，不需要服务器知识。

目标状态：

```text
daymark.top           官网（本仓库，托管在 Cloudflare）
www.daymark.top       301 跳转到 daymark.top
app.daymark.top       Daymark Web App（以后接）
api.daymark.top       你已有的后端 API（保持不动）
```

Cloudflare 可以做到你听说的两件事，而且这两件事是分开的两个功能：

| 听说的说法 | 实际是什么 | 在这份文档里的位置 |
|---|---|---|
| "Cloudflare 可以托管域名" | 把域名的 **DNS 解析**交给 Cloudflare 管理（改 nameserver） | 第 1–2 步 |
| "Cloudflare 一键部署 GitHub 项目" | **Cloudflare Pages**：连上 GitHub 仓库，每次 `git push` 自动构建并上线 | 第 3–5 步 |

---

## 0. 先搞清楚"托管"这个词

买域名和让域名能用，是两件事：

1. **注册**：你在某家注册商买了 `daymark.top`，这家公司只是"登记处"。
2. **解析托管**：要有人告诉你"访问 `daymark.top` 时，去哪个服务器拿内容"。这个角色由 **nameserver（NS）** 承担。

你现在的情况是：域名已注册，而且 `api.daymark.top` 已经在用（说明某处已经有一个 DNS 解析在生效）。接下来要做的是**把解析托管权统一交给 Cloudflare**，然后让 Cloudflare 同时管官网和你的 API。

> 关键概念：nameserver 决定"谁来回答解析问题"。把 NS 改成 Cloudflare，等于把整个域名的解析表搬迁到 Cloudflare。**搬迁前要先在 Cloudflare 把你现有的 API 解析记录原样建好，否则 API 会断。**

---

## 1. 查清现在的情况（5 分钟，不要跳过）

在动手前，先回答三个问题。用 Windows 自带的命令行即可：

```powershell
# 现在的 NS 是谁（看最下面"权威名称服务器"那几行）
nslookup -type=NS daymark.top

# 现在 api 子域指向哪里（记下这个 IP / 主机名，后面要照抄到 Cloudflare）
nslookup api.daymark.top

# 主域名现在有没有解析
nslookup daymark.top
```

同时登录你的**域名注册商**后台，找到 "DNS 管理 / DNS 记录 / Name Servers" 页面，把现有记录**截图或抄下来**。常见记录类型：

| 类型 | 含义 | 例子 |
|---|---|---|
| `A` | 指向一个 IPv4 地址 | `api` → `123.45.67.89` |
| `AAAA` | 指向一个 IPv6 地址 | — |
| `CNAME` | 指向另一个域名 | `api` → `xxx.example.com` |
| `TXT` | 文本记录（验证、邮件等） | `@` → `v=spf1 ...` |
| `MX` | 邮件记录 | 如果你用域名邮箱，**必须抄下来** |

**这一步的产物**：一张你自己看得懂的"现有记录清单"。后面在 Cloudflare 里要 1:1 重建。

---

## 2. 把域名解析托管到 Cloudflare

### 2.1 注册并添加站点

1. 打开 <https://dash.cloudflare.com/sign-up>，用邮箱注册（免费版就够）。
2. 登录后点 **Add a site / 添加站点**，输入 `daymark.top`（**不要**带 `www`、不要带 `https://`）。
3. 选 **Free** 套餐。
4. Cloudflare 会扫描现有解析记录，并列出它找到的。**逐条和你在第 1 步抄的清单核对**，缺的手动补上（尤其 `api` 和 `MX`）。
5. 继续后，Cloudflare 会给你**两个 nameserver 地址**，形如：

   ```text
   xxxx.ns.cloudflare.com
   yyyy.ns.cloudflare.com
   ```

### 2.2 去注册商改 nameserver

回到你的域名注册商后台 → 找到该域名的 **DNS / 名称服务器（Name Servers）** 设置 → 改成"使用自定义 DNS"，填入 Cloudflare 给的那两个地址 → 保存。

> 常见情况：注册商默认用自己的 NS（例如阿里云、腾讯云、GoDaddy、Namecheap 各自的地址）。把它们替换成 Cloudflare 的两个即可。**不要**删掉域名本身。

### 2.3 等待生效

- 通常 10 分钟到 2 小时，最长可能 24 小时。
- 验证：

  ```powershell
  nslookup -type=NS daymark.top
  ```

  如果显示的是 `*.ns.cloudflare.com`，就成功了。
- Cloudflare 后台该站点会从 "Pending" 变成 **Active**。这时再做后面的步骤。

### 2.4 立即检查 API 是否还活着

```powershell
curl.exe -I https://api.daymark.top/
```

只要还有响应（任何状态码都算），说明记录搬对了。如果这里断了，回到 Cloudflare 的 **DNS → Records** 补上缺失的 `api` 记录。

**Cloudflare 小知识（很重要）**

- **橙色云 vs 灰色云**：记录旁边那朵云，橙色 = 流量经过 Cloudflare（可缓存、可隐藏源站），灰色 = 直接解析（DNS only）。
  - `api.daymark.top` **建议先设为灰色云（DNS only）**，确认 API 正常后，再决定是否切橙色云。切橙色云时 SSL/TLS 模式要设成 **Full (strict)**，并且源站要有有效证书，否则会出现重定向循环或 525 错误。
  - 官网（Pages 自定义域）用 Cloudflare 默认即可。
- `www` 的处理：在 **Rules → Redirect Rules** 建一条规则，把 `www.daymark.top/*` 301 重定向到 `https://daymark.top/$1`，这样搜索引擎只会把主域名当主站。

---

## 3. 把仓库推到 GitHub

Cloudflare Pages 的"一键部署"是从 GitHub 仓库构建的，所以官网需要先在 GitHub 上有一个仓库。

> W0 §23 要求官网与产品 App 分仓，所以这里是**新建一个仓库**，不要放进 Daymark 主仓库。

```powershell
cd "E:\CUFE\vibecoding\Daymark website"

git init
git add .
git commit -m "Daymark website: W3 prototype (nav + hero + scene 01 + scene 02)"

# 在 GitHub 网页上新建一个空仓库，例如 Daymark-site，然后：
git remote add origin https://github.com/<你的用户名>/Daymark-site.git
git branch -M main
git push -u origin main
```

> `.gitignore` 已经排除了 `node_modules/`、`dist/`、`.review/`、`.env*`，不会把本地产物推上去。
> 不要往仓库里放任何密钥；官网上只会用到 `VITE_` 开头的公开配置。

---

## 4. 用 Cloudflare Pages 部署官网

1. Cloudflare 后台左侧选 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 授权 GitHub，选中 `Daymark-site` 仓库。
3. 构建配置填：

   | 字段 | 值 |
   |---|---|
   | Production branch | `main` |
   | Framework preset | `None` 或 `Vite` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | 留空（仓库根目录就是项目根目录） |

4. **Environment variables（可选，但建议）**：

   | 变量名 | 值 | 作用 |
   |---|---|---|
   | `VITE_APP_URL` | `https://app.daymark.top` | 所有"进入 Daymark"按钮的目标 |
   | `VITE_SITE_URL` | `https://daymark.top` | 站点自身地址 |
   | `VITE_GITHUB_URL` | 你的公开仓库地址 | Footer 的 GitHub 链接 |

   > 这些都是**公开**信息，会进入浏览器产物，这是正常的。数据库密码、JWT、Supabase service key、LLM key **绝不要**放在这里（W4 §35）。

5. 点 **Save and Deploy**，等 1–2 分钟。成功后你会得到一个 `xxx.pages.dev` 的临时地址，先点开看看对不对。

### 4.1 SPA 路由

仓库里的 `public/_redirects` 已经配置好，Cloudflare 会把未知路径交给 `index.html`，因此 `daymark.top/en/` 能正常打开而不是 404。

### 4.2 绑定正式域名

1. 进入该 Pages 项目 → **Custom domains** → **Set up a custom domain**。
2. 输入 `daymark.top`，确认。因为域名已经托管在同一个 Cloudflare 账号里，它会自动添加解析记录。
3. 再加一条 `www.daymark.top`（可选，之后按第 2.4 节做成跳转）。
4. 等状态变成 **Active**，访问 <https://daymark.top/> 应该就能看到官网了。

### 4.3 以后的更新方式

以后只要：

```powershell
git add .
git commit -m "调整 hero 间距"
git push
```

Cloudflare 会自动重新构建并上线。非 `main` 分支和 Pull Request 会自动得到一个独立的预览地址，可以拿给别人看效果而不影响正式站（W0 §23 提到的 preview deployment）。

### 4.4 出错怎么回滚

Pages 项目 → **Deployments** → 找到上一个正常版本 → **Rollback**。不需要动 Git。

---

## 5. 以后接 `app.daymark.top`

Daymark Web App 是另一个项目。两种常见做法：

- **也放 Cloudflare Pages**：新建第二个 Pages 项目（连产品仓库），然后加自定义域 `app.daymark.top`，步骤和第 4.2 节一样，最简单。
- **放在你自己的云服务器上**：在 Cloudflare **DNS** 里加一条 `app` 的 `A` 记录指向服务器 IP。先用灰色云确认能访问，再考虑切橙色云（此时 SSL/TLS 用 **Full (strict)**，源站需有证书）。

无论哪种，`api.daymark.top` 都保持独立，不要和官网的托管绑在一起（W0 §24）。

---

## 6. 上线前建议做的检查

- [ ] `https://daymark.top/` 是中文，`https://daymark.top/en/` 是英文，语言开关能来回切。
- [ ] `http://daymark.top` 会自动跳到 `https://`（Cloudflare 默认开启 **Always Use HTTPS**，在 SSL/TLS → Edge Certificates 里确认）。
- [ ] `www.daymark.top` 301 到 `daymark.top`。
- [ ] `https://daymark.top/robots.txt` 和 `/sitemap.xml` 能打开。
- [ ] `api.daymark.top` 仍然正常（这条最容易被忘记）。
- [ ] 手机上打开一次，确认没有横向滚动。
- [ ] 系统开启"减弱动态效果"后再打开一次，确认内容仍然完整可读。

---

## 7. 常见问题

**Q：改完 NS 后网站打不开了？**
DNS 还在传播。用 `nslookup -type=NS daymark.top` 确认 NS 是否已切换；必要时等 1–2 小时。

**Q：`api.daymark.top` 出现 525 / 重定向循环？**
这条记录被设成了橙色云，但源站证书不被信任。把 SSL/TLS 模式改成 **Full (strict)**，或先把这条记录改回灰色云（DNS only）。

**Q：Cloudflare 免费版在中国大陆访问慢？**
Cloudflare 免费版没有中国大陆节点，国内访问可能不稳定。先用起来观察；如果这是硬需求，再考虑备案 + 国内云托管静态站，或者用国内 CDN。这属于后续优化，不影响第一版上线。

**Q：需要在 Cloudflare 里再买什么吗？**
不需要。域名解析、Pages 托管、HTTPS 证书在免费版里都有。

**Q：会不会影响我给 AI 用的那些密钥？**
官网是纯静态站点，不含任何服务端逻辑，也不持有任何密钥；展示用的产品界面全部是本地假数据，不联网、不写库、不调用模型。你的密钥只应该待在后端（W0 §25）。
