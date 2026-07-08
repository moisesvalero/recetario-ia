<script lang="ts">
  import { authState } from "../lib/auth-state.svelte";
  import {
    registerUser,
    loginUser,
    updateCurrentUser,
    getUsers,
    logoutUser,
    isAppwriteActive,
    loginWithOAuth,
    type User,
  } from "../lib/auth";

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let selectedAvatar = $state("🥑");
  let error = $state("");
  let success = $state("");
  let savedAccounts = $state<User[]>([]);

  const AVATARS = [
    "🥑",
    "🍳",
    "🍕",
    "🍰",
    "🍣",
    "🥗",
    "🌮",
    "🧁",
    "🍉",
    "🍪",
    "🍔",
    "🍜",
    "☕",
    "🍎",
    "🍩",
  ];

  $effect(() => {
    if (authState.isAuthModalOpen) {
      error = "";
      success = "";
      password = "";
      getUsers().then((accounts) => {
        savedAccounts = accounts;
      });
      if (authState.currentUser) {
        name = authState.currentUser.name;
        email = authState.currentUser.email;
        selectedAvatar = authState.currentUser.avatarUrl;
      } else {
        name = "";
        email = "";
      }
    }
  });

  async function handleRegister(e: Event) {
    e.preventDefault();
    error = "";
    success = "";
    if (!name.trim() || !email.trim()) {
      error = "Por favor, rellena todos los campos.";
      return;
    }
    if (isAppwriteActive() && password.length < 8) {
      error = "La contraseña debe tener al menos 8 caracteres.";
      return;
    }
    try {
      const user = await registerUser(
        name.trim(),
        email.trim(),
        isAppwriteActive() ? password : undefined,
      );
      authState.login(user);
      success = "¡Cuenta creada correctamente!";
      setTimeout(() => {
        authState.isAuthModalOpen = false;
      }, 1000);
    } catch (err: any) {
      error = err.message || "Error al registrarse.";
    }
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    error = "";
    success = "";
    if (!email.trim()) {
      error = "Introduce tu correo electrónico.";
      return;
    }
    if (isAppwriteActive() && !password) {
      error = "Introduce tu contraseña.";
      return;
    }
    try {
      const user = await loginUser(
        email.trim(),
        isAppwriteActive() ? password : undefined,
      );
      authState.login(user);
      success = "¡Sesión iniciada correctamente!";
      setTimeout(() => {
        authState.isAuthModalOpen = false;
      }, 1000);
    } catch (err: any) {
      error = err.message || "Error al iniciar sesión.";
    }
  }

  async function handleSelectSaved(user: User) {
    // Si es local se loguea directo. Si es Appwrite debe introducir contraseña, por lo que rellenamos su email
    if (isAppwriteActive()) {
      email = user.email;
      error = "Introduce la contraseña para esta cuenta.";
      return;
    }
    try {
      const logged = await loginUser(user.email);
      authState.login(logged);
      success = `¡Bienvenido de nuevo, ${logged.name}!`;
      setTimeout(() => {
        authState.isAuthModalOpen = false;
      }, 1000);
    } catch (err: any) {
      error = err.message || "Error al iniciar sesión.";
    }
  }

  async function handleUpdateProfile(e: Event) {
    e.preventDefault();
    error = "";
    success = "";
    if (!name.trim() || !email.trim()) {
      error = "Por favor, rellena todos los campos.";
      return;
    }
    try {
      const updated = await updateCurrentUser(
        name.trim(),
        email.trim(),
        selectedAvatar,
      );
      authState.login(updated);
      success = "Perfil actualizado correctamente.";
      setTimeout(() => {
        authState.isAuthModalOpen = false;
      }, 1000);
    } catch (err: any) {
      error = err.message || "Error al actualizar.";
    }
  }

  async function handleLogout() {
    await logoutUser();
    authState.logout();
    success = "Sesión cerrada correctamente.";
    setTimeout(() => {
      authState.isAuthModalOpen = false;
    }, 1000);
  }

  async function handleSocialLogin(provider: "google") {
    error = "";
    success = "";
    try {
      success = "Redirigiendo a " + provider + "...";
      await loginWithOAuth(provider);
    } catch (err: any) {
      error = err.message || "Error al conectar.";
    }
  }

  function closeModal() {
    authState.isAuthModalOpen = false;
  }
