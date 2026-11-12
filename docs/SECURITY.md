# Security Notes / Production Checklist

1. Confirm all Production requests enforce HTTPS (including correct reverse proxy configuration).
2. Set Web Root to `public/`. `storage/`, `config/` and `app/` must not be publicly reachable. `.htaccess` alone doesn't protect Nginx.
3. Disable web installation after initial install (default remote setup disabled), protect SSH and all admin logins.
4. Enforce PHP 8.4+, monitor official security patches, enable secure `session.cookie_*`, and configure session isolation.
5. Run the application with its own low-privilege PHP-FPM user. Give only the needed `storage/` write permission; `config/installed.php` can be read-only after setup.
6. Keep backups encrypted using `sodium`, and store them off-host. Drill restore regularly. Keep backup password separate.
7. Avoid file exports to public or shared directories; CSV may contain private contact information.
8. Upload only PNG/JPEG/WEBP/PDF; file MIME, image validity and signature checked; download is forced as attachment and requires role permission. Malware scanning is a separate operational control to add in high-risk deployments.
9. Security controls include CSRF, input validation, output escaping, CSP, session rotation, rate-limited login, role-based CRUD checks, record version checks and audit events.
10. Review field-level redaction and per-record access requirements before handling highly sensitive donor information; the current RBAC restricts modules, not individual donors/regions.
11. Do not assume the file store supports multiple simultaneous writer hosts, NFS/SMB, or unrestricted high concurrency. Use one writable server with local filesystem.
12. External penetration testing, privacy and compliance review, load testing and incident response are still needed before Production rollout.

No default administrative account is included in the distribution.
