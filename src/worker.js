addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // 静态文件服务
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return new Response(await getAsset('index.html'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
  if (url.pathname === '/script.js') {
    return new Response(await getAsset('script.js'), {
      headers: { 'Content-Type': 'application/javascript' },
    });
  }
  if (url.pathname === '/style.css') {
    return new Response(await getAsset('style.css'), {
      headers: { 'Content-Type': 'text/css' },
    });
  }

  // API 端点
  if (url.pathname === '/api/save' && request.method === 'POST') {
    const { username, encryptedData } = await request.json();
    await PASSWORD_KV.put(username, encryptedData);
    return new Response('Saved successfully', { status: 200 });
  }

  if (url.pathname === '/api/load' && request.method === 'GET') {
    const username = url.searchParams.get('username');
    const encryptedData = await PASSWORD_KV.get(username);
    return new Response(encryptedData || '[]', { status: 200 });
  }

  return new Response('Not Found', { status: 404 });
}

// 模拟静态文件获取（部署时由 Wrangler 处理）
async function getAsset(filename) {
  const assets = {
    'index.html': INDEX_HTML,
    'script.js': SCRIPT_JS,
    'style.css': STYLE_CSS,
  };
  return assets[filename] || 'Not Found';
}

// 以下内容由 Wrangler 自动注入静态文件
const INDEX_HTML = `<!DOCTYPE html>...`; // 见下文 index.html
const SCRIPT_JS = `...`; // 见下文 script.js
const STYLE_CSS = `...`; // 见下文 style.css
