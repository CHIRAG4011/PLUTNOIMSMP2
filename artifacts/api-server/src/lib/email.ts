import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || `Plutonium SMP <${SMTP_USER || "noreply@plutoniumsmp.net"}>`;

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.log(`[EMAIL - not configured] TO: ${to} | SUBJECT: ${subject}`);
    console.log(`[EMAIL BODY]`, html.replace(/<[^>]+>/g, " ").trim());
    return;
  }
  await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
}

const brandHeader = `
  <div style="background:#0a0a0a;padding:30px 40px 20px;border-bottom:2px solid #22c55e;">
    <h1 style="color:#22c55e;font-family:monospace;font-size:24px;margin:0;">⚡ PLUTONIUM SMP</h1>
    <p style="color:#888;font-size:12px;margin:4px 0 0;">play.plutoniumsmp.net</p>
  </div>
`;

const brandFooter = `
  <div style="background:#0a0a0a;padding:20px 40px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:12px;margin:0;">© 2026 Plutonium SMP — Minecraft Lifesteal Server</p>
    <p style="color:#555;font-size:12px;margin:4px 0 0;">play.plutoniumsmp.net</p>
  </div>
`;

export async function sendOtpEmail(to: string, code: string, purpose: "registration" | "login") {
  const label = purpose === "registration" ? "Verify your email" : "Login verification";
  const description =
    purpose === "registration"
      ? "Use this code to verify your email and complete registration:"
      : "Use this code to verify your identity:";

  const html = `
    <div style="background:#111;min-height:100vh;font-family:sans-serif;">
      ${brandHeader}
      <div style="padding:40px;">
        <h2 style="color:#fff;margin:0 0 12px;">${label}</h2>
        <p style="color:#aaa;font-size:15px;">${description}</p>
        <div style="background:#0a0a0a;border:2px solid #22c55e;border-radius:12px;padding:32px;text-align:center;margin:28px 0;">
          <div style="color:#22c55e;font-size:48px;font-family:monospace;font-weight:bold;letter-spacing:16px;">${code}</div>
          <p style="color:#666;font-size:13px;margin:16px 0 0;">This code expires in 10 minutes.</p>
        </div>
        <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      ${brandFooter}
    </div>
  `;
  await sendEmail(to, `${code} — ${label} | Plutonium SMP`, html);
}

export async function sendCheckoutOtpEmail(to: string, username: string, code: string) {
  const html = `
    <div style="background:#111;min-height:100vh;font-family:sans-serif;">
      ${brandHeader}
      <div style="padding:40px;">
        <h2 style="color:#fff;margin:0 0 12px;">Confirm Your Order</h2>
        <p style="color:#aaa;font-size:15px;">Hi <strong style="color:#fff;">${username}</strong>, use this code to verify and place your order:</p>
        <div style="background:#0a0a0a;border:2px solid #22c55e;border-radius:12px;padding:32px;text-align:center;margin:28px 0;">
          <div style="color:#22c55e;font-size:48px;font-family:monospace;font-weight:bold;letter-spacing:16px;">${code}</div>
          <p style="color:#666;font-size:13px;margin:16px 0 0;">This code expires in 15 minutes.</p>
        </div>
        <p style="color:#666;font-size:13px;">If you didn't initiate a purchase, please ignore this email.</p>
      </div>
      ${brandFooter}
    </div>
  `;
  await sendEmail(to, `${code} — Order Verification | Plutonium SMP`, html);
}

export async function sendWelcomeEmail(to: string, username: string) {
  const html = `
    <div style="background:#111;min-height:100vh;font-family:sans-serif;">
      ${brandHeader}
      <div style="padding:40px;">
        <h2 style="color:#fff;margin:0 0 12px;">Welcome to Plutonium SMP, ${username}!</h2>
        <p style="color:#aaa;font-size:15px;">Your account has been created successfully. You're ready to join the ultimate Minecraft Lifesteal experience.</p>
        <div style="background:#0a0a0a;border:1px solid #333;border-radius:12px;padding:24px;margin:28px 0;">
          <p style="color:#22c55e;font-family:monospace;font-size:16px;margin:0 0 8px;">🎮 Server IP: <strong>play.plutoniumsmp.net</strong></p>
          <p style="color:#aaa;font-size:14px;margin:0;">Join our Discord to connect with the community!</p>
        </div>
        <p style="color:#666;font-size:13px;">Visit <a href="https://plutoniumsmp.net/store" style="color:#22c55e;">the store</a> to grab exclusive ranks and perks.</p>
      </div>
      ${brandFooter}
    </div>
  `;
  await sendEmail(to, `Welcome to Plutonium SMP, ${username}!`, html);
}

