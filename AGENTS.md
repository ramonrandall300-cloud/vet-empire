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

- AuthSessionBridge owns the single auth-event subscription and post-verification handoff; email links return to the public /auth/callback page so initialization is visible and completes before entering protected pages.
- Trial subscription periods end at clinics.trial_ends_at; paid renewal dates come from billing records, keeping trial and paid periods distinct.
