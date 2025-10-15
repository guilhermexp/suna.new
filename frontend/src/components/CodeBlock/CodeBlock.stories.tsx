import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock, InlineCode } from './CodeBlock';

/**
 * CodeBlock component showcases code snippets with beautiful liquid glass styling,
 * syntax highlighting, and copy functionality.
 */
const meta: Meta<typeof CodeBlock> = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A modern code block component with liquid glass morphism design, syntax highlighting via Shiki, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    code: {
      control: 'text',
      description: 'The code string to display',
    },
    language: {
      control: 'select',
      options: [
        'javascript',
        'typescript',
        'python',
        'bash',
        'jsx',
        'tsx',
        'json',
        'css',
        'html',
        'markdown',
        'sql',
        'yaml',
      ],
      description: 'Programming language for syntax highlighting',
    },
    filename: {
      control: 'text',
      description: 'Optional filename to display in header',
    },
    showHeader: {
      control: 'boolean',
      description: 'Show/hide the header',
    },
    showCopyButton: {
      control: 'boolean',
      description: 'Show/hide copy button',
    },
    compact: {
      control: 'boolean',
      description: 'Compact variant with reduced padding',
    },
    maxHeight: {
      control: 'number',
      description: 'Maximum height before scrolling (in pixels)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

/**
 * Default story showing TypeScript code
 */
export const Default: Story = {
  args: {
    code: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet('World');
console.log(message);`,
    language: 'typescript',
    filename: 'greet.ts',
  },
};

/**
 * JavaScript example with React component
 */
export const JavaScript: Story = {
  args: {
    code: `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
    language: 'javascript',
    filename: 'Counter.jsx',
  },
};

/**
 * Python example with function
 */
export const Python: Story = {
  args: {
    code: `def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]

    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])

    return sequence

# Generate first 10 Fibonacci numbers
result = fibonacci(10)
print(f"Fibonacci sequence: {result}")`,
    language: 'python',
    filename: 'fibonacci.py',
  },
};

/**
 * Bash script example
 */
export const Bash: Story = {
  args: {
    code: `#!/bin/bash

# Deploy script for production
echo "Starting deployment..."

# Build the application
npm run build

# Run tests
npm test

# Deploy to server
if [ $? -eq 0 ]; then
  echo "Tests passed! Deploying..."
  rsync -avz dist/ user@server:/var/www/
  echo "Deployment complete!"
else
  echo "Tests failed! Aborting deployment."
  exit 1
fi`,
    language: 'bash',
    filename: 'deploy.sh',
  },
};

/**
 * JSON configuration example
 */
export const JSON: Story = {
  args: {
    code: `{
  "name": "liquid-glass-codeblock",
  "version": "1.0.0",
  "description": "Beautiful code blocks with liquid glass design",
  "main": "index.ts",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "shiki": "^1.0.0"
  }
}`,
    language: 'json',
    filename: 'package.json',
  },
};

/**
 * CSS styling example
 */
export const CSS: Story = {
  args: {
    code: `.liquid-glass-container {
  background: linear-gradient(
    135deg,
    rgba(18, 18, 18, 0.95),
    rgba(26, 26, 26, 0.95)
  );
  backdrop-filter: blur(12px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  padding: 1rem;
  transition: all 250ms ease-in-out;
}

.liquid-glass-container:hover {
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}`,
    language: 'css',
    filename: 'styles.css',
  },
};

/**
 * Compact variant with less padding
 */
export const Compact: Story = {
  args: {
    code: `const add = (a, b) => a + b;
const result = add(5, 3);`,
    language: 'javascript',
    compact: true,
  },
};

/**
 * Without header
 */
export const WithoutHeader: Story = {
  args: {
    code: `console.log('Hello, World!');`,
    language: 'javascript',
    showHeader: false,
  },
};

/**
 * Without copy button
 */
export const WithoutCopyButton: Story = {
  args: {
    code: `SELECT * FROM users WHERE active = true;`,
    language: 'sql',
    showCopyButton: false,
  },
};

/**
 * Long code with scrolling
 */
export const LongCode: Story = {
  args: {
    code: `// This is a long file to demonstrate scrolling
import React, { useState, useEffect, useCallback } from 'react';

export default function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.example.com/data');

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Data:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={fetchData}>Refresh</button>
    </div>
  );
}`,
    language: 'typescript',
    maxHeight: 300,
    filename: 'DataFetcher.tsx',
  },
};

/**
 * Inline code example
 */
export const InlineCodeExample: Story = {
  render: () => (
    <div className="p-4 space-y-4">
      <p className="text-base">
        To install the package, run <InlineCode>npm install liquid-glass</InlineCode> in your
        terminal.
      </p>
      <p className="text-base">
        Then import it using <InlineCode>import {'{'}CodeBlock{'}'} from 'liquid-glass'</InlineCode>.
      </p>
      <p className="text-base">
        You can also use the shorthand <InlineCode>const greet = (name) =&gt; `Hello ${'{'}name{'}'}!`</InlineCode> syntax.
      </p>
    </div>
  ),
};

/**
 * Multiple code blocks
 */
export const MultipleBlocks: Story = {
  render: () => (
    <div className="space-y-6">
      <CodeBlock
        code="npm install liquid-glass-codeblock"
        language="bash"
        filename="terminal"
        compact
      />
      <CodeBlock
        code={`import { CodeBlock } from 'liquid-glass-codeblock';

export default function App() {
  return (
    <CodeBlock
      code="const hello = 'world';"
      language="javascript"
    />
  );
}`}
        language="tsx"
        filename="App.tsx"
      />
    </div>
  ),
};
