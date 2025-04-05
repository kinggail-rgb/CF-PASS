let encryptionKey;

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt || crypto.getRandomValues(new Uint8Array(16)),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data))
  );
  return { iv: Array.from(iv), encrypted: Array.from(new Uint8Array(encrypted)) };
}

async function decrypt(encryptedData, key) {
  const dec = new TextDecoder();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
    key,
    new Uint8Array(encryptedData.encrypted)
  );
  return JSON.parse(dec.decode(decrypted));
}

async function login() {
  const username = document.getElementById('username').value;
  const masterPassword = document.getElementById('masterPassword').value;
  encryptionKey = await deriveKey(masterPassword);
  const encryptedData = await fetch(`/api/load?username=${username}`).then(res => res.text());
  const data = encryptedData === '[]' ? [] : await decrypt(JSON.parse(encryptedData), encryptionKey);
  document.getElementById('auth').style.display = 'none';
  document.getElementById('manager').style.display = 'block';
  renderPasswords(data);
  window.currentData = data;
  window.username = username;
}

function logout() {
  encryptionKey = null;
  document.getElementById('auth').style.display = 'block';
  document.getElementById('manager').style.display = 'none';
}

async function addPassword() {
  const name = document.getElementById('accountName').value;
  const password = document.getElementById('accountPassword').value;
  window.currentData.push({ name, password });
  const encrypted = await encrypt(window.currentData, encryptionKey);
  await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: window.username, encryptedData: JSON.stringify(encrypted) }),
  });
  renderPasswords(window.currentData);
}

function renderPasswords(data) {
  const list = document.getElementById('passwordList');
  list.innerHTML = '';
  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name}: ${item.password}`;
    list.appendChild(li);
  });
}