</script>

{#if authState.isAuthModalOpen}
  <!-- Overlay -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300 print-hidden"
    role="dialog"
    aria-modal="true"
    onclick={closeModal}
  >
    <!-- Modal Container: Styled as a stapled card/note -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="relative w-full max-w-md overflow-hidden rounded border border-[var(--border)] bg-white p-6 sm:p-8 shadow-2xl transition-all duration-300 transform scale-100 rotate-[-0.5deg]"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Staple or Tape representation at the top center -->
      <div
        class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-16 h-5 tape shadow-sm border border-black/5 opacity-90 rotate-[-2deg] pointer-events-none"
      ></div>

      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-dashed border-[var(--border)] pb-4 mb-5"
      >
        <h3 class="font-handwritten text-2xl font-black text-[var(--text)]">
          {#if authState.authTab === "login"}
            Iniciar Sesión
          {:else if authState.authTab === "register"}
            Crear Cuenta
          {:else}
            Tu Perfil
          {/if}
        </h3>
        <button
          type="button"
          class="rounded border border-dashed border-[var(--border)] p-1 text-[var(--muted)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--text)] transition cursor-pointer"
          onclick={closeModal}
          aria-label="Cerrar modal"
        >
          <svg class="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div>
        {#if error}
          <div
            class="mb-5 rounded border border-dashed border-red-300 bg-red-50/50 p-3 text-xs font-mono font-bold text-red-600 flex items-center gap-2"
          >
            ⚠️ {error}
          </div>
        {/if}

        {#if success}
          <div
            class="mb-5 rounded border border-dashed border-emerald-300 bg-emerald-50/50 p-3 text-xs font-mono font-bold text-emerald-700 flex items-center gap-2"
          >
            ✓ {success}
          </div>
        {/if}

        {#if authState.authTab === "login"}
          <!-- Login Form -->
          <form onsubmit={handleLogin} class="space-y-5">
            <div>
              <label
                for="login-email"
                class="block text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5"
                >Correo electrónico</label
              >
              <input
                id="login-email"
                type="email"
                placeholder="ejemplo@correo.com"
                class="w-full sketchy-input bg-transparent px-2 py-2 text-sm text-[var(--text)] outline-none font-handwritten font-bold"
                bind:value={email}
                required
              />
            </div>

            {#if isAppwriteActive()}
              <div>
                <label
                  for="login-password"
                  class="block text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5"
                  >Contraseña</label
                >
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  class="w-full sketchy-input bg-transparent px-2 py-2 text-sm text-[var(--text)] outline-none font-mono font-bold"
                  bind:value={password}
                  required
                />
              </div>
            {/if}

            <button
              type="submit"
              class="marker-btn w-full py-3 text-xs text-white shadow-md cursor-pointer select-none"
            >
              Entrar
            </button>

            {#if isAppwriteActive()}
              <div
                class="relative my-5 flex items-center justify-center select-none"
              >
                <div class="absolute inset-0 flex items-center">
                  <div
                    class="w-full border-t border-dashed border-[var(--border)]"
                  ></div>
                </div>
                <span
                  class="relative bg-white px-3 text-[0.625rem] font-mono font-bold text-[var(--muted)] uppercase tracking-wider"
                  >O continuar con</span
                >
              </div>

              <div>
                <button
                  type="button"
                  onclick={() => handleSocialLogin("google")}
                  class="w-full flex items-center justify-center gap-2 rounded border border-dashed border-[var(--border)] bg-white px-3 py-2.5 text-xs font-mono font-bold uppercase text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 cursor-pointer"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15.02 1 12 1 7.37 1 3.42 3.66 1.48 7.55l3.96 3.07C6.38 7.56 8.95 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.45c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.38-4.89 3.38-8.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.44 14.38c-.24-.72-.38-1.49-.38-2.38s.14-1.66.38-2.38L1.48 6.55C.53 8.44 0 10.56 0 12.8s.53 4.36 1.48 6.25l3.96-3.07z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.05 0-5.62-2.52-6.56-5.58L1.48 15.75C3.42 19.64 7.37 23 12 23z"
                    />
                  </svg>
                  Continuar con Google
                </button>
              </div>
            {/if}
          </form>

          {#if savedAccounts.length > 0}
            <div
              class="mt-6 border-t border-dashed border-[var(--border)] pt-5"
            >
              <p
                class="text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-3 select-none"
              >
                Cuentas locales guardadas
              </p>
              <div class="max-h-36 overflow-y-auto space-y-2">
                {#each savedAccounts as acc}
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded border border-dashed border-[var(--border)] p-2.5 text-left text-sm hover:bg-[var(--accent-soft)]/20 transition cursor-pointer"
                    onclick={() => handleSelectSaved(acc)}
                  >
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded bg-[var(--surface-muted)] text-xl border border-dashed border-[var(--border)]"
                      >{acc.avatarUrl}</span
                    >
                    <div class="flex-1 min-w-0">
                      <p
                        class="font-handwritten text-base font-bold text-[var(--text)] truncate"
                      >
                        {acc.name}
                      </p>
                      <p class="text-xs text-[var(--muted)] font-mono truncate">
                        {acc.email}
                      </p>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <p
            class="mt-5 text-center text-xs font-handwritten text-[var(--muted)]"
          >
            ¿No tienes cuenta?
            <button
              type="button"
              class="font-mono text-xs font-bold uppercase text-[var(--accent-hover)] hover:underline cursor-pointer ml-1"
              onclick={() => (authState.authTab = "register")}
            >
              Regístrate
            </button>
          </p>
        {:else if authState.authTab === "register"}
          <!-- Register Form -->
          <form onsubmit={handleRegister} class="space-y-4">
            <div>
              <label
                for="reg-name"
                class="block text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5"
                >Nombre completo</label
              >
              <input
                id="reg-name"
                type="text"
                placeholder="María González"
                class="w-full sketchy-input bg-transparent px-2 py-2 text-sm text-[var(--text)] outline-none font-handwritten font-bold"
                bind:value={name}
                required
              />
            </div>
            <div>
              <label
                for="reg-email"
                class="block text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5"
                >Correo electrónico</label
              >
              <input
                id="reg-email"
                type="email"
                placeholder="ejemplo@correo.com"
                class="w-full sketchy-input bg-transparent px-2 py-2 text-sm text-[var(--text)] outline-none font-handwritten font-bold"
                bind:value={email}
                required
              />
            </div>

            {#if isAppwriteActive()}
              <div>
                <label
                  for="reg-password"
                  class="block text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5"
                  >Contraseña (mínimo 8 caracteres)</label
                >
                <input
                  id="reg-password"
                  type="password"
                  placeholder="••••••••"
                  class="w-full sketchy-input bg-transparent px-2 py-2 text-sm text-[var(--text)] outline-none font-mono font-bold"
                  bind:value={password}
                  required
                />
              </div>
            {/if}

            <div
              class="rounded border border-dashed border-yellow-300 bg-yellow-50/50 p-4 mt-2 select-none"
            >
              <h4 class="font-handwritten text-sm font-black text-yellow-900">
                🎁 Ventajas de registrarte gratis:
              </h4>
              <ul
                class="mt-2 space-y-1 font-handwritten text-xs text-yellow-800"
              >
                <li>• Guarda tus recetas favoritas para siempre.</li>
                <li>• Descarga recetas en un PDF hermoso para imprimir.</li>
                <li>• Crea y gestiona tu propia lista de compras.</li>
              </ul>
            </div>

            <button
              type="submit"
              class="marker-btn w-full py-3 text-xs text-white shadow-md cursor-pointer select-none"
            >
              Registrarse y Entrar
            </button>

            {#if isAppwriteActive()}
              <div
                class="relative my-4 flex items-center justify-center select-none"
              >
                <div class="absolute inset-0 flex items-center">
                  <div
                    class="w-full border-t border-dashed border-[var(--border)]"
                  ></div>
                </div>
                <span
                  class="relative bg-white px-3 text-[0.625rem] font-mono font-bold text-[var(--muted)] uppercase tracking-wider"
                  >O continuar con</span
                >
              </div>

              <div>
                <button
                  type="button"
                  onclick={() => handleSocialLogin("google")}
                  class="w-full flex items-center justify-center gap-2 rounded border border-dashed border-[var(--border)] bg-white px-3 py-2.5 text-xs font-mono font-bold uppercase text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 cursor-pointer"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15.02 1 12 1 7.37 1 3.42 3.66 1.48 7.55l3.96 3.07C6.38 7.56 8.95 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.45c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.38-4.89 3.38-8.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.44 14.38c-.24-.72-.38-1.49-.38-2.38s.14-1.66.38-2.38L1.48 6.55C.53 8.44 0 10.56 0 12.8s.53 4.36 1.48 6.25l3.96-3.07z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.05 0-5.62-2.52-6.56-5.58L1.48 15.75C3.42 19.64 7.37 23 12 23z"
                    />
                  </svg>
                  Continuar con Google
                </button>
              </div>
            {/if}
          </form>

          <p
            class="mt-5 text-center text-xs font-handwritten text-[var(--muted)]"
          >
            ¿Ya tienes cuenta?
            <button
              type="button"
              class="font-mono text-xs font-bold uppercase text-[var(--accent-hover)] hover:underline cursor-pointer ml-1"
              onclick={() => (authState.authTab = "login")}
            >
              Inicia sesión
            </button>
          </p>
        {:else}
          <!-- Profile View / Edit Form -->
          <form onsubmit={handleUpdateProfile} class="space-y-5">
            <div class="flex flex-col items-center mb-4">
              <span
                class="flex h-16 w-16 items-center justify-center rounded bg-[var(--surface-muted)] text-3xl border border-dashed border-[var(--border)] shadow-sm"
                >{selectedAvatar}</span
              >
              <p
                class="text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mt-2.5 select-none"
              >
                Elige tu avatar
              </p>

              <!-- Avatar Grid Select -->
              <div
                class="mt-3.5 grid grid-cols-5 gap-2 max-h-24 overflow-y-auto p-1.5 border border-dashed border-[var(--border)] rounded bg-[var(--surface-muted)]/50"
              >
                {#each AVATARS as av}
                  <button
                    type="button"
                    class="h-8 w-8 text-xl flex items-center justify-center rounded transition-all hover:bg-[var(--accent-soft)]/20 cursor-pointer {selectedAvatar ===
                    av
                      ? 'bg-amber-100 border border-dashed border-amber-400 shadow-sm'
                      : ''}"
                    onclick={() => (selectedAvatar = av)}
                  >
                    {av}
                  </button>
                {/each}
              </div>
            </div>

            <div>
              <label
                for="prof-name"
                class="block text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5"
                >Nombre</label
              >
              <input
                id="prof-name"
                type="text"
                class="w-full sketchy-input bg-transparent px-2 py-2 text-sm text-[var(--text)] outline-none font-handwritten font-bold"
                bind:value={name}
                required
              />
            </div>
            <div>
              <label
                for="prof-email"
                class="block text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5"
                >Correo electrónico</label
              >
              <input
                id="prof-email"
                type="email"
                class="w-full sketchy-input bg-transparent px-2 py-2 text-sm text-[var(--text)] outline-none font-handwritten font-bold"
                bind:value={email}
                required
              />
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="flex-1 rounded border border-dashed border-[var(--border)] px-4 py-3 text-xs font-mono font-bold uppercase text-[var(--text)] hover:bg-[var(--accent-soft)]/20 transition cursor-pointer"
                onclick={handleLogout}
              >
                Cerrar Sesión
              </button>
              <button
                type="submit"
                class="flex-1 marker-btn py-3 text-xs text-white shadow-md cursor-pointer select-none"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
{/if}
