import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@boracantar.com";

function isConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function createTransporter() {
  if (!isConfigured()) {
    throw new Error("SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS");
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Accept self-signed certs for shared hosting
    },
  });
}

export interface WelcomeEmailData {
  email: string;
  password: string;
  loginUrl?: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  if (!isConfigured()) {
    console.warn("[email] SMTP not configured — skipping welcome email for", data.email);
    return;
  }

  const transporter = createTransporter();
  const loginUrl = data.loginUrl ?? "https://boracantar.com/login";

  await transporter.sendMail({
    from: `"Karaokê Bora Cantar" <${SMTP_FROM}>`,
    to: data.email,
    subject: "Bem-vindo ao Karaokê Bora Cantar! Acesse sua conta",
    text: `Olá!

Obrigado por se tornar assinante do Karaokê Bora Cantar!

Sua conta foi criada com sucesso. Aqui estão seus dados de acesso:

Email: ${data.email}
Senha temporária: ${data.password}

Acesse agora: ${loginUrl}

Após o primeiro login, recomendamos que você troque sua senha por uma de sua preferência.

Dúvidas? Entre em contato conosco.

Equipe Karaokê Bora Cantar`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo h1 { font-size: 24px; font-weight: 800; color: #1a1a1a; margin: 0; }
    .logo span { color: #d4af37; }
    h2 { font-size: 20px; color: #1a1a1a; margin: 0 0 16px; }
    p { font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 16px; }
    .credentials { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .credentials-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
    .credentials-row:last-child { border-bottom: none; }
    .label { font-size: 13px; color: #6c757d; font-weight: 500; }
    .value { font-size: 15px; color: #1a1a1a; font-weight: 600; }
    .password { font-size: 22px; font-family: 'SF Mono', Monaco, monospace; color: #d4af37; letter-spacing: 2px; }
    .button { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #c9a227 100%); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 16px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e9ecef; }
    .footer p { font-size: 12px; color: #adb5bd; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>Karaokê <span>Bora Cantar</span></h1>
    </div>
    <h2>Bem-vindo, assinante!</h2>
    <p>Obrigado por se tornar assinante do Karaokê Bora Cantar. Sua conta foi criada com sucesso e você já pode acessar nossa plataforma com o catálogo completo de músicas.</p>
    <div class="credentials">
      <div class="credentials-row">
        <span class="label">Email</span>
        <span class="value">${data.email}</span>
      </div>
      <div class="credentials-row">
        <span class="label">Senha temporária</span>
        <span class="password">${data.password}</span>
      </div>
    </div>
    <p style="text-align:center">
      <a href="${loginUrl}" class="button">Acessar Plataforma</a>
    </p>
    <p style="font-size:13px; color:#6c757d; text-align:center;">Após o primeiro login, recomendamos trocar sua senha por uma de sua preferência.</p>
    <div class="footer">
      <p>Karaokê Bora Cantar — A Sua Plataforma de Karaokê Online no Brasil</p>
      <p>Dúvidas? Entre em contato conosco.</p>
    </div>
  </div>
</body>
</html>`,
  });

  console.log("[email] Welcome email sent to", data.email);
}

export async function sendPasswordResetEmail(data: { email: string; newPassword: string; loginUrl?: string }): Promise<void> {
  if (!isConfigured()) {
    console.warn("[email] SMTP not configured — skipping password reset email for", data.email);
    return;
  }

  const transporter = createTransporter();
  const loginUrl = data.loginUrl ?? "https://boracantar.com/login";

  await transporter.sendMail({
    from: `"Karaokê Bora Cantar" <${SMTP_FROM}>`,
    to: data.email,
    subject: "Sua nova senha de acesso — Karaokê Bora Cantar",
    text: `Olá!

Sua senha foi redefinida. Aqui está sua nova senha temporária:

Email: ${data.email}
Nova senha: ${data.newPassword}

Acesse agora: ${loginUrl}

Recomendamos trocar sua senha após o login.

Equipe Karaokê Bora Cantar`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo h1 { font-size: 24px; font-weight: 800; color: #1a1a1a; margin: 0; }
    .logo span { color: #d4af37; }
    h2 { font-size: 20px; color: #1a1a1a; margin: 0 0 16px; }
    p { font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 16px; }
    .credentials { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .credentials-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
    .credentials-row:last-child { border-bottom: none; }
    .label { font-size: 13px; color: #6c757d; font-weight: 500; }
    .password { font-size: 22px; font-family: 'SF Mono', Monaco, monospace; color: #d4af37; letter-spacing: 2px; }
    .button { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #c9a227 100%); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 16px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e9ecef; }
    .footer p { font-size: 12px; color: #adb5bd; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>Karaokê <span>Bora Cantar</span></h1>
    </div>
    <h2>Sua senha foi redefinida</h2>
    <p>Uma nova senha temporária foi gerada para sua conta. Use os dados abaixo para acessar a plataforma:</p>
    <div class="credentials">
      <div class="credentials-row">
        <span class="label">Email</span>
        <span class="value">${data.email}</span>
      </div>
      <div class="credentials-row">
        <span class="label">Nova senha</span>
        <span class="password">${data.newPassword}</span>
      </div>
    </div>
    <p style="text-align:center">
      <a href="${loginUrl}" class="button">Acessar Plataforma</a>
    </p>
    <p style="font-size:13px; color:#6c757d; text-align:center;">Recomendamos trocar sua senha após o login.</p>
    <div class="footer">
      <p>Karaokê Bora Cantar — A Sua Plataforma de Karaokê Online no Brasil</p>
      <p>Dúvidas? Entre em contato conosco.</p>
    </div>
  </div>
</body>
</html>`,
  });

  console.log("[email] Password reset email sent to", data.email);
}
