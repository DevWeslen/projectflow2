const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'lib', 'store.ts');
let content = fs.readFileSync(storePath, 'utf-8');

if (!content.includes('initStore: () => Promise<void>')) {
  // 1. Add interface method
  content = content.replace(
    'deleteUser: (id: string) => void',
    'deleteUser: (id: string) => void\n  initStore: () => Promise<void>'
  );

  // 2. Add backgroundSync helper
  content = content.replace(
    /const generateId = \(\) => Math\.random\(\)\.toString\(36\)\.substring\(2, 15\)/,
    `const backgroundSync = (url: string, method: string, data?: any) => {\n  fetch(url, {\n    method,\n    headers: { 'Content-Type': 'application/json' },\n    body: data ? JSON.stringify(data) : undefined,\n  }).catch(err => console.error('Sync error:', err))\n}\n\nconst generateId = () => Math.random().toString(36).substring(2, 15)`
  );

  // 3. Implement initStore
  content = content.replace(
    'users: [',
    `initStore: async () => {\n        try {\n          const res = await fetch('/api/sync')\n          if (res.ok) {\n            const data = await res.json()\n            set((state) => ({\n              ...state,\n              projects: data.projects || state.projects,\n              tasks: data.tasks || state.tasks,\n              users: data.users && data.users.length > 0 ? data.users : state.users,\n              riskAnalyses: data.riskAnalyses || state.riskAnalyses\n            }))\n          }\n        } catch (error) {\n          console.error("Failed to sync store with backend", error)\n        }\n      },\n\n      users: [`
  );

  // 4. Inject backgroundSync into methods
  // login, logout - no change needed
  // addUser
  content = content.replace(
    /addUser: \(userData\) => \{([\s\S]*?)set\(\(state\) => \(\{([\s\S]*?)users: \[\.\.\.state\.users, \{ \.\.\.userData, id \}]([\s\S]*?)\}\)\)([\s\S]*?)\},/,
    (match) => {
      // Need to capture the user object to send it
      return `addUser: (userData) => {\n        const id = generateId()\n        const user = { ...userData, id }\n        set((state) => ({\n          users: [...state.users, user]\n        }))\n        backgroundSync('/api/users', 'POST', user)\n      },`;
    }
  );

  // updateUser
  content = content.replace(
    /updateUser: \(id, updates\) => \{\s+set\(\(state\) => \(\{\s+users: state\.users\.map\(\(u\) => \(u\.id === id \? \{ \.\.\.u, \.\.\.updates \} : u\)\)\s+\}\)\)\s+\},/,
    `updateUser: (id, updates) => {\n        set((state) => ({\n          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u))\n        }))\n        backgroundSync('/api/users', 'PUT', { id, ...updates })\n      },`
  );

  // deleteUser
  content = content.replace(
    /deleteUser: \(id\) => \{\s+set\(\(state\) => \(\{\s+users: state\.users\.filter\(\(u\) => u\.id !== id\)\s+\}\)\)\s+\},/,
    `deleteUser: (id) => {\n        set((state) => ({\n          users: state.users.filter((u) => u.id !== id)\n        }))\n        backgroundSync(\`/api/users?id=\${id}\`, 'DELETE')\n      },`
  );

  // addProject
  content = content.replace(
    /set\(\(state\) => \(\{\s+projects: \[\.\.\.state\.projects, project\],\s+selectedProjectId: id\s+\}\)\)\s+return id\s+\},/,
    `set((state) => ({\n          projects: [...state.projects, project],\n          selectedProjectId: id\n        }))\n        backgroundSync('/api/projects', 'POST', project)\n        return id\n      },`
  );

  // updateProject
  content = content.replace(
    /updateProject: \(id, updates\) => \{\s+set\(\(state\) => \(\{\s+projects: state\.projects\.map\(\(p\) =>\s+p\.id === id \? \{ \.\.\.p, \.\.\.updates, updatedAt: new Date\(\) \} : p\s+\)\s+\}\)\)\s+\},/,
    `updateProject: (id, updates) => {\n        set((state) => ({\n          projects: state.projects.map((p) =>\n            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p\n          )\n        }))\n        backgroundSync('/api/projects', 'PUT', { id, ...updates })\n      },`
  );

  // deleteProject
  content = content.replace(
    /deleteProject: \(id\) => \{\s+set\(\(state\) => \(\{\s+projects: state\.projects\.filter\(\(p\) => p\.id !== id\),\s+tasks: state\.tasks\.filter\(\(t\) => t\.projectId !== id\),\s+riskAnalyses: state\.riskAnalyses\.filter\(\(r\) => r\.projectId !== id\),\s+selectedProjectId: state\.selectedProjectId === id \? null : state\.selectedProjectId\s+\}\)\)\s+\},/,
    `deleteProject: (id) => {\n        set((state) => ({\n          projects: state.projects.filter((p) => p.id !== id),\n          tasks: state.tasks.filter((t) => t.projectId !== id),\n          riskAnalyses: state.riskAnalyses.filter((r) => r.projectId !== id),\n          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId\n        }))\n        backgroundSync(\`/api/projects?id=\${id}\`, 'DELETE')\n      },`
  );

  // addTask
  content = content.replace(
    /set\(\(state\) => \(\{ tasks: \[\.\.\.state\.tasks, task\] \}\)\)\s+return id\s+\},/,
    `set((state) => ({ tasks: [...state.tasks, task] }))\n        backgroundSync('/api/tasks', 'POST', task)\n        return id\n      },`
  );

  // updateTask (it returns object in functional set)
  content = content.replace(
    /return \{ tasks \}\s+\}\)\s+\},(?=\s+deleteTask)/,
    `return { tasks }\n        })\n        // Syncing just the updated task to backend to keep it simple\n        backgroundSync('/api/tasks', 'PUT', { id, ...updates })\n      },`
  );

  // deleteTask
  content = content.replace(
    /set\(\(state\) => \(\{\s+tasks: state\.tasks\.filter\(\(t\) => !idsToDelete\.includes\(t\.id\)\)\s+\}\)\)\s+\},/,
    `set((state) => ({\n          tasks: state.tasks.filter((t) => !idsToDelete.includes(t.id))\n        }))\n        idsToDelete.forEach(toDelete => backgroundSync(\`/api/tasks?id=\${toDelete}\`, 'DELETE'))\n      },`
  );

  // addRiskAnalysis
  content = content.replace(
    /set\(\(state\) => \(\{ riskAnalyses: \[\.\.\.state\.riskAnalyses, analysis\] \}\)\)\s+return id\s+\},/,
    `set((state) => ({ riskAnalyses: [...state.riskAnalyses, analysis] }))\n        backgroundSync('/api/risk-analyses', 'POST', analysis)\n        return id\n      },`
  );

  // updateRiskAnalysis
  content = content.replace(
    /updateRiskAnalysis: \(id, updates\) => \{\s+set\(\(state\) => \(\{\s+riskAnalyses: state\.riskAnalyses\.map\(\(r\) =>\s+r\.id === id \? \{ \.\.\.r, \.\.\.updates, updatedAt: new Date\(\) \} : r\s+\)\s+\}\)\)\s+\},/,
    `updateRiskAnalysis: (id, updates) => {\n        set((state) => ({\n          riskAnalyses: state.riskAnalyses.map((r) =>\n            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r\n          )\n        }))\n        backgroundSync('/api/risk-analyses', 'PUT', { id, ...updates })\n      },`
  );

  // deleteRiskAnalysis
  content = content.replace(
    /deleteRiskAnalysis: \(id\) => \{\s+set\(\(state\) => \(\{\s+riskAnalyses: state\.riskAnalyses\.filter\(\(r\) => r\.id !== id\)\s+\}\)\)\s+\},/,
    `deleteRiskAnalysis: (id) => {\n        set((state) => ({\n          riskAnalyses: state.riskAnalyses.filter((r) => r.id !== id)\n        }))\n        backgroundSync(\`/api/risk-analyses?id=\${id}\`, 'DELETE')\n      },`
  );

  // Finally remove persist since we sync from API initially. Oh wait, if we remove persist, the user experiences a blank screen before fetch completes. But since the app expects local data immediately, it's better to keep persist but let initStore OVERWRITE it. The only issue is if persist writes backward to the state.
  
  fs.writeFileSync(storePath, content, 'utf-8');
  console.log('Store patched successfully.');
} else {
  console.log('Store already patched.');
}
