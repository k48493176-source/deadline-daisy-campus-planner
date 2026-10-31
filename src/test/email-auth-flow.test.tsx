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

describe("email authentication security", () => {
  it("does not sign in an unconfirmed new signup", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null, user: { identities: [{}] } }, error: null });
    render(<AuthPage />);
    fireEvent.click(screen.getByRole("button", { name: "No account? Sign up" }));
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: /^Sign up$/ }));
    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledTimes(1));
    await screen.findByRole("status");
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.signUp.mock.calls[0]?.[0].options.emailRedirectTo).toBe(window.location.origin);
  });
  it.each(["email_not_confirmed", "invalid_credentials"])("rejects sign-in for %s without redirecting", async (code) => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { code } });
    render(<AuthPage />);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: /^Sign in$/ }));
    await screen.findByRole("alert");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("redirects only after password sign-in returns a session", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: { user: { id: "test-user" } } }, error: null });
    render(<AuthPage />);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: /^Sign in$/ }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/", replace: true }));
  });
});