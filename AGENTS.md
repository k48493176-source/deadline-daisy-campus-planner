<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Dashboard insights use the existing owner-scoped tasks query and a pure calculation helper; do not introduce separate privileged reads or change access policies for analytics.
- Email sign-in uses the auth server's error codes and validates existing users before redirecting; never infer identity from stale local sessions or bypass confirmation.
