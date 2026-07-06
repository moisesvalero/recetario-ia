<script lang="ts">
  import { authState } from "../lib/auth-state.svelte";
  import {
    registerUser,
    loginUser,
    updateCurrentUser,
    getUsers,
    logoutUser,
    isAppwriteActive,
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

  function closeModal() {
    authState.isAuthModalOpen = false;
  }
</script>

{#if authState.isAuthModalOpen}
  <!-- Overlay -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300"
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal Container -->
    <div
      class="relative w-full max-w-md overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl transition-all duration-300 transform scale-100"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-slate-100 px-6 py-4"
      >
        <h3 class="text-lg font-bold text-slate-800">
          {#if authState.authTab === "login"}
            Iniciar sesión
          {:else if authState.authTab === "register"}
            Crear cuenta gratis
          {:else}
            Tu Perfil
          {/if}
        </h3>
        <button
          type="button"
          class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          onclick={closeModal}
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        {#if error}
          <div
            class="mb-4 rounded-2xl bg-red-50 p-3.5 text-sm font-medium text-red-600 border border-red-100 flex items-center gap-2"
          >
            ⚠️ {error}
          </div>
        {/if}

        {#if success}
          <div
            class="mb-4 rounded-2xl bg-emerald-50 p-3.5 text-sm font-medium text-emerald-700 border border-emerald-100 flex items-center gap-2"
          >
            ✓ {success}
          </div>
        {/if}

        {#if authState.authTab === "login"}
          <!-- Login Form -->
          <form onsubmit={handleLogin} class="space-y-4">
            <div>
              <label
                for="login-email"
                class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                >Correo electrónico</label
              >
              <input
                id="login-email"
                type="email"
                placeholder="ejemplo@correo.com"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                bind:value={email}
                required
              />
            </div>

            {#if isAppwriteActive()}
              <div>
                <label
                  for="login-password"
                  class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                  >Contraseña</label
                >
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  bind:value={password}
                  required
                />
              </div>
            {/if}

            <button
              type="submit"
              class="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700"
            >
              Entrar
            </button>
          </form>

          {#if savedAccounts.length > 0}
            <div class="mt-6 border-t border-slate-100 pt-5">
              <p
                class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3"
              >
                Cuentas locales guardadas
              </p>
              <div class="max-h-36 overflow-y-auto space-y-2">
                {#each savedAccounts as acc}
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-2xl border border-slate-100 p-2.5 text-left text-sm hover:bg-orange-50/50 hover:border-orange-200 transition"
                    onclick={() => handleSelectSaved(acc)}
                  >
                    <span
                      class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl"
                      >{acc.avatarUrl}</span
                    >
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-slate-700 truncate">
                        {acc.name}
                      </p>
                      <p class="text-xs text-slate-400 truncate">{acc.email}</p>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <p class="mt-5 text-center text-xs text-slate-500">
            ¿No tienes cuenta?
            <button
              type="button"
              class="font-bold text-orange-500 hover:underline"
              onclick={() => (authState.authTab = "register")}
            >
              Regístrate gratis
            </button>
          </p>
        {:else if authState.authTab === "register"}
          <!-- Register Form -->
          <form onsubmit={handleRegister} class="space-y-4">
            <div>
              <label
                for="reg-name"
                class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                >Nombre completo</label
              >
              <input
                id="reg-name"
                type="text"
                placeholder="María González"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                bind:value={name}
                required
              />
            </div>
            <div>
              <label
                for="reg-email"
                class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                >Correo electrónico</label
              >
              <input
                id="reg-email"
                type="email"
                placeholder="ejemplo@correo.com"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                bind:value={email}
                required
              />
            </div>

            {#if isAppwriteActive()}
              <div>
                <label
                  for="reg-password"
                  class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                  >Contraseña (mínimo 8 caracteres)</label
                >
                <input
                  id="reg-password"
                  type="password"
                  placeholder="••••••••"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  bind:value={password}
                  required
                />
              </div>
            {/if}

            <div
              class="rounded-2xl bg-orange-50/50 border border-orange-100 p-4 mt-2"
            >
              <h4 class="text-xs font-bold text-orange-800">
                🎁 Ventajas de registrarte gratis:
              </h4>
              <ul class="mt-2 space-y-1 text-xs text-orange-700">
                <li>• Guarda tus recetas favoritas para siempre.</li>
                <li>• Descarga recetas en un PDF hermoso para imprimir.</li>
                <li>• Crea y gestiona tu propia lista de compras.</li>
              </ul>
            </div>

            <button
              type="submit"
              class="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700"
            >
              Registrarse y Entrar
            </button>
          </form>

          <p class="mt-5 text-center text-xs text-slate-500">
            ¿Ya tienes cuenta?
            <button
              type="button"
              class="font-bold text-orange-500 hover:underline"
              onclick={() => (authState.authTab = "login")}
            >
              Inicia sesión
            </button>
          </p>
        {:else}
          <!-- Profile View / Edit Form -->
          <form onsubmit={handleUpdateProfile} class="space-y-4">
            <div class="flex flex-col items-center mb-4">
              <span
                class="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl shadow-sm border border-orange-200/50"
                >{selectedAvatar}</span
              >
              <p class="text-xs text-slate-400 font-semibold mt-2">
                Elige tu avatar
              </p>

              <!-- Avatar Grid Select -->
              <div
                class="mt-3 grid grid-cols-5 gap-2 max-h-24 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50"
              >
                {#each AVATARS as av}
                  <button
                    type="button"
                    class="h-8 w-8 text-xl flex items-center justify-center rounded-xl transition-all hover:bg-orange-100/50 {selectedAvatar ===
                    av
                      ? 'bg-orange-200 shadow-sm border border-orange-300'
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
                class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                >Nombre</label
              >
              <input
                id="prof-name"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                bind:value={name}
                required
              />
            </div>
            <div>
              <label
                for="prof-email"
                class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                >Correo electrónico</label
              >
              <input
                id="prof-email"
                type="email"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                bind:value={email}
                required
              />
            </div>

            <div class="flex gap-2 pt-2">
              <button
                type="button"
                class="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                onclick={handleLogout}
              >
                Cerrar Sesión
              </button>
              <button
                type="submit"
                class="flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700"
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
