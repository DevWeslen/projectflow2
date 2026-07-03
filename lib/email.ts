import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Tipo para os dados básicos de envio de e-mail
export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

const smtpConfig: any = {
  host: process.env.SMTP_HOST ?? "smtp.office365.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: (process.env.SMTP_SECURE ?? "false") === "true",
  tls: {
    rejectUnauthorized: false,
  },
};

// Autenticação SMTP
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpConfig.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
}

const transporter = nodemailer.createTransport(smtpConfig);

export const sendEmail = async (payload: EmailPayload) => {
  const fromName = process.env.SMTP_FROM_NAME ?? "Gestão de Projetos";
  const fromEmail = process.env.SMTP_USER ?? "notificacoes@princesadoscampos.com.br";
  
  // Verifica a existência do logo para adicionar inline
  const logoPath = path.join(process.cwd(), "public", "PrincesadosCampos-positivo2-vertical (2).jpg");
  let attachments: any[] = [];
  if (fs.existsSync(logoPath)) {
    attachments = [
      {
        filename: "logo-princesa.jpg",
        path: logoPath,
        cid: "company-logo",
      },
    ];
  }

  const toEmails = Array.isArray(payload.to) ? payload.to : [payload.to];

  try {
    const results = await Promise.allSettled(
      toEmails.map(async (recipient) => {
        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: recipient,
          subject: payload.subject,
          html: payload.html,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        console.log(`[Email] ✅ Enviado para: ${recipient} | Response: ${info.response}`);
        return recipient;
      })
    );

    // Identificar falhas se houver
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(`[Email] ❌ Falha ao enviar para alguns destinatários:`, failed);
    }

    return { success: true, results };
  } catch (error) {
    console.error(`[Email] ❌ Falha fatal no envio:`, error);
    return { success: false, error };
  }
};

export const getProjectEmailTemplate = (project: {
  name: string;
  description?: string | null;
  status: string;
  category?: string | null;
  deadline?: Date | null;
  actualStartDate?: Date | null;
  sprintDuration?: number | null;
  totalSprints?: number | null;
}) => {
  const startDateStr = project.actualStartDate
    ? new Date(project.actualStartDate).toLocaleDateString('pt-BR')
    : 'Não informada';
  const deadlineStr = project.deadline
    ? new Date(project.deadline).toLocaleDateString('pt-BR')
    : 'Não definido';

  const optionalRows = [
    project.category ? `
      <tr>
        <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;width:140px;">Categoria</td>
        <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${project.category}</td>
      </tr>` : '',
    project.sprintDuration ? `
      <tr>
        <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">Sprint</td>
        <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${project.sprintDuration} dias</td>
      </tr>` : '',
    project.totalSprints ? `
      <tr>
        <td style="padding:8px 12px;background-color:#f0fdf4;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">Total de Sprints</td>
        <td style="padding:8px 12px;background-color:#ffffff;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${project.totalSprints}</td>
      </tr>` : '',
  ].join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Novo Projeto</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
  <tr>
    <td align="center" style="padding:30px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #d1d5db;">

        <!-- HEADER -->
        <tr>
          <td style="background-color:#006838;padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#ffffff;">Torre de Controle</td>
                <td align="right" width="90" style="width:90px;">
                  <img src="cid:company-logo" alt="Princesa dos Campos" width="80" height="50" style="display:block;width:80px;height:50px;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TITLE -->
        <tr>
          <td style="padding:28px 24px 16px;background-color:#f0fdf4;border-bottom:3px solid #006838;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;color:#006838;">Novo Projeto Criado</p>
            <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:15px;color:#1f2937;">${project.name}</p>
          </td>
        </tr>

        <!-- INTRO -->
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
              Olá, você foi vinculado a um novo projeto na plataforma de <strong>Gestão de Projetos (Torre de Controle)</strong>. Confira os detalhes abaixo:
            </p>
          </td>
        </tr>

        <!-- DETAILS TABLE -->
        <tr>
          <td style="padding:0 24px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d1fae5;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;width:140px;">Status</td>
                <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">${project.status}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">Data de Início</td>
                <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${startDateStr}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">Prazo de Entrega</td>
                <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${deadlineStr}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">Descrição</td>
                <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${project.description || 'Sem descrição'}</td>
              </tr>
              ${optionalRows}
            </table>
          </td>
        </tr>

        <!-- CTA BUTTON -->
        <tr>
          <td align="center" style="padding:8px 24px 32px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#006838;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display:inline-block;padding:12px 32px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;background-color:#006838;">
                    Acessar Painel
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#f9fafb;border-top:1px solid #d1d5db;padding:16px 24px;text-align:center;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#6b7280;">Este é um e-mail automático enviado pelo sistema Torre de Controle.</p>
            <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#006838;font-weight:bold;">Expresso Princesa dos Campos S/A</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
};

export const getTaskEmailTemplate = (
  task: { title: string; description?: string | null; status: string; deadline?: Date | null },
  projectName: string
) => {
  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString('pt-BR')
    : null;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nova Tarefa</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
  <tr>
    <td align="center" style="padding:30px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #d1d5db;">

        <!-- HEADER -->
        <tr>
          <td style="background-color:#006838;padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#ffffff;">Torre de Controle</td>
                <td align="right" width="90" style="width:90px;">
                  <img src="cid:company-logo" alt="Princesa dos Campos" width="80" height="50" style="display:block;width:80px;height:50px;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TITLE -->
        <tr>
          <td style="padding:28px 24px 16px;background-color:#f0fdf4;border-bottom:3px solid #006838;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;color:#006838;">Nova Tarefa Atribuída</p>
            <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:15px;color:#1f2937;">${task.title}</p>
          </td>
        </tr>

        <!-- INTRO -->
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
              Olá, uma nova tarefa foi criada e atribuída a você no projeto <strong>${projectName}</strong>. Confira os detalhes abaixo:
            </p>
          </td>
        </tr>

        <!-- DETAILS TABLE -->
        <tr>
          <td style="padding:0 24px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d1fae5;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;width:140px;">Projeto</td>
                <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${projectName}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">Status</td>
                <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">${task.status}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">Descrição</td>
                <td style="padding:8px 12px;background-color:#ffffff;border-bottom:1px solid #d1fae5;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${task.description || 'Sem descrição'}</td>
              </tr>
              ${deadlineStr ? `
              <tr>
                <td style="padding:8px 12px;background-color:#f0fdf4;font-family:Arial,sans-serif;font-size:13px;color:#065f46;font-weight:bold;">Prazo</td>
                <td style="padding:8px 12px;background-color:#ffffff;font-family:Arial,sans-serif;font-size:13px;color:#1f2937;">${deadlineStr}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>

        <!-- CTA BUTTON -->
        <tr>
          <td align="center" style="padding:8px 24px 32px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#006838;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display:inline-block;padding:12px 32px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;background-color:#006838;">
                    Ver Tarefa no Painel
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#f9fafb;border-top:1px solid #d1d5db;padding:16px 24px;text-align:center;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#6b7280;">Este é um e-mail automático enviado pelo sistema Torre de Controle.</p>
            <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#006838;font-weight:bold;">Expresso Princesa dos Campos S/A</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
};



