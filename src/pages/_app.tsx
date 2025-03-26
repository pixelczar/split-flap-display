import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ThemeProvider } from '@/components/theme-provider'

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="bg-slate-900/50 p-12 rounded-lg backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
        <pre className="text-red-400 mb-4">{error.message}</pre>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={resetErrorBoundary}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Component {...pageProps} />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
