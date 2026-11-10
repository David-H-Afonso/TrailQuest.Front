import { Component, type ReactNode } from 'react';
import { Button } from './Button';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="fatal-error"><h1>No se ha podido abrir esta vista</h1>
      <p>Tus datos siguen guardados en el equipo. Recarga la página para volver a intentarlo.</p>
      <Button icon="refresh" onClick={() => location.reload()}>Recargar aplicación</Button></main>;
    return this.props.children;
  }
}
