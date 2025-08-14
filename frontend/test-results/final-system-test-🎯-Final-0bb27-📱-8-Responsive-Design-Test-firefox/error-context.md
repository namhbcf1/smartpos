# Page snapshot

```yaml
- main:
  - text: SmartPOS
  - heading "SmartPOS Login" [level=1]
  - paragraph: Enter your credentials to access the system
  - alert:
    - strong: "Tài khoản demo:"
    - text: "Username:"
    - code: admin
    - text: "Password:"
    - code: admin
  - text: Username
  - textbox "Username": admin
  - text: Password
  - textbox "Password": admin
  - button "toggle password visibility"
  - button "Sign in button": Sign In
  - paragraph:
    - text: Chưa có tài khoản?
    - link "Đăng ký ngay":
      - /url: /register
  - paragraph: "Default login: admin / admin"
```