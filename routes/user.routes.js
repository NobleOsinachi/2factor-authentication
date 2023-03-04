const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const sendEmail = require("../emails/send-emails");
const router = require("express").Router();
// Generate a new secret for the user
function generateSecret() {
  const secret = speakeasy.generateSecret({
    name: "My App",
  });
  return secret.base32;
}

router.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const secret = generateSecret();
  const user = new User({ email, password, secret });
  await user.save();

  // Generate a QR code for the user to scan and send to user's email
  const otpauth_url = speakeasy.otpauthURL({
    secret: user.secret,
    label: "My App",
    issuer: "My Company",
    encoding: "base32",
  });

  console.log(otpauth_url);

  const qrCodeImg = await qrcode.toDataURL(otpauth_url);
  await sendEmail({
    email: user.email,
    subject: "Your 2FA Secret",
    message: `Scan this QR code to set up your 2FA: <img src="${qrCodeImg}"/>`,
    attachments: [
      {
        filename: "qrCode.png",
        content: qrCodeImg.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
        encoding: "base64",
      },
    ],
  });
  return res.send(`<img src="${qrCodeImg}"/>`);
});

// Authenticate the user with 2-factor authentication
router.post("/api/authenticate", async (req, res) => {
  const { email, password, token } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }
  const verified = speakeasy.totp.verify({
    secret: user.secret,
    encoding: "base32",
    token: token,
    window: 1,
  });
  console.log({ verified });
  if (verified) {
    const payload = {
      email: user.email,
      id: user._id,
    };
    const token = jwt.sign(payload, "secret", {
      expiresIn: "1h",
    });

    return res.status(200).json({
      success: true,
      message: "Authentication successful!",
      token: token,
    });
  } else {
    return res.json({ success: false, message: "Invalid token" });
  }
});

module.exports = router;
