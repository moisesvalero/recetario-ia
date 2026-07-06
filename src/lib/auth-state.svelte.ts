import { initAuth, getCurrentUser, type User } from "./auth";

class AuthState {
  currentUser = $state<User | null>(null);
  isAuthModalOpen = $state(false);
  authTab = $state<"login" | "register" | "profile">("login");
  isInitialized = $state(false);

  constructor() {
    if (typeof window !== "undefined") {
      this.currentUser = getCurrentUser();
      initAuth().then((user) => {
        this.currentUser = user;
        this.isInitialized = true;
      });
    }
  }

  login(user: User) {
    this.currentUser = user;
    this.isAuthModalOpen = false;
  }

  logout() {
    this.currentUser = null;
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("recetario:current_user");
    }
  }

  refresh() {
    if (typeof window !== "undefined") {
      this.currentUser = getCurrentUser();
    }
  }

  openLogin() {
    this.authTab = "login";
    this.isAuthModalOpen = true;
  }

  openRegister() {
    this.authTab = "register";
    this.isAuthModalOpen = true;
  }

  openProfile() {
    if (this.currentUser) {
      this.authTab = "profile";
      this.isAuthModalOpen = true;
    } else {
      this.openLogin();
    }
  }
}

export const authState = new AuthState();
