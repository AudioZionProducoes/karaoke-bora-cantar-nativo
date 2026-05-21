export function WelcomeEmail() {
  return (
    <div className="min-h-screen bg-neutral-200 p-6 flex items-center justify-center">
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src="/logo.jpeg"
            alt="Karaokê Bora Cantar"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "12px",
            }}
          />
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#1a1a1a",
              margin: 0,
            }}
          >
            Karaokê <span style={{ color: "#d4af37" }}>Bora Cantar</span>
          </h1>
        </div>
        <h2
          style={{
            fontSize: "20px",
            color: "#1a1a1a",
            margin: "0 0 16px",
            fontWeight: 700,
          }}
        >
          Bem-vindo, assinante!
        </h2>
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.6,
            color: "#444",
            margin: "0 0 16px",
          }}
        >
          Obrigado por se tornar assinante do Karaokê Bora Cantar. Sua conta foi
          criada com sucesso e você já pode acessar nossa plataforma com o
          catálogo completo de músicas.
        </p>
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "20px",
            margin: "20px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: "1px solid #e9ecef",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#6c757d",
                fontWeight: 500,
              }}
            >
              Email
            </span>
            <span
              style={{
                fontSize: "15px",
                color: "#1a1a1a",
                fontWeight: 600,
              }}
            >
              audiozion.producoes@gmail.com
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#6c757d",
                fontWeight: 500,
              }}
            >
              Senha temporária
            </span>
            <span
              style={{
                fontSize: "22px",
                fontFamily: "'SF Mono', Monaco, monospace",
                color: "#d4af37",
                letterSpacing: "2px",
                fontWeight: 700,
              }}
            >
              84729301
            </span>
          </div>
        </div>
        <p style={{ textAlign: "center" }}>
          <a
            href="#"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #d4af37 0%, #c9a227 100%)",
              color: "#000",
              textDecoration: "none",
              padding: "14px 32px",
              borderRadius: "50px",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            Acessar Plataforma
          </a>
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#6c757d",
            textAlign: "center",
            marginTop: "8px",
          }}
        >
          Após o primeiro login, recomendamos trocar sua senha por uma de sua
          preferência.
        </p>
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e9ecef",
          }}
        >
          <p style={{ fontSize: "12px", color: "#adb5bd", margin: "4px 0" }}>
            Karaokê Bora Cantar — A Sua Plataforma de Karaokê Online no Brasil
          </p>
          <p style={{ fontSize: "12px", color: "#adb5bd", margin: "4px 0" }}>
            Dúvidas? Entre em contato conosco.
          </p>
        </div>
      </div>
    </div>
  );
}
