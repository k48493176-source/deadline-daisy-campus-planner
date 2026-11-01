import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getUser: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: mocks } }));
import { Route } from "@/routes/auth";

const AuthPage = (Route.options as unknown as { component: React.ComponentType }).component;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: null } });
});
afterEach(cleanup);

function fillCredentials() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "student@campus.edu" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SafeTestPassword42" } });
}

function tab(name: string) {
  return screen.getByRole("tab", { name });
}

describe("email authentication security", () => {
  it("does not sign in an unconfirmed new signup", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null, user: { identities: [{}] } }, error: null });
    render(<AuthPage />);
    fireEvent.click(tab("Create account"));
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledTimes(1));
    expect((await screen.findByRole("status")).textContent).toBe("Check your email to confirm your account");
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.signUp.mock.calls[0]?.[0].options.emailRedirectTo).toBe(window.location.origin);
  });
  it.each(["email_not_confirmed", "invalid_credentials"])("rejects sign-in for %s without redirecting", async (code) => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { code } });
    render(<AuthPage />);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("alert");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("redirects only after password sign-in returns a session", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: { user: { id: "test-user" } } }, error: null });
    render(<AuthPage />);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/", replace: true }));
  });
});

describe("sign-in / create-account tabs", () => {
  it("shows both tabs with the sign-in tab selected by default", () => {
    render(<AuthPage />);
    expect(tab("Sign in")).toHaveAttribute("aria-selected", "true");
    expect(tab("Create account")).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByLabelText("Full name")).toBeNull();
  });

  it("the Create account tab reveals the full-name field", () => {
    render(<AuthPage />);
    fireEvent.click(tab("Create account"));
    expect(tab("Create account")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("a refused sign-in names the problem and offers to create an account", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { code: "invalid_credentials" } });
    render(<AuthPage />);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Wrong email or password. No account yet? Create one.");
    fireEvent.click(within(alert, "Create account"));
    expect(tab("Create account")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

function within(scope: HTMLElement, name: string) {
  const button = Array.from(scope.querySelectorAll("button")).find((el) => el.textContent === name);
  if (!button) throw new Error(`No "${name}" button inside the notice`);
  return button;
}
