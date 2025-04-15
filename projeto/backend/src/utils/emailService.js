const nodemailer = require("nodemailer");
require("dotenv").config();

// Configurar o transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Enviar email de confirmação de registro
const sendRegistrationEmail = async (user) => {
  try {
    await transporter.sendMail({
      from: `"The SoftSkills" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Confirmação de Registro",
      html: `
        <h1>Bem-vindo à plataforma The SoftSkills</h1>
        <p>Olá ${user.nome},</p>
        <p>Sua conta foi criada com sucesso.</p>
        <p>Email: ${user.email}</p>
        <p>Por favor, acesse a plataforma e altere sua senha no primeiro login.</p>
        <p>Atenciosamente,<br>Equipe The SoftSkills</p>
      `,
    });
    console.log(`Email de registro enviado para ${user.email}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
};

// Enviar email de confirmação de inscrição
const sendEnrollmentEmail = async (user, curso) => {
  try {
    await transporter.sendMail({
      from: `"The SoftSkills" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Confirmação de Inscrição - ${curso.nome}`,
      html: `
        <h1>Inscrição Confirmada</h1>
        <p>Olá ${user.nome},</p>
        <p>Sua inscrição no curso "${curso.nome}" foi confirmada.</p>
        <p>Detalhes do curso:</p>
        <ul>
          <li>Início: ${new Date(curso.data_inicio).toLocaleDateString()}</li>
          <li>Término: ${new Date(curso.data_fim).toLocaleDateString()}</li>
          <li>Tipo: ${curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}</li>
        </ul>
        <p>Atenciosamente,<br>Equipe The SoftSkills</p>
      `,
    });
    console.log(`Email de inscrição enviado para ${user.email}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
};

// Enviar notificação de alteração no curso
const sendCourseUpdateEmail = async (users, curso, changes) => {
  try {
    for (const user of users) {
      await transporter.sendMail({
        from: `"The SoftSkills" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Atualização no Curso - ${curso.nome}`,
        html: `
          <h1>Atualização no Curso</h1>
          <p>Olá ${user.nome},</p>
          <p>O curso "${curso.nome}" no qual você está inscrito foi atualizado.</p>
          <p>Alterações:</p>
          <ul>
            ${Object.entries(changes).map(([key, value]) => 
              `<li>${key}: ${value}</li>`
            ).join('')}
          </ul>
          <p>Atenciosamente,<br>Equipe The SoftSkills</p>
        `,
      });
    }
    console.log(`Emails de atualização enviados para ${users.length} usuários`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar emails:", error);
    return false;
  }
};

// Enviar mailing list (bônus)
const sendMailingList = async (users, cursos, area) => {
  try {
    const areaText = area ? `na área de ${area.nome}` : '';
    
    for (const user of users) {
      await transporter.sendMail({
        from: `"The SoftSkills" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Novos Cursos Disponíveis ${areaText}`,
        html: `
          <h1>Novos Cursos Disponíveis</h1>
          <p>Olá ${user.nome},</p>
          <p>Confira os novos cursos disponíveis ${areaText}:</p>
          <ul>
            ${cursos.map(curso => 
              `<li>
                <strong>${curso.nome}</strong> - 
                ${curso.descricao}<br>
                Início: ${new Date(curso.data_inicio).toLocaleDateString()}<br>
                <a href="${process.env.FRONTEND_URL}/cursos/${curso.id_curso}">Ver detalhes</a>
              </li>`
            ).join('')}
          </ul>
          <p>Atenciosamente,<br>Equipe The SoftSkills</p>
        `,
      });
    }
    console.log(`Emails de mailing list enviados para ${users.length} usuários`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar emails:", error);
    return false;
  }
};

// NOVA FUNÇÃO: Enviar email com certificado
const sendCertificateEmail = async (user, curso, certificadoPath) => {
  try {
    await transporter.sendMail({
      from: `"The SoftSkills" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Seu Certificado do Curso: ${curso.nome}`,
      html: `
        <h1>Certificado de Conclusão</h1>
        <p>Olá ${user.nome},</p>
        <p>Parabéns por concluir o curso "${curso.nome}"!</p>
        <p>Em anexo, você encontrará seu certificado de conclusão.</p>
        <p>Você também pode acessar seu certificado a qualquer momento em seu perfil na plataforma.</p>
        <p>Atenciosamente,<br>Equipe The SoftSkills</p>
      `,
      attachments: [
        {
          filename: `Certificado_${curso.nome.replace(/\s+/g, '_')}.pdf`,
          path: certificadoPath
        }
      ]
    });
    console.log(`Email com certificado enviado para ${user.email}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email com certificado:", error);
    return false;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendEnrollmentEmail,
  sendCourseUpdateEmail,
  sendMailingList,
  sendCertificateEmail  // Adicionando a nova função ao módulo exportado
};