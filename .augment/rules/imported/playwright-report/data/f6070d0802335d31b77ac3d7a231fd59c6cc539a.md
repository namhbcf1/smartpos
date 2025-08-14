---
type: "manual"
---

# Page snapshot

```yaml
- main:
  - text: SmartPOS
  - heading "SmartPOS Login" [level=1]
  - paragraph: Enter your credentials to access the system
  - text: Username
  - textbox "Username" [disabled]: admin
  - text: Password
  - textbox "Password" [disabled]: admin123456
  - button "toggle password visibility"
  - button [disabled]:
    - progressbar:
      - img
  - paragraph: "Default login: admin / admin"
```