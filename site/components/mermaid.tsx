'use client';

import { useTheme } from 'next-themes';
import { useEffect, useId, useState } from 'react';

/** A mermaid diagram from a fenced block in docs/, drawn in the browser in the current theme. */
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let current = true;
    void (async () => {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        fontFamily: 'inherit',
        theme: resolvedTheme === 'dark' ? 'dark' : 'neutral',
      });
      try {
        const { svg: drawn } = await mermaid.render(`mermaid-${id}`, chart);
        if (current) setSvg(drawn);
      } catch {
        if (current) setSvg('');
      }
    })();
    return () => {
      current = false;
    };
  }, [chart, id, resolvedTheme]);

  if (!svg) return <pre className="text-xs">{chart}</pre>;
  return <div className="my-6 flex justify-center overflow-x-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}
