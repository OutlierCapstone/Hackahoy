# Hackahoy local demo

The local demo is the default operating mode after the public beta. AWS remains
stopped as a reversible fallback and is not required for normal demos.

## Safety boundary

The challenge services are intentionally vulnerable. Local mode binds the main
gateway and ports 5001-5007 to `127.0.0.1`. Team-share mode binds them only to
the host's Tailscale IPv4 address, not every LAN interface. Use restricted
device sharing/ACLs and do not forward these ports on a router.

Production secrets and production data are not used. PostgreSQL is seeded with
local flags, social login is disabled, email is disabled, and AI responses are
deterministic mocks that make no Gemini requests.

## Start locally

```powershell
.\scripts\demo.ps1 Start
```

Open `http://localhost:8080`. The demo PostgreSQL volume survives `Stop`.

## Share with the team

Install and sign in to Tailscale, share this device only with the intended team,
then run:

```powershell
.\scripts\demo.ps1 Start -ShareTeam
```

The script prints private tailnet HTTP URLs for the main gateway and all seven
challenge ports. Traffic between devices is still encrypted by Tailscale. The
host PC, Docker Desktop, and Tailscale must remain running.

### Always-on desktop host

On the desktop host, use the deploy wrapper from the logged-in desktop account.
It uses an anonymous Docker Hub config for public image pulls, starts the
complete stack, and waits for the main health endpoint:

```powershell
.\scripts\desktop-deploy.ps1
```

The GitHub deploy workflow targets a repository self-hosted runner labeled
`hackahoy-demo`. Pull-request CI remains on GitHub-hosted runners; only pushes
to `main` or a manual workflow dispatch can deploy the desktop demo.

## Stop or inspect

```powershell
.\scripts\demo.ps1 Status
.\scripts\demo.ps1 Stop
```

`Stop` does not remove the database volume and does not change Tailscale
configuration.

## Known limitation

Problem 7's frontend is recorded in the parent repository as a gitlink, but the
repository has no `.gitmodules` mapping or submodule object. The local demo uses
a safe placeholder for problem 7. Problems 1-6 and the main platform are built
from tracked sources.

## AWS fallback

The fallback EC2 instance keeps its 100 GiB EBS root volume and Elastic IP while
stopped. Starting the instance restores the same IP and DuckDNS/Caddy route.
The helper refuses to operate if the active AWS account is not the expected one:

```powershell
.\scripts\aws-fallback.ps1 Status
.\scripts\aws-fallback.ps1 Start
.\scripts\aws-fallback.ps1 Stop
```

Run `aws login` first if the AWS session has expired. Never terminate the
instance or release its Elastic IP as part of this fallback workflow.

As of 2026-08-26, the instance is stopped, API termination protection is on,
and snapshot `snap-0f1f25ee509333d6c` was created from the stopped 100 GiB root
volume. The Elastic IP remains associated, so `Start` restores the same public
address.
