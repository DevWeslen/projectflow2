/**
 * Script de diagnóstico de email — Torre de Controle
 * Uso: node test-email.mjs
 */
import nodemailer from "nodemailer";
import { readFileSync } from "fs";
import { resolve } from "path";

// Carrega o .env manualmente (sem depender do dotenv)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    });
    console.log("✅ Arquivo .env carregado com sucesso.");
  } catch {
    console.warn("⚠️  Arquivo .env não encontrado — usando variáveis de ambiente do sistema.");
  }
}

loadEnv();

const host     = process.env.SMTP_HOST     || "smtp.office365.com";
const port     = Number(process.env.SMTP_PORT || 587);
const secure   = (process.env.SMTP_SECURE   || "false") === "true";
const user     = process.env.SMTP_USER;
const pass     = process.env.SMTP_PASS;
const fromName = process.env.SMTP_FROM_NAME || "Torre de Controle";

console.log("\n========================================");
console.log("  🔎 DIAGNÓSTICO DE EMAIL - Torre de Controle");
console.log("========================================");
console.log(`  SMTP_HOST    : ${host}`);
console.log(`  SMTP_PORT    : ${port}`);
console.log(`  SMTP_SECURE  : ${secure}`);
console.log(`  SMTP_USER    : ${user  || "❌ NÃO DEFINIDO"}`);
console.log(`  SMTP_PASS    : ${pass  ? "✅ definido" : "❌ NÃO DEFINIDO"}`);
console.log("========================================\n");

if (!user || !pass) {
  console.error("❌ SMTP_USER ou SMTP_PASS não estão definidos.");
  console.error("   Verifique se o arquivo .env existe na raiz do projeto no servidor.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  tls: { rejectUnauthorized: false },
});

// ── 1. Verifica conexão ──────────────────────────────────────────────────────
console.log("🔄 Verificando conexão com o servidor SMTP...");
try {
  await transporter.verify();
  console.log("✅ Conexão SMTP OK! Credenciais aceitas.\n");
} catch (err) {
  console.error("❌ Falha na verificação SMTP:", err.message);
  console.error("\n📋 Possíveis causas:");
  console.error("   1. SMTP Auth desabilitado → admin.microsoft.com > Usuários > Email > SMTP Autenticado");
  console.error("   2. Senha incorreta ou conta bloqueada");
  console.error("   3. Firewall bloqueando porta 587");
  console.error("\nDetalhes técnicos:", err);
  process.exit(1);
}

// ── 2. Envia email de teste ──────────────────────────────────────────────────
console.log(`🔄 Enviando email de teste para: ${user} ...`);
try {
  const info = await transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to: user,
    subject: "✅ Teste SMTP - Torre de Controle",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #041d11; color: #f3f4f6; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #34d399;">✅ Email de teste funcionando!</h2>
        <p>Este email foi enviado pelo script de diagnóstico da <strong>Torre de Controle</strong>.</p>
        <hr style="border-color: #065f46;" />
        <p style="font-size: 12px; color: #6b7280;">
          Servidor: ${host}:${port} | Usuário: ${user}
        </p>
      </div>
    `,
  });

  console.log("\n🎉 Email enviado com sucesso!");
  console.log("   Response  :", info.response);
  console.log("   MessageId :", info.messageId);
  console.log(`\n📬 Verifique a caixa de entrada de: ${user}`);
} catch (err) {
  console.error("❌ Falha ao enviar o email:", err.message);
  console.error("\nDetalhes técnicos:", err);
  process.exit(1);
}
