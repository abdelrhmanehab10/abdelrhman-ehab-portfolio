class Login {
  constructor() {
    this.loginForm = document.querySelector(".login-form");
    this.emailInput = document.querySelector("#email");
    this.passwordInput = document.querySelector("#password");
    this.emailErrorMessage = document.querySelector(
      "fieldset:nth-child(1) .error-message"
    );
    this.passwordErrorMessage = document.querySelector(
      "fieldset:nth-child(2) .error-message"
    );
    this.error;
    this.init();
  }

  init() {
    this.loginForm.addEventListener(
      "submit",
      this.onSubmitLoginForm.bind(this)
    );

    this.emailInput.addEventListener("input", this.resetFormErrors.bind(this));
    this.passwordInput.addEventListener(
      "input",
      this.resetFormErrors.bind(this)
    );
  }

  onSubmitLoginForm(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    this.validateUserData(email, password);

    // TODO: fetch API to login
  }

  resetFormErrors(e) {
    this.error = "";
    e.target.id === "email"
      ? (this.emailErrorMessage.textContent = "")
      : (this.passwordErrorMessage.textContent = "");
    e.target.classList.remove("invalid");
  }

  validateUserData(email, password) {
    this.error = "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === "") {
      this.error = "Email is required ⛔";
      this.emailInput.classList.add("invalid");
      this.emailErrorMessage.textContent = this.error;
      return;
    }

    if (password === "") {
      this.error = "Password is required ⛔";
      this.passwordInput.classList.add("invalid");
      this.passwordErrorMessage.textContent = this.error;
      return;
    }

    if (!emailPattern.test(email)) {
      this.error = "Email isn't valid ⛔";
      this.emailInput.classList.add("invalid");
      this.emailErrorMessage.textContent = this.error;
      return;
    }
  }
}
document.addEventListener("DOMContentLoaded", function () {
  new Login();
});
