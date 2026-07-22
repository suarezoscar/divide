import { Component, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: "" };

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <h1 className={styles.title}>Algo salió mal</h1>
            <p className={styles.message}>{this.state.error}</p>
            <button
              className={styles.button}
              onClick={() => window.location.reload()}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
