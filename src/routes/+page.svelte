<!-- src/routes/+page.svelte -->
<script>
    import { onMount } from "svelte";

    let commands = [];
    let pendingCommands = [];
    let newCommand = { tag_id: '', floor: 1, robot_id: '' };
    let activeTab = 'history'; // 'history' or 'pending'
    let isLoading = false;
    let error = null;

    async function fetchCommands() {
        try {
            isLoading = true;
            error = null;
            const [historyRes, pendingRes] = await Promise.all([
                fetch('http://127.0.0.1:3000/commands'),
                fetch('http://127.0.0.1:3000/commands/pending')
            ]);

            if (!historyRes.ok || !pendingRes.ok) {
                throw new Error('Failed to fetch commands');
            }

            commands = await historyRes.json();
            pendingCommands = await pendingRes.json();
        } catch (err) {
            error = err.message;
            console.error("Fetch error:", err);
        } finally {
            isLoading = false;
        }
    }

    async function createCommand() {
        if (!newCommand.tag_id.trim()) {
            error = "Tag ID is required";
            return;
        }
        if (!newCommand.robot_id.trim()) {
            error = "Robot ID is required";
            return;
        }
        try {
            isLoading = true;
            error = null;
            const res = await fetch('http://127.0.0.1:3000/commands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCommand)
            });

            if (!res.ok) {
                throw new Error('Failed to create command');
            }

            newCommand = { tag_id: '', floor: 1, robot_id: '' };
            await fetchCommands();
        } catch (err) {
            error = err.message;
            console.error("Create error:", err);
        } finally {
            isLoading = false;
        }
    }

    async function completeCommand(id) {
        try {
            isLoading = true;
            error = null;
            const res = await fetch(`http://127.0.0.1:3000/commands/${id}/complete`, {
                method: 'POST'
            });

            if (!res.ok) {
                throw new Error('Failed to complete command');
            }

            await fetchCommands();
        } catch (err) {
            error = err.message;
            console.error("Complete error:", err);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        fetchCommands();
    });
</script>

<div class="container">
    <header>
        <h1>🤖 Robot Command Center</h1>
        {#if error}
            <div class="error-banner">{error}</div>
        {/if}
    </header>

    <div class="command-form card">
        <h2>Create New Command</h2>
        <div class="form-group">
            <label for="tag-id">Tag ID:</label>
            <input
                    id="tag-id"
                    bind:value={newCommand.tag_id}
                    placeholder="e.g. tag_1"
                    class="input-field"
            />
        </div>
        <div class="form-group">
            <label for="robot-id">Robot ID:</label>
            <input
                    id="robot-id"
                    bind:value={newCommand.robot_id}
                    placeholder="e.g. robot_1"
                    class="input-field"
            />
        </div>
        <div class="form-group">
            <label for="floor">Floor:</label>
            <input
                    id="floor"
                    type="number"
                    bind:value={newCommand.floor}
                    min="1"
                    max="10"
                    class="input-field"
            />
        </div>
        <button
                on:click={createCommand}
                class="primary-button"
                disabled={isLoading}
        >
            {isLoading ? 'Creating...' : 'Create Command'}
        </button>
    </div>

    <div class="tabs">
        <button
                class:active={activeTab === 'history'}
                on:click={() => activeTab = 'history'}
        >
            Command History
        </button>
        <button
                class:active={activeTab === 'pending'}
                on:click={() => activeTab = 'pending'}
        >
            Pending Commands ({pendingCommands.length})
        </button>
    </div>

    {#if isLoading && commands.length === 0}
        <div class="loading">Loading commands...</div>
    {:else}
        <div class="command-list card">
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Robot</th>
                    <th>Tag</th>
                    <th>Floor</th>
                    <th>Status</th>
                    <th>Created At</th>
                    {#if activeTab === 'pending'}
                        <th>Action</th>
                    {/if}
                </tr>
                </thead>
                <tbody>
                {#if activeTab === 'history'}
                    {#each commands as command}
                        <tr class:completed={command.status === 'completed'}>
                            <td>{command.id.slice(0, 8)}</td>
                            <td>{command.robot_id}</td>
                            <td>{command.tag_id}</td>
                            <td>{command.floor}</td>
                            <td>
                                    <span class="status-badge {command.status}">
                                        {command.status}
                                    </span>
                            </td>
                            <td>{new Date(command.created_at).toLocaleString()}</td>
                        </tr>
                    {/each}
                {:else}
                    {#each pendingCommands as command}
                        <tr>
                            <td>{command.id.slice(0, 8)}</td>
                            <td>{command.robot_id}</td>
                            <td>{command.tag_id}</td>
                            <td>{command.floor}</td>
                            <td>
                                    <span class="status-badge pending">
                                        {command.status}
                                    </span>
                            </td>
                            <td>{new Date(command.created_at).toLocaleString()}</td>
                            <td>
                                <button
                                        on:click={() => completeCommand(command.id)}
                                        class="action-button"
                                        disabled={isLoading}
                                >
                                    Mark Complete
                                </button>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="6" class="no-commands">No pending commands</td>
                        </tr>
                    {/each}
                {/if}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f8f9fa;
        color: #333;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    header {
        margin-bottom: 2rem;
        text-align: center;
    }

    h1 {
        color: #2c3e50;
        margin-bottom: 0.5rem;
    }

    .error-banner {
        background-color: #ffebee;
        color: #c62828;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        text-align: center;
    }

    .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    .input-field {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
    }

    .primary-button {
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s;
    }

    .primary-button:hover {
        background-color: #388E3C;
    }

    .primary-button:disabled {
        background-color: #a5d6a7;
        cursor: not-allowed;
    }

    .tabs {
        display: flex;
        margin-bottom: 1rem;
        border-bottom: 1px solid #ddd;
    }

    .tabs button {
        padding: 0.75rem 1.5rem;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        color: #666;
        position: relative;
    }

    .tabs button.active {
        color: #2c3e50;
        font-weight: 500;
    }

    .tabs button.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background-color: #4CAF50;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }

    th {
        background-color: #f5f5f5;
        padding: 1rem;
        text-align: left;
        font-weight: 500;
    }

    td {
        padding: 1rem;
        border-bottom: 1px solid #eee;
        vertical-align: middle;
    }

    tr:last-child td {
        border-bottom: none;
    }

    tr.completed {
        color: #999;
    }

    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .status-badge.pending {
        background-color: #fff3e0;
        color: #e65100;
    }

    .status-badge.completed {
        background-color: #e8f5e9;
        color: #2e7d32;
    }

    .action-button {
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.3s;
    }

    .action-button:hover {
        background-color: #1976D2;
    }

    .action-button:disabled {
        background-color: #bbdefb;
        cursor: not-allowed;
    }

    .no-commands {
        text-align: center;
        color: #666;
        padding: 2rem;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
    }

    @media (max-width: 768px) {
        .container {
            padding: 1rem;
        }

        table {
            display: block;
            overflow-x: auto;
        }
    }
</style>