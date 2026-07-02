import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") || process.env.SMTP_FROM_EMAIL || "test@example.com";

  const result = await sendEmail({
    to,
    subject: "Teste de Notificação - Gestão de Projetos",
    html: `
      <div style="font-family: sans-serif; background-color: #021a0f; color: white; padding: 20px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
        <h2 style="text-align: center; color: #4ade80;">Teste de Integração</h2>
        <p>Olá,</p>
        <p>Este é um e-mail de teste enviado pelo sistema de <strong>Gestão de Projetos</strong> para validar as credenciais e configuração do Nodemailer.</p>
        <hr style="border-color: #166534;" />
        <p style="font-size: 12px; color: #86efac; text-align: center;">Torre de Controle - Princesa dos Campos</p>
      </div>
    `,
  });

  if (result.success) {
    return NextResponse.json({ message: "E-mail enviado com sucesso!", info: result.info });
  } else {
    return NextResponse.json({ message: "Falha ao enviar e-mail.", error: result.error }, { status: 500 });
  }
}
