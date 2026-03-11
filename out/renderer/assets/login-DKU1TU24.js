/* empty css               */
/* empty css               */
import { q as query, c as collection, d as db, w as where, g as getDocs } from "./firebaseConfig-Beljwz77.js";
const api = window.electronAPI;
const btnLogin = document.getElementById("login-btn");
const errorMsg = document.getElementById("error-msg");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const btnMin = document.getElementById("btn-min");
const btnClose = document.getElementById("btn-close");
const rememberMeCb = document.getElementById("remember-me");
btnMin.onclick = () => api.minimizeWindow();
btnClose.onclick = () => api.closeWindow();
api.getSettings().then((settings) => {
  if (settings.rememberMe) {
    usernameInput.value = settings.savedUsername || "";
    passwordInput.value = settings.savedPassword || "";
    rememberMeCb.checked = true;
  }
});
async function handleLogin() {
  const un = usernameInput.value.trim();
  const pw = passwordInput.value.trim();
  if (!un || !pw) {
    errorMsg.textContent = "Lütfen kullanıcı adı ve şifre girin.";
    return;
  }
  btnLogin.disabled = true;
  btnLogin.textContent = "Giriş Yapılıyor...";
  errorMsg.textContent = "";
  try {
    const q = query(collection(db, "users"), where("username", "==", un), where("password", "==", pw));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      errorMsg.textContent = "Hatalı kullanıcı adı veya şifre!";
      btnLogin.disabled = false;
      btnLogin.textContent = "Giriş Yap";
      return;
    }
    const userData = snapshot.docs[0].data();
    const effectiveRole = userData.role === "admin" ? "kargo_kabul" : userData.role;
    const currentSettings = await api.getSettings();
    await api.saveSettings({
      ...currentSettings,
      personnelName: userData.fullName,
      role: effectiveRole,
      username: un,
      isAdmin: un === "KursatS" || userData.role === "admin",
      isLoggedIn: true,
      rememberMe: rememberMeCb.checked,
      savedUsername: rememberMeCb.checked ? un : "",
      savedPassword: rememberMeCb.checked ? pw : ""
    });
    await api.loginSuccess();
  } catch (error) {
    console.error("Login error:", error);
    errorMsg.textContent = "Bağlantı hatası: " + error.message;
    btnLogin.disabled = false;
    btnLogin.textContent = "Giriş Yap";
  }
}
btnLogin.addEventListener("click", handleLogin);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});
