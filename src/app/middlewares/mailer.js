const nodemailer = require('nodemailer')

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const confirmURL = `https://yourapp.com/confirm/${userToken}`;

const mailOptions = {
    from: `notepad project <${EMAIL_USER}>`,
    to: userEmail,
    subject: 'Confirma tu cuenta',
    html: `
        <p>Hola ${userName},</p>
        <p>Gracias por registrarte. Por favor, confirma tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${confirmURL}">${confirmURL}</a>
    `,
};

await transporter.sendMail(mailOptions);
console.log('Correo de confirmación enviado a:', userData.email);
