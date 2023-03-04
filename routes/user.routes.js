const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const sendEmail = require("../emails/send-emails");
const { cloudinary } = require("../file_upload/image_upload");
const router = require("express").Router();
const fs = require("fs");
const path = require("path");

// Generate a new secret for the user
function generateSecret() {
  const secret = speakeasy.generateSecret({
    name: "My App",
  });
  return secret.base32;
}

router.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    //  // Check if user already exists
    const alreadyExists = await User.findOne({ email });
    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

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

    // console.log(otpauth_url);

    const qrCodeImg = await qrcode.toDataURL(otpauth_url);
    // console.log("QR Code:");
    // console.log(qrCodeImg);
    // convert the string to array first and split the string at the comma and take the second part
    const spiltImage = await qrCodeImg.split(",")[1];

    // store the image in the server
    fs.writeFile(
      path.join(__dirname, `../uploads/${user._id}.png`),
      spiltImage,
      "base64",
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );

    // upload the QR code to cloudinary
    const result = await cloudinary.uploader.upload(
      path.join(__dirname, `../uploads/${user._id}.png`),
      {
        folder: "2fa",
      }
    );

    //get the url of the uploaded image
    const qrCodeUrl = result.secure_url;
    await sendEmail({
      email: user.email,
      subject: "Your 2FA Secret",
      html: `Scan this QR code to set up your 2FA: <img src="${qrCodeUrl}"/>`,
      attachments: [
        {
          filename: "qrCode.png",
          content: qrCodeImg.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
          encoding: "base64",
        },
      ],
    });
    return res.send(`<img src="${qrCodeImg}"/>`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
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
