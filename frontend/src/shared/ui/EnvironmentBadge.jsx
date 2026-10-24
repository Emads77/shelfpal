import "./environment-badge.css";

const ENVIRONMENTS = {
  "acc.shelfpal.saxion.college": {
    label: "Acceptance environment. Data here is for testing only.",
    switchTo: {
      label: "Go to production",
      url: "https://shelfpal.saxion.college",
    },
  },
  localhost: {
    label: "Local development",
  },
  "shelfpal.saxion.college": {
    quiet: true,
    switchTo: {
      label: "Acceptance",
      url: "https://acc.shelfpal.saxion.college",
    },
  },
};

export default function EnvironmentBadge({
  hostname = window.location.hostname,
}) {
  const environment = ENVIRONMENTS[hostname];
  if (!environment) return null;

  return (
    <div
      className={
        environment.quiet ? "environment-badge quiet" : "environment-badge"
      }
      role="note"
    >
      {environment.label && <span>{environment.label}</span>}
      {environment.switchTo && (
        <a href={environment.switchTo.url}>{environment.switchTo.label}</a>
      )}
    </div>
  );
}
