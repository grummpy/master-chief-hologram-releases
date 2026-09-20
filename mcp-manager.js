'use strict';

(() => {
  const api = window.masterChief;
  const trigger = document.getElementById('mcpServerBtn');
  if (!api?.listMcpServers || !trigger) return;

  const dialog = document.createElement('dialog');
  dialog.id = 'mcpManager';
  dialog.className = 'mcp-manager';
  dialog.setAttribute('aria-labelledby', 'mcpManagerTitle');
  dialog.innerHTML = `
    <header><div><span class="eyebrow">BOUNDED TOOL CONNECTIONS</span><h2 id="mcpManagerTitle">MCP servers</h2></div><button type="button" data-mcp-close>Close</button></header>
    <p class="hint">Only HTTP(S) MCP endpoints are supported. Unencrypted endpoints must stay on this Mac or a private network. Discover tools, then approve each tool explicitly.</p>
    <form class="mcp-add-form">
      <label>Server name<input name="name" maxlength="100" required placeholder="Local tools"></label>
      <label>HTTP(S) endpoint<input name="endpoint" type="url" required placeholder="http://127.0.0.1:9000"></label>
      <button class="primary" type="submit">Add server</button>
    </form>
    <p class="hint" data-mcp-status role="status" aria-live="polite"></p>
    <div class="mcp-server-list" data-mcp-list aria-live="polite"></div>`;
  document.body.append(dialog);

  const list = dialog.querySelector('[data-mcp-list]');
  const status = dialog.querySelector('[data-mcp-status]');
  const form = dialog.querySelector('form');
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('error', error);
  };

  async function discover(server, container) {
    const button = container.querySelector('[data-mcp-discover]');
    button.disabled = true;
    setStatus(`Discovering tools from ${server.name}…`);
    try {
      const result = await api.listMcpTools(server.id);
      const tools = Array.isArray(result?.tools) ? result.tools : [];
      const permissions = server.permissions || {};
      const toolList = document.createElement('div');
      toolList.className = 'mcp-tool-list';
      if (!tools.length) toolList.textContent = 'This server reported no tools.';
      for (const tool of tools) {
        const label = document.createElement('div');
        label.className = 'mcp-tool-row';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(permissions[tool.name]);
        checkbox.setAttribute('aria-label', `Allow ${tool.name} from ${server.name}`);
        checkbox.onchange = async () => {
          checkbox.disabled = true;
          try {
            await api.setMcpPermission(server.id, tool.name, checkbox.checked);
            setStatus(`${tool.name} ${checkbox.checked ? 'approved' : 'disabled'} for ${server.name}.`);
          } catch (error) {
            checkbox.checked = !checkbox.checked;
            setStatus(error.message, true);
          } finally { checkbox.disabled = false; }
        };
        const copy = document.createElement('span');
        const name = document.createElement('strong');
        const description = document.createElement('small');
        name.textContent = tool.name;
        description.textContent = tool.description || 'No description supplied by this server.';
        copy.append(name, description);
        const run = document.createElement('button');
        run.type = 'button';
        run.textContent = 'Run';
        run.disabled = !checkbox.checked;
        run.setAttribute('aria-label', `Run ${tool.name} from ${server.name}`);
        run.onclick = async () => {
          const raw = prompt(`JSON arguments for ${tool.name}`, '{}');
          if (raw === null) return;
          let args;
          try { args = JSON.parse(raw); } catch { setStatus('Tool arguments must be valid JSON.', true); return; }
          run.disabled = true;
          setStatus(`Running ${tool.name}…`);
          try {
            const result = await api.callMcpTool(server.id, tool.name, args);
            const text = JSON.stringify(result, null, 2);
            setStatus(`${tool.name} completed. ${text.length > 500 ? `${text.slice(0, 500)}…` : text}`);
          } catch (error) { setStatus(`${tool.name} failed: ${error.message}`, true); }
          finally { run.disabled = !checkbox.checked; }
        };
        checkbox.addEventListener('change', () => { run.disabled = !checkbox.checked; });
        label.append(checkbox, copy, run);
        toolList.append(label);
      }
      container.querySelector('.mcp-tool-list')?.remove();
      container.append(toolList);
      setStatus(`${tools.length} tool${tools.length === 1 ? '' : 's'} discovered from ${server.name}.`);
    } catch (error) {
      setStatus(`Could not discover tools: ${error.message}`, true);
    } finally { button.disabled = false; }
  }

  async function render() {
    list.replaceChildren();
    try {
      const state = await api.listMcpServers();
      const servers = Array.isArray(state?.servers) ? state.servers : [];
      if (!servers.length) {
        const empty = document.createElement('p');
        empty.className = 'hint';
        empty.textContent = 'No MCP servers registered.';
        list.append(empty);
        return;
      }
      for (const server of servers) {
        const card = document.createElement('section');
        card.className = 'mcp-server-card';
        const header = document.createElement('header');
        const identity = document.createElement('div');
        const name = document.createElement('strong');
        const endpoint = document.createElement('small');
        name.textContent = server.name;
        endpoint.textContent = server.endpoint;
        identity.append(name, endpoint);
        const actions = document.createElement('div');
        const discoverButton = document.createElement('button');
        discoverButton.type = 'button';
        discoverButton.dataset.mcpDiscover = '';
        discoverButton.textContent = 'Discover tools';
        discoverButton.onclick = () => discover(server, card);
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'danger-subtle';
        removeButton.textContent = 'Remove';
        removeButton.onclick = async () => {
          if (!confirm(`Remove MCP server “${server.name}”?`)) return;
          try { await api.removeMcpServer(server.id); setStatus(`${server.name} removed.`); await render(); }
          catch (error) { setStatus(error.message, true); }
        };
        actions.append(discoverButton, removeButton);
        header.append(identity, actions);
        card.append(header);
        list.append(card);
      }
    } catch (error) { setStatus(`MCP registry unavailable: ${error.message}`, true); }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const saved = await api.saveMcpServer({ name: data.get('name'), endpoint: data.get('endpoint') });
      form.reset();
      setStatus(`${saved.name} registered. Discover its tools before approving access.`);
      await render();
    } catch (error) { setStatus(error.message, true); }
    finally { submit.disabled = false; }
  });
  dialog.querySelector('[data-mcp-close]').onclick = () => dialog.close();
  trigger.onclick = async () => { await render(); dialog.showModal(); };
})();
