/* Login — warm paper backdrop with a centered ledger card. */
const { useState: useStateLogin } = React;

const LoginScreen = ({ onSignIn }) => {
  const [email, setEmail] = useStateLogin("");
  const [pass, setPass]   = useStateLogin("");
  const [err, setErr]     = useStateLogin(false);

  const submit = (e) => {
    e.preventDefault();
    // Simulate auth
    if (!email || !pass) { setErr(true); return; }
    onSignIn();
  };

  return (
    <div className="paper-grain" style={{
      minHeight: "100%", display: "grid", placeItems: "center", padding: 32,
      background: "var(--paper-100)"
    }}>
      <div style={{ width: 440, fontFamily: "var(--font-sans)" }} className="fade-in">
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: "var(--ink-900)",
            display: "grid", placeItems: "center", boxShadow: "var(--elev-3)",
            padding: 14, marginBottom: 20
          }}>
            <img src="assets/logo-axentria-mark.svg" alt="Axentria" style={{ width: "100%", height: "100%" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <img src="assets/logo-axentria.svg" alt="Axentria" style={{ height: 32, marginBottom: 8 }} />
            <div style={{
              fontSize: 16, color: "var(--slate-500)",
              fontFamily: "var(--font-display)", fontStyle: "italic",
              letterSpacing: "0.01em"
            }}>
              El libro de ventas, hecho aplicación.
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "32px 36px",
          border: "1px solid var(--border-default)", boxShadow: "var(--elev-3)",
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--brass-400)" }} />

          <div className="ovl" style={{ marginBottom: 24, fontSize: 11, color: "var(--slate-500)" }}>Acceso al sistema</div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input
              label="Correo electrónico o usuario"
              value={email}
              onChange={e => { setEmail(e.target.value); setErr(false); }}
              placeholder="nombre@empresa.com"
              prefix={<Icon name="user" size={16} />}
            />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-900)" }}>Contraseña</label>
                <a href="#" style={{ fontSize: 11, color: "var(--brass-600)", fontWeight: 600 }}>¿Olvidó su clave?</a>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", top: 11, left: 12, color: err ? "var(--coral-500)" : "var(--slate-400)" }}>
                  <Icon name="settings" size={16} style={{ transform: "rotate(45deg)" }} />
                </span>
                <input
                  className="ax-input"
                  style={{ paddingLeft: 38, borderColor: err ? "var(--coral-500)" : undefined }}
                  type="password"
                  value={pass}
                  onChange={e => { setPass(e.target.value); setErr(false); }}
                  placeholder="••••••••••••"
                />
              </div>
              {err && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--coral-600)", fontSize: 12, marginTop: 8, fontWeight: 600 }}>
                  <Icon name="x" size={13}/> Credenciales incorrectas. Verifique e intente de nuevo.
                </div>
              )}
            </div>

            <Button type="submit" size="lg" style={{ marginTop: 12, width: "100%" }}>
              Ingresar al panel
              <Icon name="chevronRight" size={16} style={{ marginLeft: 4 }} />
            </Button>
          </form>

          <div className="hairline" style={{ margin: "28px 0 20px" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sage-500)" }} />
              <span style={{ fontSize: 11, color: "var(--slate-500)", fontWeight: 500 }}>Sistema operativo</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--slate-400)", fontFamily: "var(--font-mono)" }}>v 4.2.1 · POS-01</span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--slate-500)" }}>
          <span style={{ opacity: 0.7 }}>© 2026 Axentria Technologies. Todos los derechos reservados.</span>
        </div>
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
