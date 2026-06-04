// Shared cookie-domain derivation used by every cookie-writing path
// (browser client, server client, middleware, OAuth callback).
//
// Why this exists: the browser client can only CLEAR a cookie at the same scope
// it was written. If the server writes session cookies at one scope (e.g. the
// bare host vault.tufan.co.uk) and the browser writes/clears at another (the
// parent .tufan.co.uk), the two coexist and the server and browser disagree
// about whether a session exists — which drives an infinite /login <-> /
// redirect loop. Deriving the SAME parent domain everywhere makes that
// impossible regardless of how COOKIE_DOMAIN is configured.
//
// COOKIE_DOMAIN remains an explicit override: if set it always wins (so an app
// can pin an exact scope, and existing deployments behave exactly as before).
// If unset, we auto-derive the registrable parent from the request host.

/**
 * Given a hostname (e.g. "vault.tufan.co.uk"), return the parent cookie domain
 * (".tufan.co.uk") so a cookie is shared across sibling subdomains. Returns
 * undefined for hosts where a Domain attribute is meaningless or harmful:
 * localhost, raw IPs, and single-label / bare-eTLD hosts.
 */
export function parentDomainFromHost(host: string | null | undefined): string | undefined {
  if (!host) return undefined;
  // Strip any port (host headers can be "example.com:3000").
  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname) return undefined;
  if (hostname === "localhost" || /^[\d.]+$/.test(hostname) || !hostname.includes(".")) {
    return undefined;
  }
  const parts = hostname.split(".");
  // Need at least 3 labels (sub.domain.tld) to have a meaningful parent.
  // A bare "domain.tld" yields ".tld", which is too broad — skip it.
  if (parts.length < 3) return undefined;
  return "." + parts.slice(1).join(".");
}

/**
 * Resolve the cookie domain to use. COOKIE_DOMAIN wins if set; otherwise
 * auto-derive from the supplied host. `host` should be the public request host
 * on the server (x-forwarded-host / host) or window.location.hostname in the
 * browser.
 */
export function resolveCookieDomain(host: string | null | undefined): string | undefined {
  const override = process.env.COOKIE_DOMAIN;
  if (override) return override;
  return parentDomainFromHost(host);
}