export async function sendLoginNotificationEmail(to: string, username: string) {
  const now = new Date().toUTCString();
  const html = `
    <div style="background:#111;min-height:100vh;font-family:sans-serif;">
      ${brandHeader}
      <div style="padding:40px;">
        <h2 style="color:#fff;margin:0 0 12px;">New Login Detected</h2>
        <p style="color:#aaa;font-size:15px;">A new login was detected for your account <strong style="color:#fff;">${username}</strong>.</p>
        <div style="background:#0a0a0a;border:1px solid #333;border-radius:12px;padding:24px;margin:28px 0;">
          <p style="color:#aaa;font-size:14px;margin:0 0 8px;">🕐 Time: <strong style="color:#fff;">${now}</strong></p>
        </div>
        <p style="color:#f87171;font-size:14px;">If this wasn't you, please change your password immediately and contact support on Discord.</p>
      </div>
      ${brandFooter}
    </div>
  `;
  await sendEmail(to, `New Login to Your Plutonium SMP Account`, html);
}

export async function sendOrderConfirmationEmail(
  to: string,
  username: string,
  items: { name: string; price: number; quantity: number }[],
  totalUsd: number,
  discountPercent: number
) {
  const itemRows = items.map(i =>
    `<tr>
      <td style="color:#aaa;padding:8px 0;border-bottom:1px solid #222;">${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}</td>
      <td style="color:#fff;padding:8px 0;border-bottom:1px solid #222;text-align:right;">$${(i.price * i.quantity / 100).toFixed(2)}</td>
    </tr>`
  ).join("");

  const discountRow = discountPercent > 0
    ? `<tr><td style="color:#22c55e;padding:8px 0;">Discount (${discountPercent}%)</td><td style="color:#22c55e;text-align:right;">-${discountPercent}%</td></tr>`
    : "";

  const html = `
    <div style="background:#111;min-height:100vh;font-family:sans-serif;">
      ${brandHeader}
      <div style="padding:40px;">
        <h2 style="color:#fff;margin:0 0 8px;">Order Confirmed! 🎉</h2>
        <p style="color:#aaa;font-size:15px;">Hi <strong style="color:#fff;">${username}</strong>, your order has been placed and is being reviewed.</p>

        <div style="background:#0a0a0a;border:1px solid #333;border-radius:12px;padding:24px;margin:28px 0;">
          <p style="color:#22c55e;font-weight:bold;margin:0 0 16px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Order Summary</p>
          <table style="width:100%;border-collapse:collapse;">
            ${itemRows}
            ${discountRow}
            <tr>
              <td style="color:#fff;font-weight:bold;padding:12px 0 0;font-size:18px;">Total</td>
              <td style="color:#22c55e;font-weight:bold;padding:12px 0 0;font-size:18px;text-align:right;">$${(totalUsd / 100).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="background:#0a0a0a;border:1px solid #22c55e;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#22c55e;font-weight:bold;margin:0 0 8px;">📋 What's Next?</p>
          <p style="color:#aaa;font-size:14px;margin:0;">Your order is <strong style="color:#fff;">pending payment</strong>. Please contact an admin on our Discord server to complete your payment and have your items delivered in-game.</p>
        </div>

        <p style="color:#666;font-size:13px;">Items will be delivered within 24 hours after payment confirmation.</p>
      </div>
      ${brandFooter}
    </div>
  `;
  await sendEmail(to, `Order Confirmed — Plutonium SMP Store`, html);
}

export async function sendPaymentConfirmationEmail(to: string, username: string, items: string[], totalUsd: number) {
  const itemList = items.map(i => `<li style="color:#aaa;padding:4px 0;">${i}</li>`).join("");
  const html = `
    <div style="background:#111;min-height:100vh;font-family:sans-serif;">
      ${brandHeader}
      <div style="padding:40px;">
        <h2 style="color:#fff;margin:0 0 12px;">Order Confirmed!</h2>
        <p style="color:#aaa;font-size:15px;">Hi <strong style="color:#fff;">${username}</strong>, your order has been confirmed.</p>
        <div style="background:#0a0a0a;border:1px solid #333;border-radius:12px;padding:24px;margin:28px 0;">
          <p style="color:#22c55e;font-weight:bold;margin:0 0 12px;">Items Ordered:</p>
          <ul style="margin:0;padding-left:20px;">${itemList}</ul>
          <div style="border-top:1px solid #333;margin-top:16px;padding-top:16px;">
            <p style="color:#22c55e;font-size:18px;font-weight:bold;margin:0;">Total: $${(totalUsd / 100).toFixed(2)}</p>
          </div>
        </div>
        <p style="color:#666;font-size:13px;margin-top:16px;">Your items will be delivered in-game within 24 hours after payment verification.</p>
      </div>
      ${brandFooter}
    </div>
  `;
  await sendEmail(to, `Order Confirmed — Plutonium SMP Store`, html);
}
