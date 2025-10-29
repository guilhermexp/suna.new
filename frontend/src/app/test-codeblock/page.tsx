'use client';

import { CodeBlock, InlineCode } from '@/components/CodeBlock';

/**
 * Test page for Liquid Glass Code Block System
 * This page demonstrates all the features of the new code block implementation
 */
export default function TestCodeBlockPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Liquid Glass Code Blocks</h1>
          <p className="text-lg text-muted-foreground">
            Testing the new code block styling system with near-black background and syntax highlighting
          </p>
        </header>

        {/* TypeScript Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">TypeScript Example</h2>
          <CodeBlock
            code={`interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

function getUserById(id: string): User | null {
  const users: User[] = getUsers();
  return users.find(user => user.id === id) ?? null;
}

const currentUser = getUserById('123');
console.log(currentUser?.name);`}
            language="typescript"
            filename="user.ts"
          />
        </section>

        {/* JavaScript Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">React Component</h2>
          <CodeBlock
            code={`import React, { useState, useEffect } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? 'Stop' : 'Start'}
      </button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}`}
            language="tsx"
            filename="Counter.tsx"
          />
        </section>

        {/* Python Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Python Example</h2>
          <CodeBlock
            code={`from typing import List, Optional

class DataProcessor:
    """Process and analyze data efficiently."""

    def __init__(self, data: List[int]):
        self.data = data
        self._cache: Optional[dict] = None

    def process(self) -> dict:
        """Process the data and return statistics."""
        if self._cache:
            return self._cache

        self._cache = {
            'sum': sum(self.data),
            'avg': sum(self.data) / len(self.data),
            'min': min(self.data),
            'max': max(self.data),
        }
        return self._cache

# Usage
processor = DataProcessor([1, 2, 3, 4, 5])
stats = processor.process()
print(f"Statistics: {stats}")`}
            language="python"
            filename="processor.py"
          />
        </section>

        {/* Bash Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Bash Script</h2>
          <CodeBlock
            code={`#!/bin/bash

# Deployment script with error handling
set -e

DEPLOY_DIR="/var/www/app"
BACKUP_DIR="/var/backups/app"

echo "Starting deployment..."

# Create backup
if [ -d "$DEPLOY_DIR" ]; then
  echo "Creating backup..."
  cp -r "$DEPLOY_DIR" "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
fi

# Build application
echo "Building application..."
npm run build

# Run tests
if npm test; then
  echo "Tests passed! Deploying..."
  rsync -avz dist/ "$DEPLOY_DIR/"
  echo "Deployment complete!"
else
  echo "Tests failed! Aborting deployment."
  exit 1
fi`}
            language="bash"
            filename="deploy.sh"
          />
        </section>

        {/* JSON Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">JSON Configuration</h2>
          <CodeBlock
            code={`{
  "name": "liquid-glass-app",
  "version": "1.0.0",
  "description": "Modern code blocks with liquid glass design",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "shiki": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0"
  }
}`}
            language="json"
            filename="package.json"
          />
        </section>

        {/* CSS Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">CSS Styling</h2>
          <CodeBlock
            code={`.liquid-glass-effect {
  background: linear-gradient(
    135deg,
    rgba(18, 18, 18, 0.95),
    rgba(26, 26, 26, 0.95)
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  transition: all 250ms ease-in-out;
}

.liquid-glass-effect:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}`}
            language="css"
            filename="styles.css"
          />
        </section>

        {/* Compact Variant */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Compact Variant</h2>
          <CodeBlock
            code={`const greeting = (name) => \`Hello, \${name}!\`;
console.log(greeting('World'));`}
            language="javascript"
            compact
          />
        </section>

        {/* Without Header */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Without Header</h2>
          <CodeBlock
            code={`SELECT * FROM users WHERE active = true ORDER BY created_at DESC;`}
            language="sql"
            showHeader={false}
          />
        </section>

        {/* Inline Code */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Inline Code</h2>
          <div className="space-y-2 text-base">
            <p>
              To install the package, run <InlineCode>npm install liquid-glass</InlineCode> in
              your terminal.
            </p>
            <p>
              Import it using{' '}
              <InlineCode>import {'{'} CodeBlock {'}'} from '@/components/CodeBlock'</InlineCode>.
            </p>
            <p>
              Use the <InlineCode>const result = add(5, 3)</InlineCode> syntax for inline code.
            </p>
          </div>
        </section>

        {/* Long Code with Scrolling */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Long Code (Scrollable)</h2>
          <CodeBlock
            code={`import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function TaskManager() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks');
      return response.json();
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Toggle task mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(\`/api/tasks/\${id}/toggle\`, {
        method: 'PATCH',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'active') return tasks.filter(task => !task.completed);
    return tasks.filter(task => task.completed);
  }, [tasks, filter]);

  const handleAddTask = useCallback((title: string, description: string) => {
    addTaskMutation.mutate({ title, description, completed: false });
  }, [addTaskMutation]);

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div className="task-manager">
      <h1>Task Manager</h1>

      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <ul className="task-list">
        {filteredTasks.map(task => (
          <li key={task.id}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTaskMutation.mutate(task.id)}
            />
            <span>{task.title}</span>
            <p>{task.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}`}
            language="tsx"
            filename="TaskManager.tsx"
            maxHeight={400}
          />
        </section>

        {/* Footer */}
        <footer className="text-center text-muted-foreground py-8">
          <p>Liquid Glass Code Block System - Phase 1 Complete</p>
          <p className="text-sm mt-2">
            Features: CSS Framework, Syntax Highlighting, Copy Button, Responsive Design,
            Accessibility
          </p>
        </footer>
      </div>
    </div>
  );
}
