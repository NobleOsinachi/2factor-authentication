#### Register a new

localhost:3000/api/register

```json
{
  "email": "test",
  "password": "test"
}
```

#### Authenticate a user

localhost:3000/api/authenticate

```json
{
    "email": "abayomiogunnusi@gmail.com",
    "password": "282455",
    "token":"808285"  // this token is gotten after scanning the QR code with the mobile app and is valid for 30 seconds
}
```


---


#### Generate a QR code for the user to scan if they don't have a mobile app
```js
// Generate a QR code for the user to scan
app.get("/api/qrcode/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  const otpauth_url = speakeasy.otpauthURL({
    secret: user.secret,
    label: "My App",
    issuer: "My Company",
  });
  qrcode.toDataURL(otpauth_url, (err, data_url) => {
    res.send(`<img src="${data_url}"/>`);
  });
});
```