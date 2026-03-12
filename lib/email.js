import nodemailer from 'nodemailer';

const recipients = [
    "Sreeragsree175@gmail.com",
    "vimishna2001@gmail.com"
];

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "zegeapps@gmail.com",
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export const sendTaskNotification = async ({ taskName, status, action }) => {
    try {
        const subject = action === 'created'
            ? `📝 New Task Created: ${taskName}`
            : `✅ Task Completed: ${taskName}`;

        const text = action === 'created'
            ? `A new task has been added to the dashboard.\n\nTask: ${taskName}\nStatus: ${status}\nDate: ${new Date().toLocaleString()}`
            : `A task has been marked as completed.\n\nTask: ${taskName}\nStatus: ${status}\nDate: ${new Date().toLocaleString()}`;

        const mailOptions = {
            from: '"Zege Dashboard" <zegeapps@gmail.com>',
            to: recipients,
            subject,
            text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent for task "${taskName}" (${action}):`, info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Email failed:", error);
    }
};
