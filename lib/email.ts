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
  let attachments = [];
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

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #041d11; padding: 30px 20px; color: #f3f4f6; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #064e3b; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
        <img src="cid:company-logo" alt="Princesa dos Campos" style="max-height: 70px; width: auto; display: block; margin: 0 auto;" />
      </div>
      
      <h2 style="color: #34d399; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 15px; text-align: center; letter-spacing: -0.5px;">
        Novo Projeto: ${project.name}
      </h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px;">
        Olá, você foi vinculado a um novo projeto na plataforma de <strong>Gestão de Projetos (Torre de Controle)</strong>. Confira os detalhes abaixo:
      </p>
      
      <div style="background-color: rgba(5, 46, 22, 0.6); border: 1px solid #065f46; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px; width: 150px;"><strong>Descrição:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #ffffff; font-size: 14px;">${project.description || "Sem descrição"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #34d399; font-size: 14px; text-transform: capitalize; font-weight: 600;">${project.status}</td>
          </tr>
          ${project.category ? `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px;"><strong>Categoria:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #ffffff; font-size: 14px;">${project.category}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px;"><strong>Data de Início:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #ffffff; font-size: 14px;">${startDateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px;"><strong>Prazo de Entrega:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #ffffff; font-size: 14px;">${deadlineStr}</td>
          </tr>
          ${project.sprintDuration ? `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px;"><strong>Sprint:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #ffffff; font-size: 14px;">${project.sprintDuration} dias</td>
          </tr>
          ` : ''}
          ${project.totalSprints ? `
          <tr>
            <td style="padding: 8px 0; color: #a7f3d0; font-size: 14px;"><strong>Total de Sprints:</strong></td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">${project.totalSprints}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="text-align: center; margin-bottom: 15px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 30px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block; font-size: 14px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
          Acessar Painel
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(16, 185, 129, 0.1);">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">Esse é um e-mail automático enviado pelo sistema Torre de Controle.</p>
        <p style="font-size: 12px; color: #34d399; font-weight: 600; margin: 5px 0 0 0;">Expresso Princesa dos Campos S/A</p>
      </div>
    </div>
  `;
};

export const getTaskEmailTemplate = (
  task: { title: string; description?: string | null; status: string; deadline?: Date | null },
  projectName: string
) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #041d11; padding: 30px 20px; color: #f3f4f6; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #064e3b; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
        <img src="cid:company-logo" alt="Princesa dos Campos" style="max-height: 70px; width: auto; display: block; margin: 0 auto;" />
      </div>
      
      <h2 style="color: #34d399; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 15px; text-align: center; letter-spacing: -0.5px;">
        Nova Tarefa Criada
      </h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px;">
        Olá, uma nova tarefa foi criada e atribuída a você no projeto <strong>${projectName}</strong>. Confira os detalhes abaixo:
      </p>
      
      <div style="background-color: rgba(5, 46, 22, 0.6); border: 1px solid #065f46; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px; width: 120px;"><strong>Título:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #ffffff; font-size: 14px; font-weight: 600;">${task.title}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px;"><strong>Projeto:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #ffffff; font-size: 14px;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px;"><strong>Descrição:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #ffffff; font-size: 14px;">${task.description || "Sem descrição"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #a7f3d0; font-size: 14px;"><strong>Status:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1); color: #34d399; font-size: 14px; text-transform: capitalize; font-weight: 600;">${task.status}</td>
          </tr>
          ${task.deadline ? `
          <tr>
            <td style="padding: 10px 0; color: #a7f3d0; font-size: 14px;"><strong>Prazo:</strong></td>
            <td style="padding: 10px 0; color: #ffffff; font-size: 14px;">${new Date(task.deadline).toLocaleDateString('pt-BR')}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="text-align: center; margin-bottom: 15px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 30px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block; font-size: 14px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
          Ver Tarefa no Painel
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(16, 185, 129, 0.1);">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">Esse é um e-mail automático enviado pelo sistema Torre de Controle.</p>
        <p style="font-size: 12px; color: #34d399; font-weight: 600; margin: 5px 0 0 0;">Expresso Princesa dos Campos S/A</p>
      </div>
    </div>
  `;
};
