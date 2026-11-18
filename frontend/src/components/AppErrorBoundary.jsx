import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error de renderizado en MG-Vacuna:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "28px",
            background: "#f5f8fb",
            color: "#344b61",
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <section
            style={{
              width: "min(680px, 100%)",
              padding: "28px",
              border: "1px solid #e5ebf0",
              borderRadius: "16px",
              background: "#fff",
              boxShadow: "0 12px 35px rgba(38, 59, 79, .08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                className="material-symbols-rounded"
                style={{ color: "#b85b60", fontSize: "30px" }}
              >
                error
              </span>
              <div>
                <small style={{ color: "#8b9aa7", letterSpacing: ".08em" }}>
                  MG-VACUNA · ERROR DE INTERFAZ
                </small>
                <h1 style={{ margin: "4px 0", fontSize: "20px" }}>
                  No se pudo mostrar esta pantalla
                </h1>
              </div>
            </div>
            <p style={{ color: "#788a9a", fontSize: "13px", lineHeight: 1.7 }}>
              La aplicación detectó un error al renderizar un componente. El resto
              del sistema no se ha eliminado. Revisa el mensaje siguiente y la
              consola del navegador para identificar el archivo que lo provoca.
            </p>
            <pre
              style={{
                padding: "13px",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                borderRadius: "9px",
                background: "#fff4f3",
                color: "#9e4c51",
                fontSize: "11px",
              }}
            >
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 15px",
                border: 0,
                borderRadius: "8px",
                background: "#496f8f",
                color: "#fff",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Recargar aplicación
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}